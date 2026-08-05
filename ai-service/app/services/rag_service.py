import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.repositories.trip_repository import trip_repository
from app.core.llm import llm_client
from app.core.qdrant import search_trip_vectors, store_trip_vector
from app.models.search import RetrievedTrip, SearchResponse
from app.models.trip import TripCreate, TripDocument, TripEmbedResponse
from app.services.embedding_service import EmbeddingService, embedding_service


logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an intelligent travel assistant.

Only answer using the retrieved trip information.

If the answer is not present,
say you don't have enough information.

Never hallucinate."""


class RagService:

    def __init__(self, embeddings: EmbeddingService) -> None:
        self._embeddings = embeddings

    async def embed_trip(self, trip: TripCreate) -> TripEmbedResponse:
        trip_id = str(uuid4())
        now = datetime.now(timezone.utc)
        trip_document = TripDocument(
            trip_id=trip_id,
            title=trip.title,
            destination=trip.destination,
            description=trip.description,
            budget=trip.budget,
            duration=trip.duration,
            tags=trip.tags,
            created_at=now,
            updated_at=now,
        )
        semantic_document = self._embeddings.build_trip_document(trip)

        await self._save_trip(trip_document, semantic_document)

        embedding = await self._embeddings.embed_text(semantic_document)
        payload = self._build_qdrant_payload(
            trip_id=trip_id,
            trip=trip,
            semantic_document=semantic_document,
        )
        await store_trip_vector(trip_id=trip_id, embedding=embedding, payload=payload)
        await self._mark_trip_embedded(trip_id)

        # ── Trigger matching against stored travel_intents ───────────────
        try:
            from app.services.recommendation_service import recommendation_service
            await recommendation_service.match_trip_against_intents(trip_id=trip_id, trip=trip)
        except Exception as match_err:
            logger.warning(f"Trip intent matching notice: {match_err}")

        logger.info("Trip Embedded & Intent Matcher Triggered")
        return TripEmbedResponse(success=True, trip_id=trip_id, embedded=True)

    async def search(self, query: str, user_id: str = "anonymous") -> SearchResponse:
        retrieved_trips, context = await self.retrieve_relevant_trips(query)

        if not retrieved_trips:
            # CASE 2: No matching published trip exists -> Automatically Record/Increment Demand!
            from app.services.demand_service import demand_service
            from app.services.extractor_service import extractor_service

            extracted = extractor_service.extract(query)
            dest_name = extracted.get("destination") or ""

            try:
                demand_res = await demand_service.record_or_increment_demand(
                    user_id=user_id,
                    extracted=extracted,
                    message=query,
                    source="explore",
                )
                dest_name = demand_res.get("destination", dest_name)
                logger.info(f"🔍 [Explore Search Demand] {demand_res['action']} for {dest_name}")
            except Exception as d_err:
                logger.warning(f"Explore search demand notice: {d_err}")

            dest_label = f" for '{dest_name}'" if dest_name else ""
            answer = (
                f"I couldn't find an exact trip matching your request{dest_label}. "
                "I've recorded your travel interest, and our verified travel partners may publish a matching trip soon! "
                "Meanwhile, feel free to check out similar popular destinations."
            )

            return SearchResponse(
                success=True,
                answer=answer,
                retrieved_trips=[],
                demand_recorded=True,
                exact_match_found=False,
                message="No exact trips found. Demand recorded for travel partners.",
            )

        # CASE 1: Matching published trips exist -> Return published trips! Do NOT create demand!
        prompt = self._build_prompt(query=query, context=context)
        answer = await llm_client.generate_text(prompt)

        logger.info("Gemini Response Generated")
        return SearchResponse(
            success=True,
            answer=answer,
            retrieved_trips=retrieved_trips,
            exact_match_found=True,
            demand_recorded=False,
        )

    async def retrieve_relevant_trips(
        self,
        query: str,
    ) -> tuple[list[RetrievedTrip], str]:
        settings = get_settings()
        logger.info("Semantic Search Started")

        results = []
        try:
            query_vector = await self._embeddings.embed_text(query)
            results = await search_trip_vectors(
                query_vector=query_vector,
                limit=settings.search_top_k,
                score_threshold=settings.search_min_score,
            )
        except Exception as q_err:
            logger.warning(f"Qdrant vector search notice (fallback to Supabase): {q_err}")
            try:
                db_trips = trip_repository.search_trips_keyword(query, limit=settings.search_top_k)
                retrieved = [
                    RetrievedTrip(
                        trip_id=str(item.get("id", item.get("trip_id", ""))),
                        title=str(item.get("title", "")),
                        score=0.88,
                        destination=str(item.get("destination", "")),
                        match_type="supabase_keyword",
                    )
                    for item in db_trips
                ]
                if retrieved:
                    context_str = "\n\n".join(
                        f"Trip Title: {t.title}\nDestination: {t.destination}"
                        for t in retrieved
                    )
                    return retrieved, context_str
            except Exception as sb_err:
                logger.warning(f"Supabase fallback trip search error: {sb_err}")

        if not results:
            return [], "No relevant trip information was retrieved."

        logger.info("Top Results Retrieved")
        return [self._to_retrieved_trip(result) for result in results], self._build_context(results)

    async def _save_trip(
        self,
        trip_document: TripDocument,
        semantic_document: str,
    ) -> None:
        doc = trip_document.model_dump()
        doc["semantic_document"] = semantic_document
        # Convert datetimes to ISO strings for Supabase
        for k, v in doc.items():
            if hasattr(v, "isoformat"):
                doc[k] = v.isoformat()

        try:
            trip_repository.save_trip(doc)
        except Exception as exc:
            logger.exception("Failed to save trip in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to save trip in Supabase",
            ) from exc

    async def _mark_trip_embedded(self, trip_id: str) -> None:
        try:
            trip_repository.mark_trip_embedded(trip_id)
        except Exception as exc:
            logger.exception("Failed to update trip embedding status in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to update trip embedding status",
            ) from exc

    def _build_qdrant_payload(
        self,
        trip_id: str,
        trip: TripCreate,
        semantic_document: str,
    ) -> dict[str, Any]:
        return {
            "trip_id": trip_id,
            "title": trip.title,
            "destination": trip.destination,
            "metadata": {
                "description": trip.description,
                "budget": trip.budget,
                "duration": trip.duration,
                "tags": trip.tags,
                "document": semantic_document,
            },
        }

    def _to_retrieved_trip(self, result: Any) -> RetrievedTrip:
        payload = getattr(result, "payload", None) or {}
        return RetrievedTrip(
            trip_id=str(payload.get("trip_id", "")),
            title=str(payload.get("title", "")),
            score=float(getattr(result, "score", 0.0)),
            destination=str(payload.get("destination", "")),
        )

    def _build_context(self, results: list[Any]) -> str:
        context_blocks: list[str] = []

        for index, result in enumerate(results, start=1):
            payload = getattr(result, "payload", None) or {}
            metadata = payload.get("metadata") or {}
            tags = metadata.get("tags") or []
            tag_text = ", ".join(tags) if tags else "General Travel"

            context_blocks.append(
                "\n".join(
                    [
                        f"Trip {index}",
                        f"Trip ID: {payload.get('trip_id', '')}",
                        f"Title: {payload.get('title', '')}",
                        f"Destination: {payload.get('destination', '')}",
                        f"Budget: {metadata.get('budget', '')}",
                        f"Duration: {metadata.get('duration', '')}",
                        f"Tags: {tag_text}",
                        f"Description: {metadata.get('description', '')}",
                    ]
                )
            )

        return "\n\n".join(context_blocks)

    def _build_prompt(self, query: str, context: str) -> str:
        return f"""{SYSTEM_PROMPT}

Retrieved trip information:
{context}

User question:
{query}

Answer:"""


rag_service = RagService(embedding_service)


def get_rag_service() -> RagService:
    return rag_service
