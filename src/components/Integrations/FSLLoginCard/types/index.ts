import { CSSProperties } from 'react'
import { PieSimpleComponentProps } from '../../../../types'

export interface FSLLoginCardData {
    name: string

    title: string
    errorMessage?: string

    appKey: string
    redirectUri: string
    state: string
    isApp: boolean
    usePopup: boolean

    iconUrl?: string
    iconPosition?: 'start' | 'end'
    sx?: CSSProperties
}

export interface FSLLoginCardProps extends PieSimpleComponentProps<FSLLoginCardData> {}
