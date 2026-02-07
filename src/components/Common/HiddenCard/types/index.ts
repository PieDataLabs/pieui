import {PieSimpleComponentProps} from "../../../../types";

export interface HiddenCardData {
    name: string
    value: string

    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
}


export interface HiddenCardProps extends PieSimpleComponentProps<HiddenCardData> {}

