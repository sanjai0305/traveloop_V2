from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.core.database import ping_supabase
from app.core.gemini import gemini_client


router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="Check service health")
async def health_check() -> dict[str, str]:
    settings = get_settings()

    try:
        ping_supabase()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase PostgreSQL is not connected",
        ) from exc

    try:
        await gemini_client.health_check()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini is not connected",
        ) from exc

    return {
        "status": "healthy",
        "service": settings.app_name,
        "supabase": "connected",
        "gemini": "connected",
    }
