import logging
from uuid import uuid4

from fastapi import HTTPException, status

from app.repositories.travel_intent_repository import travel_intent_repository
from app.core.qdrant import store_search_intent_vector
from app.models.search import SearchIntentDocument, SearchRequest
from app.services.embedding_service import EmbeddingService, embedding_service
from app.services.extractor_service import ExtractorService, extractor_service


logger = logging.getLogger(__name__)


class SearchIntentService:

    def __init__(
        self,
        embeddings: EmbeddingService,
        extractor: ExtractorService,
    ) -> None:
        self._embeddings = embeddings
        self._extractor = extractor

    async def record_search_intent(
        self,
        request: SearchRequest,
        query_embedding: list[float],
    ) -> SearchIntentDocument:
        extracted = self._extractor.extract(request.query)
        intent_id = str(uuid4())
        document = SearchIntentDocument(
            intent_id=intent_id,
            user_id=request.user_id,
            session_id=request.session_id,
            query=request.query,
            query_embedding=query_embedding,
            destination=extracted.get("destination"),
            budget=extracted.get("budget"),
            duration=extracted.get("duration"),
            theme=extracted.get("theme"),
            travel_month=extracted.get("season"),
            group_size=extracted.get("companions"),
            group_type=extracted.get("group_type"),
            intent=extracted.get("intent"),
            timestamp=extracted["timestamp"],
        )

        try:
            travel_intent_repository.save_search_intent({
                "intent_id": intent_id,
                "user_id": request.user_id,
                "session_id": request.session_id,
                "query": request.query,
                "query_embedding": query_embedding,
                "destination": document.destination,
                "budget": document.budget,
                "duration": document.duration,
                "theme": document.theme,
                "travel_month": document.travel_month,
                "group_size": str(document.group_size) if document.group_size else None,
                "group_type": document.group_type,
                "intent": document.intent,
                "timestamp": document.timestamp.isoformat() if hasattr(document.timestamp, "isoformat") else str(document.timestamp),
            })
        except Exception as exc:
            logger.exception("Failed to store traveler search intent in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to store traveler search intent",
            ) from exc

        await store_search_intent_vector(
            intent_id=intent_id,
            embedding=query_embedding,
            payload={
                "intent_id": intent_id,
                "user_id": request.user_id,
                "session_id": request.session_id,
                "query": request.query,
                "destination": document.destination,
                "budget": document.budget,
                "duration": document.duration,
                "theme": document.theme,
                "group_type": document.group_type,
                "intent": document.intent,
            },
        )
        logger.info("Traveler Search Intent Stored")
        return document

    async def ensure_indexes(self) -> None:
        # Supabase PostgreSQL indexes are managed via schema.sql — nothing to do here
        logger.info("Supabase: indexes managed via schema.sql")


search_intent_service = SearchIntentService(embedding_service, extractor_service)


def get_search_intent_service() -> SearchIntentService:
    return search_intent_service
