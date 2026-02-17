import clsx from 'clsx'

const MessageContent = ({
    name,
    content,
    isSent,
}: {
    name: string
    content: string
    isSent: boolean
}) => {
    return (
        <div className="px-6 py-4">
            <div
                className={clsx(
                    'text-xl font-medium text-black',
                    isSent ? 'text-right' : 'text-left'
                )}
            >
                {isSent ? 'You' : name}
            </div>
            <p className="text-gray-500">{content}</p>
        </div>
    )
}

export default MessageContent
