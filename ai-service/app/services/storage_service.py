"""AWS S3 Storage Service for AI Service.

Provides cross-service S3 object read, write, and presigned URL generation,
following the same object key structures and visibility models as the Node.js backend.
"""

import logging
import uuid
from typing import Any, Dict, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_s3_client = None


def get_s3_client():
    """Lazily initialize boto3 S3 client with configured settings or default IAM credentials."""
    global _s3_client
    if _s3_client is not None:
        return _s3_client

    try:
        import boto3
        from botocore.config import Config

        settings = get_settings()
        boto_config = Config(
            region_name=settings.aws_region,
            retries={"max_attempts": 3, "mode": "standard"},
        )

        kwargs: Dict[str, Any] = {"config": boto_config}
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key

        _s3_client = boto3.client("s3", **kwargs)
        logger.info("[StorageService] Initialized boto3 S3 client for region %s", settings.aws_region)
        return _s3_client
    except ImportError:
        logger.warning("[StorageService] boto3 not installed. S3 features disabled in AI Service.")
        return None
    except Exception as exc:
        logger.error("[StorageService] Failed to initialize boto3 S3 client: %s", exc)
        return None


def generate_object_key(folder: str, entity_id: str, extension: str = "json") -> str:
    """Generate structured object key compatible with Node.js backend."""
    file_id = str(uuid.uuid4())
    clean_ext = extension.lstrip(".")
    return f"{folder}/{entity_id}/{file_id}.{clean_ext}"


def upload_bytes(
    data: bytes,
    key: str,
    content_type: str = "application/octet-stream",
    metadata: Optional[Dict[str, str]] = None,
) -> Optional[str]:
    """Upload byte buffer to S3 bucket.

    Returns the public/CloudFront delivery URL or S3 key.
    """
    client = get_s3_client()
    if client is None:
        logger.warning("[StorageService] Cannot upload bytes: S3 client unavailable.")
        return None

    settings = get_settings()
    extra_args: Dict[str, Any] = {
        "ContentType": content_type,
        "ServerSideEncryption": "AES256",
    }
    if metadata:
        extra_args["Metadata"] = metadata

    try:
        client.put_object(
            Bucket=settings.aws_s3_bucket,
            Key=key,
            Body=data,
            **extra_args,
        )
        if settings.aws_cloudfront_domain:
            domain = settings.aws_cloudfront_domain.strip("/").replace("https://", "").replace("http://", "")
            return f"https://{domain}/{key}"
        return f"https://{settings.aws_s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"
    except Exception as exc:
        logger.error("[StorageService] Failed to upload object '%s' to S3: %s", key, exc)
        return None


def get_presigned_download_url(key: str, expires_in: int = 3600) -> Optional[str]:
    """Generate short-lived presigned download URL for private documents."""
    client = get_s3_client()
    if client is None:
        return None

    settings = get_settings()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.aws_s3_bucket, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except Exception as exc:
        logger.error("[StorageService] Failed to generate presigned URL for '%s': %s", key, exc)
        return None
