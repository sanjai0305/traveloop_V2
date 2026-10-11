import logging
import uuid
import json
from typing import Any, List, Optional
from app.database.mysql import fetch_all, fetch_one, execute_statement

logger = logging.getLogger(__name__)


class RecommendationRepository:
    def __init__(self) -> None:
        self.recommendations_table = "recommendations"
        self.profiles_table = "user_profiles"

    def get_user_recommendations(self, user_id: str, limit: int = 10) -> List[dict[str, Any]]:
        try:
            sql = f"""
                SELECT `trip_id`, `title`, `destination`, `score`, `reason`, `thumbnail`, `price`, `duration`
                FROM `{self.recommendations_table}`
                WHERE `user_id` = :user_id
                ORDER BY `score` DESC
                LIMIT :limit
            """
            return fetch_all(sql, {"user_id": user_id, "limit": limit})
        except Exception as exc:
            logger.error(f"Error fetching recommendations from MySQL: {exc}")
            return []

    def save_recommendation(self, rec_doc: dict[str, Any]) -> dict[str, Any]:
        data = dict(rec_doc)
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())

        cols = [f"`{k}`" for k in data.keys()]
        placeholders = [f":{k}" for k in data.keys()]
        sql = f"INSERT INTO `{self.recommendations_table}` ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"

        params: dict[str, Any] = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                params[k] = json.dumps(v)
            else:
                params[k] = v

        try:
            execute_statement(sql, params)
        except Exception as exc:
            logger.error(f"Error saving recommendation to MySQL: {exc}")

        return data

    def get_user_profile(self, user_id: str) -> Optional[dict[str, Any]]:
        try:
            sql = f"SELECT * FROM `{self.profiles_table}` WHERE `user_id` = :user_id LIMIT 1"
            return fetch_one(sql, {"user_id": user_id})
        except Exception as exc:
            logger.error(f"Error fetching user profile from MySQL: {exc}")
            return None

    def upsert_user_profile(self, user_id: str, profile_doc: dict[str, Any]) -> dict[str, Any]:
        data = dict(profile_doc)
        data["user_id"] = user_id
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())

        cols = [f"`{k}`" for k in data.keys()]
        placeholders = [f":{k}" for k in data.keys()]
        update_clauses = [f"`{k}` = VALUES(`{k}`)" for k in data.keys() if k != "id"]

        sql = f"""
            INSERT INTO `{self.profiles_table}` ({', '.join(cols)})
            VALUES ({', '.join(placeholders)})
            ON DUPLICATE KEY UPDATE {', '.join(update_clauses)}
        """

        params: dict[str, Any] = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                params[k] = json.dumps(v)
            else:
                params[k] = v

        try:
            execute_statement(sql, params)
        except Exception as exc:
            logger.error(f"Error upserting user profile to MySQL: {exc}")

        return data


recommendation_repository = RecommendationRepository()


def get_recommendation_repository() -> RecommendationRepository:
    return recommendation_repository
