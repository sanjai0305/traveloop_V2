from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


def clean_text(value: str) -> str:
    return " ".join(value.strip().split())


class TripCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        examples=["Budget Bali Family Escape"],
    )
    destination: str = Field(..., min_length=1, max_length=120, examples=["Bali"])
    description: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        examples=["Beach holiday with snorkeling and temple tours."],
    )
    budget: str = Field(..., min_length=1, max_length=120, examples=["Budget Friendly"])
    duration: str = Field(..., min_length=1, max_length=120, examples=["5 Days"])
    tags: list[str] = Field(
        default_factory=list,
        max_length=20,
        examples=[["Beach", "Family", "Snorkeling"]],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Budget Bali Family Escape",
                "destination": "Bali",
                "description": "Beach holiday with snorkeling and temple tours.",
                "budget": "Budget Friendly",
                "duration": "5 Days",
                "tags": ["Beach", "Family", "Snorkeling", "Temple Tour"],
            }
        }
    )

    @field_validator(
        "title",
        "destination",
        "description",
        "budget",
        "duration",
        mode="before",
    )
    @classmethod
    def sanitize_text_fields(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("Value must be a string")

        cleaned = clean_text(value)
        if not cleaned:
            raise ValueError("Value cannot be empty")

        return cleaned

    @field_validator("tags", mode="before")
    @classmethod
    def sanitize_tags(cls, value: Any) -> list[str]:
        if value is None:
            return []

        if not isinstance(value, list):
            raise ValueError("Tags must be a list")

        sanitized_tags: list[str] = []
        seen_tags: set[str] = set()
        for item in value:
            if not isinstance(item, str):
                raise ValueError("Each tag must be a string")

            tag = clean_text(item)
            if not tag:
                continue

            if len(tag) > 80:
                raise ValueError("Each tag must be 80 characters or fewer")

            tag_key = tag.casefold()
            if tag_key not in seen_tags:
                sanitized_tags.append(tag)
                seen_tags.add(tag_key)

        if len(sanitized_tags) > 20:
            raise ValueError("At most 20 tags are allowed")

        return sanitized_tags


class TripDocument(TripCreate):
    trip_id: str
    embedded: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)


class TripEmbedResponse(BaseModel):
    success: bool = True
    trip_id: str
    embedded: bool = True
