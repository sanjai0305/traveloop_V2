from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.chat import _IDENTIFIER_PATTERN, sanitize_text


class HistoryQuery(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=128, examples=["user123"])

    @field_validator("user_id", mode="before")
    @classmethod
    def sanitize_user_id(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("user_id must be a string")

        cleaned = sanitize_text(value)
        if not cleaned:
            raise ValueError("user_id cannot be empty")

        if not _IDENTIFIER_PATTERN.fullmatch(cleaned):
            raise ValueError(
                "user_id may only contain letters, numbers, dots, "
                "underscores, colons, and hyphens"
            )

        return cleaned


class HistoryItem(BaseModel):
    role: str
    message: str
    time: datetime


class HistoryResponse(BaseModel):
    history: list[HistoryItem] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "history": [
                    {
                        "role": "user",
                        "message": "I like hill stations.",
                        "time": "2026-08-03T10:00:00Z",
                    },
                    {
                        "role": "assistant",
                        "message": "Got it. I'll prioritize hill stations.",
                        "time": "2026-08-03T10:00:01Z",
                    },
                ]
            }
        }
    )
