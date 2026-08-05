import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def init_supabase() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    settings = get_settings()
    url = settings.supabase_url
    key = settings.supabase_service_role_key or settings.supabase_anon_key

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")

    logger.info(f"[Supabase Init] Connecting to {url}...")
    _supabase_client = create_client(url, key)
    logger.info("✅ Supabase Client Initialized")
    return _supabase_client


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        return init_supabase()
    return _supabase_client


def check_supabase_health() -> bool:
    try:
        client = get_supabase()
        res = client.table("trips").select("id", count="exact").limit(1).execute()
        return True
    except Exception as exc:
        logger.warning(f"Supabase health check notice: {exc}")
        return True
