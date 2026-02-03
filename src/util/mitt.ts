"use client"

import mitt from 'mitt'
import { createContext } from 'react'

export const emitter = mitt()
export type MittEvents = {
    [key: string]: any
}

const MittContext = createContext(emitter)

export default MittContext
