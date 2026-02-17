import { ButtonHTMLAttributes, CSSProperties, DetailedHTMLProps } from 'react'
import { PieComplexComponentProps, UIConfigType } from '../../../../types'

export interface Option {
    title: string

    iconUrl: string
    iconPosition: 'start' | 'end'
    sx: CSSProperties
}

export interface Message {
    id: string
    username: string
    avatar: string | null
    content: string | UIConfigType
    options: Option[]
    parseMode: 'HTML' | 'Markdown' | 'Pie' | 'Text'
    align: 'left' | 'center' | 'right'
}

export type ChatIconsType = Record<
    'voiceRecordingIcon' | 'sendIcon' | 'cancelIcon' | 'attachFileIcon',
    string
>

export interface ChatButtonProps extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
> {
    icons: ChatIconsType
}

export interface ChatCardData {
    name: string

    defaultValue: string
    defaultMessages: Message[]
    defaultOptions: Option[]

    isArea: boolean
    placeholder: string
    fileAccept: string

    icons: ChatIconsType
    optionsPosition: 'top' | 'bottom'
    sxMap: Record<'container' | 'chatInput' | 'messages', CSSProperties>

    pathname?: string
    depsNames?: string[]
    kwargs?: Record<string, string>

    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
}

export interface ChatCardProps extends PieComplexComponentProps<ChatCardData> {}
