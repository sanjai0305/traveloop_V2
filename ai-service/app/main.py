import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api import (
    analytics,
    chat,
    demands,
    embed,
    health,
    history,
    recommendations,
    search,
)
from app.core.database import connect_to_supabase, close_supabase_connection
from app.core.gemini import connect_to_gemini
from app.core.qdrant import close_qdrant_connection, connect_to_qdrant
from app.core.redis import close_redis_connection, connect_to_redis
from app.services.embedding_service import embedding_service
from app.services.analytics_service import analytics_service
from app.services.history_service import history_service
from app.services.profile_service import profile_service
from app.services.recommendation_service import recommendation_service


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_to_supabase()
        await history_service.ensure_indexes()
        await analytics_service.ensure_indexes()
        await profile_service.ensure_indexes()
        await recommendation_service.ensure_indexes()
        await connect_to_redis()
        await connect_to_gemini()
        vector_size = await embedding_service.get_embedding_dimension()
        await connect_to_qdrant(vector_size)
        logger.info("✅ AI Service Started")

        yield
    finally:
        await close_qdrant_connection()
        await close_redis_connection()
        await close_supabase_connection()


app = FastAPI(
    title="AI Service API",
    version="1.0.0",
    description="Production-ready AI service with Gemini chat and trip RAG search.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "Health",
            "description": "Service dependency health checks.",
        },
        {
            "name": "Chat",
            "description": "Memory-aware travel assistant chat endpoints.",
        },
        {
            "name": "History",
            "description": "Long-term Supabase chat history endpoints.",
        },
        {
            "name": "Memory",
            "description": "Redis-backed short-term conversation memory.",
        },
        {
            "name": "Analytics",
            "description": "Business intelligence and travel trend dashboards.",
        },
        {
            "name": "Demand Intelligence",
            "description": "Travel demand extraction and aggregation endpoints.",
        },
        {
            "name": "Dashboard",
            "description": "Chart-ready cached dashboard API responses.",
        },
        {
            "name": "Recommendations",
            "description": "Personalized trip recommendations for dashboards.",
        },
        {
            "name": "User Profile",
            "description": "Dynamic AI user profile and embedding signals.",
        },
        {
            "name": "Personalization",
            "description": "Semantic and behavioral personalization endpoints.",
        },
        {
            "name": "Embedding",
            "description": "Trip ingestion and vector embedding endpoints.",
        },
        {
            "name": "Search",
            "description": "Semantic trip retrieval with Gemini grounded answers.",
        },
        {
            "name": "Models",
            "description": "Pydantic schemas for request and response validation.",
        },
    ],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(demands.router)
app.include_router(recommendations.router)
app.include_router(embed.router)
app.include_router(search.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    if isinstance(exc.detail, dict):
        content = {"success": False, **exc.detail}
    else:
        content = {"success": False, "error": exc.detail}
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation failed",
            "details": jsonable_encoder(exc.errors()),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.exception("Unhandled application error")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
        },
    )
