import { CSSProperties } from 'react'
import { PieSimpleComponentProps } from '../../../../types'

export interface HTMLEmbedCardData {
    name: string
    html: string
    sx: CSSProperties

    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
}

export interface HTMLEmbedCardProps extends PieSimpleComponentProps<HTMLEmbedCardData> {}
