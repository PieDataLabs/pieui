import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

// @ts-ignore
import { StyleRoot } from 'radium'

import type { PieRootProps } from './types'

import MittContext, {emitter} from "../../util/mitt.ts"
import SocketIOContext, {socket} from "../../util/socket.ts"
import CentrifugeIOContext, {centrifuge} from "../../util/centrifuge.ts"
import { queryClient } from "../../util/queryClient.ts"

import SocketIOInitProvider from "../../providers/SocketIOInitProvider.tsx"
import CentrifugeIOInitProvider from "../../providers/CentrifugeIOInitProvider.tsx"
import FallbackContext from "../../util/fallback.ts";


const PieRoot: React.FC<PieRootProps> = ({ children, fallback }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <MittContext.Provider value={emitter}>
                <SocketIOContext.Provider value={socket}>
                    <CentrifugeIOContext.Provider value={centrifuge}>
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

export default PieRoot
