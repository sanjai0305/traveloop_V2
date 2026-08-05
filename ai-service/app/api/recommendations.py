from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status

from app.models.history import HistoryQuery
from app.models.recommendation import RecommendationResponse
from app.services.rate_limit_service import RateLimitService, get_rate_limit_service
from app.services.recommendation_service import (
    RecommendationService,
    get_recommendation_service,
)


router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations", "User Profile", "Personalization"],
)


@router.get(
    "",
    response_model=RecommendationResponse,
    response_model_exclude_none=True,
    summary="Get personalized recommendations for a user",
)
async def get_recommendations(
    request: Request,
    user_id: str = Query(..., min_length=1, max_length=128, examples=["user123"]),
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
    service: RecommendationService = Depends(get_recommendation_service),
    rate_limiter: RateLimitService = Depends(get_rate_limit_service),
) -> RecommendationResponse:
    query = HistoryQuery(user_id=user_id)
    if x_user_id is not None and x_user_id != query.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another user's recommendations",
        )

    client_host = request.client.host if request.client else "unknown"
    await rate_limiter.check(f"rate:recommendations:{query.user_id}:{client_host}")
    return await service.get_recommendations(query.user_id)
