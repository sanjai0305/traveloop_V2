from fastapi import APIRouter, Depends, status

from app.models.search import SearchRequest, SearchResponse
from app.services.rag_service import RagService, get_rag_service


router = APIRouter(tags=["Search"])


@router.post(
    "/search",
    response_model=SearchResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
    summary="Search trips and generate a grounded answer",
)
async def search(
    request: SearchRequest,
    service: RagService = Depends(get_rag_service),
) -> SearchResponse:
    return await service.search(query=request.query, user_id=request.user_id)
