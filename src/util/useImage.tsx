import React, { useLayoutEffect, useReducer } from 'react'

export function useImage(url: string, crossOrigin?: string, referrerPolicy?: string) {
    type State = {
        image: HTMLImageElement | undefined
        status: 'loading' | 'loaded' | 'failed'
    }
    type Action = { type: 'LOAD'; payload: HTMLImageElement } | { type: 'CLEAR' } | { type: 'FAIL' }
    const reducer = (state: State, action: Action): State => {
        switch (action.type) {
            case 'LOAD':
                return { image: action.payload, status: 'loaded' }
            case 'CLEAR':
                return { image: undefined, status: 'loading' }
            case 'FAIL':
                return { image: undefined, status: 'failed' }
            default:
                return state
        }
    }
    const [state, dispatch] = useReducer(reducer, {
        image: undefined,
        status: 'loading',
    })

    // keep track of old props to trigger changes
    const oldUrl = React.useRef<string>()
    const oldCrossOrigin = React.useRef<string>()
    const oldReferrerPolicy = React.useRef<string>()
    if (
        oldUrl.current !== url ||
        oldCrossOrigin.current !== crossOrigin ||
        oldReferrerPolicy.current !== referrerPolicy
    ) {
        // statusRef.current = 'loading'
        // imageRef.current = undefined
        dispatch({ type: 'CLEAR' })
        oldUrl.current = url
        oldCrossOrigin.current = crossOrigin
        oldReferrerPolicy.current = referrerPolicy
    }

    useLayoutEffect(() => {
        if (!url) return
        const img = document.createElement('img')

        const onload = () => dispatch({ type: 'LOAD', payload: img })
        const onerror = () => dispatch({ type: 'FAIL' })

        img.addEventListener('load', onload)
        img.addEventListener('error', onerror)
        crossOrigin && (img.crossOrigin = crossOrigin)
        referrerPolicy && (img.referrerPolicy = referrerPolicy)
        img.src = url

        return function cleanup() {
            img.removeEventListener('load', onload)
            img.removeEventListener('error', onerror)
        }
    }, [url, crossOrigin, referrerPolicy])

    return state
}
