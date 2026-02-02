import { ReactNode, useContext, useEffect } from 'react'
import CentrifugeIOContext from '../util/centrifuge.ts'
import { useIsSupported } from '../util/useIsSupported.ts'


const CentrifugeIOInitProvider = ({ children }: { children: ReactNode }) => {
    const centrifuge = useContext(CentrifugeIOContext)
    const isCentrifugeSupported = useIsSupported('centrifuge')

    useEffect(() => {
        if (!centrifuge) {
            return
        }

        const onConnectEvent = () => {
            console.log('Centrifuge connected')
        }

        const onDisconnectEvent = (event: any) => {
            console.log(`Centrifuge disconnected:`, event)
        }

        if (isCentrifugeSupported) {
            centrifuge.on('connected', onConnectEvent)
            centrifuge.on('disconnected', onDisconnectEvent)
            centrifuge.connect()
        }

        return () => {
            if (isCentrifugeSupported) {
                centrifuge.disconnect()
            }
        }
    }, [centrifuge, isCentrifugeSupported])

    return children
}

export default CentrifugeIOInitProvider
