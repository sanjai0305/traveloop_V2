import logging
import uuid
import json
from typing import Any, List, Optional
from app.database.mysql import fetch_all, fetch_one, execute_statement

logger = logging.getLogger(__name__)


class TripRepository:
    def __init__(self) -> None:
        pass

    def get_published_trips(self, limit: int = 50) -> List[dict[str, Any]]:
        try:
            sql = """
                SELECT * FROM `agent_trips`
                WHERE `status` IN ('APPROVED', 'active', 'published')
                   OR `approval_status` = 'APPROVED'
                   OR `is_published` = 1
                ORDER BY `created_at` DESC
                LIMIT :limit
            """
            rows = fetch_all(sql, {"limit": limit})
            if rows:
                return rows
        except Exception as exc:
            logger.warning(f"Error querying agent_trips: {exc}")

        # Fallback to trips table
        try:
            sql_fallback = "SELECT * FROM `trips` ORDER BY `created_at` DESC LIMIT :limit"
            return fetch_all(sql_fallback, {"limit": limit})
        except Exception as exc:
            logger.error(f"Error querying trips: {exc}")
            return []

    def get_trip_by_id(self, trip_id: str) -> Optional[dict[str, Any]]:
        try:
            row = fetch_one("SELECT * FROM `agent_trips` WHERE `id` = :id LIMIT 1", {"id": trip_id})
            if row:
                return row
        except Exception:
            pass

        try:
            row = fetch_one("SELECT * FROM `trips` WHERE `id` = :id LIMIT 1", {"id": trip_id})
            if row:
                return row
        except Exception:
            pass

        return None

    def save_trip(self, trip_data: dict[str, Any]) -> dict[str, Any]:
        data = dict(trip_data)
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())

        cols = [f"`{k}`" for k in data.keys()]
        placeholders = [f":{k}" for k in data.keys()]
        sql = f"INSERT INTO `trips` ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"

        params = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                params[k] = json.dumps(v)
            else:
                params[k] = v

        execute_statement(sql, params)
        return data

    def mark_trip_embedded(self, trip_id: str) -> None:
        try:
            execute_statement(
                "UPDATE `agent_trips` SET `visible_to_travelers` = 1 WHERE `id` = :id",
                {"id": trip_id},
            )
        except Exception:
            pass


trip_repository = TripRepository()


def get_trip_repository() -> TripRepository:
    return trip_repository
