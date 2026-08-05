import logging
from typing import Any

from app.models.recommendation import UserProfileDocument
from app.models.trip import TripCreate


logger = logging.getLogger(__name__)


class SimilarityService:
    async def score_trip_for_profile(
        self,
        semantic_similarity: float,
        profile: UserProfileDocument | None,
        trip: TripCreate,
        popularity_score: float = 0.0,
    ) -> tuple[float, str]:
        preference_score = self._preference_score(profile, trip)
        search_score = self._search_history_score(profile, trip)
        booking_score = self._booking_score(profile)
        viewed_score = self._viewed_score(profile)

        final_score = (
            semantic_similarity * 40
            + preference_score * 20
            + search_score * 15
            + booking_score * 10
            + viewed_score * 10
            + popularity_score * 5
        )
        final_score = round(min(final_score, 100.0), 2)
        return final_score, self._reason(profile, trip, semantic_similarity)

    def _preference_score(
        self,
        profile: UserProfileDocument | None,
        trip: TripCreate,
    ) -> float:
        if profile is None:
            return 0.0

        signals = {
            trip.destination.casefold(),
            trip.budget.casefold(),
            trip.duration.casefold(),
            *(tag.casefold() for tag in trip.tags),
        }
        profile_values = {
            *(value.casefold() for value in profile.preferences),
            *(value.casefold() for value in profile.preferred_destinations),
            *(value.casefold() for value in profile.preferred_themes),
            *(value.casefold() for value in profile.preferred_budget),
            *(value.casefold() for value in profile.preferred_duration),
            *(value.casefold() for value in profile.preferred_group_type),
        }
        return 1.0 if signals & profile_values else 0.0

    def _search_history_score(
        self,
        profile: UserProfileDocument | None,
        trip: TripCreate,
    ) -> float:
        if profile is None:
            return 0.0

        destinations = {
            destination.casefold()
            for destination in profile.frequently_searched_destinations
        }
        return 1.0 if trip.destination.casefold() in destinations else 0.0

    def _viewed_score(self, profile: UserProfileDocument | None) -> float:
        if profile is None:
            return 0.0
        if profile.frequently_viewed_trips or profile.bookmarked_trips:
            return 1.0
        return 0.0

    def _booking_score(self, profile: UserProfileDocument | None) -> float:
        if profile is None:
            return 0.0
        return 1.0 if profile.booked_trips else 0.0

    def _reason(
        self,
        profile: UserProfileDocument | None,
        trip: TripCreate,
        semantic_similarity: float,
    ) -> str:
        if profile:
            if trip.destination in profile.preferred_destinations:
                return f"Matches your interest in {trip.destination}"
            matching_tags = [
                tag
                for tag in trip.tags
                if tag in profile.preferences or tag in profile.preferred_themes
            ]
            if matching_tags:
                return f"Because you like {matching_tags[0]} trips"
            if trip.budget in profile.preferred_budget:
                return f"Matches your {trip.budget.lower()} travel preference"
            if profile.booked_trips:
                return "Similar to your previous bookings"
            if semantic_similarity >= 0.85:
                return "Matches your recent searches"

        return "Trending among travelers with similar interests"

    def payload_to_trip(self, payload: dict[str, Any]) -> TripCreate:
        metadata = payload.get("metadata") or {}
        return TripCreate(
            title=str(payload.get("title", "")),
            destination=str(payload.get("destination", "")),
            description=str(metadata.get("description") or metadata.get("document") or ""),
            budget=str(metadata.get("budget") or "Mid Range"),
            duration=str(metadata.get("duration") or "Weekend"),
            tags=[str(tag) for tag in metadata.get("tags", [])],
        )


similarity_service = SimilarityService()


def get_similarity_service() -> SimilarityService:
    return similarity_service
