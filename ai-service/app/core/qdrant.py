import inspect
import logging
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from fastapi import HTTPException, status

from app.core.config import get_settings


logger = logging.getLogger(__name__)

_client: Any | None = None


async def connect_to_qdrant(vector_size: int) -> None:
    global _client

    settings = get_settings()

    try:
        from qdrant_client import AsyncQdrantClient

        _client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=settings.qdrant_timeout_seconds,
        )
        await ping_qdrant()
        await ensure_trip_collection(vector_size)
        await ensure_user_profile_collection(vector_size)
        await ensure_search_intent_collection(vector_size)
    except Exception:
        logger.exception("Qdrant connection failed")
        _client = None
        raise

    logger.info("✅ Qdrant Connected")


async def close_qdrant_connection() -> None:
    global _client

    if _client is not None:
        close = getattr(_client, "close", None)
        if close is not None:
            result = close()
            if inspect.isawaitable(result):
                await result

    _client = None


def get_qdrant_client() -> Any:
    if _client is None:
        raise RuntimeError("Qdrant is not connected")
    return _client


async def ping_qdrant() -> bool:
    try:
        await get_qdrant_client().get_collections()
    except Exception:
        logger.exception("Qdrant health check failed")
        raise

    return True


async def ensure_trip_collection(vector_size: int) -> None:
    settings = get_settings()
    await _ensure_collection(settings.qdrant_collection_name, vector_size)


async def ensure_user_profile_collection(vector_size: int) -> None:
    settings = get_settings()
    await _ensure_collection(settings.qdrant_user_profile_collection_name, vector_size)


async def ensure_search_intent_collection(vector_size: int) -> None:
    settings = get_settings()
    await _ensure_collection(settings.qdrant_search_intent_collection_name, vector_size)


async def _ensure_collection(collection_name: str, vector_size: int) -> None:
    client = get_qdrant_client()

    try:
        exists = await _collection_exists(collection_name)
        if not exists:
            from qdrant_client.models import Distance, VectorParams

            await client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            )
            return

        collection = await client.get_collection(collection_name)
        existing_size = _extract_vector_size(collection)
        if existing_size is not None and existing_size != vector_size:
            raise RuntimeError(
                "Qdrant collection vector size mismatch: "
                f"expected {vector_size}, found {existing_size}"
            )
    except Exception:
        logger.exception("Failed to ensure Qdrant collection")
        raise


async def store_trip_vector(
    trip_id: str,
    embedding: list[float],
    payload: dict[str, Any],
) -> None:
    settings = get_settings()

    if not embedding:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cannot store an empty embedding",
        )

    try:
        from qdrant_client.models import PointStruct

        await get_qdrant_client().upsert(
            collection_name=settings.qdrant_collection_name,
            points=[
                PointStruct(
                    id=trip_id,
                    vector=embedding,
                    payload=payload,
                )
            ],
            wait=True,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to store vector in Qdrant")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to store vector in Qdrant",
        ) from exc

    logger.info("Stored in Qdrant")


async def store_user_profile_vector(
    user_id: str,
    embedding: list[float],
    payload: dict[str, Any],
) -> None:
    settings = get_settings()

    if not embedding:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cannot store an empty profile embedding",
        )

    try:
        from qdrant_client.models import PointStruct

        await get_qdrant_client().upsert(
            collection_name=settings.qdrant_user_profile_collection_name,
            points=[
                PointStruct(
                    id=str(uuid5(NAMESPACE_URL, f"user-profile:{user_id}")),
                    vector=embedding,
                    payload={**payload, "user_id": user_id},
                )
            ],
            wait=True,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to store user profile vector in Qdrant")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to store user profile vector in Qdrant",
        ) from exc


async def store_search_intent_vector(
    intent_id: str,
    embedding: list[float],
    payload: dict[str, Any],
) -> None:
    settings = get_settings()

    if not embedding:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cannot store an empty search intent embedding",
        )

    try:
        from qdrant_client.models import PointStruct

        await get_qdrant_client().upsert(
            collection_name=settings.qdrant_search_intent_collection_name,
            points=[
                PointStruct(
                    id=intent_id,
                    vector=embedding,
                    payload=payload,
                )
            ],
            wait=True,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to store search intent vector in Qdrant")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to store search intent vector in Qdrant",
        ) from exc


async def search_trip_vectors(
    query_vector: list[float],
    limit: int,
    score_threshold: float | None,
) -> list[Any]:
    settings = get_settings()

    if not query_vector:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cannot search with an empty embedding",
        )

    try:
        client = get_qdrant_client()
        if hasattr(client, "query_points"):
            kwargs: dict[str, Any] = {
                "collection_name": settings.qdrant_collection_name,
                "query": query_vector,
                "limit": limit,
                "with_payload": True,
            }
            if score_threshold is not None:
                kwargs["score_threshold"] = score_threshold
            result = await client.query_points(**kwargs)
            return list(getattr(result, "points", []))

        kwargs = {
            "collection_name": settings.qdrant_collection_name,
            "query_vector": query_vector,
            "limit": limit,
            "with_payload": True,
        }
        if score_threshold is not None:
            kwargs["score_threshold"] = score_threshold
        return list(await client.search(**kwargs))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Qdrant semantic search failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Qdrant semantic search failed",
        ) from exc


async def search_user_profile_vectors(
    query_vector: list[float],
    limit: int,
    score_threshold: float,
) -> list[Any]:
    settings = get_settings()

    if not query_vector:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cannot search with an empty embedding",
        )

    try:
        client = get_qdrant_client()
        if hasattr(client, "query_points"):
            result = await client.query_points(
                collection_name=settings.qdrant_user_profile_collection_name,
                query=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
            )
            return list(getattr(result, "points", []))

        return list(
            await client.search(
                collection_name=settings.qdrant_user_profile_collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
            )
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Qdrant user profile search failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Qdrant user profile search failed",
        ) from exc


async def search_search_intent_vectors(
    query_vector: list[float],
    limit: int,
    score_threshold: float,
) -> list[Any]:
    settings = get_settings()

    if not query_vector:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cannot search with an empty embedding",
        )

    try:
        client = get_qdrant_client()
        if hasattr(client, "query_points"):
            result = await client.query_points(
                collection_name=settings.qdrant_search_intent_collection_name,
                query=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
            )
            return list(getattr(result, "points", []))

        return list(
            await client.search(
                collection_name=settings.qdrant_search_intent_collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
            )
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Qdrant search intent similarity search failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Qdrant search intent similarity search failed",
        ) from exc


async def _collection_exists(collection_name: str) -> bool:
    client = get_qdrant_client()

    if hasattr(client, "collection_exists"):
        return bool(await client.collection_exists(collection_name))

    collections = await client.get_collections()
    return any(
        collection.name == collection_name
        for collection in collections.collections
    )


def _extract_vector_size(collection: Any) -> int | None:
    vectors = getattr(collection.config.params, "vectors", None)
    if vectors is None:
        return None

    size = getattr(vectors, "size", None)
    if size is not None:
        return int(size)

    if isinstance(vectors, dict) and vectors:
        first_vector = next(iter(vectors.values()))
        first_size = getattr(first_vector, "size", None)
        return int(first_size) if first_size is not None else None

    return None
