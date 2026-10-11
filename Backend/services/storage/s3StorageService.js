import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import db from "../../config/db.js";

// ── Configuration ──────────────────────────────────────────────────────────
const REGION = process.env.AWS_REGION || "ap-south-1";
const BUCKET_NAME = process.env.AWS_S3_BUCKET || "traveloop-media";
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN || "";

// Initialize S3 Client using credentials or default credential provider chain
const s3Config = { region: REGION };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  if (process.env.AWS_SESSION_TOKEN) {
    s3Config.credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
  }
}

export const s3Client = new S3Client(s3Config);

/**
 * File validation rules & size limits
 */
export const FILE_RULES = {
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_AUDIO_TYPES: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
  ],
  MAX_SIZES: {
    avatar: 5 * 1024 * 1024, // 5 MB
    logo: 5 * 1024 * 1024, // 5 MB
    gallery: 15 * 1024 * 1024, // 15 MB
    kyc: 20 * 1024 * 1024, // 20 MB
    document: 20 * 1024 * 1024, // 20 MB
    chat: 15 * 1024 * 1024, // 15 MB
    general: 15 * 1024 * 1024, // 15 MB
  },
};

/**
 * Sanitize filename to prevent directory traversal or malformed characters
 */
export function sanitizeFilename(filename) {
  if (!filename) return "unnamed_file";
  const basename = path.basename(filename);
  return basename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}

/**
 * Generate organized, collision-resistant S3 object key
 */
export function generateObjectKey({
  folder = "general",
  entityType = "media",
  entityId = "common",
  ownerId = "anonymous",
  filename = "file",
}) {
  const ext = path.extname(filename).toLowerCase() || ".bin";
  const uniqueId = crypto.randomUUID();
  const safeName = sanitizeFilename(path.basename(filename, ext));

  // Determine key hierarchy according to domain logic
  switch (folder.toLowerCase()) {
    case "avatars":
    case "profile":
    case "profiles":
      return `users/${ownerId || entityId}/avatar/${uniqueId}${ext}`;
    case "logos":
    case "company_logo":
      return `agents/${ownerId || entityId}/logo/${uniqueId}${ext}`;
    case "kyc":
    case "agent_kyc":
      return `agents/${ownerId || entityId}/kyc/${uniqueId}${ext}`;
    case "driver_docs":
    case "driver_documents":
      return `drivers/${ownerId || entityId}/documents/${uniqueId}${ext}`;
    case "trips":
    case "gallery":
    case "trip_gallery":
      return `trips/${entityId || ownerId}/gallery/${uniqueId}${ext}`;
    case "covers":
    case "trip_covers":
      return `trips/${entityId || ownerId}/cover/${uniqueId}${ext}`;
    case "chat":
    case "chat_media":
      return `chat/${entityId || "common"}/${uniqueId}${ext}`;
    case "documents":
    case "passes":
    case "boarding_passes":
      return `documents/${entityId || ownerId}/${uniqueId}${ext}`;
    default:
      return `uploads/${folder}/${uniqueId}_${safeName}${ext}`;
  }
}

/**
 * Determine default visibility (public vs private) based on category
 */
export function resolveVisibility(folder, entityType, explicitVisibility) {
  if (explicitVisibility) {
    return explicitVisibility === "private" ? "private" : "public";
  }
  const privateCategories = [
    "kyc",
    "agent_kyc",
    "driver_docs",
    "driver_documents",
    "documents",
    "passes",
    "boarding_passes",
  ];
  if (
    privateCategories.includes((folder || "").toLowerCase()) ||
    privateCategories.includes((entityType || "").toLowerCase())
  ) {
    return "private";
  }
  return "public";
}

/**
 * Build public delivery URL (CloudFront or direct S3 URL)
 */
