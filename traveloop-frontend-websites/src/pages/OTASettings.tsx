/**
 * src/pages/OTASettings.tsx
 *
 * OTA Settings Screen — embedded in the app's Settings / Profile area.
 * Shows current version, latest version, release notes, update badge,
 * download progress, and a Restart App button after success.
 *
 * Usage in your Settings route:
 *   import OTASettings from "../pages/OTASettings";
 *   <OTASettings ota={ota} />
 *
 * Or in a router:
 *   <Route path="/settings/updates" element={<OTASettingsPage />} />
 */

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  Zap,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UseOTAUpdateReturn } from "../hooks/useOTAUpdate";
import OTAService from "../services/otaService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OTASettingsProps {
  ota: UseOTAUpdateReturn;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVersion(v: string): string {
  if (!v || v === "0.0.0") return "—";
  return v.startsWith("v") ? v : `v${v}`;
}

const statusLabel: Record<string, string> = {
  idle: "Tap to check for updates",
  checking: "Checking…",
  "up-to-date": "You're on the latest version",
  "update-available": "Update available!",
  downloading: "Downloading…",
  success: "Update installed",
  error: "Check failed",
};

// ─── Component ────────────────────────────────────────────────────────────────

const OTASettings: React.FC<OTASettingsProps> = ({ ota }) => {
  const navigate = useNavigate();

  // Auto-check on mount
  useEffect(() => {
    if (ota.status === "idle") {
      ota.checkNow();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const notes: string[] = ota.releaseNotes
    ? ota.releaseNotes
        .split(/[\n;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #0B1325 0%, #0f1f3d 100%)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-white font-extrabold text-lg">App Updates</h1>
          <p className="text-slate-500 text-xs">Over-the-air update system</p>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-10">
        {/* ── Version card ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #141f35, #1a2942)",
            border: "1px solid rgba(45,212,191,0.15)",
          }}
        >
          {/* Accent stripe */}
          <div
            className="h-[3px]"
            style={{
              background: "linear-gradient(90deg, #2DD4BF, #06B6D4, #3B82F6)",
            }}
          />

          <div className="p-5">
            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-[14px] flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(45,212,191,0.18), rgba(6,182,212,0.1))",
                  border: "1px solid rgba(45,212,191,0.25)",
                }}
              >
                <Zap size={18} className="text-teal-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Traveloop</p>
                <p className="text-slate-500 text-xs">
                  {statusLabel[ota.status] ?? ""}
                </p>
              </div>

              {/* Update badge */}
              {ota.hasUpdate && ota.status !== "success" && (
                <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold text-teal-900 bg-teal-400">
                  NEW
                </span>
              )}
            </div>

            {/* Version comparison row */}
            <div className="flex gap-3 mb-5">
              <div
                className="flex-1 rounded-2xl px-4 py-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Current
                </p>
                <p className="text-white font-bold text-sm">
                  {fmtVersion(ota.currentVersion)}
                </p>
              </div>

              <div className="flex items-center justify-center text-slate-600">
                <RefreshCw size={12} />
              </div>

              <div
                className="flex-1 rounded-2xl px-4 py-3 text-center"
                style={{
                  background: ota.hasUpdate
                    ? "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(6,182,212,0.07))"
                    : "rgba(255,255,255,0.04)",
                  border: ota.hasUpdate
                    ? "1px solid rgba(45,212,191,0.25)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                    ota.hasUpdate ? "text-teal-400" : "text-slate-600"
                  }`}
                >
                  Latest
                </p>
                <p
                  className={`font-bold text-sm ${
                    ota.hasUpdate ? "text-teal-300" : "text-white"
                  }`}
                >
                  {ota.isChecking ? "…" : fmtVersion(ota.latestVersion)}
                </p>
              </div>
            </div>

            {/* ── Release notes ─────────────────────────────────────────── */}
            {notes.length > 0 && (
              <div
                className="rounded-2xl px-4 py-3 mb-5"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-2">
                  Release Notes
                </p>
                <ul className="space-y-1.5">
                  {notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle
                        size={11}
                        className="text-teal-500 mt-[3px] flex-shrink-0"
                      />
                      <span className="text-slate-300 text-xs leading-relaxed">
                        {note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Progress bar (download) ───────────────────────────────── */}
            {ota.isDownloading && (
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-xs font-medium">
                    Downloading update…
                  </span>
                  <span className="text-teal-400 text-xs font-bold tabular-nums">
                    {ota.progress}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #2DD4BF, #06B6D4, #3B82F6)",
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${ota.progress}%` }}
                    transition={{ ease: "linear", duration: 0.25 }}
                  />
                </div>
              </div>
            )}

            {/* ── Success banner ────────────────────────────────────────── */}
            {ota.status === "success" && (
              <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-300 text-sm font-medium">
                  Update installed — restarting…
                </span>
              </div>
            )}

            {/* ── Error banner ──────────────────────────────────────────── */}
            {ota.status === "error" && (
              <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle
                  size={15}
                  className="text-rose-400 flex-shrink-0 mt-0.5"
                />
                <span className="text-rose-300 text-sm font-medium">
                  {ota.error ?? "Update check failed. Please try again."}
                </span>
              </div>
            )}

            {/* ── Up to date ────────────────────────────────────────────── */}
            {ota.status === "up-to-date" && (
              <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                <CheckCircle size={15} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 text-sm font-medium">
                  You're on the latest version
                </span>
              </div>
            )}

            {/* ── Action buttons ────────────────────────────────────────── */}
            <div className="flex gap-3">
              {/* Check for updates / Re-check */}
              {(ota.status === "idle" ||
                ota.status === "up-to-date" ||
                ota.status === "error") && (
                <button
                  onClick={ota.checkNow}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-slate-300 active:scale-95 transition-transform"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <RefreshCw
                    size={14}
                    className={ota.isChecking ? "animate-spin" : ""}
                  />
                  {ota.isChecking ? "Checking…" : "Check for Updates"}
                </button>
              )}

              {/* Download Update */}
              {ota.hasUpdate && !ota.isDownloading && ota.status !== "success" && (
                <button
                  onClick={ota.startUpdate}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white active:scale-95 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #2DD4BF, #0D9488)",
                    boxShadow: "0 8px 24px rgba(45,212,191,0.28)",
                  }}
                >
                  <Download size={14} />
                  Download Update
                </button>
              )}

              {/* Downloading… (disabled) */}
              {ota.isDownloading && (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white opacity-70"
                  style={{ background: "rgba(45,212,191,0.25)" }}
                >
                  <RefreshCw size={14} className="animate-spin" />
                  Updating…
                </button>
              )}

              {/* Restart App — after success (safety net, the WebView should auto-reload) */}
              {ota.status === "success" && (
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white active:scale-95 transition-transform"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: "0 8px 24px rgba(16,185,129,0.28)",
                  }}
                >
                  <RotateCcw size={14} />
                  Restart App
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Info card ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl px-4 py-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-2">
            About OTA Updates
          </p>
          <p className="text-slate-500 text-xs leading-relaxed">
            Over-the-air updates deliver new features and bug fixes directly to
            your app without requiring a reinstall from the Play Store. Only UI
            assets are updated — native code changes still require a full APK
            release.
          </p>
        </motion.div>

        {/* ── Rollback (developer debug) ────────────────────────────────────── */}
        {import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => OTAService.rollback()}
              className="w-full py-3 rounded-2xl text-xs font-bold text-slate-600 active:scale-95 transition-transform"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.08)",
              }}
            >
              ⚠️ Rollback to built-in bundle (dev only)
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OTASettings;

// ─── Standalone page wrapper ──────────────────────────────────────────────────
// For use as a route: <Route path="/settings/updates" element={<OTASettingsPage />} />

import { useOTAUpdate } from "../hooks/useOTAUpdate";

export const OTASettingsPage: React.FC = () => {
  const ota = useOTAUpdate();
  return <OTASettings ota={ota} />;
};
