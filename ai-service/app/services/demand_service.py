import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, List
from uuid import uuid4

from fastapi import HTTPException, status

from app.repositories.travel_intent_repository import travel_intent_repository
from app.core.qdrant import store_user_profile_vector
from app.core.redis import get_redis_client
from app.models.analytics import AnalyticsFilters, CountMetric
from app.models.demand import DemandItem, DemandsResponse
from app.services.analytics_service import AnalyticsService, analytics_service
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class DemandService:
    cache_ttl_seconds = 300

    def __init__(self, analytics: AnalyticsService) -> None:
        self._analytics = analytics

    async def get_demands(self, filters: AnalyticsFilters) -> DemandsResponse:
        cache_key = self._cache_key(filters)
        cached_response = await self._get_cached_response(cache_key)
        if cached_response:
            return DemandsResponse.model_validate(cached_response)

        try:
            intents = travel_intent_repository.get_active_demands(limit=50)

            demands_list: List[DemandItem] = []
            for item in intents:
                count = item.get("intent_count", 1)
                score = min(98, 72 + count * 4)
                status_str = "High" if score >= 85 else ("Medium" if score >= 75 else "Low")

                demands_list.append(
                    DemandItem(
                        destination=item.get("destination", "Popular Spot"),
                        demand_score=score,
                        users_waiting=item.get("users_waiting", 1),
                        avg_budget=item.get("budget", "₹5,000"),
                        avg_duration=item.get("duration", "2 Days"),
                        theme=item.get("theme", "Nature"),
                        intent_count=count,
                        group_type=item.get("group_type", "Group Tour"),
                        source=item.get("source", "chatbot"),
                        last_requested="Just Now",
                    )
                )

            top_dests = [
                CountMetric(name=d.destination, count=d.intent_count)
                for d in demands_list[:10]
            ]
            top_themes = [
                CountMetric(name=d.theme, count=d.intent_count)
                for d in demands_list[:10]
            ]

            response = DemandsResponse(
                success=True,
                demands=demands_list,
                recent_demands=demands_list[:20],
                top_requested_destinations=top_dests,
                top_requested_themes=top_themes,
                top_group_types=[],
                top_trip_intents=[],
            )
        except Exception as exc:
            logger.exception("Demand aggregation failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Demand aggregation failed",
            ) from exc

        await self._set_cached_response(cache_key, response.model_dump(mode="json"))
        logger.info("Demand Marketplace Delivered")
        return response

    async def record_or_increment_demand(
        self,
        user_id: str,
        extracted: dict[str, Any],
        message: str,
        source: str = "chatbot",
    ) -> dict[str, Any]:
        """
        Action 2: Record new travel intent or increment existing demand.
        Guarantees no duplicate records for the same destination.
        """
        destination = (extracted.get("destination") or "").strip()
        if not destination or destination.lower() in {"general", "none", "trip", "vacation", "holiday", "anywhere"}:
            match = re.search(
                r"\b(ooty|munnar|goa|manali|wayanad|pondicherry|coorg|kodaikanal|shimla|rishikesh|ladakh|bali|dubai|thailand|singapore|paris|yercaud)\b",
                message,
                re.IGNORECASE,
            )
            if match:
                destination = match.group(1).capitalize()
            else:
                destination = "Popular Destination"

        budget = extracted.get("budget") or "₹5,000"
        duration = extracted.get("duration") or "2 Days"
        theme = extracted.get("theme") or "Nature"
        group_type = extracted.get("group_type") or "Group Tour"

        now = datetime.now(timezone.utc)

        existing = travel_intent_repository.find_by_destination(destination)

        if existing:
            existing_user_ids = existing.get("user_ids") or []
            if isinstance(existing_user_ids, str):
                import json as json_lib
                existing_user_ids = json_lib.loads(existing_user_ids)
            if user_id not in existing_user_ids:
                existing_user_ids.append(user_id)

            intent_count = (existing.get("intent_count") or 1) + 1
            users_waiting = max(len(existing_user_ids), 1)

            update_fields = {
                "intent_count": intent_count,
                "users_waiting": users_waiting,
                "user_ids": existing_user_ids,
                "last_requested_at": now.isoformat(),
                "budget": budget or existing.get("budget", "₹5,000"),
                "duration": duration or existing.get("duration", "2 Days"),
                "theme": theme or existing.get("theme", "Nature"),
            }

            travel_intent_repository.update_demand(existing["id"], update_fields)
            await self.invalidate_demand_cache()

            logger.info(f"⚡ [Demand Incremented] {destination} -> count: {intent_count}, waiting: {users_waiting}")
            return {"action": "incremented", "destination": destination, "intent_count": intent_count, "users_waiting": users_waiting}

        else:
            intent_id = str(uuid4())
            intent_doc = {
                "intent_id": intent_id,
                "destination": destination,
                "budget": budget,
                "duration": duration,
                "theme": theme,
                "group_type": group_type,
                "source": source,
                "user_id": user_id,
                "user_ids": [user_id],
                "users_waiting": 1,
                "intent_count": 1,
                "status": "active",
                "created_at": now.isoformat(),
                "last_requested_at": now.isoformat(),
            }

            travel_intent_repository.create_demand(intent_doc)

            try:
                intent_text = f"{destination} {theme} {duration} {budget}"
                embedding = await embedding_service.embed_text(intent_text)
                await store_user_profile_vector(
                    user_id=intent_id,
                    embedding=embedding,
                    payload={
                        "intent_id": intent_id,
                        "destination": destination,
                        "theme": theme,
                        "user_ids": [user_id],
                    },
                )
            except Exception as q_err:
                logger.warning(f"Qdrant intent vector store notice: {q_err}")

            await self.invalidate_demand_cache()
            logger.info(f"🔥 [Demand Created] NEW demand for {destination}")
            return {"action": "created", "destination": destination, "intent_count": 1, "users_waiting": 1}

    async def invalidate_demand_cache(self) -> None:
        try:
            redis = get_redis_client()
            keys = await redis.keys("dashboard:demands:*")
            if keys:
                await redis.delete(*keys)
                logger.info(f"Flushed {len(keys)} Redis demand cache keys")
        except Exception as exc:
            logger.warning(f"Redis demand cache invalidation notice: {exc}")

    def _cache_key(self, filters: AnalyticsFilters) -> str:
        payload = filters.model_dump(mode="json", exclude_none=True)
        return f"dashboard:demands:{json.dumps(payload, sort_keys=True)}"

    async def _get_cached_response(self, cache_key: str) -> dict[str, Any] | None:
        try:
            cached_value = await get_redis_client().get(cache_key)
        except Exception as exc:
            logger.warning(f"Redis demand cache read notice: {exc}")
            return None

        return json.loads(cached_value) if cached_value else None

    async def _set_cached_response(
        self,
        cache_key: str,
        response: dict[str, Any],
    ) -> None:
        try:
            await get_redis_client().set(
                cache_key,
                json.dumps(response),
                ex=self.cache_ttl_seconds,
            )
        except Exception as exc:
            logger.warning(f"Redis demand cache write notice: {exc}")


demand_service = DemandService(analytics_service)


def get_demand_service() -> DemandService:
    return demand_service
