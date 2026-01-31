import { CSSProperties } from 'react'
import {PieContainerComponentProps} from "../../../../types";

export interface AjaxButtonCardData {
    name: string
    title: string

    pathname?: string
    depsNames?: string[]
    kwargs?: Record<string, string>

    iconUrl?: string
    iconPosition?: 'start' | 'end'
    sx?: CSSProperties
}

export interface AjaxButtonCardProps extends PieContainerComponentProps<AjaxButtonCardData> {}
