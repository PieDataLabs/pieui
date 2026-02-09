import { PieSimpleComponentProps } from "../../../../types";
import { ToastOptions } from "react-toastify";
import {CSSProperties} from "react";


export interface IOEventsCardData {
    name: string
    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
}


export interface IOEventData extends Omit<ToastOptions, 'transition' | 'style' | 'className' | 'onClick' | 'onClose' | 'onOpen'> {
    alertType: string
    message: string
    transition: 'bounce' | 'slide' | 'zoom' | 'flip'
    sx: CSSProperties
}


export interface IOEventsCardProps extends PieSimpleComponentProps<IOEventsCardData> {}
