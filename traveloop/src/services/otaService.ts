/**
 * src/services/otaService.ts
 *
 * Production-ready OTA Update Service
 * Backend:  GitHub Releases (version.json + web.zip)
 * Plugin:   @capgo/capacitor-updater v8.x
 * Platform: Capacitor Android
 *
 * Startup flow:
 *   1. notifyAppReady()    — MUST be called first on every launch to prevent auto-rollback
 *   2. checkForUpdates()   — compares VITE_APP_VERSION with remote version.json
 *   3. applyUpdate(url)    — downloads web.zip via native plugin, sets bundle, reloads WebView
 */

import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// ─── Environment ──────────────────────────────────────────────────────────────

/**
 * URL to version.json hosted as a GitHub Release asset.
 * Example:
 *   https://github.com/sanjai0305/traveloop_V2/releases/latest/download/version.json
 *
 * IMPORTANT: GitHub's `/releases/latest/download/` redirect follows to the latest tag.
 * A cache-buster query param is appended at runtime so it is never served stale.
 */
const VERSION_URL: string =
  import.meta.env.VITE_OTA_VERSION_URL ??
  "https://github.com/sanjai0305/traveloop_V2/releases/latest/download/version.json";

/**
 * The version bundled into the APK at build time.
 * Set via  VITE_APP_VERSION=1.0.0  in .env before every build.
 */
export const BUNDLED_VERSION: string =
  import.meta.env.VITE_APP_VERSION ?? "1.0.0";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of version.json uploaded to each GitHub Release. */
export interface VersionManifest {
  /** Semantic version of the release, e.g. "1.2.0" */
  version: string;
  /** Direct URL to web.zip inside the same GitHub Release */
  url: string;
  /** Whether the user must update immediately (hides the "Later" button) */
  mandatory?: boolean;
  /** Human-readable release notes string */
  releaseNotes?: string;
}

/** Return type of checkForUpdates() */
export interface OTAInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  mandatory?: boolean;
  /** Direct download URL for web.zip */
  url?: string;
}

/** Granular error codes for robust UI handling */
export type OTAError =
  | "NETWORK_ERROR"
  | "NOT_FOUND"
  | "INVALID_JSON"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "DOWNLOAD_FAILED"
  | "APPLY_FAILED"
  | "PLATFORM_WEB";

