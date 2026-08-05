from datetime import date

from fastapi import APIRouter, Depends, Query, Request

from app.models.analytics import AnalyticsFilters, AnalyticsResponse
from app.services.analytics_service import AnalyticsService, get_analytics_service
from app.services.rate_limit_service import RateLimitService, get_rate_limit_service


router = APIRouter(prefix="/analytics", tags=["Analytics", "Dashboard"])


@router.get(
    "",
    response_model=AnalyticsResponse,
    summary="Get dashboard analytics and demand trends",
)
async def get_analytics(
    request: Request,
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    destination: str | None = Query(default=None, max_length=120),
    budget: str | None = Query(default=None),
    theme: str | None = Query(default=None),
    user_id: str | None = Query(default=None, max_length=128),
    group_type: str | None = Query(default=None),
    service: AnalyticsService = Depends(get_analytics_service),
    rate_limiter: RateLimitService = Depends(get_rate_limit_service),
) -> AnalyticsResponse:
    client_host = request.client.host if request.client else "unknown"
    await rate_limiter.check(f"rate:analytics:{client_host}")
    filters = AnalyticsFilters(
        from_date=from_date,
        to_date=to_date,
        destination=destination,
        budget=budget,
        theme=theme,
        user_id=user_id,
        group_type=group_type,
    )
    return await service.get_dashboard(filters)
