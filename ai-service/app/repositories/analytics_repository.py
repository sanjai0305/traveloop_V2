import logging
import uuid
from typing import Any, List, Optional
from app.database.mysql import fetch_all, fetch_one, execute_statement

logger = logging.getLogger(__name__)


class AnalyticsRepository:
    def __init__(self) -> None:
        self.analytics_table = "chat_analytics"
        self.statistics_table = "daily_statistics"
        self.demands_table = "travel_intents"

    def insert_analytics(self, doc: dict[str, Any]) -> dict[str, Any]:
        data = dict(doc)
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())

        cols = [f"`{k}`" for k in data.keys()]
        placeholders = [f":{k}" for k in data.keys()]
        sql = f"INSERT INTO `{self.analytics_table}` ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"

        try:
            execute_statement(sql, data)
        except Exception as exc:
            logger.error(f"Error inserting analytics to MySQL: {exc}")

        return data

    def get_analytics(self, filters: dict[str, Any], limit: int = 1000) -> List[dict[str, Any]]:
        try:
            where_clauses = []
            params: dict[str, Any] = {"limit": limit}

            if filters.get("date_from"):
                where_clauses.append("`timestamp` >= :date_from")
                params["date_from"] = filters["date_from"]
            if filters.get("date_to"):
                where_clauses.append("`timestamp` <= :date_to")
                params["date_to"] = filters["date_to"]
            if filters.get("destination"):
                where_clauses.append("`destination` = :destination")
                params["destination"] = filters["destination"]
            if filters.get("theme"):
                where_clauses.append("`theme` = :theme")
                params["theme"] = filters["theme"]

            where_str = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
            sql = f"SELECT * FROM `{self.analytics_table}` {where_str} LIMIT :limit"
            return fetch_all(sql, params)
        except Exception as exc:
            logger.error(f"Error fetching analytics from MySQL: {exc}")
            return []

    def count_analytics(self, filters: dict[str, Any]) -> int:
        rows = self.get_analytics(filters)
        return len(rows)

    def top_counts(self, filters: dict[str, Any], field: str, limit: int = 10) -> List[dict[str, Any]]:
        rows = self.get_analytics(filters)
        counts: dict[str, int] = {}
        for row in rows:
            val = row.get(field)
            if val and val not in ("", None):
                counts[val] = counts.get(val, 0) + 1
        sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        return [{"name": k, "count": v} for k, v in sorted_counts[:limit]]

    def distribution(self, filters: dict[str, Any], field: str, allowed: List[str]) -> List[dict[str, Any]]:
        rows = self.get_analytics(filters)
        counts: dict[str, int] = {}
        for val in allowed:
            counts[val] = 0
        for row in rows:
            val = row.get(field)
            if val in counts:
                counts[val] += 1
        return [{"name": k, "count": v} for k, v in counts.items()]

    def budget_distribution(self, filters: dict[str, Any]) -> List[dict[str, Any]]:
        allowed = ["budget", "mid-range", "luxury"]
        return self.distribution(filters, "budget", allowed)

    def group_type_distribution(self, filters: dict[str, Any]) -> List[dict[str, Any]]:
        allowed = ["solo", "couple", "family", "friends", "group"]
        return self.distribution(filters, "group_type", allowed)


analytics_repository = AnalyticsRepository()


def get_analytics_repository() -> AnalyticsRepository:
    return analytics_repository
