import logging
from typing import Any, List, Optional
from app.database.supabase import get_supabase

logger = logging.getLogger(__name__)


class TripRepository:
    def __init__(self) -> None:
        pass

    def get_published_trips(self, limit: int = 50) -> List[dict[str, Any]]:
        try:
            client = get_supabase()
            res = (
                client.table("agent_trips")
                .select("*")
                .in_("status", ["APPROVED", "active", "published"])
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            if res.data:
                return res.data
        except Exception as exc:
            logger.warning(f"Error querying agent_trips: {exc}")

        # Fallback to trips table
        try:
            client = get_supabase()
            res = client.table("trips").select("*").limit(limit).execute()
            return res.data or []
        except Exception as exc:
            logger.error(f"Error querying trips: {exc}")
            return []

    def get_trip_by_id(self, trip_id: str) -> Optional[dict[str, Any]]:
        client = get_supabase()
        try:
            res = client.table("agent_trips").select("*").eq("id", trip_id).limit(1).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

        try:
            res = client.table("trips").select("*").eq("id", trip_id).limit(1).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

        return None

    def save_trip(self, trip_data: dict[str, Any]) -> dict[str, Any]:
        client = get_supabase()
        res = client.table("trips").insert(trip_data).execute()
        return res.data[0] if res.data else trip_data

    def mark_trip_embedded(self, trip_id: str) -> None:
        client = get_supabase()
        try:
            client.table("trips").update({"embedded": True}).eq("id", trip_id).execute()
        except Exception:
            try:
                client.table("agent_trips").update({"embedded": True}).eq("id", trip_id).execute()
            except Exception as e:
                logger.warning(f"Could not mark trip embedded in Supabase: {e}")

    def search_trips_keyword(self, query: str, limit: int = 5) -> List[dict[str, Any]]:
        client = get_supabase()
        try:
            res = (
                client.table("agent_trips")
                .select("*")
                .ilike("destination", f"%{query}%")
                .limit(limit)
                .execute()
            )
            if res.data:
                return res.data
            # Try by title
            res2 = (
                client.table("agent_trips")
                .select("*")
                .ilike("title", f"%{query}%")
                .limit(limit)
                .execute()
            )
            if res2.data:
                return res2.data
        except Exception as exc:
            logger.warning(f"Keyword search agent_trips error: {exc}")

        try:
            res = (
                client.table("trips")
                .select("*")
                .ilike("destination", f"%{query}%")
                .limit(limit)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.error(f"Keyword search trips error: {exc}")
            return []


trip_repository = TripRepository()
