import { useEffect } from 'react'
import {AutoRedirectCardProps} from '../types'


const AutoRedirectCard = ({ data }: AutoRedirectCardProps) => {
    const { url } = data

    // useEffect(() => {
    //     const isExternal = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)
    //     if (isExternal) {
    //         window.location.href = url
    //     } else {
    //         navigate(url, {})
    //     }
    // }, [url, navigate])

    return <></>
}

export default AutoRedirectCard
