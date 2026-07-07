import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App } from '@capacitor/app';

export interface OTAInfo {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseNotes?: string;
    mandatory?: boolean;
    url?: string;
}

interface OTAMetadata {
    version: string;
    url: string;
    mandatory: boolean;
    releaseNotes: string;
}

const OTA_URL =
    import.meta.env.VITE_OTA_VERSION_URL;

export class OTAService {

    static async getCurrentVersion() {

        const info = await App.getInfo();

        return info.version;

    }

    static async getLatestVersion(): Promise<OTAMetadata> {

        const response = await fetch(OTA_URL, {
            cache: 'no-store'
        });

        if (!response.ok) {

            throw new Error(
                `Failed to fetch OTA metadata`
            );

        }

        return await response.json();

    }

    static async checkForUpdates(): Promise<OTAInfo> {

        console.log('[OTA] Checking updates');

        try {

            const currentVersion =
                await this.getCurrentVersion();

            console.log(
                '[OTA] Current Version:',
                currentVersion
            );

            const latest =
                await this.getLatestVersion();

            console.log(
                '[OTA] Latest Version:',
                latest.version
            );

            const hasUpdate =
                currentVersion !== latest.version;

            if (hasUpdate) {

                console.log(
                    '[OTA] Update Available'
                );

            }

            return {

                hasUpdate,

                currentVersion,

                latestVersion:
                    latest.version,

                releaseNotes:
                    latest.releaseNotes,

                mandatory:
                    latest.mandatory,

                url:
                    latest.url

            };

        }

        catch (error) {

            console.error(
                '[OTA] Check Failed',
                error
            );

            return {

                hasUpdate: false,

                currentVersion: '0.0.0',

                latestVersion: '0.0.0'

            };

        }

    }

    static async downloadUpdate(

        bundleUrl: string,

        onProgress?:
            (progress: number) => void

    ) {

        console.log(
            '[OTA] Downloading'
        );

        const response =
            await fetch(bundleUrl);

        const blob =
            await response.blob();

        onProgress?.(100);

        return blob;

    }

    static async applyUpdate(

        bundleUrl: string

    ) {

        try {

            console.log(
                '[OTA] Installing'
            );

            const result =
                await CapacitorUpdater.download({

                    url: bundleUrl

                });

            await CapacitorUpdater.set(

                result.bundle.id

            );

            console.log(

                '[OTA] Success'

            );

            return true;

        }

        catch (error) {

            console.error(

                '[OTA] Install Failed',

                error

            );

            return false;

        }

    }

}