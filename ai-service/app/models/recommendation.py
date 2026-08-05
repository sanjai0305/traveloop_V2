from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


class RecommendationDocument(BaseModel):
    user_id: str
    trip_id: str
    title: str
    destination: str
    score: float
    reason: str
    thumbnail: str | None = None
    price: str | None = None
    duration: str | None = None
    viewed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RecommendationItem(BaseModel):
    trip_id: str
    title: str
    destination: str
    score: float
    reason: str
    thumbnail: str | None = None
    price: str | None = None
    duration: str | None = None


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationItem]
    dashboard_sections: dict[str, list[RecommendationItem]] = Field(
        default_factory=dict
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "recommendations": [
                    {
                        "trip_id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "Maldives Honeymoon Escape",
                        "destination": "Maldives",
                        "score": 94.8,
                        "reason": "Because you like beach destinations",
                        "thumbnail": None,
                        "price": "Luxury",
                        "duration": "5 Days",
                    }
                ],
                "dashboard_sections": {
                    "recommended_for_you": [],
                    "new_trips_matching_your_interests": [],
                    "because_you_like_beach_trips": [],
                    "trending_near_you": [],
                    "recently_added_for_you": [],
                    "continue_exploring": [],
                },
            }
        }
    )


class UserProfileDocument(BaseModel):
    user_id: str
    preferred_destinations: list[str] = Field(default_factory=list)
    preferred_themes: list[str] = Field(default_factory=list)
    preferred_budget: list[str] = Field(default_factory=list)
    preferred_duration: list[str] = Field(default_factory=list)
    preferred_seasons: list[str] = Field(default_factory=list)
    preferred_group_type: list[str] = Field(default_factory=list)
    favourite_activities: list[str] = Field(default_factory=list)
    frequently_viewed_trips: list[str] = Field(default_factory=list)
    bookmarked_trips: list[str] = Field(default_factory=list)
    booked_trips: list[str] = Field(default_factory=list)
    frequently_searched_destinations: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)
    profile_embedding: list[float] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
