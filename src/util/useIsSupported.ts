import { useEffect, useState } from 'react'
import { API_SERVER } from '../config/constant'

export function useIsSupported(name: string): boolean | null {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)
    const [supportIsRequested, setSupportIsRequested] = useState(false)
    useEffect(() => {
        if (!supportIsRequested) {
            setSupportIsRequested(true)
            fetch(API_SERVER + `api/support/${name}`, { method: 'GET' })
                .then((res) => res.json())
                .then((res) => {
                    setIsSupported(res)
                })
        }
    }, [])
    return isSupported
}
