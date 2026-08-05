from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.chat import _IDENTIFIER_PATTERN, sanitize_text


ALLOWED_BUDGETS = {"Budget", "Mid Range", "Luxury"}
ALLOWED_DURATIONS = {"Weekend", "1-3 Days", "4-7 Days", "7+ Days"}
ALLOWED_THEMES = {
    "Beach",
    "Hill Station",
    "Adventure",
    "Wildlife",
    "Camping",
    "Historical",
    "Spiritual",
    "Road Trip",
    "Nature",
    "Food",
    "Photography",
    "Cruise",
}
ALLOWED_GROUPS = {"Solo", "Couple", "Family", "Friends", "Corporate"}


class AnalyticsFilters(BaseModel):
    from_date: date | None = None
    to_date: date | None = None
    destination: str | None = Field(default=None, max_length=120)
    budget: str | None = None
    theme: str | None = None
    user_id: str | None = Field(default=None, max_length=128)
    group_type: str | None = None

    @field_validator("destination", mode="before")
    @classmethod
    def sanitize_destination(cls, value: Any) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("destination must be a string")
        cleaned = sanitize_text(value)
        return cleaned or None

    @field_validator("user_id", mode="before")
    @classmethod
    def sanitize_user_id(cls, value: Any) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("user_id must be a string")
        cleaned = sanitize_text(value)
        if cleaned and not _IDENTIFIER_PATTERN.fullmatch(cleaned):
            raise ValueError("user_id contains invalid characters")
        return cleaned or None

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, value: str | None) -> str | None:
        if value is not None and value not in ALLOWED_BUDGETS:
            raise ValueError("budget must be Budget, Mid Range, or Luxury")
        return value

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, value: str | None) -> str | None:
        if value is not None and value not in ALLOWED_THEMES:
            raise ValueError("theme is not supported")
        return value

    @field_validator("group_type")
    @classmethod
    def validate_group_type(cls, value: str | None) -> str | None:
        if value is not None and value not in ALLOWED_GROUPS:
            raise ValueError("group_type is not supported")
        return value

    @model_validator(mode="after")
    def validate_range(self) -> "AnalyticsFilters":
        if self.from_date and self.to_date and self.from_date > self.to_date:
            raise ValueError("from_date must be before or equal to to_date")
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "from_date": "2026-01-01",
                "to_date": "2026-12-31",
                "destination": "Ooty",
                "budget": "Budget",
                "theme": "Nature",
                "user_id": "user123",
                "group_type": "Family",
            }
        }
    )


class CountMetric(BaseModel):
    name: str
    count: int


class TimeSeriesPoint(BaseModel):
    label: str
    count: int


class HeatmapPoint(BaseModel):
    day: str
    hour: int
    count: int


class AnalyticsResponse(BaseModel):
    total_queries: int
    top_destinations: list[CountMetric]
    top_themes: list[CountMetric]
    budget_distribution: dict[str, int]
    duration_distribution: dict[str, int]
    peak_search_hour: str | None
    weekly_growth: float
    weekly_demand: list[TimeSeriesPoint]
    monthly_demand: list[TimeSeriesPoint]
    hourly_heatmap: list[HeatmapPoint]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_queries": 1254,
                "top_destinations": [{"name": "Ooty", "count": 241}],
                "top_themes": [{"name": "Beach", "count": 152}],
                "budget_distribution": {
                    "Budget": 420,
                    "Mid Range": 380,
                    "Luxury": 120,
                },
                "duration_distribution": {
                    "Weekend": 210,
                    "1-3 Days": 520,
                    "4-7 Days": 340,
                    "7+ Days": 184,
                },
                "peak_search_hour": "20",
                "weekly_growth": 12.8,
                "weekly_demand": [{"label": "2026-W31", "count": 145}],
                "monthly_demand": [{"label": "2026-08", "count": 512}],
                "hourly_heatmap": [{"day": "Monday", "hour": 20, "count": 43}],
            }
        }
    )


class ChatAnalyticsDocument(BaseModel):
    user_id: str
    session_id: str
    destination: str | None = None
    budget: str | None = None
    duration: str | None = None
    theme: str | None = None
    season: str | None = None
    trip_type: str | None = None
    transportation: str | None = None
    accommodation: str | None = None
    companions: str | None = None
    group_type: str | None = None
    intent: str | None = None
    timestamp: datetime

