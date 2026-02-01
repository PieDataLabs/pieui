import { RefObject } from 'react'
import AttachFileIcon from './icons/AttachFileIcon'
import { ChatIconsType } from '../../types'
import { PIEBREAK } from '../../../../../config/constant'

const AttachFileButton = ({
    name,
    accept,
    fileInputRef,
    onSelectFile,
    icons,
}: {
    name: string
    accept: string
    fileInputRef: RefObject<HTMLInputElement>
    onSelectFile: (file: File) => void
    icons: ChatIconsType
}) => {
    return (
        <button
            className='rounded-md p-1 text-gray-500 ring-0 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent'
            type='button'
            onClick={() => {
                if (fileInputRef.current) {
                    fileInputRef.current.click()
                }
            }}
        >
            <input
                name={name + PIEBREAK + 'file'}
                className='hidden'
                type='file'
                accept={accept}
                ref={fileInputRef}
                onChange={(e) => {
                    if (e.target.files) {
                        onSelectFile(e.target.files[0])
                    }
                }}
            />
            {icons.attachFileIcon ? <img src={icons.attachFileIcon} alt='' /> : <AttachFileIcon />}
        </button>
    )
}

export default AttachFileButton
