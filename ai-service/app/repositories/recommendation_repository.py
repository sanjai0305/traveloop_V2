import logging
from typing import Any, List, Optional
from app.database.supabase import get_supabase

logger = logging.getLogger(__name__)


class RecommendationRepository:
    def __init__(self) -> None:
        self.recommendations_table = "recommendations"
        self.profiles_table = "user_profiles"

    def get_user_recommendations(self, user_id: str, limit: int = 10) -> List[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table(self.recommendations_table)
                .select("trip_id, title, destination, score, reason, thumbnail, price, duration")
                .eq("user_id", user_id)
                .order("score", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error(f"Error fetching recommendations from Supabase: {exc}")
            return []

    def save_recommendation(self, rec_doc: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase()
        try:
            res = client.table(self.recommendations_table).insert(rec_doc).execute()
            return res.data[0] if res.data else rec_doc
        except Exception as exc:
            logger.error(f"Error saving recommendation to Supabase: {exc}")
            return rec_doc

    def get_user_profile(self, user_id: str) -> Optional[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table(self.profiles_table)
                .select("*")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            return res.data[0] if res.data else None
        except Exception as exc:
            logger.error(f"Error fetching user profile from Supabase: {exc}")
            return None

    def upsert_user_profile(self, user_id: str, profile_doc: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase()
        try:
            profile_doc["user_id"] = user_id
            res = (
                client.table(self.profiles_table)
                .upsert(profile_doc, on_conflict="user_id")
                .execute()
            )
            return res.data[0] if res.data else profile_doc
        except Exception as exc:
            logger.error(f"Error upserting user profile to Supabase: {exc}")
            return profile_doc


recommendation_repository = RecommendationRepository()
