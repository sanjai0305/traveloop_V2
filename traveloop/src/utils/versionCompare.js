// src/utils/versionCompare.js
// Version comparison helpers for OTA update system

/**
 * Compares two semantic version strings.
 * Returns:
 *   1  if versionA > versionB  (newer)
 *   -1 if versionA < versionB  (older)
 *   0  if versionA === versionB
 */
export function compareVersions(versionA, versionB) {
  if (!versionA || !versionB) return 0;

  const partsA = String(versionA).split(".").map(Number);
  const partsB = String(versionB).split(".").map(Number);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i++) {
    const a = partsA[i] ?? 0;
    const b = partsB[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

/**
 * Returns true if remoteVersion is strictly newer than localVersion.
 */
export function isNewerVersion(localVersion, remoteVersion) {
  return compareVersions(remoteVersion, localVersion) === 1;
}

/**
 * Returns a display-friendly label from a version string.
 * e.g. "1.2.0" → "v1.2.0"
 */
export function formatVersion(version) {
  if (!version) return "v0.0.0";
  return version.startsWith("v") ? version : `v${version}`;
}
