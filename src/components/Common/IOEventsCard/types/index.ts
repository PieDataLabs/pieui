import { PieSimpleComponentProps } from "../../../../types";


export interface IOEventsCardData {
    name: string
    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
}


// export interface IOEventData {
//     position: ToastPosition
//     transition?: 'bounce' | 'slide' | 'zoom' | 'flip'
//     alertType: string
//     message: string
//     autoClose?: number
//     sx: CSSProperties
//
//     progress?: {
//         sx: CSSProperties
//     }
// }


export interface IOEventsCardProps extends PieSimpleComponentProps<IOEventsCardData> {}
