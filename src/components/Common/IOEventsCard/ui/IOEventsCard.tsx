import { Bounce, Slide, Zoom, Flip } from 'react-toastify'
import { toast, ToastContainer, ToastOptions } from 'react-toastify'
// import 'react-toastify/dist/ReactToastify.css'
// import addNotification from 'react-push-notification'
import PieCard from '../../../PieCard'
import { IOEventData, IOEventsCardProps } from '../types'
import { useContext } from 'react'
import NavigateContext from '../../../../util/navigate.ts'
import { ShowPopupOptions } from '@telegram-apps/sdk'

const createTransition = (name?: string) => {
    if (name === 'bounce') {
        return Bounce
    } else if (name === 'slide') {
        return Slide
    } else if (name === 'zoom') {
        return Zoom
    } else if (name === 'flip') {
        return Flip
    }
}

const IOEventsCard = ({ data }: IOEventsCardProps) => {
    const {
        useCentrifugeSupport,
        useSocketioSupport,
        useMittSupport,
        centrifugeChannel,
    } = data
    const navigate = useContext(NavigateContext)

    const onShowTelegramPopupEvent = (event: ShowPopupOptions) => {
        window.Telegram.WebApp.showPopup(event)
    }

    const onToastEvent = (event: IOEventData) => {
        const options: ToastOptions = {
            ...event,
            transition: createTransition(event.transition),
            position: event.position ?? 'bottom-right',
            autoClose: event.autoClose ?? 5000,
            style: {
                backgroundColor: 'black',
                ...event.sx,
            },
        }

        toast(event.message, options)
    }

    const onLogEvent = (event: string) => {
        console.log('Log event', event)
    }

    const onRedirectEvent = (event: { to: string }) => {
        if (event.to) {
            const url = event.to

            const isExternal = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)
            if (isExternal) {
                window.location.href = url
            } else {
                navigate?.(url)
            }
        } else {
            window.location.reload()
        }
    }

    //
    // const onPushNotificationEvent = (event: any) => {
    //     console.log('Push notification event', event)
    //     addNotification({
    //         title: event.title,
    //         subtitle: event.subtitle,
    //         message: event.message,
    //         icon: event.icon,
    //         vibrate: event.vibrate,
    //         silent: event.silent,
    //         duration: event.duration,
    //         theme: event.theme,
    //         native: true,
    //     })
    // }

    return (
        <>
            <PieCard
                card={'IOEventsCard'}
                data={data}
                useCentrifugeSupport={useCentrifugeSupport}
                useSocketioSupport={useSocketioSupport}
                useMittSupport={useMittSupport}
                centrifugeChannel={centrifugeChannel}
                methods={{
                    toast: onToastEvent,
                    showTelegramPopup: onShowTelegramPopupEvent,
                    log: onLogEvent,
                    redirect: onRedirectEvent,
                    // push: onPushNotificationEvent,
                }}
            >
                <ToastContainer />
            </PieCard>
        </>
    )
}

export default IOEventsCard
