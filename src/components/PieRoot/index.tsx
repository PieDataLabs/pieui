import React, {useMemo, useEffect, useState} from 'react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'

// @ts-ignore
import { StyleRoot } from 'radium'

import {PieRootProps} from './types'

import MittContext, {emitter} from "../../util/mitt"
import SocketIOContext, {getSocket} from "../../util/socket"
import CentrifugeIOContext, { getCentrifuge } from "../../util/centrifuge"
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


const PieRootContent: React.FC<PieRootProps> = ({ location, fallback, onError, initializePie, components, config }) => {
    console.log('[PieRoot DEBUG] Props config:', config);
    
    const apiServer = getApiServer()
    const centrifugeServer = getCentrifugeServer()
    
    console.log('[PieRoot DEBUG] After hooks - apiServer:', apiServer, 'centrifugeServer:', centrifugeServer);

    // Initialize components in useEffect to avoid issues with hooks
    useEffect(() => {
        if (!isPieComponentsInitialized()) {
            initializePieComponents();
        }
        
        // Register custom components if provided
        if (components && components.length > 0) {
            components.forEach(({ name, component }) => {
                registerPieComponent({ name, component });
            });
        }
        
        // Call custom initialization if provided
        if (initializePie) {
            initializePie();
        }
    }, []);

    const axiosInstance = useMemo(() => createAxiosDateTransformer({
        baseURL: apiServer,
    }), [])

    // Вызываем isRenderingLogEnabled() на верхнем уровне компонента (не внутри async функции)
    const renderingLogEnabled = isRenderingLogEnabled();

    if (renderingLogEnabled) {
        console.log('[PieRoot] Rendering with location:', location)
        console.log('[PieRoot] API_SERVER:', apiServer)
        console.log('[PieRoot] Fallback provided:', !!fallback)
    }

    if (!apiServer) {
        throw Error("Set PIE_API_SERVER and PIE_CENTRIFUGE_SERVER")
    }

    // Всегда вызываем useQuery без enabled - пусть запрос идет всегда
    const {
        data: uiConfiguration,
        isLoading,
        error,
    } = useQuery<UIConfigType, AxiosError>({
        queryKey: ['uiConfig', location.pathname + location.search],
        queryFn: async () => {
            console.log('[PieRoot] queryFn CALLED! Starting fetch...')
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


const PieRoot: React.FC<PieRootProps> = (props) => (
    <PieConfigContext.Provider value={props.config}>
        <QueryClientProvider client={queryClient}>
            <PieRootContent {...props} />
        </QueryClientProvider>
    </PieConfigContext.Provider>
)


export default PieRoot
