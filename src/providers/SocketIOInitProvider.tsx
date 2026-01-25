import { ReactNode, useContext, useEffect } from 'react'
import SocketIOContext from '../util/socket.ts'
import { useIsSupported } from '../util/useIsSupported.ts'
import { Socket } from 'socket.io-client'


const SocketIOInitProvider = ({ children }: { children: ReactNode }) => {
    const socket: Socket = useContext(SocketIOContext)
    const isSocketIOSupported = useIsSupported('socketIO')

    const onPieInitEvent = (event: any) => {
        window.sid = event.sid
        console.log(`SocketIO initialized: ${window.sid}`)
    }

    useEffect(() => {
        const onConnectEvent = () => {
            console.log('SocketIO connected')
        }

        const onDisconnectEvent = (event: any) => {
            console.log(`SocketIO disconnected: ${event}`)
            socket.connect()
        }

        if (isSocketIOSupported) {
            socket.on(`pieinit`, onPieInitEvent)
            socket.on('connect', onConnectEvent)
            socket.on('disconnect', onDisconnectEvent)
            socket.connect()
        }
        return () => {
            if (isSocketIOSupported) {
                socket.off(`pieinit`, onPieInitEvent)
                socket.off('connect', onConnectEvent)
                socket.off('disconnect', onDisconnectEvent)
                socket.disconnect()
            }
        }
    }, [socket, isSocketIOSupported])

    return children
}

export default SocketIOInitProvider
