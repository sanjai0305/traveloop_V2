import logging
from datetime import datetime, timezone
from typing import Any, List, Optional
from app.database.supabase import get_supabase

logger = logging.getLogger(__name__)


class TravelIntentRepository:
    def __init__(self) -> None:
        self.table_name = "travel_intents"
        self.search_intents_table = "traveler_search_intents"

    def get_active_demands(self, limit: int = 50) -> List[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table(self.table_name)
                .select("*")
                .eq("status", "active")
                .order("intent_count", desc=True)
                .order("last_requested_at", desc=True)
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error(f"Error fetching active demands from Supabase: {exc}")
            return []

    def find_by_destination(self, destination: str) -> Optional[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table(self.table_name)
                .select("*")
                .ilike("destination", destination)
                .limit(1)
                .execute()
            )
            return res.data[0] if res.data else None
        except Exception as exc:
            logger.error(f"Error finding intent by destination '{destination}': {exc}")
            return None

    def update_demand(self, intent_id: str, update_fields: dict[str, Any]) -> Optional[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table(self.table_name)
                .update(update_fields)
                .eq("id", intent_id)
                .execute()
            )
            return res.data[0] if res.data else None
        except Exception as exc:
            logger.error(f"Error updating demand in Supabase: {exc}")
            return None

    def create_demand(self, intent_doc: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase()
        try:
            res = client.table(self.table_name).insert(intent_doc).execute()
            return res.data[0] if res.data else intent_doc
        except Exception as exc:
            logger.error(f"Error creating demand in Supabase: {exc}")
            return intent_doc

    def save_search_intent(self, intent_doc: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase()
        try:
            res = client.table(self.search_intents_table).insert(intent_doc).execute()
            return res.data[0] if res.data else intent_doc
        except Exception as exc:
            logger.error(f"Error saving search intent in Supabase: {exc}")
            return intent_doc


travel_intent_repository = TravelIntentRepository()
