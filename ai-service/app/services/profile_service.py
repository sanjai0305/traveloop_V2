import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.repositories.recommendation_repository import recommendation_repository
from app.core.qdrant import store_user_profile_vector
from app.models.recommendation import UserProfileDocument
from app.services.embedding_service import EmbeddingService, embedding_service


logger = logging.getLogger(__name__)


class ProfileService:

    def __init__(self, embeddings: EmbeddingService) -> None:
        self._embeddings = embeddings

    async def update_profile_from_user_activity(
        self,
        user_id: str,
    ) -> UserProfileDocument:
        profile_payload = await self._build_profile_payload(user_id)
        profile_text = self._build_profile_text(profile_payload)
        profile_embedding = await self._embeddings.embed_text(profile_text)

        profile = UserProfileDocument(
            user_id=user_id,
            profile_embedding=profile_embedding,
            updated_at=datetime.now(timezone.utc),
            **profile_payload,
        )

        try:
            profile_doc = profile.model_dump()
            # Convert embedding list to JSON-serializable for Supabase JSONB
            profile_doc["profile_embedding"] = profile_embedding
            profile_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
            recommendation_repository.upsert_user_profile(user_id, profile_doc)
        except Exception as exc:
            logger.exception("Failed to update user profile in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to update user profile",
            ) from exc

        await store_user_profile_vector(
            user_id=user_id,
            embedding=profile_embedding,
            payload={
                "preferences": profile.preferences,
                "preferred_destinations": profile.preferred_destinations,
                "preferred_themes": profile.preferred_themes,
                "preferred_budget": profile.preferred_budget,
                "preferred_duration": profile.preferred_duration,
                "preferred_group_type": profile.preferred_group_type,
            },
        )
        logger.info("Profile Updated")
        return profile

    async def get_profile(self, user_id: str) -> UserProfileDocument | None:
        try:
            document = recommendation_repository.get_user_profile(user_id)
        except Exception as exc:
            logger.exception("Failed to load user profile from Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to load user profile",
            ) from exc

        return UserProfileDocument.model_validate(document) if document else None

    async def ensure_indexes(self) -> None:
        logger.info("Supabase: indexes managed via schema.sql")

    async def _build_profile_payload(self, user_id: str) -> dict[str, list[str]]:
        from app.repositories.chat_history_repository import chat_history_repository
        preferences = chat_history_repository.get_user_preferences(user_id)

        return {
            "preferred_destinations": await self._top_intent_values(user_id, "destination"),
            "preferred_themes": await self._top_intent_values(user_id, "theme"),
            "preferred_budget": await self._top_intent_values(user_id, "budget"),
            "preferred_duration": await self._top_intent_values(user_id, "duration"),
            "preferred_seasons": await self._top_intent_values(user_id, "season"),
            "preferred_group_type": await self._top_intent_values(user_id, "group_type"),
            "favourite_activities": await self._top_intent_values(user_id, "theme"),
            "frequently_viewed_trips": [],
            "bookmarked_trips": [],
            "booked_trips": [],
            "frequently_searched_destinations": await self._top_intent_values(user_id, "destination"),
            "preferences": preferences,
        }

    async def _top_intent_values(
        self,
        user_id: str,
        field_name: str,
        limit: int = 10,
    ) -> list[str]:
        from app.database.supabase import get_supabase
        try:
            client = get_supabase()
            res = (
                client.table("travel_intents")
                .select(field_name)
                .eq("user_id", user_id)
                .not_.is_(field_name, "null")
                .limit(100)
                .execute()
            )
            counts: dict[str, int] = {}
            for row in (res.data or []):
                val = row.get(field_name)
                if val:
                    counts[val] = counts.get(val, 0) + 1
            sorted_vals = sorted(counts, key=lambda k: counts[k], reverse=True)
            return sorted_vals[:limit]
        except Exception as exc:
            logger.warning(f"Could not aggregate profile values from Supabase: {exc}")
            return []

    def _build_profile_text(self, profile_payload: dict[str, list[str]]) -> str:
        parts: list[str] = []
        for label, values in profile_payload.items():
            if values:
                parts.append(f"{label.replace('_', ' ').title()}: {', '.join(values)}.")

        return "\n".join(parts) or "General travel interests."


profile_service = ProfileService(embedding_service)


def get_profile_service() -> ProfileService:
    return profile_service
