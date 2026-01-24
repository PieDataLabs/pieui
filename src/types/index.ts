import { providers } from 'ethers5'
import { Telegram } from '../util/useWebApp.ts'

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
        ethereum?: providers.ExternalProvider
        Telegram: Telegram
    }
}
