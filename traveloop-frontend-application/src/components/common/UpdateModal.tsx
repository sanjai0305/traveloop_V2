/**
 * src/components/common/UpdateModal.tsx
 *
 * OTA Update Modal — shown automatically at startup when a newer bundle exists.
 * Accepts the output of useOTAUpdate() as props.
 *
 * Matches Traveloop's dark design system:
 *   Background: #0B1325 → #1e293b gradient
 *   Accent:     teal-400 (#2DD4BF) / cyan-400 (#06B6D4)
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  RefreshCw,
  X,
  Zap,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { UseOTAUpdateReturn } from "../../hooks/useOTAUpdate";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateModalProps {
  ota: UseOTAUpdateReturn;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVersion(v: string): string {
  if (!v || v === "0.0.0") return "—";
  return v.startsWith("v") ? v : `v${v}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const UpdateModal: React.FC<UpdateModalProps> = ({ ota }) => {
  const isOpen =
    ota.status === "update-available" ||
    ota.status === "downloading" ||
    ota.status === "success" ||
    ota.status === "error";

  // Parse release notes — support both newline and semicolon delimited lists
  const notes: string[] = ota.releaseNotes
    ? ota.releaseNotes
        .split(/[\n;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : ["Bug fixes and performance improvements"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            key="ota-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={ota.status !== "downloading" ? ota.dismiss : undefined}
          />

          {/* ── Modal ────────────────────────────────────────────────────── */}
          <motion.div
            key="ota-modal"
            initial={{ opacity: 0, y: 64, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed inset-x-4 bottom-6 z-[9999] rounded-[28px] overflow-hidden shadow-2xl"
            style={{
              background:
                "linear-gradient(145deg, #0B1325 0%, #1e293b 60%, #0B1325 100%)",
              border: "1px solid rgba(45,212,191,0.2)",
            }}
          >
            {/* Gradient top stripe */}
            <div
              className="h-[3px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, #2DD4BF, #06B6D4, #3B82F6)",
              }}
            />

            <div className="p-6">
              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(45,212,191,0.18), rgba(6,182,212,0.12))",
                      border: "1px solid rgba(45,212,191,0.28)",
                    }}
                  >
                    <Zap size={18} className="text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-[17px] leading-tight">
                      Update Available
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      A new version of Traveloop is ready
                    </p>
                  </div>
                </div>

                {/* Close — hidden during download and after success */}
                {ota.status !== "downloading" && ota.status !== "success" && !ota.mandatory && (
                  <button
                    onClick={ota.dismiss}
                    className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition-all"
                    aria-label="Dismiss update"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* ── Version chips ──────────────────────────────────────── */}
              <div className="flex gap-3 mb-5">
                {/* Current */}
                <div
                  className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                    Installed
                  </p>
                  <p className="text-white font-bold text-sm">
                    {fmtVersion(ota.currentVersion)}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center text-teal-500">
                  <RefreshCw size={13} />
                </div>

                {/* Latest */}
                <div
                  className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(6,182,212,0.07))",
                    border: "1px solid rgba(45,212,191,0.28)",
                  }}
                >
                  <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                    Latest
                  </p>
                  <p className="text-teal-300 font-bold text-sm">
                    {fmtVersion(ota.latestVersion)}
                  </p>
                </div>
              </div>

              {/* ── Release notes ──────────────────────────────────────── */}
              <div
                className="rounded-2xl px-4 py-3 mb-5"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                  What's new
                </p>
                <ul className="space-y-1.5">
                  {notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle
                        size={11}
                        className="text-teal-400 mt-[3px] flex-shrink-0"
                      />
                      <span className="text-slate-300 text-xs leading-relaxed">
                        {note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Download progress ──────────────────────────────────── */}
              {ota.status === "downloading" && (
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-xs font-medium">
                      Downloading…
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

              {/* ── Success banner ─────────────────────────────────────── */}
              {ota.status === "success" && (
                <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-300 text-sm font-medium">
                    Update applied — reloading…
                  </span>
                </div>
              )}

              {/* ── Error banner ───────────────────────────────────────── */}
              {ota.status === "error" && (
                <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="text-rose-300 text-sm font-medium">
                    {ota.error ?? "Update failed. Try again later."}
                  </span>
                </div>
              )}

              {/* ── Action buttons ─────────────────────────────────────── */}
              <div className="flex gap-3">
                {/* Later — hidden during download / after success / if mandatory */}
                {ota.status !== "downloading" &&
                  ota.status !== "success" &&
                  !ota.mandatory && (
                    <button
                      onClick={ota.dismiss}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-400 active:scale-95 transition-transform"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Later
                    </button>
                  )}

                {/* Update Now / Updating… — hidden after success */}
                {ota.status !== "success" && (
                  <button
                    onClick={ota.startUpdate}
                    disabled={ota.status === "downloading"}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
                    style={{
                      background:
                        ota.status === "downloading"
                          ? "rgba(45,212,191,0.25)"
                          : "linear-gradient(135deg, #2DD4BF, #0D9488)",
                      boxShadow:
                        ota.status !== "downloading"
                          ? "0 8px 24px rgba(45,212,191,0.28)"
                          : "none",
                    }}
                  >
                    {ota.status === "downloading" ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Updating…
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        Update Now
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Fine print */}
              {ota.status === "update-available" && (
                <p className="text-center text-slate-600 text-[10px] mt-3">
                  Only UI assets are updated · No reinstall needed
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpdateModal;
