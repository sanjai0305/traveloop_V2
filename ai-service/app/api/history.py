from fastapi import APIRouter, Depends, Query

from app.models.history import HistoryQuery, HistoryResponse
from app.services.history_service import HistoryService, get_history_service


router = APIRouter(prefix="/history", tags=["History"])


@router.get(
    "",
    response_model=HistoryResponse,
    summary="Get long-term chat history for a user",
)
async def get_history(
    user_id: str = Query(..., min_length=1, max_length=128, examples=["user123"]),
    service: HistoryService = Depends(get_history_service),
) -> HistoryResponse:
    query = HistoryQuery(user_id=user_id)
    return await service.get_history(query.user_id)
