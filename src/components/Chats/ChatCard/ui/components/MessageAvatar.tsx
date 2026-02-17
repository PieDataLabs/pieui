import DefaultAvatar from './icons/DefaultAvatar'

function MessageAvatar({
    username,
    avatar,
}: {
    username: string
    avatar: string | null
}) {
    return (
        <div className="w-[30px]">
            <div className="relative flex size-[30px] items-center justify-center rounded-sm p-1 text-white">
                {avatar ? (
                    <img
                        src={avatar}
                        className="absolute inset-0 rounded"
                        alt={username}
                    />
                ) : (
                    <DefaultAvatar />
                )}
            </div>
        </div>
    )
}

export default MessageAvatar