export function getPublicDeliveryUrl(objectKey) {
  if (CLOUDFRONT_DOMAIN) {
    const cleanDomain = CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, "").replace(
      /\/+$/,
      ""
    );
    return `https://${cleanDomain}/${objectKey}`;
  }
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${objectKey}`;
}

export class S3StorageService {
  /**
   * Upload Buffer directly to S3 and persist metadata in MySQL
   */
  static async uploadFile({
    buffer,
    originalname,
    mimetype,
    size,
    folder = "general",
    entityType = "media",
    entityId = null,
    ownerId = null,
    visibility = null,
    metadata = {},
  }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error("Invalid file content: buffer is required.");
    }

    const resolvedVisibility = resolveVisibility(
      folder,
      entityType,
      visibility
    );
    const objectKey = generateObjectKey({
      folder,
      entityType,
      entityId,
      ownerId,
      filename: originalname,
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: buffer,
      ContentType: mimetype || "application/octet-stream",
      ServerSideEncryption: "AES256",
      Metadata: {
        "original-filename": sanitizeFilename(originalname),
        "owner-id": ownerId ? String(ownerId) : "unknown",
        "entity-type": entityType ? String(entityType) : "media",
        visibility: resolvedVisibility,
      },
    });

    try {
      await s3Client.send(command);
    } catch (s3Error) {
      console.error(
        `[S3StorageService] S3 PutObject failed for key '${objectKey}':`,
        s3Error.message
      );
      throw new Error(`AWS S3 Upload Failed: ${s3Error.message}`);
    }

    // Determine return delivery URL
    let deliveryUrl = "";
    if (resolvedVisibility === "public") {
      deliveryUrl = getPublicDeliveryUrl(objectKey);
    } else {
      // For private files, generate short-lived signed read URL for immediate viewing
      deliveryUrl = await this.getPresignedDownloadUrl(objectKey, 3600);
    }

    // Persist metadata into MySQL uploaded_files registry
    const fileId = crypto.randomUUID();
    try {
      await db.from("uploaded_files").insert({
        id: fileId,
        owner_id: ownerId || null,
        entity_type: entityType || folder,
        entity_id: entityId || null,
        original_filename: sanitizeFilename(originalname),
        storage_provider: "s3",
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
        mime_type: mimetype || "application/octet-stream",
        file_size: size || buffer.length || 0,
        visibility: resolvedVisibility,
        metadata: JSON.stringify({
          ...metadata,
          region: REGION,
          cloudfront: Boolean(CLOUDFRONT_DOMAIN),
        }),
      });
    } catch (dbError) {
      console.error(
        "[S3StorageService] Warning: Failed to record file metadata in MySQL:",
        dbError.message
      );
      // Non-fatal if table doesn't exist yet, return upload success
    }

    return {
      success: true,
      fileId,
      url: deliveryUrl,
      objectKey,
      bucket: BUCKET_NAME,
      region: REGION,
      filename: sanitizeFilename(originalname),
      mimetype,
      size: size || buffer.length,
      visibility: resolvedVisibility,
    };
  }

  /**
   * Generate a Presigned Upload URL for direct browser-to-S3 uploads
   */
  static async getPresignedUploadUrl({
    folder = "general",
    entityType = "media",
    entityId = null,
    ownerId = null,
    filename = "upload.bin",
    mimetype = "application/octet-stream",
    size = 0,
    visibility = null,
    expiresIn = 900, // 15 minutes
  }) {
    const resolvedVisibility = resolveVisibility(
      folder,
      entityType,
      visibility
    );
    const objectKey = generateObjectKey({
      folder,
      entityType,
      entityId,
      ownerId,
      filename,
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: mimetype,
      ServerSideEncryption: "AES256",
      Metadata: {
        "original-filename": sanitizeFilename(filename),
        "owner-id": ownerId ? String(ownerId) : "unknown",
        "entity-type": entityType ? String(entityType) : "media",
        visibility: resolvedVisibility,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const publicUrl =
      resolvedVisibility === "public" ? getPublicDeliveryUrl(objectKey) : null;

    return {
      success: true,
      uploadUrl,
      objectKey,
      bucket: BUCKET_NAME,
      region: REGION,
      publicUrl,
      visibility: resolvedVisibility,
      expiresIn,
      requiredHeaders: {
        "Content-Type": mimetype,
      },
    };
  }

  /**
   * Confirm direct browser upload and persist metadata in MySQL
   */
  static async confirmDirectUpload({
    objectKey,
    originalFilename,
    mimetype,
    size,
    entityType = "media",
    entityId = null,
    ownerId = null,
    visibility = null,
    metadata = {},
  }) {
    if (!objectKey) {
      throw new Error("objectKey is required to confirm upload.");
    }

    // Verify object exists in S3
    let headData = null;
    try {
      headData = await s3Client.send(
        new HeadObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectKey,
        })
      );
    } catch (headErr) {
      console.error(
        `[S3StorageService] HeadObject check failed for key '${objectKey}':`,
        headErr.message
      );
      throw new Error(`File not found in S3 bucket: ${headErr.message}`);
    }

    const resolvedVisibility = resolveVisibility(
      entityType,
      entityType,
      visibility
    );
    const fileId = crypto.randomUUID();
    const actualSize = headData.ContentLength || size || 0;
    const actualMime = headData.ContentType || mimetype || "application/octet-stream";

    try {
      await db.from("uploaded_files").insert({
        id: fileId,
        owner_id: ownerId || null,
        entity_type: entityType || "media",
        entity_id: entityId || null,
        original_filename: sanitizeFilename(originalFilename || path.basename(objectKey)),
        storage_provider: "s3",
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
        mime_type: actualMime,
        file_size: actualSize,
        visibility: resolvedVisibility,
        metadata: JSON.stringify({
          ...metadata,
          confirmedAt: new Date().toISOString(),
          s3ETag: headData.ETag,
        }),
      });
    } catch (dbErr) {
      console.error(
        "[S3StorageService] Warning: Failed to record confirmed upload in MySQL:",
        dbErr.message
      );
    }

    let deliveryUrl = "";
    if (resolvedVisibility === "public") {
      deliveryUrl = getPublicDeliveryUrl(objectKey);
    } else {
      deliveryUrl = await this.getPresignedDownloadUrl(objectKey, 3600);
    }

    return {
      success: true,
      fileId,
      url: deliveryUrl,
      objectKey,
      size: actualSize,
      mimetype: actualMime,
      visibility: resolvedVisibility,
    };
  }

  /**
   * Generate short-lived presigned download URL for private files
   */
  static async getPresignedDownloadUrl(objectKey, expiresIn = 3600) {
    if (!objectKey) {
      throw new Error("objectKey is required to generate download URL.");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Delete object securely from S3 and remove MySQL record
   */
  static async deleteFile(objectKey, ownerId = null) {
    if (!objectKey) return { success: false, message: "No objectKey provided" };

    // If ownerId provided, check ownership
    if (ownerId) {
      try {
        const { data: fileRecord } = await db
          .from("uploaded_files")
          .select("owner_id")
          .eq("object_key", objectKey)
          .maybeSingle();

        if (fileRecord && fileRecord.owner_id && fileRecord.owner_id !== ownerId) {
          throw new Error("Unauthorized: You do not own this file.");
        }
      } catch (authErr) {
        if (authErr.message.startsWith("Unauthorized")) throw authErr;
      }
    }

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectKey,
        })
      );
    } catch (s3Err) {
      console.error(
        `[S3StorageService] DeleteObject failed for key '${objectKey}':`,
        s3Err.message
      );
    }

    try {
      await db.from("uploaded_files").delete().eq("object_key", objectKey);
    } catch (dbErr) {
      // Ignore database cleanup failure
    }

    return { success: true, message: `Object ${objectKey} deleted.` };
  }

  /**
   * Check storage connectivity and bucket accessibility
   */
  static async checkStorageHealth() {
    const hasBucket = Boolean(BUCKET_NAME);
    const hasRegion = Boolean(REGION);
    const hasCreds = Boolean(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    );

    let bucketAccessible = false;
    let error = null;

    if (hasBucket && (hasCreds || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI)) {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        bucketAccessible = true;
      } catch (err) {
        error = err.message;
      }
    }

    return {
      status: bucketAccessible ? "connected" : hasBucket ? "configured" : "unconfigured",
      provider: "AWS S3",
      bucket: BUCKET_NAME,
      region: REGION,
      cloudfront: Boolean(CLOUDFRONT_DOMAIN),
      bucketAccessible,
      error,
    };
  }
}

export default S3StorageService;
