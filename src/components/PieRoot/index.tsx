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
import { API_SERVER } from "../../config/constant.ts";


const axiosInstance = createAxiosDateTransformer({
    baseURL: API_SERVER,
})

const PieRootContent: React.FC<PieRootProps> = ({ location, fallback, onError }) => {
    if (!API_SERVER) {
        throw Error("Set PIE_API_SERVER and PIE_CENTRIFUGE_SERVER")
    }

    const {
        data: uiConfiguration,
        isLoading,
        error,
    } = useQuery<UIConfigType, AxiosError>({
        queryKey: ['uiConfig', location.pathname + location.search],
        queryFn: async () => {
            const apiEndpoint = '/api/content' + location.pathname + location.search
            const response = await axiosInstance.get(apiEndpoint, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
                    'Content-type': 'application/json',
                },
                withCredentials: true,
            })
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
        onError?.()
        return fallback
    }


    if (isLoading || !uiConfiguration) return fallback

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
