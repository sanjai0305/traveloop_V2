import logging
import re
from datetime import datetime, timezone


logger = logging.getLogger(__name__)

DESTINATION_KEYWORDS = {
    "Ooty",
    "Kodaikanal",
    "Munnar",
    "Maldives",
    "Bali",
    "Goa",
    "Manali",
    "Shimla",
    "Ladakh",
    "Jaipur",
    "Kerala",
    "Rishikesh",
    "Coorg",
    "Darjeeling",
    "Andaman",
    "Dubai",
    "Singapore",
    "Thailand",
    "Paris",
    "London",
}

THEME_RULES: dict[str, tuple[str, ...]] = {
    "Beach": ("beach", "beaches", "maldives", "goa", "bali", "island", "coast"),
    "Hill Station": (
        "hill station",
        "hill stations",
        "manali",
        "shimla",
        "mountain",
    ),
    "Adventure": ("adventure", "trek", "trekking", "hiking", "rafting", "bungee"),
    "Wildlife": ("wildlife", "safari", "jungle", "national park"),
    "Camping": ("camping", "camp", "tent"),
    "Historical": ("historical", "heritage", "fort", "palace", "museum"),
    "Spiritual": ("spiritual", "pilgrimage", "temple", "religious", "ashram"),
    "Road Trip": ("road trip", "roadtrip", "drive", "driving"),
    "Nature": ("nature", "scenic", "forest", "greenery", "waterfall"),
    "Food": ("food", "cuisine", "culinary", "street food"),
    "Photography": ("photography", "photoshoot", "photo", "instagram"),
    "Cruise": ("cruise", "ship", "sailing"),
}

DESTINATION_THEME_DEFAULTS = {
    "Ooty": "Nature",
    "Kodaikanal": "Nature",
    "Munnar": "Nature",
    "Maldives": "Beach",
    "Bali": "Beach",
    "Goa": "Beach",
    "Ladakh": "Adventure",
    "Jaipur": "Historical",
    "Rishikesh": "Adventure",
}

SEASON_RULES: dict[str, tuple[str, ...]] = {
    "Summer": ("summer", "april", "may", "june"),
    "Monsoon": ("monsoon", "rainy", "rain", "july", "august", "september"),
    "Winter": ("winter", "december", "january", "february", "snow"),
    "Spring": ("spring", "march"),
    "Autumn": ("autumn", "october", "november"),
}

GROUP_RULES: dict[str, tuple[str, ...]] = {
    "Solo": ("solo", "alone", "by myself"),
    "Couple": ("couple", "honeymoon", "romantic", "partner", "spouse"),
    "Family": ("family", "kids", "children", "parents"),
    "Friends": ("friends", "group of friends", "college group"),
    "Corporate": ("corporate", "team outing", "office", "company"),
}

INTENT_RULES: dict[str, tuple[str, ...]] = {
    "Honeymoon": ("honeymoon", "romantic"),
    "Trip Planning": ("plan", "suggest", "recommend", "need", "want", "looking for"),
    "Booking Intent": ("book", "booking", "reserve", "availability"),
    "Price Research": ("price", "cost", "budget", "cheap", "expensive"),
    "Itinerary": ("itinerary", "schedule", "day wise", "day-wise"),
}

TRANSPORT_RULES: dict[str, tuple[str, ...]] = {
    "Flight": ("flight", "fly", "airport"),
    "Train": ("train", "railway"),
    "Car": ("car", "cab", "taxi", "drive", "road trip"),
    "Bus": ("bus",),
    "Cruise": ("cruise", "ship"),
}

ACCOMMODATION_RULES: dict[str, tuple[str, ...]] = {
    "Hotel": ("hotel",),
    "Resort": ("resort",),
    "Homestay": ("homestay",),
    "Hostel": ("hostel",),
    "Villa": ("villa",),
    "Camping": ("camp", "camping", "tent"),
}


class ExtractorService:
    def extract(self, message: str) -> dict[str, object]:
        normalized_message = f" {message.casefold()} "

        destination = self._extract_destination(message)
        budget = self._extract_budget(normalized_message)
        duration = self._extract_duration(normalized_message)
        theme = self._first_rule_match(normalized_message, THEME_RULES)
        if theme is None and destination is not None:
            theme = DESTINATION_THEME_DEFAULTS.get(destination)
        season = self._first_rule_match(normalized_message, SEASON_RULES)
        group_type = self._first_rule_match(normalized_message, GROUP_RULES)
        intent = self._first_rule_match(normalized_message, INTENT_RULES)
        transportation = self._first_rule_match(normalized_message, TRANSPORT_RULES)
        accommodation = self._first_rule_match(normalized_message, ACCOMMODATION_RULES)

        if intent is None:
            intent = "General Inquiry"

        if destination:
            logger.info("Destination Extracted")
        if theme:
            logger.info("Theme Detected")

        return {
            "destination": destination,
            "budget": budget,
            "duration": duration,
            "theme": theme,
            "season": season,
            "trip_type": intent,
            "transportation": transportation,
            "accommodation": accommodation,
            "companions": group_type,
            "group_type": group_type,
            "intent": intent,
            "timestamp": datetime.now(timezone.utc),
        }

    def _extract_budget(self, normalized_message: str) -> str | None:
        if any(
            keyword in normalized_message
            for keyword in (" luxury ", " premium ", " five star ", " 5 star ")
        ):
            return "Luxury"

        if any(
            keyword in normalized_message
            for keyword in (" budget ", " cheap ", " affordable ", " low cost ")
        ):
            return "Budget"

        if any(
            keyword in normalized_message
            for keyword in (" mid range ", " mid-range ", " moderate ", " standard ")
        ):
            return "Mid Range"

        return None

    def _extract_duration(self, normalized_message: str) -> str | None:
        if any(keyword in normalized_message for keyword in (" weekend ", " two days ")):
            return "Weekend"

        match = re.search(r"\b(\d{1,2})\s*(day|days|night|nights)\b", normalized_message)
        if not match:
            return None

        days = int(match.group(1))
        if days <= 2:
            return "Weekend"
        if days <= 3:
            return "1-3 Days"
        if days <= 7:
            return "4-7 Days"
        return "7+ Days"

    def _extract_destination(self, message: str) -> str | None:
        normalized_message = message.casefold()

        for destination in DESTINATION_KEYWORDS:
            if destination.casefold() in normalized_message:
                return destination

        match = re.search(
            r"\b(?:to|in|near|around|visit|visiting)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})",
            message,
        )
        if match:
            candidate = match.group(1).strip()
            if candidate.casefold() not in {"a", "the", "my", "with"}:
                return candidate

        return None

    def _first_rule_match(
        self,
        normalized_message: str,
        rules: dict[str, tuple[str, ...]],
    ) -> str | None:
        for label, keywords in rules.items():
            if any(keyword in normalized_message for keyword in keywords):
                return label
        return None


extractor_service = ExtractorService()


def get_extractor_service() -> ExtractorService:
    return extractor_service