export class OTAServiceError extends Error {
  constructor(
    public readonly code: OTAError,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "OTAServiceError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** True only when running inside the native Capacitor runtime (Android / iOS). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Compares two SemVer strings.
 * Returns 1 when a > b, -1 when a < b, 0 when equal.
 */
function semverCompare(a: string, b: string): number {
  const toNumbers = (v: string) =>
    v
      .replace(/^v/, "")
      .split(".")
      .map((n) => parseInt(n, 10) || 0);

  const [aMajor, aMinor, aPatch] = toNumbers(a);
  const [bMajor, bMinor, bPatch] = toNumbers(b);

  if (aMajor !== bMajor) return aMajor > bMajor ? 1 : -1;
  if (aMinor !== bMinor) return aMinor > bMinor ? 1 : -1;
  if (aPatch !== bPatch) return aPatch > bPatch ? 1 : -1;
  return 0;
}

// ─── Core Service ─────────────────────────────────────────────────────────────

export const OTAService = {

  /**
   * MUST be called immediately on app startup.
   * Signals to @capgo/capacitor-updater that this bundle loaded successfully.
   * Without this, the plugin's internal watchdog will auto-rollback after a timeout.
   */
  async notifyAppReady(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await CapacitorUpdater.notifyAppReady();
      console.log("[OTA] notifyAppReady → OK");
    } catch (err) {
      // Non-fatal — log and continue
      console.warn("[OTA] notifyAppReady failed:", err);
    }
  },

  /**
   * Returns the current running version.
   * On native: reads the Capacitor App Info version (matches VITE_APP_VERSION at APK build time).
   * On web: falls back to VITE_APP_VERSION env var.
   */
  async getCurrentVersion(): Promise<string> {
    if (!isNativePlatform()) return BUNDLED_VERSION;
    try {
      const info = await App.getInfo();
      return info.version ?? BUNDLED_VERSION;
    } catch {
      return BUNDLED_VERSION;
    }
  },

  /**
   * Fetches and parses version.json from GitHub Releases.
   * Throws OTAServiceError on any failure.
   */
  async getLatestVersion(): Promise<VersionManifest> {
    // Append cache-buster — GitHub CDN and browser caches must not return stale JSON
    const url = `${VERSION_URL}?_cb=${Date.now()}`;

    let res: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10 s timeout

      res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
        // GitHub Releases serve assets from a CDN with CORS headers — no credentials needed
        credentials: "omit",
      });
      clearTimeout(timeoutId);
    } catch (err: unknown) {
      const name = (err as Error)?.name;
      if (name === "AbortError") {
        throw new OTAServiceError("TIMEOUT", "Version check timed out after 10 s.", err);
      }
      throw new OTAServiceError("NETWORK_ERROR", "Network request failed.", err);
    }

    if (res.status === 404) {
      throw new OTAServiceError(
        "NOT_FOUND",
        "version.json not found in GitHub Release. Has a release been published yet?"
      );
    }
    if (res.status === 403) {
      throw new OTAServiceError("RATE_LIMITED", "GitHub API rate limit exceeded.");
    }
    if (!res.ok) {
      throw new OTAServiceError(
        "NETWORK_ERROR",
        `Unexpected HTTP ${res.status} from GitHub.`
      );
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch (err) {
      throw new OTAServiceError("INVALID_JSON", "version.json is not valid JSON.", err);
    }

    const manifest = data as Partial<VersionManifest>;
    if (!manifest.version || !manifest.url) {
      throw new OTAServiceError(
        "INVALID_JSON",
        'version.json must contain "version" and "url" fields.'
      );
    }

    return manifest as VersionManifest;
  },

  /**
   * High-level entry point called at startup and on manual "Check Updates" tap.
   *
   * @returns OTAInfo with hasUpdate=true when a newer version exists on GitHub.
   */
  async checkForUpdates(): Promise<OTAInfo> {
    console.log("[OTA] Checking updates…");

    const currentVersion = await this.getCurrentVersion();
    console.log("[OTA] Current Version:", currentVersion);

    let manifest: VersionManifest;
    try {
      manifest = await this.getLatestVersion();
    } catch (err) {
      console.warn("[OTA] Failed:", (err as Error).message);
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
      };
    }

    console.log("[OTA] Latest Version:", manifest.version);

    const hasUpdate = semverCompare(manifest.version, currentVersion) > 0;

    if (hasUpdate) {
      console.log(
        `[OTA] Update Available: ${currentVersion} → ${manifest.version}`
      );
    } else {
      console.log("[OTA] Up to date.");
    }

    return {
      hasUpdate,
      currentVersion,
      latestVersion: manifest.version,
      releaseNotes: manifest.releaseNotes,
      mandatory: manifest.mandatory ?? false,
      url: manifest.url,
    };
  },

  /**
   * Downloads web.zip from GitHub Releases using @capgo/capacitor-updater's
   * native download implementation (streams directly to device storage).
   *
   * @param bundleUrl   Direct URL to web.zip (from version.json)
   * @param version     Version string used to label the bundle
   * @param onProgress  Called with 0-100 as the download progresses
   */
  async downloadUpdate(
    bundleUrl: string,
    version: string,
    onProgress?: (percent: number) => void
  ): Promise<{ id: string }> {
    if (!isNativePlatform()) {
      throw new OTAServiceError(
        "PLATFORM_WEB",
        "OTA downloads only work on native Capacitor platforms."
      );
    }

    console.log("[OTA] Downloading", bundleUrl);
    onProgress?.(0);

    try {
      // @capgo/capacitor-updater v8 download signature:
      //   download({ url, version }) → BundleInfo
      // Progress is emitted via a separate listener in v8.x
      CapacitorUpdater.addListener("download", (state) => {
        const pct = Math.round(state.percent ?? 0);
        console.log(`[OTA] Progress: ${pct}%`);
        onProgress?.(pct);
      });

      const bundle = await CapacitorUpdater.download({ url: bundleUrl, version });
      console.log("[OTA] Download complete → bundle id:", bundle.id);
      onProgress?.(100);
      return bundle;
    } catch (err) {
      console.error("[OTA] Download Failed:", err);
      throw new OTAServiceError("DOWNLOAD_FAILED", "Bundle download failed.", err);
    }
  },

  /**
   * Activates a downloaded bundle and reloads the WebView.
   * Must be called immediately after downloadUpdate().
   *
   * @param bundle  Bundle object returned by downloadUpdate()
   */
  async applyUpdate(bundle: { id: string }): Promise<void> {
    if (!isNativePlatform()) {
      throw new OTAServiceError("PLATFORM_WEB", "applyUpdate is native-only.");
    }

    try {
      console.log("[OTA] Installing bundle:", bundle.id);
      await CapacitorUpdater.set({ id: bundle.id });
      console.log("[OTA] Reloading WebView…");
      // set() triggers a WebView reload automatically in v8; reload() is a safety net
      await CapacitorUpdater.reload();
      console.log("[OTA] Success ✓");
    } catch (err) {
      console.error("[OTA] Failed:", err);
      throw new OTAServiceError("APPLY_FAILED", "Failed to apply bundle.", err);
    }
  },

  /**
   * One-shot helper: downloads AND applies an update.
   * This is what the modal's "Update Now" button calls.
   */
  async downloadAndApply(
    bundleUrl: string,
    version: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const bundle = await this.downloadUpdate(bundleUrl, version, onProgress);
    await this.applyUpdate(bundle);
  },

  /**
   * Rolls back to the last known-good bundle (the one shipped with the APK).
   * Use this if a bad OTA update is pushed.
   */
  async rollback(): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      await CapacitorUpdater.reset({ toLastSuccessful: true });
      console.log("[OTA] Rolled back to last successful bundle.");
    } catch (err) {
      console.error("[OTA] Rollback error:", err);
    }
  },
};

export default OTAService;
