import {createContext, useContext} from "react";
import {PieConfig} from "../types";


export const PieConfigContext = createContext<PieConfig | null>(null)

export const usePieConfig = () => {
    const context = useContext(PieConfigContext)
    if (!context) {
        throw new Error('usePieConfig must be used within PieConfigProvider')
    }
    return context
}

// Helper functions that match the old API
export const useApiServer = () => {
    const { apiServer } = usePieConfig()
    return apiServer
}

export const getApiServer = useApiServer


export const useCentrifugeServer = () => {
    const { centrifugeServer } = usePieConfig()
    return centrifugeServer
}

export const getCentrifugeServer = useCentrifugeServer

export const useIsRenderingLogEnabled = () => {
    const { enableRenderingLog } = usePieConfig()
    return enableRenderingLog
}

export const isRenderingLogEnabled = useIsRenderingLogEnabled

export const usePageProcessor = () => {
    const { pageProcessor } = usePieConfig()
    return pageProcessor
}

export const getPageProcessor = usePageProcessor
