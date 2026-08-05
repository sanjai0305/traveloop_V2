from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.chat import _IDENTIFIER_PATTERN
from app.models.trip import clean_text


class SearchRequest(BaseModel):
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
    query: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        examples=["I need a budget beach vacation"],
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "user_id": "user123",
                "session_id": "session001",
                "query": "I need a budget beach vacation",
            }
        }
    }

    @staticmethod
    def _validate_identifier(value: Any, field_name: str) -> str:
        if not isinstance(value, str):
            raise ValueError(f"{field_name} must be a string")

        cleaned = clean_text(value)
        if not cleaned:
            raise ValueError(f"{field_name} cannot be empty")

        if not _IDENTIFIER_PATTERN.fullmatch(cleaned):
            raise ValueError(f"{field_name} contains invalid characters")

        return cleaned

    @field_validator("user_id", mode="before")
    @classmethod
    def sanitize_user_id(cls, value: Any) -> str:
        return cls._validate_identifier(value, "user_id")

    @field_validator("session_id", mode="before")
    @classmethod
    def sanitize_session_id(cls, value: Any) -> str:
        return cls._validate_identifier(value, "session_id")

    @field_validator("query", mode="before")
    @classmethod
    def sanitize_query(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("Query must be a string")

        cleaned = clean_text(value)
        if not cleaned:
            raise ValueError("Query cannot be empty")

        return cleaned


class RetrievedTrip(BaseModel):
    trip_id: str
    title: str
    score: float
    destination: str
    match_type: str = "semantic"


class SearchResponse(BaseModel):
    success: bool = True
    answer: str | None = None
    retrieved_trips: list[RetrievedTrip] = Field(default_factory=list)
    demand_recorded: bool = False
    exact_match_found: bool = False
    message: str | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "answer": "I did not find an exact match, but these are the closest relevant trips.",
                    "demand_recorded": True,
                    "exact_match_found": False,
                    "retrieved_trips": [
                        {
                            "trip_id": "550e8400-e29b-41d4-a716-446655440000",
                            "title": "Budget Bali Family Escape",
                            "score": 0.82,
                            "destination": "Bali",
                            "match_type": "semantic",
                        }
                    ],
                },
            ]
        }
    }


class SearchIntentDocument(BaseModel):
    intent_id: str
    user_id: str
    session_id: str
    query: str
    query_embedding: list[float]
    destination: str | None = None
    budget: str | None = None
    duration: str | None = None
    theme: str | None = None
    travel_month: str | None = None
    group_size: str | None = None
    group_type: str | None = None
    intent: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "intent_id": "7f982b42-62c5-41f7-b019-30d0e37c8b54",
                "user_id": "user123",
                "session_id": "session001",
                "query": "Ooty 2 day trip under Rs 5000",
                "destination": "Ooty",
                "budget": "Budget",
                "duration": "Weekend",
                "theme": "Nature",
                "intent": "Trip Planning",
                "timestamp": "2026-08-03T10:00:00Z",
            }
        }
    )
