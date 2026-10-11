import logging
import uuid
import json
from datetime import datetime, timezone
from typing import Any, List, Optional
from app.database.mysql import fetch_all, fetch_one, execute_statement

logger = logging.getLogger(__name__)


class ChatHistoryRepository:
    def __init__(self) -> None:
        self.history_table = "chat_history"
        self.preferences_table = "user_preferences"

    def save_message(self, user_id: str, session_id: str, role: str, message: str) -> dict[str, Any]:
        msg_id = str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        doc = {
            "id": msg_id,
            "user_id": user_id,
            "session_id": session_id,
            "role": role,
            "message": message,
            "timestamp": now_str,
        }
        try:
            sql = f"""
                INSERT INTO `{self.history_table}` (`id`, `user_id`, `session_id`, `role`, `message`, `timestamp`)
                VALUES (:id, :user_id, :session_id, :role, :message, :timestamp)
            """
            execute_statement(sql, doc)
            return doc
        except Exception as exc:
            logger.error(f"Error saving chat message to MySQL: {exc}")
            return doc

    def get_history(self, user_id: str) -> List[dict[str, Any]]:
        try:
            sql = f"""
                SELECT `role`, `message`, `timestamp`
                FROM `{self.history_table}`
                WHERE `user_id` = :user_id AND `role` IN ('user', 'assistant')
                ORDER BY `timestamp` ASC
            """
            return fetch_all(sql, {"user_id": user_id})
        except Exception as exc:
            logger.error(f"Error fetching chat history from MySQL: {exc}")
            return []

    def get_user_preferences(self, user_id: str) -> List[str]:
        try:
            sql = f"SELECT `preferences` FROM `{self.preferences_table}` WHERE `user_id` = :user_id LIMIT 1"
            row = fetch_one(sql, {"user_id": user_id})
            if row and row.get("preferences"):
                prefs = row["preferences"]
                if isinstance(prefs, str):
                    try:
                        return json.loads(prefs)
                    except Exception:
                        return []
                elif isinstance(prefs, list):
                    return prefs
            return []
        except Exception as exc:
            logger.error(f"Error fetching user preferences from MySQL: {exc}")
            return []

    def update_user_preferences(self, user_id: str, preferences: List[str]) -> None:
        pref_id = str(uuid.uuid4())
        prefs_json = json.dumps(preferences)
        sql = f"""
            INSERT INTO `{self.preferences_table}` (`id`, `user_id`, `preferences`)
            VALUES (:id, :user_id, :preferences)
            ON DUPLICATE KEY UPDATE `preferences` = :preferences
        """
        try:
            execute_statement(sql, {"id": pref_id, "user_id": user_id, "preferences": prefs_json})
        except Exception as exc:
            logger.error(f"Error updating user preferences in MySQL: {exc}")


chat_history_repository = ChatHistoryRepository()


def get_chat_history_repository() -> ChatHistoryRepository:
    return chat_history_repository
