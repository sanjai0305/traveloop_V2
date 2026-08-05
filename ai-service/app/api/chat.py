from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService, get_chat_service
from app.services.analytics_service import AnalyticsService, get_analytics_service
from app.services.recommendation_service import (
    RecommendationService,
    get_recommendation_service,
)


router = APIRouter(prefix="/chat", tags=["Chat", "Memory"])


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a memory-aware travel assistant response",
)
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    service: ChatService = Depends(get_chat_service),
    analytics: AnalyticsService = Depends(get_analytics_service),
    recommendations: RecommendationService = Depends(get_recommendation_service),
) -> ChatResponse:
    response = await service.create_conversation_response(request)
    background_tasks.add_task(
        analytics.process_chat_message,
        request.user_id,
        request.session_id,
        request.message,
    )
    background_tasks.add_task(recommendations.refresh_for_user, request.user_id)
    return response
