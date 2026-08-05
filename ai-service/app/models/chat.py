from datetime import datetime, timezone
import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9_.:-]+$")


def sanitize_text(value: str) -> str:
    return " ".join(value.strip().split())


class ChatRequest(BaseModel):
    user_id: str = Field(
        default="anonymous",
        min_length=1,
        max_length=128,
        examples=["user123"],
    )
    session_id: str = Field(
        default="default",
        min_length=1,
        max_length=128,
        examples=["session001"],
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        examples=["Suggest a weekend trip."],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "user123",
                "session_id": "session001",
                "message": "Suggest a weekend trip.",
            }
        }
    )

    @staticmethod
    def _validate_identifier(value: Any, field_name: str) -> str:
        if not isinstance(value, str):
            raise ValueError(f"{field_name} must be a string")

        cleaned = sanitize_text(value)
        if not cleaned:
            raise ValueError(f"{field_name} cannot be empty")

        if not _IDENTIFIER_PATTERN.fullmatch(cleaned):
            raise ValueError(
                f"{field_name} may only contain letters, numbers, dots, "
                "underscores, colons, and hyphens"
            )

        return cleaned

    @staticmethod
    def _sanitize_message(value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("message must be a string")

        cleaned = sanitize_text(value)
        if not cleaned:
            raise ValueError("message cannot be empty")

        return cleaned

    @field_validator("user_id", mode="before")
    @classmethod
    def sanitize_user_id(cls, value: Any) -> str:
        return cls._validate_identifier(value, "user_id")

    @field_validator("session_id", mode="before")
    @classmethod
    def sanitize_session_id(cls, value: Any) -> str:
        return cls._validate_identifier(value, "session_id")

    @field_validator("message", mode="before")
    @classmethod
    def sanitize_message(cls, value: Any) -> str:
        return cls._sanitize_message(value)


class ChatResponse(BaseModel):
    success: bool = True
    response: str
    memory_updated: bool = True
    preferences_detected: list[str] = Field(default_factory=list)
    recommended_trips: list[dict[str, Any]] = Field(default_factory=list)
    exact_match_found: bool = True
    demand_created: bool = False

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "response": "Based on your preference for hill stations, I recommend Ooty, Kodaikanal, or Munnar.",
                "memory_updated": True,
                "preferences_detected": ["Hill Stations"],
            }
        }
    )


class ChatHistoryDocument(BaseModel):
    user_id: str
    session_id: str
    role: Literal["user", "assistant"]
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)
