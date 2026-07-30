/**
 * src/hooks/useOTAUpdate.ts
 *
 * Stateful React hook that wraps OTAService.
 * Provides all the state variables needed by UpdateModal and OTASettings.
 *
 * Usage:
 *   const ota = useOTAUpdate();
 *
 *   ota.hasUpdate        → boolean
 *   ota.currentVersion   → "1.0.0"
 *   ota.latestVersion    → "1.1.0"
 *   ota.releaseNotes     → "Bug fixes…"
 *   ota.mandatory        → boolean
 *   ota.isChecking       → boolean (fetching version.json)
 *   ota.isDownloading    → boolean (bundle download in progress)
 *   ota.progress         → 0–100
 *   ota.status           → "idle" | "checking" | "up-to-date" | "update-available" | "downloading" | "success" | "error"
 *   ota.error            → string | null
 *   ota.checkNow()       → manually trigger a version check
 *   ota.startUpdate()    → begin download + apply cycle
 *   ota.dismiss()        → user tapped "Later"
 */

import { useState, useCallback, useRef } from "react";
import OTAService, { OTAServiceError, BUNDLED_VERSION } from "../services/otaService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OTAStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "update-available"
  | "downloading"
  | "success"
  | "error";

export interface UseOTAUpdateReturn {
  // State
  status: OTAStatus;
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  mandatory: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  progress: number;
  error: string | null;

  // Actions
  checkNow: () => Promise<void>;
  startUpdate: () => Promise<void>;
  dismiss: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOTAUpdate(): UseOTAUpdateReturn {
  const [status, setStatus] = useState<OTAStatus>("idle");
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(BUNDLED_VERSION);
  const [latestVersion, setLatestVersion] = useState(BUNDLED_VERSION);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [mandatory, setMandatory] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Keeps the bundle URL from version.json so startUpdate() can use it
  const bundleUrlRef = useRef<string>("");
  const latestVersionRef = useRef<string>(BUNDLED_VERSION);

  // ── checkNow ────────────────────────────────────────────────────────────────
  const checkNow = useCallback(async () => {
    setStatus("checking");
    setError(null);

    try {
      const info = await OTAService.checkForUpdates();

      setCurrentVersion(info.currentVersion);
      setLatestVersion(info.latestVersion);
      setReleaseNotes(info.releaseNotes ?? "");
      setMandatory(info.mandatory ?? false);
      setHasUpdate(info.hasUpdate);
      bundleUrlRef.current = info.url ?? "";
      latestVersionRef.current = info.latestVersion;

      setStatus(info.hasUpdate ? "update-available" : "up-to-date");
    } catch (err) {
      const msg =
        err instanceof OTAServiceError
          ? err.message
          : "Update check failed. Please try again.";
      setError(msg);
      setStatus("error");
    }
  }, []);

  // ── startUpdate ─────────────────────────────────────────────────────────────
  const startUpdate = useCallback(async () => {
    if (!bundleUrlRef.current) {
      setError("No update URL available. Please check again first.");
      setStatus("error");
      return;
    }

    setStatus("downloading");
    setProgress(0);
    setError(null);

    try {
      await OTAService.downloadAndApply(
        bundleUrlRef.current,
        latestVersionRef.current,
        (pct) => setProgress(pct)
      );
      // If we reach here the WebView has already reloaded, but set success
      // in case reload is delayed
      setStatus("success");
    } catch (err) {
      const msg =
        err instanceof OTAServiceError
          ? err.message
          : "Update failed. Please try again.";
      setError(msg);
      setStatus("error");
    }
  }, []);

  // ── dismiss ─────────────────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    if (status === "downloading") return; // Prevent closing mid-download
    setStatus("idle");
    setError(null);
  }, [status]);

  return {
    status,
    hasUpdate,
    currentVersion,
    latestVersion,
    releaseNotes,
    mandatory,
    isChecking: status === "checking",
    isDownloading: status === "downloading",
    progress,
    error,
    checkNow,
    startUpdate,
    dismiss,
  };
}

export default useOTAUpdate;
