import {io, Socket} from 'socket.io-client'
import { createContext } from 'react'
import { getApiServer } from '../config/constant'

// export const socket = io(getApiServer(), {
//     autoConnect: false,
//     transports: ['websocket'],
// })

export const getSocket = () => io(getApiServer(), {
    autoConnect: false,
    transports: ['websocket'],
})

/*
const onPieInitEvent = (event) => {
    window.sid = event.sid
    console.log(`Connected: ${window.sid}`)
}
socket.on(`pieinit`, onPieInitEvent)
*/

const SocketIOContext = createContext<Socket | null>(null)

export default SocketIOContext
