import { useContext, useEffect } from 'react';
import { ENABLE_RENDERING_LOG } from '../../config/constant';
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
    // const name = data.name;
    if (ENABLE_RENDERING_LOG) {
        console.log(card, data)
    }

    const socket = useContext(SocketIOContext)
    const centrifuge = useContext(CentrifugeIOContext)
    const mitt = useContext(MittContext)

    useEffect(() => {
        if (!socket || !useSocketioSupport || !methods || !data.name) {
            return
        }
        Object.entries(methods).forEach(([methodName, methodHandler]) => {
            console.log(`[PieCard] socketio.on pie${methodName}_${data.name}`)
            socket.on(`pie${methodName}_${data.name}`, methodHandler)
        })
        return () => {
            Object.entries(methods).forEach(([methodName, methodHandler]) => {
                socket.off(`pie${methodName}_${data.name}`, methodHandler)
            })
        }
    }, [socket, methods, data.name])

    useEffect(() => {
        if (!centrifuge || !useCentrifugeSupport || !centrifugeChannel || !methods || !data.name) {
            return
        }

        const subscriptions = Object.entries(methods).map(([methodName, methodHandler]) => {
            console.log(
                `[PieCard] centrifuge.on pie${methodName}_${data.name}_${centrifugeChannel}`,
            )
            const subscription = centrifuge.newSubscription(
                `pie${methodName}_${data.name}_${centrifugeChannel}`,
            )
            subscription.on('publication', (ctx) => {
                methodHandler(ctx.data)
            })
            subscription.subscribe()
            return subscription
        })

        return () => {
            subscriptions.forEach((subscription) => {
                subscription.unsubscribe()
                centrifuge.removeSubscription(subscription)
            })
        }
    }, [centrifuge, centrifugeChannel, methods, data.name])

    useEffect(() => {
        if (!mitt || !useMittSupport || !methods || !data.name) {
            return
        }

        Object.entries(methods).forEach(([methodName, methodHandler]) => {
            const eventName = `pie${methodName}_${data.name}`
            console.log(`[PieCard] mitt.on ${eventName}`)
            mitt.on(eventName, methodHandler)
        })

        return () => {
            Object.entries(methods).forEach(([methodName, methodHandler]) => {
                const eventName = `pie${methodName}_${data.name}`
                mitt.off(eventName, methodHandler)
            })
        }
    }, [mitt, methods, data.name])

    return children
}

export default PieCard
