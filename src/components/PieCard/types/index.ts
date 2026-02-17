import { ReactNode } from 'react'

export interface PieCardData {
    name: string
    [key: string]: any
}

export interface PieCardProps {
    card: string
    data: PieCardData
    children: ReactNode
    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
    methods?: Record<string, (data: any) => void>
}
