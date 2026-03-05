// Cesium loader utility to handle CDN loading
declare global {
    interface Window {
        Cesium: any;
        CESIUM_BASE_URL: string;
    }
}

export async function loadCesium(): Promise<any> {
    // If running in SSR, return null
    if (typeof window === 'undefined') {
        return null;
    }

    // Set base URL for Cesium assets
    window.CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.116/Build/Cesium/';

    // Wait for Cesium to be available (loaded from CDN)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    while (!window.Cesium && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.Cesium) {
        throw new Error('Failed to load Cesium from CDN after 5 seconds');
    }

    return window.Cesium;
}

export function getCesium() {
    if (typeof window === 'undefined' || !window.Cesium) {
        throw new Error('Cesium not loaded. Call loadCesium() first.');
    }
    return window.Cesium;
}
