import { CSSProperties } from 'react'
import Radium from 'radium'

export function sx2radium(
    sx: Record<string, any> | CSSProperties | undefined
): CSSProperties {
    if (!sx) {
        return {}
    }

    const copy = { ...sx }
    if ('animationName' in copy && typeof copy.animationName === 'object') {
        const uniqueAnimationName =
            'radiumAnimation_' + Math.random().toString(36).substring(2, 8)
        copy.animationName = Radium.keyframes(
            copy.animationName,
            uniqueAnimationName
        )
    }
    return copy
}
