import React from 'react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'

// @ts-ignore
import { StyleRoot } from 'radium'

import {PieRootProps} from './types'

import MittContext, {emitter} from "../../util/mitt"
import SocketIOContext, {socket} from "../../util/socket"
import CentrifugeIOContext, {centrifuge} from "../../util/centrifuge"
import { queryClient } from "../../util/queryClient"

import SocketIOInitProvider from "../../providers/SocketIOInitProvider"
import CentrifugeIOInitProvider from "../../providers/CentrifugeIOInitProvider"
import FallbackContext from "../../util/fallback";
import {UIConfigType} from "../../types";
import {AxiosError} from "axios";
import UI from "../UI";
import { createAxiosDateTransformer } from "axios-date-transformer";
import { API_SERVER, ENABLE_RENDERING_LOG } from "../../config/constant";
import {isPieComponentsInitialized} from "../../util/initializeComponents.ts";


const axiosInstance = createAxiosDateTransformer({
    baseURL: API_SERVER,
})

const PieRootContent: React.FC<PieRootProps> = ({ location, fallback, onError }) => {
    if (ENABLE_RENDERING_LOG) {
        console.log('[PieRoot] Rendering with location:', location)
        console.log('[PieRoot] API_SERVER:', API_SERVER)
        console.log('[PieRoot] Fallback provided:', !!fallback)
    }

    if (!API_SERVER) {
        throw Error("Set PIE_API_SERVER and PIE_CENTRIFUGE_SERVER")
    }

    if (!isPieComponentsInitialized()) {
        throw Error("Pie components are not initialized. Use initializePieComponents() at the top of page file")
    }

    const {
        data: uiConfiguration,
        isLoading,
        error,
    } = useQuery<UIConfigType, AxiosError>({
        queryKey: ['uiConfig', location.pathname + location.search],
        queryFn: async () => {
            const apiEndpoint = '/api/content' + location.pathname + location.search
            if (ENABLE_RENDERING_LOG) {
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
            if (ENABLE_RENDERING_LOG) {
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
        if (ENABLE_RENDERING_LOG) {
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
        if (ENABLE_RENDERING_LOG) {
            console.log('[PieRoot] Loading state:', { isLoading, hasUiConfiguration: !!uiConfiguration })
        }
        return fallback
    }

    if (ENABLE_RENDERING_LOG) {
        console.log('[PieRoot] UI configuration loaded successfully:', uiConfiguration)
        console.log('[PieRoot] Rendering UI with configuration')
    }

    return (
        <QueryClientProvider client={queryClient}>
            <MittContext.Provider value={emitter}>
                <SocketIOContext.Provider value={socket}>
                    <CentrifugeIOContext.Provider value={centrifuge}>
                        <FallbackContext.Provider value={fallback ?? <></>}>
                            <SocketIOInitProvider>
                                <CentrifugeIOInitProvider>

                                    <StyleRoot>
                                        <UI uiConfig={uiConfiguration} />
                                    </StyleRoot>

                                </CentrifugeIOInitProvider>
                            </SocketIOInitProvider>
                        </FallbackContext.Provider>
                    </CentrifugeIOContext.Provider>
                </SocketIOContext.Provider>
            </MittContext.Provider>
        </QueryClientProvider>
    )
}



const PieRoot: React.FC<PieRootProps> = (props) => (
    <QueryClientProvider client={queryClient}>
        <PieRootContent {...props} />
    </QueryClientProvider>
)


export default PieRoot
