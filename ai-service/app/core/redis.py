import inspect
import logging
from typing import Any


from app.core.config import get_settings


logger = logging.getLogger(__name__)

_client: Any | None = None


async def connect_to_redis() -> None:
    global _client

    settings = get_settings()

    try:
        from redis.asyncio import Redis

        _client = Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            health_check_interval=30,
        )
        await ping_redis()
    except Exception:
        logger.exception("Redis connection failed")
        _client = None
        raise

    logger.info("✅ Redis Connected")


async def close_redis_connection() -> None:
    global _client

    if _client is not None:
        close = getattr(_client, "aclose", None) or getattr(_client, "close", None)
        if close is not None:
            result = close()
            if inspect.isawaitable(result):
                await result

    _client = None


def get_redis_client() -> Any:
    if _client is None:
        raise RuntimeError("Redis is not connected")
    return _client


async def ping_redis() -> bool:
    await get_redis_client().ping()
    return True
