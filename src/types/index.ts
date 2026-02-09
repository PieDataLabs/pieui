import {ComponentType, ReactNode} from "react";
import {ShowPopupOptions} from "@telegram-apps/sdk";

export type WebAppUser = {
    id: string
    username: string
    photo_url: string
}

export type MainButtonType = {
    show: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    setText: (text: string) => void
    hide: () => void
}

export type BackButtonType = {
    show: () => void
    onClick: (callback: () => void) => void
    hide: () => void
}

export type WebAppInitData = {
    user: WebAppUser
    start_param?: string
    chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel'
    chat_instance?: string
    auth_date: number
    hash: string
}

export type WebApp = {
    sendData: (data: string) => void
    showAlert: (message: string) => void
    showPopup: (options: ShowPopupOptions) => void
    MainButton: MainButtonType
    BackButton: BackButtonType
    initDataUnsafe: WebAppInitData
    initData: string
    ready: () => void
    close: () => void
    openLink: (link: string, option: string) => void
    platform: 'ios' | 'android' | 'web'
    expand: () => void
}

export type Telegram = {
    WebApp: WebApp
}

export type InitDataUnsafe = {
    user?: WebAppUser
}

export type InitData = string


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


export interface PieConfig {
    apiServer: string
    centrifugeServer?: string
    enableRenderingLog?: boolean
    pageProcessor?: string
}
