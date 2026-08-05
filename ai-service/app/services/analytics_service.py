import json
import logging
from datetime import datetime, time, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from app.repositories.analytics_repository import analytics_repository
from app.core.redis import get_redis_client
from app.models.analytics import (
    ALLOWED_BUDGETS,
    ALLOWED_DURATIONS,
    AnalyticsFilters,
    AnalyticsResponse,
    ChatAnalyticsDocument,
    CountMetric,
    HeatmapPoint,
    TimeSeriesPoint,
)
from app.models.demand import TravelDemandDocument
from app.services.extractor_service import ExtractorService, extractor_service


logger = logging.getLogger(__name__)


class AnalyticsService:
    dashboard_cache_ttl_seconds = 300

    def __init__(self, extractor: ExtractorService) -> None:
        self._extractor = extractor

    async def process_chat_message(
        self,
        user_id: str,
        session_id: str,
        message: str,
    ) -> None:
        try:
            extracted = self._extractor.extract(message)
            analytics_document = ChatAnalyticsDocument(
                user_id=user_id,
                session_id=session_id,
                **extracted,
            )
            demand_document = TravelDemandDocument(
                user_id=user_id,
                session_id=session_id,
                **extracted,
            )
            await self._store_documents(analytics_document, demand_document)
            await self._update_daily_statistics(analytics_document)
            await self.invalidate_dashboard_cache()
            logger.info("Analytics Generated")
        except Exception:
            logger.exception("Analytics background processing failed")

    async def get_dashboard(self, filters: AnalyticsFilters) -> AnalyticsResponse:
        cache_key = self._cache_key("analytics", filters)
        cached_response = await self._get_cached_response(cache_key)
        if cached_response:
            return AnalyticsResponse.model_validate(cached_response)

        supabase_filters = self._build_supabase_filters(filters)

        try:
            total_queries = analytics_repository.count_analytics(supabase_filters)
            top_destinations = [
                CountMetric(name=d["name"], count=d["count"])
                for d in analytics_repository.top_counts(supabase_filters, "destination")
            ]
            top_themes = [
                CountMetric(name=d["name"], count=d["count"])
                for d in analytics_repository.top_counts(supabase_filters, "theme")
            ]
            budget_distribution = {
                d["name"]: d["count"]
                for d in analytics_repository.distribution(supabase_filters, "budget", sorted(ALLOWED_BUDGETS))
            }
            duration_distribution = {
                d["name"]: d["count"]
                for d in analytics_repository.distribution(supabase_filters, "duration", sorted(ALLOWED_DURATIONS))
            }
            peak_hour = analytics_repository.peak_search_hour(supabase_filters)
            peak_search_hour = str(peak_hour) if peak_hour is not None else None
            weekly_growth = analytics_repository.get_weekly_growth(supabase_filters)

            weekly_demand = [
                TimeSeriesPoint(label=d["date"], count=d["count"])
                for d in analytics_repository.time_series(supabase_filters, "%Y-W%U")
            ]
            monthly_demand = [
                TimeSeriesPoint(label=d["date"], count=d["count"])
                for d in analytics_repository.time_series(supabase_filters, "%Y-%m")
            ]
            day_names = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday", 4: "Friday", 5: "Saturday", 6: "Sunday"}
            hourly_heatmap = [
                HeatmapPoint(
                    day=day_names.get(d["day"], str(d["day"])),
                    hour=d["hour"],
                    count=d["count"],
                )
                for d in analytics_repository.hourly_heatmap(supabase_filters)
            ]
        except Exception as exc:
            logger.exception("Analytics aggregation failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Analytics aggregation failed",
            ) from exc

        response = AnalyticsResponse(
            total_queries=total_queries,
            top_destinations=top_destinations,
            top_themes=top_themes,
            budget_distribution=budget_distribution,
            duration_distribution=duration_distribution,
            peak_search_hour=peak_search_hour,
            weekly_growth=weekly_growth,
            weekly_demand=weekly_demand,
            monthly_demand=monthly_demand,
            hourly_heatmap=hourly_heatmap,
        )
        await self._set_cached_response(cache_key, response.model_dump(mode="json"))
        logger.info("Dashboard Cache Updated")
        return response

    async def ensure_indexes(self) -> None:
        # Supabase PostgreSQL indexes are managed via schema.sql
        logger.info("Supabase: indexes managed via schema.sql")

    async def invalidate_dashboard_cache(self) -> None:
        try:
            client = get_redis_client()
            keys: list[str] = []
            async for key in client.scan_iter(match="dashboard:*"):
                keys.append(key)
            if keys:
                await client.delete(*keys)
        except Exception:
            logger.exception("Dashboard cache invalidation failed")

    async def _store_documents(
        self,
        analytics_document: ChatAnalyticsDocument,
        demand_document: TravelDemandDocument,
    ) -> None:
        try:
            analytics_doc = analytics_document.model_dump()
            analytics_doc["timestamp"] = analytics_doc.get("timestamp", datetime.now(timezone.utc))
            if hasattr(analytics_doc["timestamp"], "isoformat"):
                analytics_doc["timestamp"] = analytics_doc["timestamp"].isoformat()
            analytics_repository.insert_analytics(analytics_doc)
        except Exception as exc:
            logger.exception("Failed to store analytics in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to store demand analytics",
            ) from exc

        logger.info("Demand Stored")

    async def _update_daily_statistics(
        self,
        analytics_document: ChatAnalyticsDocument,
    ) -> None:
        timestamp = analytics_document.timestamp
        stat_date = timestamp.date().isoformat()
        try:
            analytics_repository.upsert_daily_statistics(stat_date, increment=1)
        except Exception as exc:
            logger.exception("Failed to update daily statistics in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to update daily statistics",
            ) from exc

        logger.info("Statistics Updated")

    def _build_supabase_filters(self, filters: AnalyticsFilters) -> dict[str, Any]:
        supabase_filters: dict[str, Any] = {}

        if filters.from_date:
            supabase_filters["date_from"] = datetime.combine(
                filters.from_date, time.min, tzinfo=timezone.utc
            ).isoformat()
        if filters.to_date:
            supabase_filters["date_to"] = datetime.combine(
                filters.to_date, time.max, tzinfo=timezone.utc
            ).isoformat()
        if filters.destination:
            supabase_filters["destination"] = filters.destination
        if filters.theme:
            supabase_filters["theme"] = filters.theme
        if filters.budget:
            supabase_filters["budget"] = filters.budget
        if filters.user_id:
            supabase_filters["user_id"] = filters.user_id
        if filters.group_type:
            supabase_filters["group_type"] = filters.group_type

        return supabase_filters

    def _cache_key(self, namespace: str, filters: AnalyticsFilters) -> str:
        payload = filters.model_dump(mode="json", exclude_none=True)
        return f"dashboard:{namespace}:{json.dumps(payload, sort_keys=True)}"

    async def _get_cached_response(self, cache_key: str) -> dict[str, Any] | None:
        try:
            cached_value = await get_redis_client().get(cache_key)
        except Exception as exc:
            logger.warning(f"Redis dashboard cache read notice: {exc}")
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
                ex=self.dashboard_cache_ttl_seconds,
            )
        except Exception as exc:
            logger.warning(f"Redis dashboard cache write notice: {exc}")


analytics_service = AnalyticsService(extractor_service)


def get_analytics_service() -> AnalyticsService:
    return analytics_service
