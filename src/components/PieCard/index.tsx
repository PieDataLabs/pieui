import { useContext, useEffect } from 'react';
import { isRenderingLogEnabled } from '../../util/pieConfig';
import CentrifugeIOContext from '../../util/centrifuge';
import SocketIOContext from '../../util/socket';
import MittContext from '../../util/mitt';
import {PieCardProps} from './types';


const PieCard = ({
    card,
    data,
    children,
    useSocketioSupport = false,
    useCentrifugeSupport = false,
    useMittSupport = false,
    centrifugeChannel = undefined,
    methods = undefined,
}: PieCardProps) => {
    // Вызываем isRenderingLogEnabled на верхнем уровне компонента
    const renderingLogEnabled = isRenderingLogEnabled()
    
    // const name = data.name;
    if (renderingLogEnabled) {
        console.log('[PieCard] Rendering card:', card)
        console.log('[PieCard] Card data:', data)
        console.log('[PieCard] Component name:', data?.name)
        console.log('[PieCard] Real-time support:', {
            socketio: useSocketioSupport,
            centrifuge: useCentrifugeSupport,
            mitt: useMittSupport,
            centrifugeChannel
        })
        console.log('[PieCard] Methods:', methods ? Object.keys(methods) : 'none')
        console.log('[PieCard] Has children:', !!children)
    }

    const socket = useContext(SocketIOContext)
    const centrifuge = useContext(CentrifugeIOContext)
    const mitt = useContext(MittContext)

    useEffect(() => {
        if (!socket || !useSocketioSupport || !methods || !data.name) {
            if (renderingLogEnabled && useSocketioSupport) {
                console.log('[PieCard] Socket.IO setup skipped:', {
                    hasSocket: !!socket,
                    useSocketioSupport,
                    hasMethods: !!methods,
                    hasDataName: !!data?.name
                })
            }
            return
        }
        Object.entries(methods).forEach(([methodName, methodHandler]) => {
            const eventName = `pie${methodName}_${data.name}`
            if (renderingLogEnabled) {
                console.log(`[PieCard] Socket.IO registering event: ${eventName}`)
            }
            socket.on(eventName, methodHandler)
        })
        return () => {
            Object.entries(methods).forEach(([methodName, methodHandler]) => {
                const eventName = `pie${methodName}_${data.name}`
                if (renderingLogEnabled) {
                    console.log(`[PieCard] Socket.IO unregistering event: ${eventName}`)
                }
                socket.off(eventName, methodHandler)
            })
        }
    }, [socket, methods, data.name, renderingLogEnabled])

    useEffect(() => {
        if (!centrifuge || !useCentrifugeSupport || !centrifugeChannel || !methods || !data.name) {
            if (renderingLogEnabled && useCentrifugeSupport) {
                console.log('[PieCard] Centrifuge setup skipped:', {
                    hasCentrifuge: !!centrifuge,
                    useCentrifugeSupport,
                    hasCentrifugeChannel: !!centrifugeChannel,
                    hasMethods: !!methods,
                    hasDataName: !!data?.name
                })
            }
            return
        }

        const subscriptions = Object.entries(methods).map(([methodName, methodHandler]) => {
            const channelName = `pie${methodName}_${data.name}_${centrifugeChannel}`
            if (renderingLogEnabled) {
                console.log(`[PieCard] Centrifuge subscribing to channel: ${channelName}`)
            }
            const subscription = centrifuge.newSubscription(channelName)
            subscription.on('publication', (ctx) => {
                if (renderingLogEnabled) {
                    console.log(`[PieCard] Centrifuge received data on ${channelName}:`, ctx.data)
                }
                methodHandler(ctx.data)
            })
            subscription.subscribe()
            return subscription
        })

        return () => {
            subscriptions.forEach((subscription) => {
                if (renderingLogEnabled) {
                    console.log(`[PieCard] Centrifuge unsubscribing from channel`)
                }
                subscription.unsubscribe()
                centrifuge.removeSubscription(subscription)
            })
        }
    }, [centrifuge, centrifugeChannel, methods, data.name, renderingLogEnabled])

    useEffect(() => {
        if (!mitt || !useMittSupport || !methods || !data.name) {
            if (renderingLogEnabled && useMittSupport) {
                console.log('[PieCard] Mitt setup skipped:', {
                    hasMitt: !!mitt,
                    useMittSupport,
                    hasMethods: !!methods,
                    hasDataName: !!data?.name
                })
            }
            return
        }

        Object.entries(methods).forEach(([methodName, methodHandler]) => {
            const eventName = `pie${methodName}_${data.name}`
            if (renderingLogEnabled) {
                console.log(`[PieCard] Mitt registering event: ${eventName}`)
            }
            mitt.on(eventName, methodHandler)
        })

        return () => {
            Object.entries(methods).forEach(([methodName, methodHandler]) => {
                const eventName = `pie${methodName}_${data.name}`
                if (renderingLogEnabled) {
                    console.log(`[PieCard] Mitt unregistering event: ${eventName}`)
                }
                mitt.off(eventName, methodHandler)
            })
        }
    }, [mitt, methods, data.name, renderingLogEnabled])

    if (renderingLogEnabled) {
        console.log('[PieCard] Rendering complete, returning children')
    }

    return children
}

export default PieCard
