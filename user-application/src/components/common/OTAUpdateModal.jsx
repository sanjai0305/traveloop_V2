// src/components/common/OTAUpdateModal.jsx
// Premium styled OTA update dialog shown when a new bundle is available

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  RefreshCw,
  X,
  Zap,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { downloadAndApplyUpdate } from "../../utils/otaService";
import { formatVersion } from "../../utils/versionCompare";

/**
 * OTA Update Modal
 *
 * Props:
 *  - isOpen        {boolean}             Whether the modal is visible
 *  - onClose       {function}            Called when the user dismisses ("Later")
 *  - currentVersion {string}             e.g. "1.0.0"
 *  - manifest      {VersionManifest}     { version, bundleUrl, changelog }
 */
const OTAUpdateModal = ({ isOpen, onClose, currentVersion, manifest }) => {
  const [status, setStatus] = useState("idle"); // idle | downloading | success | error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const changelog = manifest?.changelog || [
    "New features and improvements",
    "Performance enhancements",
    "Bug fixes",
  ];

  const handleUpdate = async () => {
    if (status === "downloading") return;
    setStatus("downloading");
    setProgress(0);
    setErrorMsg("");

    const success = await downloadAndApplyUpdate(
      manifest.bundleUrl,
      manifest.version,
      (pct) => setProgress(pct)
    );

    if (success) {
      setStatus("success");
      // App will reload automatically via CapacitorUpdater.reload()
    } else {
      setStatus("error");
      setErrorMsg("Update failed. Please try again later.");
    }
  };

  const handleClose = () => {
    if (status === "downloading") return; // Prevent dismissal mid-download
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ota-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={status !== "downloading" ? handleClose : undefined}
          />

          {/* Modal */}
          <motion.div
            key="ota-modal"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 bottom-6 z-[9999] rounded-[28px] overflow-hidden shadow-2xl"
            style={{
              background:
                "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
              border: "1px solid rgba(20,184,181,0.25)",
            }}
          >
            {/* Header gradient stripe */}
            <div
              className="h-1 w-full"
              style={{
                background: "linear-gradient(90deg, #14B8B5, #06B6D4, #3B82F6)",
              }}
            />

            <div className="p-6">
              {/* Title row */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[14px] flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(20,184,181,0.2), rgba(6,182,212,0.15))",
                      border: "1px solid rgba(20,184,181,0.3)",
                    }}
                  >
                    <Zap size={18} className="text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-lg leading-tight">
                      Update Available
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      A new version of Traveloop is ready
                    </p>
                  </div>
                </div>
                {status !== "downloading" && (
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Version info */}
              <div className="flex gap-3 mb-5">
                <div
                  className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Installed
                  </p>
                  <p className="text-white font-bold text-sm">
                    {formatVersion(currentVersion)}
                  </p>
                </div>
                <div className="flex items-center text-teal-400">
                  <RefreshCw size={14} />
                </div>
                <div
                  className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(20,184,181,0.12), rgba(6,182,212,0.08))",
                    border: "1px solid rgba(20,184,181,0.3)",
                  }}
                >
                  <p className="text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Latest
                  </p>
                  <p className="text-teal-300 font-bold text-sm">
                    {formatVersion(manifest?.version)}
                  </p>
                </div>
              </div>

              {/* Changelog */}
              <div
                className="rounded-2xl px-4 py-3 mb-5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                  What's new
                </p>
                <ul className="space-y-1.5">
                  {changelog.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle
                        size={12}
                        className="text-teal-400 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-slate-300 text-xs">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Download progress bar */}
              {status === "downloading" && (
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-xs font-medium">
                      Downloading update…
                    </span>
                    <span className="text-teal-400 text-xs font-bold">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, #14B8B5, #06B6D4, #3B82F6)",
                      }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Success state */}
              {status === "success" && (
                <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span className="text-emerald-300 text-sm font-medium">
                    Update applied! Reloading…
                  </span>
                </div>
              )}

              {/* Error state */}
              {status === "error" && (
                <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle size={16} className="text-rose-400" />
                  <span className="text-rose-300 text-sm font-medium">
                    {errorMsg}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {status !== "downloading" && status !== "success" && (
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-400 transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    Later
                  </button>
                )}

                {status !== "success" && (
                  <button
                    onClick={handleUpdate}
                    disabled={status === "downloading"}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
                    style={{
                      background:
                        status === "downloading"
                          ? "rgba(20,184,181,0.3)"
                          : "linear-gradient(135deg, #14B8B5, #0D9488)",
                      boxShadow:
                        status !== "downloading"
                          ? "0 8px 20px rgba(20,184,181,0.3)"
                          : "none",
                    }}
                  >
                    {status === "downloading" ? (
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
              {status === "idle" && (
                <p className="text-center text-slate-600 text-[10px] mt-3">
                  Only app content is updated · No reinstall needed
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OTAUpdateModal;
