import logging
from typing import Any

from app.core.llm import llm_client
from app.models.chat import ChatRequest, ChatResponse
from app.services.demand_service import demand_service
from app.services.extractor_service import extractor_service
from app.services.history_service import HistoryService, history_service
from app.services.memory_service import MemoryService, memory_service
from app.services.rag_service import RagService, rag_service

logger = logging.getLogger(__name__)

TRAVEL_ASSISTANT_PROMPT = """You are Traveloop AI, an intelligent travel assistant.

Your role:
- If matching trip packages are available, present them enthusiastically.
- If NO exact matching trip package exists, inform the user clearly that their request has been recorded for Traveloop verified partner agents to publish soon, and recommend similar destinations. Never reply with only 'No trips found'.
- Answer naturally, helpfully, and accurately based on context."""


class ChatService:
    def __init__(
        self,
        memory: MemoryService,
        history: HistoryService,
        rag: RagService,
    ) -> None:
        self._memory = memory
        self._history = history
        self._rag = rag

    async def create_chat_response(self, message: str) -> str:
        request = ChatRequest(message=message)
        response = await self.create_conversation_response(request)
        return response.response

    async def create_conversation_response(self, request: ChatRequest) -> ChatResponse:
        memory = await self._memory.load_memory(request.user_id, request.session_id)
        preferences = await self._history.get_user_preferences(request.user_id)
        detected_preferences = self._memory.detect_preferences(request.message)

        new_preferences = await self._history.update_user_preferences(
            user_id=request.user_id,
            detected_preferences=detected_preferences,
        )
        active_preferences = preferences + new_preferences

        # ── Step 1: Hybrid Vector RAG Search ──────────────────────────────
        retrieved_trips, trip_context = await self._rag.retrieve_relevant_trips(
            request.message
        )
        exact_match_found = len(retrieved_trips) > 0

        demand_created = False
        destination_name = ""

        # ── Step 2: CASE 1 vs CASE 2 Branching ────────────────────────────
        if not exact_match_found:
            # CASE 2: No exact trip exists -> Automatically Record/Increment Demand
            demand_created = True
            extracted = extractor_service.extract(request.message)
            destination_name = extracted.get("destination") or ""

            try:
                demand_res = await demand_service.record_or_increment_demand(
                    user_id=request.user_id,
                    extracted=extracted,
                    message=request.message,
                )
                destination_name = demand_res.get("destination", destination_name)
                logger.info(f"🤖 [Auto Demand] {demand_res['action']} for {destination_name}")
            except Exception as d_err:
                logger.warning(f"Auto demand recording notice: {d_err}")

        # ── Step 3: Build Context & Generate Gemini Response ──────────────
        prompt = self._build_prompt(
            memory_context=self._memory.format_memory_context(memory),
            preferences=active_preferences,
            trip_context=trip_context,
            current_message=request.message,
            exact_match_found=exact_match_found,
            destination_name=destination_name,
        )

        ai_response = await llm_client.generate_text(prompt)
        logger.info(f"Gemini Response Generated (Match: {exact_match_found}, Demand: {demand_created})")

        # ── Step 4: Persist Memory & History ──────────────────────────────
        await self._memory.append_conversation(
            user_id=request.user_id,
            session_id=request.session_id,
            user_message=request.message,
            assistant_message=ai_response,
            existing_memory=memory,
        )
        await self._history.save_message(
            user_id=request.user_id,
            session_id=request.session_id,
            role="user",
            message=request.message,
        )
        await self._history.save_message(
            user_id=request.user_id,
            session_id=request.session_id,
            role="assistant",
            message=ai_response,
        )

        return ChatResponse(
            success=True,
            response=ai_response,
            memory_updated=True,
            preferences_detected=detected_preferences,
            recommended_trips=[
                {
                    "trip_id": t.trip_id,
                    "title": t.title,
                    "destination": t.destination,
                    "score": t.score,
                }
                for t in retrieved_trips
            ] if exact_match_found else [],
            exact_match_found=exact_match_found,
            demand_created=demand_created,
        )

    def _build_prompt(
        self,
        memory_context: str,
        preferences: list[str],
        trip_context: str,
        current_message: str,
        exact_match_found: bool,
        destination_name: str,
    ) -> str:
        preference_context = (
            "\n".join(f"- {preference}" for preference in preferences)
            if preferences
            else "No stored user preferences."
        )

        if exact_match_found:
            match_instruction = "Matching trips WERE found! Summarize these trips enthusiastically and invite the user to view details or book."
        else:
            dest_label = f" for '{destination_name}'" if destination_name else ""
            match_instruction = (
                f"No exact trip matching the user's search{dest_label} was found in the database. "
                "Inform the user warmly that their travel request has been recorded for our verified travel partners, "
                "who may publish a matching trip package soon. Meanwhile, suggest popular similar destinations or ask for travel dates."
            )

        return f"""{TRAVEL_ASSISTANT_PROMPT}

{match_instruction}

Conversation history:
{memory_context}

User preferences:
{preference_context}

Retrieved trip information:
{trip_context}

Current user message:
{current_message}

Assistant answer:"""


chat_service = ChatService(memory_service, history_service, rag_service)


def get_chat_service() -> ChatService:
    return chat_service
