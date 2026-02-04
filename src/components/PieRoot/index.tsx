import {useEffect, useMemo} from 'react'
import {QueryClient, QueryClientProvider, useQuery} from '@tanstack/react-query'

import Radium from "radium";
import {PieRootProps} from './types'

import MittContext, {emitter} from "../../util/mitt"
import SocketIOContext, {getSocket} from "../../util/socket"
import CentrifugeIOContext, { getCentrifuge } from "../../util/centrifuge"

import SocketIOInitProvider from "../../providers/SocketIOInitProvider"
import CentrifugeIOInitProvider from "../../providers/CentrifugeIOInitProvider"
import FallbackContext from "../../util/fallback";
import {UIConfigType} from "../../types";
import {AxiosError} from "axios";
import UI from "../UI";
import { createAxiosDateTransformer } from "axios-date-transformer";
import {initializePieComponents, isPieComponentsInitialized} from "../../util/initializeComponents.ts";
import {
    getApiServer,
    isRenderingLogEnabled,
    getCentrifugeServer,
    PieConfigContext
} from "../../util/pieConfig";


const PieRootContent = ({ location, fallback, onError, initializePie }: PieRootProps) => {
    const apiServer = getApiServer()
    const centrifugeServer = getCentrifugeServer()
    const renderingLogEnabled = isRenderingLogEnabled()

    useEffect(() => {
        if (isPieComponentsInitialized()) {
            return
        }
        initializePieComponents()
        initializePie()
    }, [])

    const axiosInstance = useMemo(() => createAxiosDateTransformer({
        baseURL: apiServer,
    }), [])

    if (renderingLogEnabled) {
        console.log('[PieRoot] Rendering with location:', location)
        console.log('[PieRoot] API_SERVER:', apiServer)
        console.log('[PieRoot] Fallback provided:', !!fallback)
    }

    if (!apiServer) {
        throw Error("Set PIE_API_SERVER and PIE_CENTRIFUGE_SERVER")
    }

    // if (!isPieComponentsInitialized()) {
    //     throw Error("Pie components are not initialized. Use initializePieComponents() at the top of page file")
    // }

    const {
        data: uiConfiguration,
        isLoading,
        error,
    } = useQuery<UIConfigType, AxiosError>({
        queryKey: ['uiConfig', location.pathname + location.search, isPieComponentsInitialized()],
        queryFn: async () => {
            if (!isPieComponentsInitialized()) {
                return
            }
            const apiEndpoint = '/api/content' + location.pathname + location.search
            if (renderingLogEnabled) {
                console.log('[PieRoot] Fetching UI configuration from:', apiEndpoint)
            }
            const response = await axiosInstance.get(apiEndpoint, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                    'Content-type': 'application/json',
                },
                withCredentials: true,
            })
            if (renderingLogEnabled) {
                console.log('[PieRoot] Received UI configuration:', response.data)
            }
            return response.data
        },
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: true,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    })

    if (error) {
        if (renderingLogEnabled) {
            console.error('[PieRoot] Error fetching UI configuration:', error)
            console.error('[PieRoot] Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            })
        }
        onError?.()
        return fallback
    }


    if (isLoading || !uiConfiguration) {
        if (renderingLogEnabled) {
            console.log('[PieRoot] Loading state:', { isLoading, hasUiConfiguration: !!uiConfiguration })
        }
        return fallback
    }

    if (renderingLogEnabled) {
        console.log('[PieRoot] UI configuration loaded successfully:', uiConfiguration)
        console.log('[PieRoot] Rendering UI with configuration')
    }

    return (
        <MittContext.Provider value={emitter}>
            <SocketIOContext.Provider value={getSocket(apiServer)}>
                <CentrifugeIOContext.Provider value={getCentrifuge(apiServer, centrifugeServer)}>
                    <FallbackContext.Provider value={fallback ?? <></>}>
                        <SocketIOInitProvider>
                            <CentrifugeIOInitProvider>

                                <Radium.StyleRoot>
                                    <UI uiConfig={uiConfiguration} />
                                </Radium.StyleRoot>

                            </CentrifugeIOInitProvider>
                        </SocketIOInitProvider>
                    </FallbackContext.Provider>
                </CentrifugeIOContext.Provider>
            </SocketIOContext.Provider>
        </MittContext.Provider>
    )
}


const PieRoot = (props: PieRootProps) => {
    const queryClient = new QueryClient()
    return (
        <PieConfigContext.Provider value={props.config}>
            <QueryClientProvider client={queryClient}>
                <PieRootContent {...props} />
            </QueryClientProvider>
        </PieConfigContext.Provider>
    )
}


export default PieRoot
