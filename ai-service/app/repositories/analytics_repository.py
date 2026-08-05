import logging
from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional
from app.database.supabase import get_supabase

logger = logging.getLogger(__name__)


class AnalyticsRepository:
    def __init__(self) -> None:
        self.analytics_table = "chat_analytics"
        self.statistics_table = "daily_statistics"
        self.demands_table = "travel_intents"

    def insert_analytics(self, doc: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase()
        try:
            res = client.table(self.analytics_table).insert(doc).execute()
            return res.data[0] if res.data else doc
        except Exception as exc:
            logger.error(f"Error inserting analytics: {exc}")
            return doc

    def get_analytics(self, filters: dict[str, Any], limit: int = 1000) -> List[dict[str, Any]]:
        client = get_supabase()
        try:
            query = client.table(self.analytics_table).select("*")
            if filters.get("date_from"):
                query = query.gte("timestamp", filters["date_from"])
            if filters.get("date_to"):
                query = query.lte("timestamp", filters["date_to"])
            if filters.get("destination"):
                query = query.eq("destination", filters["destination"])
            if filters.get("theme"):
                query = query.eq("theme", filters["theme"])
            res = query.limit(limit).execute()
            return res.data or []
        except Exception as exc:
            logger.error(f"Error fetching analytics: {exc}")
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

    def time_series(self, filters: dict[str, Any], format_str: str) -> List[dict[str, Any]]:
        rows = self.get_analytics(filters)
        counts: dict[str, int] = {}
        for row in rows:
            ts = row.get("timestamp")
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                if "%U" in format_str:
                    key = f"{dt.year}-W{dt.strftime('%U')}"
                elif format_str == "%Y-%m":
                    key = dt.strftime("%Y-%m")
                else:
                    key = dt.strftime(format_str)
                counts[key] = counts.get(key, 0) + 1
            except Exception:
                continue
        return [{"date": k, "count": v} for k, v in sorted(counts.items())]

    def hourly_heatmap(self, filters: dict[str, Any]) -> List[dict[str, Any]]:
        rows = self.get_analytics(filters)
        heatmap: dict[tuple, int] = {}
        for row in rows:
            ts = row.get("timestamp")
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                day = dt.weekday()
                hour = dt.hour
                heatmap[(day, hour)] = heatmap.get((day, hour), 0) + 1
            except Exception:
                continue
        return [{"day": d, "hour": h, "count": c} for (d, h), c in heatmap.items()]

    def peak_search_hour(self, filters: dict[str, Any]) -> Optional[int]:
        rows = self.get_analytics(filters)
        hour_counts: dict[int, int] = {}
        for row in rows:
            ts = row.get("timestamp")
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                hour_counts[dt.hour] = hour_counts.get(dt.hour, 0) + 1
            except Exception:
                continue
        if not hour_counts:
            return None
        return max(hour_counts, key=lambda h: hour_counts[h])

    def upsert_daily_statistics(self, date_str: str, increment: int = 1) -> None:
        client = get_supabase()
        try:
            res = client.table(self.statistics_table).select("*").eq("date", date_str).limit(1).execute()
            if res.data:
                row = res.data[0]
                new_count = row.get("total_queries", 0) + increment
                client.table(self.statistics_table).update({
                    "total_queries": new_count,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("date", date_str).execute()
            else:
                client.table(self.statistics_table).insert({
                    "date": date_str,
                    "total_queries": increment,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
        except Exception as exc:
            logger.error(f"Error upserting daily statistics: {exc}")

    def get_weekly_growth(self, filters: dict[str, Any]) -> float:
        rows = self.get_analytics(filters)
        now = datetime.now(timezone.utc)
        this_week_start = now - timedelta(days=7)
        last_week_start = now - timedelta(days=14)

        this_week = 0
        last_week = 0
        for row in rows:
            ts = row.get("timestamp")
            if not ts:
                continue
            try:
                dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                if dt >= this_week_start:
                    this_week += 1
                elif dt >= last_week_start:
                    last_week += 1
            except Exception:
                continue

        if last_week == 0:
            return 0.0
        return round((this_week - last_week) / last_week * 100, 2)

    def get_demands_for_analytics(self) -> List[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table(self.demands_table)
                .select("*")
                .eq("status", "active")
                .order("intent_count", desc=True)
                .limit(100)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error(f"Error fetching demands for analytics: {exc}")
            return []


analytics_repository = AnalyticsRepository()
