import AttachedFileIcon from './icons/AttachedFileIcon'
import CancelFileIcon from './icons/CancelFileIcon'

const AttachedFileView = ({
    name,
    selectedFile,
    onDropFile,
}: {
    name: string
    selectedFile: File
    onDropFile: () => void
}) => {
    return (
        <div className='flex w-full cursor-default flex-row items-center gap-2'>
            <AttachedFileIcon />
            <span className='flex-1'>{selectedFile.name}</span>
            <input type='hidden' name={name} value='' />
            <button
                className='rounded-md p-1 text-gray-500 ring-0 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent'
                type='button'
                onClick={onDropFile}
            >
                <CancelFileIcon />
            </button>
        </div>
    )
}

export default AttachedFileView
