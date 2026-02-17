import MessageCard from './MessageCard'
import {
    CSSProperties,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { Message } from '../../types'
import { SetUiAjaxConfigurationType } from '../../../../../types'

export interface MessagesBoardHandle {
    addMessage: (message: Message) => void
    setMessages: (messages: Array<Message>) => void
    scrollToBottom: () => void
}

const MessagesBoard = forwardRef<
    MessagesBoardHandle,
    {
        name: string
        handleOptionClick: (option: string) => void
        defaultMessages: Message[]
        sx: CSSProperties
        setUiAjaxConfiguration?: SetUiAjaxConfigurationType
    }
>(
    (
        {
            name,
            handleOptionClick,
            defaultMessages,
            sx,
            setUiAjaxConfiguration,
        },
        ref
    ) => {
        const [messages, setMessages] = useState<Message[]>(defaultMessages)
        const containerRef = useRef<HTMLDivElement>(null)

        const scrollToBottom = () => {
            if (containerRef.current) {
                containerRef.current.scrollTop =
                    containerRef.current.scrollHeight
            }
        }

        useEffect(() => {
            scrollToBottom()
        }, [messages])

        useImperativeHandle(ref, () => ({
            setMessages: (currentMessages: Array<Message>) =>
                setMessages(currentMessages),
            addMessage: (message: Message) =>
                setMessages((currentMessages) => [...currentMessages, message]),
            scrollToBottom: scrollToBottom,
        }))

        return (
            <div
                id={name + '_messages'}
                className="flex flex-col items-center overflow-y-scroll"
                style={sx}
                ref={containerRef}
            >
                {messages.map((message) => (
                    <MessageCard
                        key={message.id}
                        message={message}
                        handleOptionClick={handleOptionClick}
                        setUiAjaxConfiguration={setUiAjaxConfiguration}
                    />
                ))}
            </div>
        )
    }
)

export default MessagesBoard
