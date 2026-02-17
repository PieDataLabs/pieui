import {
    DetailedHTMLProps,
    FocusEventHandler,
    KeyboardEventHandler,
    TextareaHTMLAttributes,
    useRef,
    useState,
} from 'react'

export default function ResizableTextarea(
    props: DetailedHTMLProps<
        TextareaHTMLAttributes<HTMLTextAreaElement>,
        HTMLTextAreaElement
    >
) {
    const [canResize, setCanResize] = useState<boolean>(false)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            setCanResize(true)
            if (textareaRef.current && typeof window !== 'undefined') {
                const style = window.getComputedStyle(textareaRef.current)
                const lineHeight = parseFloat(style.lineHeight)
                textareaRef.current.style.height =
                    textareaRef.current.scrollHeight + lineHeight + 'px'
            }
        }
        if (e.key === 'Backspace') {
            setCanResize(true)
            if (textareaRef.current && typeof window !== 'undefined') {
                const style = window.getComputedStyle(textareaRef.current)
                const lineHeight = parseFloat(style.lineHeight)
                if (textareaRef.current.scrollHeight > lineHeight) {
                    textareaRef.current.style.height =
                        textareaRef.current.scrollHeight - lineHeight + 'px'
                }
            }
        }
        props.onKeyDown && props.onKeyDown(e)
    }

    const handleKeyUp: KeyboardEventHandler<HTMLTextAreaElement> = () => {
        setCanResize(false)
    }

    const handleBlur: FocusEventHandler<HTMLTextAreaElement> = (e) => {
        setCanResize(false)
        props.onBlur && props.onBlur(e)
    }

    return (
        <textarea
            ref={textareaRef}
            {...props}
            onKeyUp={handleKeyUp}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{
                resize: canResize ? 'vertical' : 'none',
                overflowY: 'auto',
                ...props.style,
            }}
        />
    )
}
