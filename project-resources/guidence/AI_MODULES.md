# AI Module Documentation — Traveloop V2

This document details the AI architecture, prompt optimization guidelines, and activity seed engines powering Traveloop V2.

---

## 1. AI Feature Catalogue

### A. Context-Aware Assistant
* **Implementation Location**: Inside [BookedPackageDetail.jsx](file:///c:/Users/sanja/Trip-Planner-Hackathon/traveloop/src/pages/BookedPackageDetail.jsx) AI Chat section.
* **Goal**: Provide travelers with contextual, destination-specific assistance during their booked trip.
* **Context Injected**: The assistant loads user context details from the active state, including:
  * Destination location and hotel ratings.
  * Start and End dates (duration).
  * Travel budgets and meal inclusions.
  * Assigned driver contact info and emergency numbers.
* **Quick Suggestions**: The UI exposes preset prompt chips (e.g. *"What should I pack for this trip?"*, *"Show me local restaurants near the hotel"*) to decrease query friction.

### B. Smart Activity Generator
* **Implementation Location**: Inside [bookingRoutes.js](file:///c:/Users/sanja/Trip-Planner-Hackathon/Backend/routes/bookingRoutes.js) (`generateAISuggestedActivities`).
* **Goal**: Minimize OpenAI API latency and run-time token costs by running a structured, high-quality local destination search engine.
* **Seeding Logic**: On booking confirmation, the destination string is analyzed. If matches are found for recognized tour destinations (e.g. Goa, Salem, Yercaud, Ladakh), predefined, highly detailed day-by-day sightseeing and culinary itineraries are automatically generated and injected into the user's trip itinerary space. These items carry the `isAiSuggestion` flag and can be customized or deleted at any time.

---

## 2. Prompt Engineering Guidelines

When prompting the LLM for custom itinerary extensions, use the following system parameters:

```markdown
Role: Senior Travel Guide & local expert.
Objective: Extend itinerary day activities for {destination}.
Constraints:
- Match style and duration: {duration} Days.
- Align with category: {category} (e.g., Adventure, Leisure).
- Respect budget constraints: limit suggestions to under {budget} total.
- Format strictly as valid JSON containing day number, titles, and segments (Morning, Lunch, Evening, Night).
```

---

## 3. Latency & Token Optimization

To guarantee sub-second responses and minimize token consumption:
1. **Local Caching**: Weather forecasts and seed itineraries are cached on the DB level to reduce external API dependency.
2. **Context Compression**: User profiles and unrelated booking fields are stripped from prompt requests before being sent to the AI engine. Only relevant travel dimensions are transmitted.
