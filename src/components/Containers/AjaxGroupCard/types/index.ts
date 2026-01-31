import {PieContainerComponentProps} from "../../../../types";


export interface AjaxGroupCardData {
    name: string
    noReturn: boolean
    returnType: 'content' | 'events'
    useLoader: boolean

    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
}


export interface AjaxGroupCardProps extends PieContainerComponentProps<AjaxGroupCardData> {}
