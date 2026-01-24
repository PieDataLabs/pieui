// Environment variables with fallbacks for library builds
const getEnvVar = (key: string, fallback: string = ''): string => {
    // Try to access import.meta.env safely
    try {
        if (typeof globalThis !== 'undefined' && (globalThis as any).import?.meta?.env) {
            return (globalThis as any).import.meta.env[key] || fallback;
        }
    } catch {
        // Ignore errors when import.meta is not available
    }

    // Fallback to process.env
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || fallback;
    }
    return fallback;
};

const getHostname = (): string => {
    if (typeof window !== 'undefined') {
        return window.location.hostname;
    }
    return 'localhost';
};

export const API_SERVER = (() => {
    const envValue = getEnvVar('VITE_PIE_API_SERVER');
    return envValue === 'auto-api' ? `https://api.${getHostname()}/` : envValue;
})();

export const CENTRIFUGE_SERVER = (() => {
    const envValue = getEnvVar('VITE_PIE_CENTRIFUGE_SERVER');
    return envValue === 'auto-api'
        ? `wss://centrifuge.${getHostname()}/connection/websocket`
        : envValue;
})();

export const ENABLE_RENDERING_LOG = false
export const PAGE_PROCESSOR = getEnvVar('VITE_PIE_PAGE_PROCESSOR')


export const logEnvs = () => {
    console.log('API_SERVER=', API_SERVER)
    console.log('CENTRIFUGE_SERVER=', CENTRIFUGE_SERVER)
    console.log('PAGE_PROCESSOR=', PAGE_PROCESSOR)
}
