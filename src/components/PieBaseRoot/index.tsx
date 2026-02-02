import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

// @ts-ignore
import { StyleRoot } from 'radium'

import type { PieBaseRootProps } from './types'

import MittContext, {emitter} from "../../util/mitt"
import SocketIOContext, {getSocket} from "../../util/socket"
import CentrifugeIOContext, {getCentrifuge} from "../../util/centrifuge"
import { queryClient } from "../../util/queryClient"

import SocketIOInitProvider from "../../providers/SocketIOInitProvider"
import CentrifugeIOInitProvider from "../../providers/CentrifugeIOInitProvider"
import FallbackContext from "../../util/fallback";


const PieBaseRoot: React.FC<PieBaseRootProps> = ({ children, fallback }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <MittContext.Provider value={emitter}>
                <SocketIOContext.Provider value={getSocket()}>
                    <CentrifugeIOContext.Provider value={getCentrifuge()}>
                        <FallbackContext.Provider value={fallback ?? <></>}>
                            <SocketIOInitProvider>
                                <CentrifugeIOInitProvider>

                                    <StyleRoot>{children}</StyleRoot>

                                </CentrifugeIOInitProvider>
                            </SocketIOInitProvider>
                        </FallbackContext.Provider>
                    </CentrifugeIOContext.Provider>
                </SocketIOContext.Provider>
            </MittContext.Provider>
        </QueryClientProvider>
    )
}

export default PieBaseRoot
