import { Option } from '../../types'
import ChatOption from './ChatOption'

const Options = ({
    options,
    handleOptionClick,
}: {
    options: Option[]
    handleOptionClick: (option: string) => void
}) => {
    return (
        <div className='flex w-full flex-row flex-wrap justify-start gap-[5px]'>
            {options.map((option: Option, idx: number) => {
                return <ChatOption key={idx} option={option} onClickOption={handleOptionClick} />
            })}
        </div>
    )
}

export default Options
