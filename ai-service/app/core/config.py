import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field

load_dotenv()


class Settings(BaseModel):
    app_name: str = "AI Service"
    api_title: str = "AI Service API"
    api_version: str = "1.0.0"

    supabase_url: str = Field(default="https://yjektwftyyfkudxfwtkf.supabase.co", min_length=1)
    supabase_service_role_key: str = Field(..., min_length=1)
    supabase_anon_key: str | None = None
    gemini_api_key: str = Field(..., min_length=1)
    gemini_model: str = Field(default="gemini-flash-latest", min_length=1)
    redis_url: str = Field(default="redis://localhost:6379/0", min_length=1)
    redis_memory_ttl_seconds: int = Field(default=86400, ge=60)
    redis_memory_max_messages: int = Field(default=30, ge=2, le=100)
    qdrant_url: str = Field(default="http://localhost:6333", min_length=1)
    qdrant_api_key: str | None = None
    qdrant_collection_name: str = Field(default="trip_vectors", min_length=1)
    qdrant_user_profile_collection_name: str = Field(
        default="user_profiles",
        min_length=1,
    )
    qdrant_search_intent_collection_name: str = Field(
        default="traveler_search_intents",
        min_length=1,
    )
    qdrant_timeout_seconds: float = Field(default=10.0, gt=0)
    embedding_model_name: str = Field(
        default="BAAI/bge-small-en-v1.5",
        min_length=1,
    )
    search_top_k: int = Field(default=5, ge=1, le=20)
    search_min_score: float = Field(default=0.65, ge=0, le=1)
    recommendation_similarity_threshold: float = Field(default=0.75, ge=0, le=1)
    recommendation_top_k: int = Field(default=10, ge=1, le=50)
    recommendation_cache_ttl_seconds: int = Field(default=900, ge=60)

    model_config = ConfigDict(extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL", "https://yjektwftyyfkudxfwtkf.supabase.co"),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_T5Kp834lfmaclIuxd-Y-LQ_X11kh34e"),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", "sb_publishable_zLv_UPjsCB3h1L_691i1ng_fbS9zlWs"),
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-flash-latest"),
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        redis_memory_ttl_seconds=os.getenv("REDIS_MEMORY_TTL_SECONDS", "86400"),
        redis_memory_max_messages=os.getenv("REDIS_MEMORY_MAX_MESSAGES", "30"),
        qdrant_url=os.getenv("QDRANT_URL", "http://localhost:6333"),
        qdrant_api_key=os.getenv("QDRANT_API_KEY") or None,
        qdrant_collection_name=os.getenv("QDRANT_COLLECTION_NAME", "trip_vectors"),
        qdrant_user_profile_collection_name=os.getenv(
            "QDRANT_USER_PROFILE_COLLECTION_NAME",
            "user_profiles",
        ),
        qdrant_search_intent_collection_name=os.getenv(
            "QDRANT_SEARCH_INTENT_COLLECTION_NAME",
            "traveler_search_intents",
        ),
        qdrant_timeout_seconds=os.getenv("QDRANT_TIMEOUT_SECONDS", "10"),
        embedding_model_name=os.getenv(
            "EMBEDDING_MODEL_NAME",
            "BAAI/bge-small-en-v1.5",
        ),
        search_top_k=os.getenv("SEARCH_TOP_K", "5"),
        search_min_score=os.getenv("SEARCH_MIN_SCORE", "0.65"),
        recommendation_similarity_threshold=os.getenv(
            "RECOMMENDATION_SIMILARITY_THRESHOLD",
            "0.75",
        ),
        recommendation_top_k=os.getenv("RECOMMENDATION_TOP_K", "10"),
        recommendation_cache_ttl_seconds=os.getenv(
            "RECOMMENDATION_CACHE_TTL_SECONDS",
            "900",
        ),
    )
