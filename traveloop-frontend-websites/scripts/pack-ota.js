#!/usr/bin/env node
/**
 * scripts/pack-ota.js
 *
 * Packages the React build output into OTA assets for GitHub Releases.
 *
 * Usage (run from traveloop/):
 *   npm run ota:pack              # uses version from package.json
 *   npm run ota:pack 1.2.0        # explicit version
 *   npm run ota:release           # builds + packs in one step
 *
 * Output:
 *   ota-bundles/
 *     ├── web.zip          ← upload as GitHub Release asset
 *     └── version.json     ← upload as GitHub Release asset
 *
 * GitHub Release structure required:
 *   Tag:    v1.2.0
 *   Assets: web.zip  +  version.json
 *
 * After publishing the release, users who open the app will see the update dialog.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir   = path.resolve(__dirname, "..");

// ── Resolve version ─────────────────────────────────────────────────────────
const pkgJson  = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
const version  = process.argv[2] || pkgJson.version || "1.0.0";
const tagName  = `v${version}`;

const GITHUB_REPO = "sanjai0305/traveloop_V2";
const GITHUB_USER = GITHUB_REPO.split("/")[0];
const GITHUB_NAME = GITHUB_REPO.split("/")[1];

console.log(`\n📦  Packing OTA bundle  ${tagName}\n`);

// ── Ensure dist/ exists ─────────────────────────────────────────────────────
const distDir = path.join(rootDir, "dist");
if (!fs.existsSync(distDir)) {
  console.error("❌  dist/ not found. Run  npm run build  first.");
  process.exit(1);
}

// ── Create output directory ─────────────────────────────────────────────────
const outDir = path.join(rootDir, "ota-bundles");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── Zip dist/ → web.zip ─────────────────────────────────────────────────────
const zipPath = path.join(outDir, "web.zip");
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

console.log("🗜   Zipping dist/ → ota-bundles/web.zip …");

const isWindows = process.platform === "win32";
if (isWindows) {
  execSync(
    `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: "inherit" }
  );
} else {
  execSync(`cd "${distDir}" && zip -r "${zipPath}" .`, { stdio: "inherit" });
}

const zipSizeKB = Math.round(fs.statSync(zipPath).size / 1024);
console.log(`✅  web.zip created  (${zipSizeKB} KB)`);

// ── Generate version.json ────────────────────────────────────────────────────
//
// The bundleUrl points to the release tag that will be created on GitHub.
// Format matches what OTAService.getLatestVersion() expects.
//
const versionJson = {
  version,
  url: `https://github.com/${GITHUB_REPO}/releases/download/${tagName}/web.zip`,
  mandatory: false,
  releaseNotes: `Bug fixes and UI improvements in ${tagName}`,
};

const versionJsonPath = path.join(outDir, "version.json");
fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2));

console.log("\n📄  version.json:");
console.log(JSON.stringify(versionJson, null, 2));

// ── Print upload instructions ────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GitHub Release steps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Option A — GitHub CLI (recommended):

    gh release create ${tagName} \\
      ota-bundles/web.zip \\
      ota-bundles/version.json \\
      --title "Traveloop ${tagName}" \\
      --notes "Bug fixes and UI improvements"

  Option B — Web UI:

    1. Go to  https://github.com/${GITHUB_REPO}/releases/new
    2. Set Tag:   ${tagName}
    3. Set Title: Traveloop ${tagName}
    4. Upload:    ota-bundles/web.zip
                  ota-bundles/version.json
    5. Publish Release

  After publishing:
    Users will see the update dialog on next app launch. ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
