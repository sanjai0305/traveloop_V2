// src/utils/otaService.js
// OTA Update Service — Firebase Storage backed, @capgo/capacitor-updater powered
//
// Architecture:
//   Firebase Storage
//     └─ updates/
//          ├─ version.json          ← manifest (latest version + bundle URL)
//          └─ v1.x.x.zip           ← zipped React build output
//
// Flow:
//   app starts → check version.json → compare with installed → show modal → download + apply → reload

import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Capacitor } from "@capacitor/core";
import { compareVersions } from "./versionCompare";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Replace with your Firebase project's Storage public URL.
// Path inside Storage: updates/version.json
const VERSION_MANIFEST_URL =
  import.meta.env.VITE_OTA_VERSION_URL ||
  "https://firebasestorage.googleapis.com/v0/b/YOUR_PROJECT_ID.appspot.com/o/updates%2Fversion.json?alt=media";

// Current installed version (bump this before every APK / OTA release)
export const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// ─── TYPES ────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} VersionManifest
 * @property {string} version     - Semantic version string e.g. "1.2.0"
 * @property {string} bundleUrl   - Publicly accessible .zip URL in Firebase Storage
 * @property {string[]} [changelog] - Optional human-readable change list
 */

// ─── PLATFORM CHECK ───────────────────────────────────────────────────────────
/**
 * Returns true only when running as a native Capacitor app on Android or iOS.
 * OTA updates have no effect in a browser context.
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

// ─── FETCH VERSION MANIFEST ───────────────────────────────────────────────────
/**
 * Fetches and returns the remote version.json manifest.
 * Adds cache-buster so the CDN always returns fresh data.
 *
 * @returns {Promise<VersionManifest|null>}
 */
export async function fetchRemoteManifest() {
  try {
    const url = `${VERSION_MANIFEST_URL}&_t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("[OTA] Remote manifest:", data);
    return data;
  } catch (err) {
    console.warn("[OTA] Failed to fetch version manifest:", err.message);
    return null;
  }
}

// ─── NOTIFYING CAPACITOR OF SUCCESSFUL LOAD ───────────────────────────────────
/**
 * Must be called once on app startup to tell @capgo/capacitor-updater
 * that the current bundle loaded correctly.
 * Without this, Capgo's internal watchdog will roll back after a timeout.
 */
export async function notifyAppReady() {
  if (!isNativePlatform()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
    console.log("[OTA] notifyAppReady sent.");
  } catch (err) {
    console.warn("[OTA] notifyAppReady error:", err.message);
  }
}

// ─── DOWNLOAD + APPLY UPDATE ─────────────────────────────────────────────────
/**
 * Downloads the remote bundle zip and applies it as the active bundle.
 * Calls onProgress(percent: number) during download.
 *
 * @param {string}   bundleUrl  - Direct download URL of the .zip
 * @param {string}   version    - Version label for this bundle
 * @param {Function} onProgress - (percent: 0-100) progress callback
 * @returns {Promise<boolean>}  - true on success, false on failure
 */
export async function downloadAndApplyUpdate(bundleUrl, version, onProgress) {
  if (!isNativePlatform()) {
    console.warn("[OTA] Not running on native platform — skipping update.");
    return false;
  }

  try {
    console.log(`[OTA] Downloading bundle v${version} from: ${bundleUrl}`);

    // CapacitorUpdater.download returns a BundleInfo object
    const bundle = await CapacitorUpdater.download(
      {
        url: bundleUrl,
        version,
      },
      (progress) => {
        const percent = Math.round(progress.percent ?? 0);
        console.log(`[OTA] Download progress: ${percent}%`);
        if (typeof onProgress === "function") onProgress(percent);
      }
    );

    console.log("[OTA] Download complete. Applying bundle…", bundle);

    // Set as the next bundle to be loaded
    await CapacitorUpdater.set(bundle);

    // Reload the WebView to activate the new bundle
    await CapacitorUpdater.reload();

    console.log("[OTA] Update applied and reloading.");
    return true;
  } catch (err) {
    console.error("[OTA] Update failed:", err.message);
    return false;
  }
}

// ─── ROLLBACK ─────────────────────────────────────────────────────────────────
/**
 * Rolls back to the built-in (factory) bundle shipped with the APK.
 * Use when a bad OTA bundle causes issues.
 */
export async function rollbackToBuiltIn() {
  if (!isNativePlatform()) return;
  try {
    await CapacitorUpdater.reset({ toLastSuccessful: false });
    console.log("[OTA] Rolled back to built-in bundle.");
  } catch (err) {
    console.error("[OTA] Rollback error:", err.message);
  }
}

// ─── GET CURRENT BUNDLE INFO ──────────────────────────────────────────────────
/**
 * Returns the currently active bundle info from @capgo/capacitor-updater.
 * Falls back gracefully in a browser environment.
 *
 * @returns {Promise<{id: string, version: string}|null>}
 */
export async function getCurrentBundle() {
  if (!isNativePlatform()) return null;
  try {
    const info = await CapacitorUpdater.current();
    return info.bundle ?? null;
  } catch {
    return null;
  }
}

// ─── CHECK FOR UPDATE ─────────────────────────────────────────────────────────
/**
 * High-level helper: fetches manifest and returns update info if newer version exists.
 *
 * @returns {Promise<{available: boolean, manifest: VersionManifest|null}>}
 */
export async function checkForUpdate() {
  const manifest = await fetchRemoteManifest();
  if (!manifest?.version || !manifest?.bundleUrl) {
    return { available: false, manifest: null };
  }

  const hasUpdate = compareVersions(manifest.version, CURRENT_VERSION) === 1;
  console.log(
    `[OTA] Local: ${CURRENT_VERSION} | Remote: ${manifest.version} | Update: ${hasUpdate}`
  );
  return { available: hasUpdate, manifest };
}
