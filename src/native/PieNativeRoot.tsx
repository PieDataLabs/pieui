'use client'

import React, { useMemo } from 'react'
import {
    QueryClient,
    QueryClientProvider,
    useQuery,
} from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { createAxiosDateTransformer } from 'axios-date-transformer'
import { Platform } from 'react-native'

import { PieRootProps } from '../components/PieRoot/types'
import UI from '../components/UI'

import MittContext, { getEmitter } from '../util/mitt'
import SocketIOContext, { getSocket } from '../util/socket'
import CentrifugeIOContext, { getCentrifuge } from '../util/centrifuge'
import SocketIOInitProvider from '../providers/SocketIOInitProvider'
import CentrifugeIOInitProvider from '../providers/CentrifugeIOInitProvider'
import FallbackContext from '../util/fallback'
import LazyErrorContext from '../util/lazyError'
import NavigateContext from '../util/navigate'
import { UIConfigType } from '../types'
import {
    PieConfigContext,
    useApiServer,
    useCentrifugeServer,
    useIsRenderingLogEnabled,
} from '../util/pieConfig'
import { resolvePieCacheFallback } from '../util/piecache'

const PieNativeRootContent = ({
    location,
    fallback,
    piecache,
    onError,
    queryOptions,
}: PieRootProps) => {
    const apiServer = useApiServer()
    const centrifugeServer = useCentrifugeServer()
    const renderingLogEnabled = useIsRenderingLogEnabled()

    const axiosInstance = useMemo(
        () => createAxiosDateTransformer({ baseURL: apiServer || '' }),
        [apiServer]
    )

    const emitter = useMemo(() => getEmitter(), [])
    const socket = useMemo(
        () => (apiServer ? getSocket(apiServer) : null),
        [apiServer]
    )
    const centrifuge = useMemo(
        () => (apiServer ? getCentrifuge(apiServer, centrifugeServer) : null),
        [apiServer, centrifugeServer]
    )

    const {
        data: uiConfiguration,
        isLoading,
        error,
    } = useQuery<UIConfigType, AxiosError>({
        queryKey: ['uiConfig', location.pathname + location.search, apiServer],
        enabled: !!apiServer,
        queryFn: async () => {
            const params = new URLSearchParams(location.search)
            // Native counterpart of PieTelegramRoot's `telegram` / PieMaxRoot's
            // `max`: identify the running mobile OS to the server.
            params.set('__pieroot', Platform.OS)
            const apiEndpoint =
                '/api/content' + location.pathname + '?' + params.toString()
            if (renderingLogEnabled) {
                console.log(
                    '[PieNativeRoot] Fetching UI configuration from:',
                    apiEndpoint
                )
            }
            const response = await axiosInstance.get(apiEndpoint, {
                headers: { 'Content-type': 'application/json' },
                withCredentials: true,
            })
            if (renderingLogEnabled) {
                console.log(
                    '[PieNativeRoot] Received UI configuration:',
                    response.data
                )
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
        ...queryOptions,
    })

    const resolvedFallback = resolvePieCacheFallback(
        location.pathname,
        piecache,
        fallback
    )

    if (!apiServer) {
        return resolvedFallback ?? null
    }

    if (error) {
        if (renderingLogEnabled) {
            console.error(
                '[PieNativeRoot] Error fetching UI configuration:',
                error
            )
        }
        onError?.(error)
        return resolvedFallback
    }

    if (isLoading || !uiConfiguration) {
        return resolvedFallback
    }

    // Native never renders an HTML `<form>` — submission goes through the
    // platform `ClientSources` wired via `configureNativeClientSources`.
    return (
        <MittContext.Provider value={emitter}>
            <SocketIOContext.Provider value={socket}>
                <CentrifugeIOContext.Provider value={centrifuge}>
                    <FallbackContext.Provider value={fallback ?? <></>}>
                        <SocketIOInitProvider>
                            <CentrifugeIOInitProvider>
                                <UI uiConfig={uiConfiguration} />
                            </CentrifugeIOInitProvider>
                        </SocketIOInitProvider>
                    </FallbackContext.Provider>
                </CentrifugeIOContext.Provider>
            </SocketIOContext.Provider>
        </MittContext.Provider>
    )
}

/**
 * React Native root for PieUI. Fetches the server-driven `UIConfig` from
 * `api/content{pathname}{search}` like {@link PieRoot}, but identifies itself to
 * the server with `__pieroot=<Platform.OS>` (`ios` / `android`) — the native
 * counterpart of PieTelegramRoot (`telegram`) and PieMaxRoot (`max`) — and never
 * renders the implicit `<form id="piedata_global_form">` wrapper (there is no
 * HTML form on native; submission goes through the platform `ClientSources`).
 *
 * The host registers its own React Native leaf components with
 * `registerPieComponent`; the fetched tree renders through `UI` / `PieCard`.
 */
const PieNativeRoot = (props: PieRootProps) => {
    const fallbackClient = useMemo(() => new QueryClient(), [])
    const queryClient = props.queryClient ?? fallbackClient

    return (
        <NavigateContext.Provider value={props.onNavigate}>
            <PieConfigContext.Provider value={props.config}>
                <LazyErrorContext.Provider value={props.onError}>
                    <QueryClientProvider client={queryClient}>
                        <PieNativeRootContent {...props} />
                    </QueryClientProvider>
                </LazyErrorContext.Provider>
            </PieConfigContext.Provider>
        </NavigateContext.Provider>
    )
}

export default PieNativeRoot
