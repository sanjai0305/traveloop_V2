import asyncio
import logging
from threading import Lock
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models.trip import TripCreate


logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self) -> None:
        self._embeddings: Any | None = None
        self._dimension: int | None = None
        self._load_lock = Lock()

    async def embed_text(self, text: str) -> list[float]:
        cleaned_text = " ".join(text.strip().split())
        if not cleaned_text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Text for embedding cannot be empty",
            )

        try:
            embedding = await asyncio.to_thread(self._embed_text_sync, cleaned_text)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Embedding generation failed")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Embedding generation failed",
            ) from exc

        if not embedding:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Embedding model returned an empty vector",
            )

        logger.info("Embedding Generated")
        return embedding

    async def get_embedding_dimension(self) -> int:
        if self._dimension is None:
            embedding = await self.embed_text("embedding dimension probe")
            self._dimension = len(embedding)

        return self._dimension

    def build_trip_document(self, trip: TripCreate) -> str:
        tags = ", ".join(trip.tags) if trip.tags else "General Travel"
        return "\n".join(
            [
                f"Trip: {trip.title}.",
                f"Destination: {trip.destination}.",
                f"Description: {trip.description}.",
                f"Budget: {trip.budget}.",
                f"Duration: {trip.duration}.",
                f"Tags: {tags}.",
            ]
        )

    def _embed_text_sync(self, text: str) -> list[float]:
        embeddings = self._get_embeddings()
        raw_embedding = embeddings.embed_query(text)
        return [float(value) for value in raw_embedding]

    def _get_embeddings(self) -> Any:
        if self._embeddings is None:
            with self._load_lock:
                if self._embeddings is None:
                    from langchain_community.embeddings import HuggingFaceEmbeddings

                    settings = get_settings()
                    self._embeddings = HuggingFaceEmbeddings(
                        model_name=settings.embedding_model_name,
                        model_kwargs={"device": "cpu"},
                        encode_kwargs={"normalize_embeddings": True},
                    )

        return self._embeddings


embedding_service = EmbeddingService()


def get_embedding_service() -> EmbeddingService:
    return embedding_service
