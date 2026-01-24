import { io } from 'socket.io-client'
import { createContext } from 'react'
import { API_SERVER } from '../config/constant'

export const socket = io(API_SERVER, {
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

const SocketIOContext = createContext(socket)

export default SocketIOContext
