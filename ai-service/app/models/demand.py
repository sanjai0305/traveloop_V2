from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.analytics import CountMetric


class TravelDemandDocument(BaseModel):
    user_id: str = "anonymous"
    session_id: str = "default"
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
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DemandItem(BaseModel):
    user_id: str = "anonymous"
    destination: str = "Popular Destination"
    budget: str | None = None
    duration: str | None = None
    theme: str | None = None
    group: str | None = Field(default=None, alias="group_type")
    group_type: str | None = None
    intent: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    demand_score: int = 85
    users_waiting: int = 1
    avg_budget: str | None = None
    avg_duration: str | None = None
    intent_count: int = 1
    source: str = "chatbot"
    last_requested: str = "Just Now"

    model_config = ConfigDict(populate_by_name=True)


class DemandsResponse(BaseModel):
    success: bool = True
    demands: list[DemandItem] = Field(default_factory=list)
    recent_demands: list[DemandItem] = Field(default_factory=list)
    top_requested_destinations: list[CountMetric] = Field(default_factory=list)
    top_requested_themes: list[CountMetric] = Field(default_factory=list)
    top_group_types: list[CountMetric] = Field(default_factory=list)
    top_trip_intents: list[CountMetric] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)
