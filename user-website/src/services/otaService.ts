// src/services/otaService.ts
// OTA Update Service — Web-only stub

export interface OTAInfo {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseNotes?: string;
    mandatory?: boolean;
    url?: string;
}

export const BUNDLED_VERSION = "1.0.0";

export class OTAServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OTAServiceError";
    }
}

export class OTAService {
    static async getCurrentVersion() {
        return BUNDLED_VERSION;
    }

    static async getLatestVersion(): Promise<OTAInfo> {
        return {
            hasUpdate: false,
            currentVersion: BUNDLED_VERSION,
            latestVersion: BUNDLED_VERSION
        };
    }

    static async downloadAndInstall(url: string, onProgress?: (p: number) => void): Promise<boolean> {
        return false;
    }

    static async notifyAppReady() {}
}

export default OTAService;