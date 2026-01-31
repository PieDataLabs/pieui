import {Component, ComponentType, ReactNode} from "react";

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
    }
}


export interface ComponentMetadata {
    author?: string
    version?: string
    description?: string
    tags?: string[]
}


export interface PieComponentProps {
    data: any
    content?: UIConfigType | Array<UIConfigType>
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}

export interface ComponentRegistration {
    name: string
    component?: ComponentType<PieComponentProps>
    fallback?: ReactNode
    loader?: () => Promise<{ default: ComponentType<PieComponentProps> }>
    metadata?: ComponentMetadata
    isLazy?: boolean
}
