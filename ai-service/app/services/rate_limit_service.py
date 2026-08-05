import logging

from fastapi import HTTPException, status

from app.core.redis import get_redis_client


logger = logging.getLogger(__name__)


class RateLimitService:
    async def check(
        self,
        key: str,
        limit: int = 120,
        window_seconds: int = 60,
    ) -> None:
        try:
            client = get_redis_client()
            current = await client.incr(key)
            if current == 1:
                await client.expire(key, window_seconds)
        except Exception as exc:
            logger.exception("Rate limit check failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rate limiter is unavailable",
            ) from exc

        if current > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )


rate_limit_service = RateLimitService()


def get_rate_limit_service() -> RateLimitService:
    return rate_limit_service
