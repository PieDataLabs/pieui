// Implementation of https://core.telegram.org/bots/webapps#initializing-web-apps as react hook

import { useEffect } from 'react'
import { getPageProcessor } from '../config/constant'
import {InitData, InitDataUnsafe} from "../types";


export const useWebApp = () => {
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.Telegram.WebApp.ready()
        if (
            getPageProcessor() === 'telegram_expanded' &&
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

export const useInitData = (): readonly [InitDataUnsafe | undefined, InitData | undefined] => {
    const WebApp = useWebApp()

    return [WebApp?.initDataUnsafe, WebApp?.initData] as const
}
