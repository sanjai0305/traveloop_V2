import logging
import uuid
import json
from datetime import datetime, timezone
from typing import Any, List, Optional
from app.database.mysql import fetch_all, fetch_one, execute_statement

logger = logging.getLogger(__name__)


class TravelIntentRepository:
    def __init__(self) -> None:
        self.table_name = "travel_intents"
        self.search_intents_table = "traveler_search_intents"

    def get_active_demands(self, limit: int = 50) -> List[dict[str, Any]]:
        try:
            sql = f"""
                SELECT * FROM `{self.table_name}`
                WHERE `status` = 'active'
                ORDER BY `intent_count` DESC, `last_requested_at` DESC
                LIMIT :limit
            """
            return fetch_all(sql, {"limit": limit})
        except Exception as exc:
            logger.error(f"Error fetching active demands from MySQL: {exc}")
            return []

    def find_by_destination(self, destination: str) -> Optional[dict[str, Any]]:
        try:
            sql = f"""
                SELECT * FROM `{self.table_name}`
                WHERE LOWER(`destination`) = LOWER(:destination)
                LIMIT 1
            """
            return fetch_one(sql, {"destination": destination})
        except Exception as exc:
            logger.error(f"Error finding intent by destination '{destination}': {exc}")
            return None

    def update_demand(self, intent_id: str, update_fields: dict[str, Any]) -> Optional[dict[str, Any]]:
        try:
            set_clauses = []
            params: dict[str, Any] = {"id": intent_id}
            for k, v in update_fields.items():
                set_clauses.append(f"`{k}` = :{k}")
                if isinstance(v, (dict, list)):
                    params[k] = json.dumps(v)
                else:
                    params[k] = v

            sql = f"UPDATE `{self.table_name}` SET {', '.join(set_clauses)} WHERE `id` = :id"
            execute_statement(sql, params)
            return fetch_one(f"SELECT * FROM `{self.table_name}` WHERE `id` = :id LIMIT 1", {"id": intent_id})
        except Exception as exc:
            logger.error(f"Error updating demand in MySQL: {exc}")
            return None

    def create_demand(self, intent_doc: dict[str, Any]) -> dict[str, Any]:
        data = dict(intent_doc)
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        data["created_at"] = data.get("created_at") or now_str
        data["last_requested_at"] = data.get("last_requested_at") or now_str

        cols = [f"`{k}`" for k in data.keys()]
        placeholders = [f":{k}" for k in data.keys()]
        sql = f"INSERT INTO `{self.table_name}` ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"

        params: dict[str, Any] = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                params[k] = json.dumps(v)
            else:
                params[k] = v

        execute_statement(sql, params)
        return data

    def log_search_intent(self, intent_doc: dict[str, Any]) -> dict[str, Any]:
        data = dict(intent_doc)
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())

        cols = [f"`{k}`" for k in data.keys()]
        placeholders = [f":{k}" for k in data.keys()]
        sql = f"INSERT INTO `{self.search_intents_table}` ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"

        params: dict[str, Any] = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                params[k] = json.dumps(v)
            else:
                params[k] = v

        try:
            execute_statement(sql, params)
        except Exception as exc:
            logger.warning(f"Could not log search intent to MySQL: {exc}")

        return data


travel_intent_repository = TravelIntentRepository()


def get_travel_intent_repository() -> TravelIntentRepository:
    return travel_intent_repository
