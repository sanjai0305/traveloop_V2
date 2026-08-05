# AI Service

Production-ready FastAPI microservice for Gemini chat, trip RAG, memory, analytics, demand intelligence, and personalized recommendations.

Implemented phases:

- Phase 1: FastAPI, Gemini, MongoDB, Swagger, health, chat
- Phase 2: Qdrant, BAAI/bge-small-en-v1.5 embeddings, trip ingestion, semantic search
- Phase 3: Redis conversation memory, MongoDB history, user preferences
- Phase 4: travel demand extraction, analytics dashboards, Redis-cached aggregations
- Phase 5: AI user profiles, profile vectors, explainable personalized recommendations

## Installation

```bash
cd ai-service
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

The service requires Python 3.12 or newer.

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required and optional settings:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=ai_service
GEMINI_API_KEY=your-gemini-api-key
REDIS_URL=redis://localhost:6379/0
REDIS_MEMORY_TTL_SECONDS=86400
REDIS_MEMORY_MAX_MESSAGES=30
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=trip_vectors
QDRANT_USER_PROFILE_COLLECTION_NAME=user_profiles
QDRANT_TIMEOUT_SECONDS=10
EMBEDDING_MODEL_NAME=BAAI/bge-small-en-v1.5
SEARCH_TOP_K=5
SEARCH_MIN_SCORE=0.65
RECOMMENDATION_SIMILARITY_THRESHOLD=0.75
RECOMMENDATION_TOP_K=10
RECOMMENDATION_CACHE_TTL_SECONDS=900
```

## Local Services

Run Redis:

```bash
docker run -p 6379:6379 redis:7
```

Run Qdrant:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

Run MongoDB locally or set `MONGODB_URI` to a hosted MongoDB database.

## Run

```bash
uvicorn app.main:app --reload
```

Swagger:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
```

## Core Endpoints

### Health

```http
GET /health
```

### Chat

```http
POST /chat
Content-Type: application/json
```

```json
{
  "user_id": "user123",
  "session_id": "session001",
  "message": "I need a budget trip to Ooty for 3 days with my family."
}
```

Successful response:

```json
{
  "success": true,
  "response": "...",
  "memory_updated": true,
  "preferences_detected": ["Hill Stations", "Budget Travel", "Family"]
}
```

After each successful chat, background processing:

- Stores Redis short-term memory under `memory:{user_id}:{session_id}`
- Stores MongoDB long-term history in `chat_history`
- Extracts travel demand into `chat_analytics` and `travel_demands`
- Updates `daily_statistics`
- Updates user profile embeddings
- Regenerates personalized recommendations

### History

```http
GET /history?user_id=user123
```

Returns long-term chat history sorted oldest to newest.

### Embed Trip

```http
POST /embed-trip
Content-Type: application/json
```

```json
{
  "title": "Budget Bali Family Escape",
  "destination": "Bali",
  "description": "Beach holiday with snorkeling and temple tours.",
  "budget": "Budget Friendly",
  "duration": "5 Days",
  "tags": ["Beach", "Family", "Snorkeling", "Temple Tour"]
}
```

Stores the trip in MongoDB, embeds it into Qdrant `trip_vectors`, then generates recommendations for matching user profiles in the background.

### Search

```http
POST /search
Content-Type: application/json
```

```json
{
  "query": "I need a budget beach vacation"
}
```

Returns Gemini answers grounded in top matching trips from Qdrant.

## Analytics

### Dashboard Analytics

```http
GET /analytics?from=2026-01-01&to=2026-12-31
```

Supported filters:

- `from`
- `to`
- `destination`
- `budget`
- `theme`
- `user_id`
- `group_type`

Returns chart-ready metrics:

- total queries
- top destinations
- top themes
- budget distribution
- duration distribution
- peak search hour
- weekly growth
- weekly and monthly demand series
- hourly heatmap

### Demand Intelligence

```http
GET /demands?theme=Beach
```

Returns:

- recent demands
- top requested destinations
- top requested themes
- top group types
- top trip intents

Analytics and demand responses are cached in Redis for 5 minutes.

## Recommendations

```http
GET /recommendations?user_id=user123
X-User-ID: user123
```

Returns:

```json
{
  "recommendations": [
    {
      "trip_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Maldives Honeymoon Escape",
      "destination": "Maldives",
      "score": 94.8,
      "reason": "Because you like beach destinations",
      "thumbnail": null,
      "price": "Luxury",
      "duration": "5 Days"
    }
  ],
  "dashboard_sections": {
    "new_trips_matching_your_interests": [],
    "recommended_for_you": [],
    "because_you_like_beach_trips": [],
    "trending_near_you": [],
    "recently_added_for_you": [],
    "continue_exploring": []
  }
}
```

Recommendation cache key:

```text
recommendations:{user_id}
```

Cache TTL is 15 minutes by default.

## MongoDB Collections

- `chat_history`
- `user_preferences`
- `trips`
- `chat_analytics`
- `daily_statistics`
- `travel_demands`
- `user_profiles`
- `recommendations`
- `trip_views`
- `trip_bookmarks`
- `trip_bookings`

## Qdrant Collections

- `trip_vectors`
- `user_profiles`

## Startup Logs

```text
✅ MongoDB Connected
✅ Redis Connected
✅ Gemini Connected
✅ Qdrant Connected
✅ AI Service Started
```
