import { createContext } from 'react'
import { Centrifuge } from 'centrifuge'
import { getApiServer, getCentrifugeServer } from '../config/constant'

async function getToken() {
    const res = await fetch(getApiServer() + 'api/centrifuge/gen_token')
    if (!res.ok) {
        if (res.status === 403) {
            throw new Centrifuge.UnauthorizedError('Backend is not answering')
        }
        throw new Error(`Unexpected status code ${res.status}`)
    }
    const data = await res.json()
    return data.token
}

export const getCentrifuge = () =>
    getCentrifugeServer() ?
        new Centrifuge(getCentrifugeServer() || '', {
            getToken,
        }): null

// export const centrifuge =
//     getCentrifugeServer() ?
//     new Centrifuge(getCentrifugeServer() || '', {
//         getToken,
//     }): null

const CentrifugeIOContext = createContext<Centrifuge | null>(null)
export default CentrifugeIOContext
