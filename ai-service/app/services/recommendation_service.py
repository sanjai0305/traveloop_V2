import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.repositories.recommendation_repository import recommendation_repository
from app.repositories.travel_intent_repository import travel_intent_repository
from app.core.qdrant import search_trip_vectors, search_user_profile_vectors
from app.core.redis import get_redis_client
from app.models.recommendation import (
    RecommendationDocument,
    RecommendationItem,
    RecommendationResponse,
    UserProfileDocument,
)
from app.models.trip import TripCreate
from app.services.embedding_service import EmbeddingService, embedding_service
from app.services.profile_service import ProfileService, profile_service
from app.services.similarity_service import SimilarityService, similarity_service


logger = logging.getLogger(__name__)


class RecommendationService:

    def __init__(
        self,
        embeddings: EmbeddingService,
        profiles: ProfileService,
        similarity: SimilarityService,
    ) -> None:
        self._embeddings = embeddings
        self._profiles = profiles
        self._similarity = similarity

    async def get_recommendations(self, user_id: str) -> RecommendationResponse:
        cache_key = self._cache_key(user_id)
        cached_response = await self._get_cached_response(cache_key)
        if cached_response:
            logger.info("Recommendation Delivered")
            return RecommendationResponse.model_validate(cached_response)

        settings = get_settings()
        try:
            documents = recommendation_repository.get_user_recommendations(
                user_id, limit=settings.recommendation_top_k
            )
        except Exception as exc:
            logger.exception("Failed to load recommendations from Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to load recommendations",
            ) from exc

        recommendations = [
            RecommendationItem.model_validate(document) for document in documents
        ]
        response = RecommendationResponse(
            recommendations=recommendations,
            dashboard_sections=self._build_dashboard_sections(recommendations),
        )
        await self._set_cached_response(cache_key, response.model_dump(mode="json"))
        logger.info("Recommendation Delivered")
        return response

    async def refresh_for_user(self, user_id: str) -> None:
        try:
            profile = await self._profiles.update_profile_from_user_activity(user_id)
            if not profile.profile_embedding:
                return

            settings = get_settings()
            results = await search_trip_vectors(
                query_vector=profile.profile_embedding,
                limit=settings.recommendation_top_k,
                score_threshold=settings.recommendation_similarity_threshold,
            )
            logger.info("Similarity Search Completed")

            for result in results:
                payload = getattr(result, "payload", None) or {}
                trip = self._similarity.payload_to_trip(payload)
                await self._create_recommendation(
                    user_id=user_id,
                    trip_id=str(payload.get("trip_id", "")),
                    trip=trip,
                    semantic_similarity=float(getattr(result, "score", 0.0)),
                    profile=profile,
                    thumbnail=self._extract_thumbnail(payload),
                )

            await self.invalidate_cache(user_id)
            logger.info("Cache Updated")
        except Exception:
            logger.exception("User recommendation refresh failed")

    async def generate_for_new_trip(
        self,
        trip_id: str,
        trip: TripCreate,
    ) -> None:
        try:
            settings = get_settings()
            semantic_document = self._embeddings.build_trip_document(trip)
            trip_embedding = await self._embeddings.embed_text(semantic_document)
            results = await search_user_profile_vectors(
                query_vector=trip_embedding,
                limit=100,
                score_threshold=settings.recommendation_similarity_threshold,
            )
            logger.info("Similarity Search Completed")

            for result in results:
                payload = getattr(result, "payload", None) or {}
                user_id = str(payload.get("user_id", ""))
                if not user_id:
                    continue

                profile = await self._profiles.get_profile(user_id)
                await self._create_recommendation(
                    user_id=user_id,
                    trip_id=trip_id,
                    trip=trip,
                    semantic_similarity=float(getattr(result, "score", 0.0)),
                    profile=profile,
                    thumbnail=None,
                )
                await self.invalidate_cache(user_id)

            logger.info("Cache Updated")
        except Exception:
            logger.exception("New trip recommendation generation failed")

    async def ensure_indexes(self) -> None:
        # Supabase PostgreSQL indexes are managed via schema.sql
        logger.info("Supabase: indexes managed via schema.sql")

    async def invalidate_cache(self, user_id: str) -> None:
        try:
            await get_redis_client().delete(self._cache_key(user_id))
        except Exception:
            logger.exception("Recommendation cache invalidation failed")

    async def _create_recommendation(
        self,
        user_id: str,
        trip_id: str,
        trip: TripCreate,
        semantic_similarity: float,
        profile: UserProfileDocument | None,
        thumbnail: str | None,
    ) -> None:
        if not trip_id:
            return

        score, reason = await self._similarity.score_trip_for_profile(
            semantic_similarity=semantic_similarity,
            profile=profile,
            trip=trip,
            popularity_score=await self._popularity_score(trip),
        )
        if semantic_similarity < get_settings().recommendation_similarity_threshold:
            return

        doc = {
            "user_id": user_id,
            "trip_id": trip_id,
            "title": trip.title,
            "destination": trip.destination,
            "score": score,
            "reason": reason,
            "thumbnail": thumbnail,
            "price": trip.budget,
            "duration": trip.duration,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            recommendation_repository.save_recommendation(doc)
        except Exception as exc:
            logger.exception("Failed to store recommendation in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to store recommendation",
            ) from exc

        logger.info("Recommendation Created")

    async def create_recommendation(
        self,
        user_id: str,
        trip_id: str,
        trip: TripCreate,
        score: float = 0.95,
        reason: str = "New trip matching your interests!",
    ) -> None:
        """Direct creation of recommendation record for matched user."""
        doc = {
            "user_id": user_id,
            "trip_id": trip_id,
            "title": trip.title,
            "destination": trip.destination,
            "score": score,
            "reason": reason,
            "thumbnail": None,
            "price": trip.budget,
            "duration": trip.duration,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            recommendation_repository.save_recommendation(doc)
        except Exception as err:
            logger.warning(f"Create recommendation error: {err}")

    async def invalidate_user_cache(self, user_id: str) -> None:
        try:
            cache_key = self._cache_key(user_id)
            await get_redis_client().delete(cache_key)
        except Exception as err:
            logger.warning(f"Cache invalidate notice: {err}")

    async def match_trip_against_intents(self, trip_id: str, trip: TripCreate) -> None:
        """
        When an agent publishes a trip, compare it against stored travel_intents in Supabase.
        Find matching users and create recommendation records.
        """
        from app.database.supabase import get_supabase
        client = get_supabase()
        dest = (trip.destination or "").strip()

        try:
            res = (
                client.table("travel_intents")
                .select("user_id, user_ids, destination, theme")
                .eq("status", "active")
                .ilike("destination", dest)
                .limit(100)
                .execute()
            )
            intents = res.data or []
        except Exception as q_err:
            logger.warning(f"match_trip_against_intents Supabase error: {q_err}")
            intents = []

        matched_user_ids: set[str] = set()
        for intent in intents:
            uids = intent.get("user_ids") or []
            if isinstance(uids, str):
                import json as json_lib
                uids = json_lib.loads(uids)
            uid_single = intent.get("user_id")
            for u in ([uid_single] + uids):
                if u and u != "anonymous":
                    matched_user_ids.add(u)

        logger.info(f"🎯 [Intent Matcher] Found {len(matched_user_ids)} users interested in '{trip.title}' to {dest}")

        for uid in matched_user_ids:
            await self.create_recommendation(
                user_id=uid,
                trip_id=trip_id,
                trip=trip,
                score=0.96,
                reason=f"New trip published matching your request for {dest}!",
            )
            await self.invalidate_user_cache(uid)

    async def _popularity_score(self, trip: TripCreate) -> float:
        from app.database.supabase import get_supabase
        try:
            client = get_supabase()
            res = (
                client.table("travel_intents")
                .select("id", count="exact")
                .ilike("destination", trip.destination or "")
                .execute()
            )
            count = res.count or 0
            return min(count / 100, 1.0)
        except Exception:
            return 0.0

    def _build_dashboard_sections(
        self,
        recommendations: list[RecommendationItem],
    ) -> dict[str, list[RecommendationItem]]:
        beach_recommendations = [
            recommendation
            for recommendation in recommendations
            if "beach" in recommendation.reason.casefold()
            or recommendation.destination.casefold() in {"maldives", "goa", "bali"}
        ]

        return {
            "new_trips_matching_your_interests": recommendations[:5],
            "recommended_for_you": recommendations[:10],
            "because_you_like_beach_trips": beach_recommendations[:5],
            "trending_near_you": recommendations[:5],
            "recently_added_for_you": recommendations[:5],
            "continue_exploring": recommendations[:5],
        }

    def _extract_thumbnail(self, payload: dict[str, Any]) -> str | None:
        metadata = payload.get("metadata") or {}
        thumbnail = metadata.get("thumbnail")
        return str(thumbnail) if thumbnail else None

    def _cache_key(self, user_id: str) -> str:
        return f"recommendations:{user_id}"

    async def _get_cached_response(self, cache_key: str) -> dict[str, Any] | None:
        try:
            cached_value = await get_redis_client().get(cache_key)
            return json.loads(cached_value) if cached_value else None
        except Exception as exc:
            logger.warning(f"Redis recommendation cache read notice: {exc}")
            return None

    async def _set_cached_response(
        self,
        cache_key: str,
        response: dict[str, Any],
    ) -> None:
        try:
            await get_redis_client().set(
                cache_key,
                json.dumps(response),
                ex=get_settings().recommendation_cache_ttl_seconds,
            )
        except Exception as exc:
            logger.warning(f"Redis recommendation cache write notice: {exc}")


recommendation_service = RecommendationService(
    embedding_service,
    profile_service,
    similarity_service,
)


def get_recommendation_service() -> RecommendationService:
    return recommendation_service
