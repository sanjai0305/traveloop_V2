#!/usr/bin/env node
/**
 * scripts/pack-ota.js
 * 
 * Packages the React build output into an OTA bundle for Firebase Storage.
 *
 * Usage (run from traveloop/):
 *   node scripts/pack-ota.js [version]
 *
 * Examples:
 *   node scripts/pack-ota.js          # uses version from package.json
 *   node scripts/pack-ota.js 1.2.0    # explicit version
 *
 * Output:
 *   ota-bundles/v1.2.0.zip    ← upload this to Firebase Storage at  updates/v1.2.0.zip
 *   ota-bundles/version.json  ← upload this to Firebase Storage at  updates/version.json
 *
 * After uploading, users who open the app will see the update dialog.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// ── Resolve version ────────────────────────────────────────────────────────────
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
const version = process.argv[2] || pkgJson.version || "1.0.0";

console.log(`\n📦  Packing OTA bundle  v${version}\n`);

// ── Ensure dist/ exists ────────────────────────────────────────────────────────
const distDir = path.join(rootDir, "dist");
if (!fs.existsSync(distDir)) {
  console.error("❌  dist/ not found. Run  npm run build  first.");
  process.exit(1);
}

// ── Create output directory ────────────────────────────────────────────────────
const outDir = path.join(rootDir, "ota-bundles");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── Zip dist/ ─────────────────────────────────────────────────────────────────
const zipName = `v${version}.zip`;
const zipPath = path.join(outDir, zipName);

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

console.log(`🗜   Zipping dist/ → ota-bundles/${zipName} …`);

// Use PowerShell Compress-Archive on Windows, zip on Unix
const isWindows = process.platform === "win32";
if (isWindows) {
  execSync(
    `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: "inherit" }
  );
} else {
  execSync(`cd "${distDir}" && zip -r "${zipPath}" .`, { stdio: "inherit" });
}

console.log(`✅  Bundle created:  ota-bundles/${zipName}`);

// ── Generate version.json ──────────────────────────────────────────────────────
// Update the bundleUrl to match your actual Firebase Storage project/bucket.
const FIREBASE_PROJECT = process.env.VITE_FIREBASE_PROJECT_ID || "traveloop-version-2-83bd2";

const versionJson = {
  version,
  bundleUrl: `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_PROJECT}.appspot.com/o/updates%2F${encodeURIComponent(zipName)}?alt=media`,
  changelog: [
    "UI and performance improvements",
    "Bug fixes",
  ],
  publishedAt: new Date().toISOString(),
};

const versionJsonPath = path.join(outDir, "version.json");
fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2));

console.log(`\n📄  version.json generated:`);
console.log(JSON.stringify(versionJson, null, 2));

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Next steps — Upload to Firebase Storage:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Open Firebase Console → Storage
  2. Navigate to / or create folder  updates/
  3. Upload:
       ota-bundles/${zipName}   →   updates/${zipName}
       ota-bundles/version.json →   updates/version.json

  4. Make both files publicly readable (or use a signed URL)

  5. Done! Users will see the update prompt on next app launch.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
