// Implementation of https://core.telegram.org/bots/webapps#initializing-web-apps as react hook

import { useEffect } from 'react'
import { PAGE_PROCESSOR } from '../config/constant'

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
    MainButton: MainButtonType
    BackButton: BackButtonType
    initDataUnsafe: WebAppInitData
    initData: string
    close: () => void
    openLink: (link: string, option: string) => void
    platform: 'ios' | 'android' | 'web'
    expand: () => void
}

export type Telegram = {
    WebApp: WebApp
}

export const useWebApp = () => {
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.Telegram.WebApp.ready()
        if (
            PAGE_PROCESSOR === 'telegram_expanded' &&
            (window.Telegram.WebApp.platform === 'ios' ||
                window.Telegram.WebApp.platform === 'android')
        ) {
            window.Telegram.WebApp.expand()
        }
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return window.Telegram.WebApp as WebApp
}

export type InitDataUnsafe = {
    user?: WebAppUser
}

export type InitData = string

export const useInitData = (): readonly [InitDataUnsafe | undefined, InitData | undefined] => {
    const WebApp = useWebApp()

    return [WebApp?.initDataUnsafe, WebApp?.initData] as const
}
