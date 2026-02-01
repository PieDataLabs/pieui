import {ComponentType, ReactNode} from "react";
import { Telegram } from "../util/useWebApp.ts";

export interface UIConfigType {
    card: string
    data: any
    content: UIConfigType | Array<UIConfigType>
}

export interface UIEventType {
    name: string
    data: Record<any, any>
}

export type SetUiAjaxConfigurationType =
    | ((content: UIConfigType | null) => void)
    | ((events: Array<UIEventType> | null) => void)

export interface PieEvent {
    cardName: string
    name: string
    eventName: string
    data: any
}

export type PieEventEmitter = (event: PieEvent) => void

declare global {
    interface Window {
        sid: string
        Telegram: Telegram
    }
}


export interface ComponentMetadata {
    author?: string
    version?: string
    description?: string
    tags?: string[]
}


export interface PieComplexContainerComponentProps<TData = unknown> {
    data: TData
    content: Array<UIConfigType>
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}

export interface PieContainerComponentProps<TData = unknown> {
    data: TData
    content: UIConfigType
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}

export interface PieComplexComponentProps<TData = unknown> {
    data: TData
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}

export interface PieSimpleComponentProps<TData = unknown> {
    data: TData
}

export type PieComponentProps<TData = unknown> =
    | PieSimpleComponentProps<TData>
    | PieContainerComponentProps<TData>
    | PieComplexContainerComponentProps<TData>


export interface ComponentRegistration<TProps> {
    name: string
    component?: ComponentType<TProps>
    fallback?: ReactNode
    loader?: () => Promise<{ default: ComponentType<TProps> }>
    metadata?: ComponentMetadata
    isLazy?: boolean
}
