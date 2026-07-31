// src/utils/otaService.js
// OTA Update Service — Web-only stub

import { compareVersions } from "./versionCompare";

const VERSION_MANIFEST_URL =
  import.meta.env.VITE_OTA_VERSION_URL ||
  "http://localhost:5000/updates/version.json";

export const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

export function isNativePlatform() {
  return false;
}

export async function fetchRemoteManifest() {
  return null;
}

export async function notifyAppReady() {}

export async function downloadAndApplyUpdate(bundleUrl, version, onProgress) {
  return false;
}

export async function rollbackToBuiltIn() {}

export async function getCurrentBundle() {
  return null;
}

export async function checkForUpdate() {
  return { available: false, manifest: null };
}
