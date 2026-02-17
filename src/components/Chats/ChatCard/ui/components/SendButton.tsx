import { useRef, useCallback, MouseEventHandler } from 'react'
import SendIcon from './icons/SendIcon'
import { ChatButtonProps } from '../../types'

const SendButton = ({ type = 'button', onClick, icons }: ChatButtonProps) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null)

    const animateSendButton = useCallback(() => {
        const btn = buttonRef.current
        if (btn) {
            btn.style.transform = 'scale(0.8)'
            setTimeout(() => {
                btn.style.transform = 'scale(1)'
            }, 600)
        }
    }, [])

    const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
        if (onClick) onClick(e)
        animateSendButton()
    }

    return (
        <button
            ref={buttonRef}
            type={type}
            onClick={handleClick}
            className="mr-1.5 rounded-md p-1 text-gray-500 ring-0 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
            style={{ transition: 'transform 300ms ease' }}
        >
            {icons.sendIcon ? (
                <img src={icons.sendIcon} alt="" />
            ) : (
                <SendIcon />
            )}
        </button>
    )
}

export default SendButton
