import CancelFileIcon from './icons/CancelFileIcon'
import VoiceRecordIcon from './icons/VoiceRecordIcon'
import { ChatIconsType } from '../../types'

const VoiceListeningButton = ({
    isListening,
    toggleListening,
    icons,
}: {
    toggleListening: () => void
    isListening: boolean
    icons: ChatIconsType
}) => {
    return (
        <button
            className='rounded-md p-1 text-gray-500 ring-0 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent'
            type='button'
            onClick={toggleListening}
        >
            {isListening ? (
                icons.cancelIcon ? (
                    <img src={icons.cancelIcon} alt='' />
                ) : (
                    <CancelFileIcon />
                )
            ) : icons.voiceRecordingIcon ? (
                <img src={icons.voiceRecordingIcon} alt='' />
            ) : (
                <VoiceRecordIcon />
            )}
        </button>
    )
}

export default VoiceListeningButton
