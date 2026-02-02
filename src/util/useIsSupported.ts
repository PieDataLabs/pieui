import { useEffect, useState } from 'react'
import { getApiServer } from '../config/constant'

export function useIsSupported(name: string): boolean | null {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)
    const [supportIsRequested, setSupportIsRequested] = useState(false)
    useEffect(() => {
        if (!supportIsRequested) {
            setSupportIsRequested(true)
            fetch(getApiServer() + `api/support/${name}`, { method: 'GET' })
                .then((res) => res.json())
                .then((res) => {
                    setIsSupported(res)
                })
        }
    }, [])
    return isSupported
}
