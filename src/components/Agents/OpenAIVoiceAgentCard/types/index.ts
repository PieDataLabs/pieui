import { CSSProperties } from 'react'
import { PieComplexComponentProps } from '../../../../types'

export interface VoiceAgentTool {
    name: string
    description: string

    params: any

    pathname: string
    depsNames: Array<string>
    kwargs: Record<string, any>
}

export interface OpenAIVoiceAgentCardData {
    name: string
    titles: Record<'enabled' | 'disabled', string>

    instructions: string
    tools: Array<VoiceAgentTool>
    token: string | null
    autoStart: boolean

    language: string | null
    muted: boolean
    outputModalities?: ('text' | 'audio')[]

    iconUrl?: string
    iconPosition?: 'start' | 'end'
    sxMap: Record<'enabled' | 'disabled', CSSProperties>

    useSocketioSupport?: boolean
    useCentrifugeSupport?: boolean
    useMittSupport?: boolean
    centrifugeChannel?: string
}

export interface OpenAIVoiceAgentCardProps extends PieComplexComponentProps<OpenAIVoiceAgentCardData> {}
