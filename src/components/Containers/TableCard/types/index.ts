import { CSSProperties } from 'react'
import { PieComplexComponentProps, UIConfigType } from '../../../../types'

export interface TableCardDataType {
    name: string
    headers: (string | UIConfigType)[][]
    rows: (string | UIConfigType)[][]
    rowUrls: (string | null)[]

    useSocketioSupport: boolean
    useCentrifugeSupport: boolean
    useMittSupport: boolean
    centrifugeChannel?: string

    columns: string[]
    content: { [key: string]: any }
    sx?: CSSProperties
    sxMap: Record<'row' | 'cell' | 'table', any>
}

export interface TableCardProps extends PieComplexComponentProps<TableCardDataType> {}
