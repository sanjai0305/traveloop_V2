import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.redis import get_redis_client


logger = logging.getLogger(__name__)

PREFERENCE_RULES: dict[str, tuple[str, ...]] = {
    "Beach": ("beach", "beaches", "seaside", "coast", "coastal", "ocean"),
    "Hill Stations": (
        "hill station",
        "hill stations",
        "mountain",
        "mountains",
        "ooty",
        "kodaikanal",
        "munnar",
    ),
    "Luxury Travel": ("luxury", "premium", "five star", "5 star", "resort"),
    "Budget Travel": ("budget", "cheap", "affordable", "low cost", "economical"),
    "Adventure": ("adventure", "trek", "trekking", "hiking", "rafting"),
    "Solo Travel": ("solo", "alone", "by myself", "single traveler"),
    "Family": ("family", "kids", "children", "parents"),
    "Honeymoon": ("honeymoon", "romantic", "couple", "anniversary"),
    "Road Trips": ("road trip", "roadtrip", "drive", "driving"),
    "Camping": ("camping", "camp", "tent"),
    "Backpacking": ("backpacking", "backpack", "hostel"),
    "International Travel": ("international", "abroad", "overseas"),
    "Food Tourism": ("food", "cuisine", "street food", "culinary"),
    "Pilgrimage": ("pilgrimage", "temple", "spiritual", "religious"),
    "Wildlife": ("wildlife", "safari", "jungle", "national park"),
    "Nature": ("nature", "greenery", "forest", "scenic"),
    "Avoid Crowds": (
        "avoid crowds",
        "hate crowded",
        "not crowded",
        "less crowded",
        "quiet",
        "peaceful",
    ),
}


class MemoryService:
    def build_memory_key(self, user_id: str, session_id: str) -> str:
        return f"memory:{user_id}:{session_id}"

    async def load_memory(self, user_id: str, session_id: str) -> dict[str, Any]:
        key = self.build_memory_key(user_id, session_id)

        try:
            raw_memory = await get_redis_client().get(key)
        except Exception as exc:
            logger.exception("Failed to load Redis memory")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Redis memory is unavailable",
            ) from exc

        if raw_memory is None:
            now = self._now_iso()
            memory = {
                "metadata": {
                    "user_id": user_id,
                    "session_id": session_id,
                    "created_at": now,
                    "updated_at": now,
                },
                "messages": [],
            }
        else:
            try:
                memory = json.loads(raw_memory)
            except json.JSONDecodeError as exc:
                logger.exception("Invalid Redis memory payload")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Stored conversation memory is invalid",
                ) from exc

        logger.info("Memory Loaded")
        return memory

    async def append_conversation(
        self,
        user_id: str,
        session_id: str,
        user_message: str,
        assistant_message: str,
        existing_memory: dict[str, Any] | None = None,
    ) -> bool:
        settings = get_settings()
        memory = existing_memory or await self.load_memory(user_id, session_id)
        messages = list(memory.get("messages") or [])
        now = self._now_iso()

        messages.extend(
            [
                {
                    "role": "user",
                    "message": user_message,
                    "timestamp": now,
                },
                {
                    "role": "assistant",
                    "message": assistant_message,
                    "timestamp": now,
                },
            ]
        )

        memory["messages"] = messages[-settings.redis_memory_max_messages :]
        memory["metadata"] = {
            **(memory.get("metadata") or {}),
            "user_id": user_id,
            "session_id": session_id,
            "updated_at": now,
            "message_count": len(memory["messages"]),
        }

        key = self.build_memory_key(user_id, session_id)
        try:
            await get_redis_client().set(
                key,
                json.dumps(memory),
                ex=settings.redis_memory_ttl_seconds,
            )
        except Exception as exc:
            logger.exception("Failed to update Redis memory")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to update Redis memory",
            ) from exc

        logger.info("Redis Updated")
        return True

    def detect_preferences(self, message: str) -> list[str]:
        normalized_message = f" {message.casefold()} "
        detected_preferences: list[str] = []

        for preference, keywords in PREFERENCE_RULES.items():
            if any(keyword in normalized_message for keyword in keywords):
                detected_preferences.append(preference)

        return detected_preferences

    def format_memory_context(self, memory: dict[str, Any]) -> str:
        messages = memory.get("messages") or []
        if not messages:
            return "No previous conversation in this session."

        formatted_messages: list[str] = []
        for item in messages:
            role = str(item.get("role", "unknown")).title()
            message = str(item.get("message", "")).strip()
            if message:
                formatted_messages.append(f"{role}: {message}")

        return "\n".join(formatted_messages) or "No previous conversation in this session."

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()


memory_service = MemoryService()


def get_memory_service() -> MemoryService:
    return memory_service
