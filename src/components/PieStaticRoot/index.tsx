import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

// @ts-ignore
import { StyleRoot } from 'radium'

import {PieStaticRootProps} from './types'

import MittContext, {emitter} from "../../util/mitt"
import SocketIOContext, {socket} from "../../util/socket"
import CentrifugeIOContext, {centrifuge} from "../../util/centrifuge"
import { queryClient } from "../../util/queryClient"

import SocketIOInitProvider from "../../providers/SocketIOInitProvider"
import CentrifugeIOInitProvider from "../../providers/CentrifugeIOInitProvider"
import FallbackContext from "../../util/fallback";
import UI from "../UI";
import {isPieComponentsInitialized} from "../../util/initializeComponents.ts";


const PieStaticRoot: React.FC<PieStaticRootProps> = ({ uiConfig, fallback }) => {
    if (!isPieComponentsInitialized()) {
        throw Error("Pie components are not initialized. Use initializePieComponents() at the top of page file")
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
                                        <UI uiConfig={uiConfig} />
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

export default PieStaticRoot
