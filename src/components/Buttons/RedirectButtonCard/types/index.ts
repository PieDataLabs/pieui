import { CSSProperties } from 'react'
import {PieSimpleComponentProps} from "../../../../types";

export interface RedirectButtonCardData {
    name: string
    title: string
    url?: string
    iconUrl?: string
    iconPosition?: 'start' | 'end'
    sx?: CSSProperties
}


export interface RedirectButtonCardProps extends PieSimpleComponentProps<RedirectButtonCardData> {}
