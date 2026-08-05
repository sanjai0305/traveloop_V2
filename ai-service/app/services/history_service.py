import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.repositories.chat_history_repository import chat_history_repository
from app.models.chat import ChatHistoryDocument
from app.models.history import HistoryItem, HistoryResponse


logger = logging.getLogger(__name__)


class HistoryService:

    async def save_message(
        self,
        user_id: str,
        session_id: str,
        role: str,
        message: str,
    ) -> None:
        try:
            chat_history_repository.save_message(user_id, session_id, role, message)
        except Exception as exc:
            logger.exception("Failed to store chat history in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to store chat history",
            ) from exc

        logger.info("History Stored")

    async def get_history(self, user_id: str) -> HistoryResponse:
        try:
            documents = chat_history_repository.get_history(user_id)
        except Exception as exc:
            logger.exception("Failed to load chat history from Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to load chat history",
            ) from exc

        return HistoryResponse(
            history=[
                HistoryItem(
                    role=str(document["role"]),
                    message=str(document["message"]),
                    time=document["timestamp"],
                )
                for document in documents
                if document.get("timestamp") is not None
            ]
        )

    async def get_user_preferences(self, user_id: str) -> list[str]:
        try:
            return chat_history_repository.get_user_preferences(user_id)
        except Exception as exc:
            logger.exception("Failed to load user preferences from Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to load user preferences",
            ) from exc

    async def update_user_preferences(
        self,
        user_id: str,
        detected_preferences: list[str],
    ) -> list[str]:
        if not detected_preferences:
            return []

        existing_preferences = await self.get_user_preferences(user_id)
        existing_keys = {preference.casefold() for preference in existing_preferences}
        new_preferences = [
            preference
            for preference in detected_preferences
            if preference.casefold() not in existing_keys
        ]

        if not new_preferences:
            return []

        updated_preferences = existing_preferences + new_preferences

        try:
            chat_history_repository.update_user_preferences(user_id, updated_preferences)
        except Exception as exc:
            logger.exception("Failed to update user preferences in Supabase")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to update user preferences",
            ) from exc

        logger.info("Preferences Updated")
        return new_preferences

    async def ensure_indexes(self) -> None:
        # Supabase PostgreSQL indexes are managed via schema.sql
        logger.info("Supabase: indexes managed via schema.sql")


history_service = HistoryService()


def get_history_service() -> HistoryService:
    return history_service
