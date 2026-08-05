import logging
from datetime import datetime, timezone
from typing import Any, List, Optional
from app.database.supabase import get_supabase

logger = logging.getLogger(__name__)


class ChatHistoryRepository:
    def __init__(self) -> None:
        self.history_table = "chat_history"
        self.preferences_table = "user_preferences"

    def save_message(self, user_id: str, session_id: str, role: str, message: str) -> dict[str, Any]:
        client = get_supabase()
        doc = {
            "user_id": user_id,
            "session_id": session_id,
            "role": role,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        try:
            res = client.table(self.history_table).insert(doc).execute()
            return res.data[0] if res.data else doc
        except Exception as exc:
            logger.error(f"Error saving chat message to Supabase: {exc}")
            return doc

    def get_history(self, user_id: str) -> List[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table(self.history_table)
                .select("role, message, timestamp")
                .eq("user_id", user_id)
                .in_("role", ["user", "assistant"])
                .order("timestamp", desc=False)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error(f"Error fetching chat history from Supabase: {exc}")
            return []

    def get_user_preferences(self, user_id: str) -> List[str]:
        client = get_supabase()
        try:
            res = (
                client.table(self.preferences_table)
                .select("preferences")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            if res.data and res.data[0].get("preferences"):
                return res.data[0]["preferences"]
            return []
        except Exception as exc:
            logger.error(f"Error fetching user preferences from Supabase: {exc}")
            return []

    def update_user_preferences(self, user_id: str, preferences: List[str]) -> dict[str, Any]:
        client = get_supabase()
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "user_id": user_id,
            "preferences": preferences,
            "updated_at": now,
        }
        try:
            res = (
                client.table(self.preferences_table)
                .upsert(doc, on_conflict="user_id")
                .execute()
            )
            return res.data[0] if res.data else doc
        except Exception as exc:
            logger.error(f"Error updating user preferences in Supabase: {exc}")
            return doc


chat_history_repository = ChatHistoryRepository()
