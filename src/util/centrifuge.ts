"use client"

import { createContext } from 'react'
import { Centrifuge } from 'centrifuge'


export const getCentrifuge = (apiServer: string, centrifugeServer?: string) => {

    async function getToken() {
        const res = await fetch(apiServer + 'api/centrifuge/gen_token')
        if (!res.ok) {
            if (res.status === 403) {
                throw new Centrifuge.UnauthorizedError('Backend is not answering')
            }
            throw new Error(`Unexpected status code ${res.status}`)
        }
        const data = await res.json()
        return data.token
    }

    return centrifugeServer ?
        new Centrifuge(centrifugeServer || '', {
            getToken,
        }): null
}


// export const centrifuge =
//     getCentrifugeServer() ?
//     new Centrifuge(getCentrifugeServer() || '', {
//         getToken,
//     }): null

const CentrifugeIOContext = createContext<Centrifuge | null>(null)
export default CentrifugeIOContext
