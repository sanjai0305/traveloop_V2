import logging
from app.database.mysql import init_mysql, check_mysql_health, get_engine

logger = logging.getLogger(__name__)


async def connect_to_mysql() -> None:
    init_mysql()
    logger.info("✅ MySQL Connected (SQLAlchemy/PyMySQL)")


async def close_mysql_connection() -> None:
    engine = get_engine()
    engine.dispose()
    logger.info("MySQL connection pool closed")


def get_database():
    return get_engine()


async def ping_mysql() -> bool:
    return check_mysql_health()


# Backward-compatibility aliases
connect_to_supabase = connect_to_mysql
close_supabase_connection = close_mysql_connection
ping_supabase = ping_mysql
