// import { Bounce, Slide, Zoom, Flip, toast, ToastOptions } from 'react-toastify'
// import { ToastContainer } from 'react-toastify'
// import 'react-toastify/dist/ReactToastify.css'
// import addNotification from 'react-push-notification'
import PieCard from '../../../PieCard'
import { IOEventsCardProps } from '../types'
import {useContext} from "react";
import NavigateContext from "../../../../util/navigate.ts";


// import { useNavigate } from 'react-router-dom'
//
// const createTransition = (name?: string) => {
//     if (name === 'bounce') {
//         return Bounce
//     } else if (name === 'slide') {
//         return Slide
//     } else if (name === 'zoom') {
//         return Zoom
//     } else if (name === 'flip') {
//         return Flip
//     }
// }

const IOEventsCard = ({ data }: IOEventsCardProps) => {
    const { useCentrifugeSupport, useSocketioSupport, useMittSupport, centrifugeChannel } = data
    const navigate = useContext(NavigateContext)

    //
    // const onPieAlertEvent = (event: IOEventData) => {
    //     const options: ToastOptions = {
    //         style: {
    //             backgroundColor: 'black',
    //             ...event.sx,
    //         },
    //         transition: createTransition(event.transition),
    //         position: event.position ?? 'bottom-right',
    //         autoClose: event.autoClose ?? 5000,
    //         hideProgressBar: false,
    //         closeOnClick: true,
    //         rtl: false,
    //         pauseOnFocusLoss: true,
    //         draggable: true,
    //         pauseOnHover: true,
    //         theme: 'dark',
    //         progressStyle: {
    //             ...event.progress?.sx,
    //         },
    //     }
    //     if (event.alertType === 'success') {
    //         toast.success(event.message, options)
    //     } else if (event.alertType === 'warning') {
    //         toast.warning(event.message, options)
    //     } else if (event.alertType === 'error') {
    //         toast.error(event.message, options)
    //     } else if (event.alertType === 'info') {
    //         toast.info(event.message, options)
    //     } else {
    //         toast(event.message, options)
    //     }
    // }

    const onLogEvent = (event: any) => {
        console.log('Log event', event)
    }

    const onRedirectEvent = (event: any) => {
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
                    // alert: onPieAlertEvent,
                    log: onLogEvent,
                    redirect: onRedirectEvent,
                    // push: onPushNotificationEvent,
                }}
            >
                <></>
            </PieCard>
        </>
    )
}

export default IOEventsCard
