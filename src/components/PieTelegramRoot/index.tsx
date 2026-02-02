import React, {useMemo, useEffect, useState} from 'react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'

// @ts-ignore
import { StyleRoot } from 'radium'

import {PieRootProps} from '../PieRoot/types'

import MittContext, {emitter} from "../../util/mitt"
import SocketIOContext, {getSocket} from "../../util/socket"
import CentrifugeIOContext, {getCentrifuge} from "../../util/centrifuge"
import { queryClient } from "../../util/queryClient"

import SocketIOInitProvider from "../../providers/SocketIOInitProvider"
import CentrifugeIOInitProvider from "../../providers/CentrifugeIOInitProvider"
import FallbackContext from "../../util/fallback";
import {UIConfigType} from "../../types";
import {AxiosError} from "axios";
import UI from "../UI";
import { createAxiosDateTransformer } from "axios-date-transformer";
import {
    getApiServer,
    isRenderingLogEnabled,
    getCentrifugeServer,
    PieConfigContext
} from "../../util/pieConfig";
import {initializePieComponents, isPieComponentsInitialized} from "../../util/initializeComponents.ts";
import {registerPieComponent} from "../../util/registry";
import {useWebApp} from "../../util/useWebApp.ts";


const PieTelegramRootContent: React.FC<PieRootProps> = ({ location, fallback, onError, initializePie, components }) => {
    const apiServer = getApiServer()
    const centrifugeServer = getCentrifugeServer()

    // Initialize components in useEffect to avoid issues with hooks
    useEffect(() => {
        if (!isPieComponentsInitialized()) {
            initializePieComponents();
        }
        
        if (components && components.length > 0) {
            components.forEach(({ name, component }) => {
                registerPieComponent({ name, component });
            });
        }
        
        if (initializePie) {
            initializePie();
        }
    }, []);

    const axiosInstance = useMemo(() => createAxiosDateTransformer({
        baseURL: apiServer,
    }), [])
    
    // Вызываем isRenderingLogEnabled() на верхнем уровне компонента
    const renderingLogEnabled = isRenderingLogEnabled();
    
    if (renderingLogEnabled) {
        console.log('[PieRoot] Rendering with location:', location)
        console.log('[PieRoot] API_SERVER:', apiServer)
        console.log('[PieRoot] Fallback provided:', !!fallback)
    }

    if (!apiServer) {
        throw Error("Set PIE_API_SERVER and PIE_CENTRIFUGE_SERVER")
    }

    // Всегда вызываем хуки перед любым ранним выходом
    const webApp = useWebApp()

    const {
        data: uiConfiguration,
        isLoading,
        error,
    } = useQuery<UIConfigType, AxiosError>({
        queryKey: ['uiConfig', location.pathname + location.search, webApp?.initData],
        queryFn: async () => {
            const querySymbol = location.search ? '&' : '?'
            const initData = webApp?.initData
                ? `${querySymbol}initData=${encodeURIComponent(webApp.initData)}`
                : ''
            const apiEndpoint = '/api/content' + location.pathname + location.search + initData

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

    // Определяем что рендерить - fallback или UI
    let content: React.ReactNode = null;
    
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
        content = fallback ?? null;
    } else if (isLoading || !uiConfiguration) {
        if (renderingLogEnabled) {
            console.log('[PieRoot] Loading state:', { isLoading, hasUiConfiguration: !!uiConfiguration })
        }
        content = fallback ?? null;
    } else {
        if (renderingLogEnabled) {
            console.log('[PieRoot] UI configuration loaded successfully:', uiConfiguration)
            console.log('[PieRoot] Rendering UI with configuration')
        }
        content = <UI uiConfig={uiConfiguration} />;
    }

    // Всегда рендерим провайдеры, чтобы количество хуков было одинаковым
    return (
        <MittContext.Provider value={emitter}>
            <SocketIOContext.Provider value={getSocket(apiServer)}>
                <CentrifugeIOContext.Provider value={getCentrifuge(apiServer, centrifugeServer)}>
                    <FallbackContext.Provider value={fallback ?? <></>}>
                        <SocketIOInitProvider>
                            <CentrifugeIOInitProvider>
                                <StyleRoot>
                                    {content}
                                </StyleRoot>
                            </CentrifugeIOInitProvider>
                        </SocketIOInitProvider>
                    </FallbackContext.Provider>
                </CentrifugeIOContext.Provider>
            </SocketIOContext.Provider>
        </MittContext.Provider>
    )
}



const PieTelegramRoot: React.FC<PieRootProps> = (props) => (
    <PieConfigContext.Provider value={props.config}>
        <QueryClientProvider client={queryClient}>
            <PieTelegramRootContent {...props} />
        </QueryClientProvider>
    </PieConfigContext.Provider>
)


export default PieTelegramRoot
