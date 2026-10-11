/**
 * test_s3_integration.js
 * Comprehensive validation script for AWS S3 Storage Integration
 */

import {
  generateObjectKey,
  resolveVisibility,
  getPublicDeliveryUrl,
  sanitizeFilename,
  FILE_RULES,
  S3StorageService,
} from "./services/storage/s3StorageService.js";
import UploadService from "./services/uploadService.js";

async function runS3Tests() {
  console.log("=================================================");
  console.log("   AWS S3 Storage Integration Test Suite        ");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Filename Sanitization
  const dirtyName = "../../malicious\0file name!@#$%.png";
  const cleanName = sanitizeFilename(dirtyName);
  assert(
    !cleanName.includes("..") && !cleanName.includes("\0") && cleanName.endsWith(".png"),
    `Sanitize filename: '${dirtyName}' -> '${cleanName}'`
  );

  // 2. Object Key Generation for User Avatars
  const avatarKey = generateObjectKey({
    folder: "avatars",
    ownerId: "user-123",
    filename: "my photo.jpg",
  });
  assert(
    avatarKey.startsWith("users/user-123/avatar/") && avatarKey.endsWith(".jpg"),
    `Avatar key structure: ${avatarKey}`
  );

  // 3. Object Key Generation for Agency KYC Documents
  const kycKey = generateObjectKey({
    folder: "kyc",
    ownerId: "agent-456",
    filename: "tax_license.pdf",
  });
  assert(
    kycKey.startsWith("agents/agent-456/kyc/") && kycKey.endsWith(".pdf"),
    `KYC document key structure: ${kycKey}`
  );

  // 4. Object Key Generation for Driver Documents
  const driverKey = generateObjectKey({
    folder: "driver_docs",
    ownerId: "driver-789",
    filename: "commercial_license.pdf",
  });
  assert(
    driverKey.startsWith("drivers/driver-789/documents/") && driverKey.endsWith(".pdf"),
    `Driver document key structure: ${driverKey}`
  );

  // 5. Object Key Generation for Trip Gallery
  const tripKey = generateObjectKey({
    folder: "gallery",
    entityId: "trip-999",
    filename: "sunset_beach.webp",
  });
  assert(
    tripKey.startsWith("trips/trip-999/gallery/") && tripKey.endsWith(".webp"),
    `Trip gallery key structure: ${tripKey}`
  );

  // 6. Object Key Generation for Chat Attachments
  const chatKey = generateObjectKey({
    folder: "chat",
    entityId: "trip-999",
    filename: "voice_note.mp3",
  });
  assert(
    chatKey.startsWith("chat/trip-999/") && chatKey.endsWith(".mp3"),
    `Chat media key structure: ${chatKey}`
  );

  // 7. Visibility Resolution (Public vs Private)
  const avatarVis = resolveVisibility("avatars", "avatar", null);
  assert(avatarVis === "public", `Avatar visibility resolves to 'public'`);

  const kycVis = resolveVisibility("kyc", "agent_kyc", null);
  assert(kycVis === "private", `KYC document visibility resolves to 'private'`);

  const driverVis = resolveVisibility("driver_docs", "driver_documents", null);
  assert(driverVis === "private", `Driver document visibility resolves to 'private'`);

  const galleryVis = resolveVisibility("gallery", "trip_gallery", null);
  assert(galleryVis === "public", `Trip gallery visibility resolves to 'public'`);

  // 8. Public Delivery URL Generation
  const sampleKey = "trips/trip-999/gallery/sample.jpg";
  const deliveryUrl = getPublicDeliveryUrl(sampleKey);
  assert(
    deliveryUrl.includes(sampleKey) && deliveryUrl.startsWith("https://"),
    `Public delivery URL generated: ${deliveryUrl}`
  );

  // 9. File Rule Enforcement
  assert(FILE_RULES.ALLOWED_IMAGE_TYPES.includes("image/jpeg"), "JPG allowed in image types");
  assert(FILE_RULES.ALLOWED_DOCUMENT_TYPES.includes("application/pdf"), "PDF allowed in doc types");
  assert(FILE_RULES.ALLOWED_AUDIO_TYPES.includes("audio/mpeg"), "MP3 allowed in audio types");

  // 10. Service Façade Compatibility
  assert(typeof UploadService.uploadFile === "function", "UploadService.uploadFile exists");
  assert(typeof UploadService.uploadToCloudinary === "function", "UploadService.uploadToCloudinary bridge exists");
  assert(typeof UploadService.deleteFile === "function", "UploadService.deleteFile exists");
  assert(typeof UploadService.getPresignedUploadUrl === "function", "UploadService.getPresignedUploadUrl exists");
  assert(typeof UploadService.getPresignedDownloadUrl === "function", "UploadService.getPresignedDownloadUrl exists");

  // 11. Storage Health Diagnostic Check
  const health = await S3StorageService.checkStorageHealth();
  console.log("\n[Storage Health Check Result]:", health);
  assert(
    health.provider === "AWS S3" && Boolean(health.bucket) && Boolean(health.region),
    "S3 Storage health check reports configured bucket and region"
  );

  console.log(`\n=================================================`);
  console.log(`   Tests Completed: ${passed}/${total} Passed     `);
  console.log(`=================================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runS3Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
