from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.models.trip import TripCreate, TripEmbedResponse
from app.services.rag_service import RagService, get_rag_service
from app.services.recommendation_service import (
    RecommendationService,
    get_recommendation_service,
)


router = APIRouter(tags=["Embedding"])


@router.post(
    "/embed-trip",
    response_model=TripEmbedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Embed a trip into the RAG engine",
)
async def embed_trip(
    request: TripCreate,
    background_tasks: BackgroundTasks,
    service: RagService = Depends(get_rag_service),
    recommendations: RecommendationService = Depends(get_recommendation_service),
) -> TripEmbedResponse:
    response = await service.embed_trip(request)
    background_tasks.add_task(
        recommendations.generate_for_new_trip,
        response.trip_id,
        request,
    )
    return response
