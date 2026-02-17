import { Option } from '../../types'

const ChatOption = ({
    option,
    onClickOption,
}: {
    option: Option
    onClickOption: (title: string) => void
}) => {
    return (
        <div
            className="flex w-fit cursor-pointer flex-row place-content-center items-center gap-1 rounded-md border border-black bg-white px-2 py-1 text-black"
            onClick={() => {
                onClickOption(option.title)
            }}
            style={option.sx}
        >
            {option.iconPosition === 'start' && (
                <img src={option.iconUrl} alt=""></img>
            )}
            {option.title}
            {option.iconPosition === 'end' && (
                <img src={option.iconUrl} alt=""></img>
            )}
        </div>
    )
}

export default ChatOption
