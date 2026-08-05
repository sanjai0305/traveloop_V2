import logging
from app.database.supabase import get_supabase, init_supabase, check_supabase_health

logger = logging.getLogger(__name__)


async def connect_to_supabase() -> None:
    init_supabase()
    logger.info("✅ Supabase Connected")


async def close_supabase_connection() -> None:
    logger.info("Supabase connection closed")


def get_database():
    return get_supabase()


async def ping_supabase() -> bool:
    return check_supabase_health()
