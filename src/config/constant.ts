const isBrowser = typeof window !== 'undefined'
const isNode = typeof process !== 'undefined' && !!process.versions?.node
const isVite = typeof import.meta !== 'undefined' && !!(import.meta as any).env

const nextPublicEnv = {
    PIE_API_SERVER:
        typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PIE_API_SERVER : undefined,
    PIE_CENTRIFUGE_SERVER:
        typeof process !== 'undefined'
            ? process.env.NEXT_PUBLIC_PIE_CENTRIFUGE_SERVER
            : undefined,
    PIE_ENABLE_RENDERING_LOG:
        typeof process !== 'undefined'
            ? process.env.NEXT_PUBLIC_PIE_ENABLE_RENDERING_LOG
            : undefined,
    PIE_PAGE_PROCESSOR:
        typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PIE_PAGE_PROCESSOR : undefined
}

const getEnvVar = (key: string, fallback: string = ''): string => {
    // 1. Vite (React / Vite)
    if (isVite) {
        return (import.meta as any).env[key] ?? fallback
    }

    // 2. Node/Bun (server-side)
    if (isNode && process.env) {
        return process.env[key] ?? fallback
    }

    return fallback
}

const getHostname = (): string => {
    if (isBrowser) return window.location.hostname
    if (isNode) return process.env.HOSTNAME ?? 'localhost'
    return 'localhost'
}

// --- API / Centrifuge
export const API_SERVER = (() => {
    const envValue =
        getEnvVar('VITE_PIE_API_SERVER') ||
        getEnvVar('PIE_API_SERVER') ||
        nextPublicEnv.PIE_API_SERVER
    return envValue === 'auto-api' ? `https://api.${getHostname()}/` : envValue
})()

export const CENTRIFUGE_SERVER = (() => {
    const envValue =
        getEnvVar('VITE_PIE_CENTRIFUGE_SERVER') ||
        getEnvVar('PIE_CENTRIFUGE_SERVER') ||
        nextPublicEnv.PIE_CENTRIFUGE_SERVER
    return envValue === 'auto-api'
        ? `wss://centrifuge.${getHostname()}/connection/websocket`
        : envValue
})()

export const ENABLE_RENDERING_LOG =
    getEnvVar('VITE_PIE_ENABLE_RENDERING_LOG', 'false') === 'true' ||
    getEnvVar('PIE_ENABLE_RENDERING_LOG', 'false') === 'true' ||
    (nextPublicEnv.PIE_ENABLE_RENDERING_LOG ?? 'false') === 'true'

export const PAGE_PROCESSOR =
    getEnvVar('VITE_PIE_PAGE_PROCESSOR') ||
    getEnvVar('PIE_PAGE_PROCESSOR') ||
    nextPublicEnv.PIE_PAGE_PROCESSOR


export const logEnvs = () => {
    console.log('API_SERVER=', API_SERVER)
    console.log('CENTRIFUGE_SERVER=', CENTRIFUGE_SERVER)
    console.log('PAGE_PROCESSOR=', PAGE_PROCESSOR)
    console.log('ENABLE_RENDERING_LOG=', ENABLE_RENDERING_LOG)
}
