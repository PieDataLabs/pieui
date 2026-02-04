import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import ResizableTextarea from './ResizableTextarea'
// import annyang from 'annyang'
// import '../../types/annyang.d.ts'
import SendButton from './SendButton'
import { Option } from '../../types'
import AttachFileButton from './AttachFileButton'
import AttachedFileView from './AttachedFileView'
import VoiceListeningButton from './VoiceListeningButton'
import Options from './Options'

export interface ChatCardInputHandle {
    clear: () => void
    setValue: (newValue: string) => void
    setOptions: (newOptions: Option[]) => void
}

const ChatCardInput = forwardRef<
    ChatCardInputHandle,
    {
        name: string
        defaultOptions: Option[]
        defaultValue: string
        isArea: boolean
        placeholder: string
        fileAccept: string
        optionsPosition: 'top' | 'bottom'
        icons: Record<'voiceRecordingIcon' | 'sendIcon' | 'cancelIcon' | 'attachFileIcon', string>
        handleOptionClick: (option: string) => void
        handleSendMessage: () => void
        sx: CSSProperties
    }
>(
    (
        {
            name,
            defaultValue,
            defaultOptions,
            isArea,
            placeholder,
            fileAccept,
            optionsPosition,
            icons,
            handleOptionClick,
            handleSendMessage,
            sx,
        },
        ref,
    ) => {
        const fileInputRef = useRef<HTMLInputElement>(null!)
        const [selectedFile, setSelectedFile] = useState<File | null>(null)
        const [value, setValue] = useState<string>(defaultValue)
        const [options, setOptions] = useState<Option[]>(defaultOptions)
        const [isListening, setIsListening] = useState(false)

        useImperativeHandle(ref, () => ({
            clear: () => {
                setValue('')
                setSelectedFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            },
            setValue: (newValue: string) => setValue(newValue),
            setOptions: (newOptions: Array<Option>) => setOptions(newOptions),
        }))

        useEffect(() => {
            setValue(defaultValue)
        }, [defaultValue])

        useEffect(() => {
            // if (annyang) {
            //     annyang.addCallback('result', (phrases: string[]) => {
            //         setValue(phrases[0])
            //     })
            //     return () => {
            //         annyang.abort()
            //         annyang.removeCallback()
            //     }
            // }
        }, [])

        const toggleListening = () => {
            // if (!annyang) return
            // if (isListening) {
            //     annyang.abort()
            //     setIsListening(false)
            //     handleSendMessage()
            // } else {
            //     annyang.start({ autoRestart: true, continuous: true })
            //     setValue('')
            //     setIsListening(true)
            // }
        }

        return (
            <div
                className='flex flex-col items-center gap-[0.1rem]'
                id={name + '_chat_input'}
                style={sx}
            >
                {options && optionsPosition === 'top' && (
                    <Options options={options} handleOptionClick={handleOptionClick} />
                )}
                <div className='stretch relative flex size-full flex-1 flex-row items-stretch gap-3 last:mb-2 md:mx-4 md:flex-col md:last:mb-6 lg:mx-auto'>
                    <div className='flex w-full grow flex-row items-center rounded-md bg-transparent'>
                        {selectedFile ? (
                            <AttachedFileView
                                name={name}
                                selectedFile={selectedFile}
                                onDropFile={() => {
                                    setSelectedFile(null)
                                    if (fileInputRef.current) fileInputRef.current.value = ''
                                }}
                            />
                        ) : !isArea ? (
                            <input
                                // ref={fileInputRef as any}
                                name={name}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleSendMessage()
                                    }
                                }}
                                tabIndex={0}
                                placeholder={placeholder}
                                className='m-0 w-full resize-none border-0 bg-transparent outline-none'
                                style={{ maxHeight: 200, height: '100%', overflowY: 'hidden' }}
                            />
                        ) : (
                            <ResizableTextarea
                                // ref={fileInputRef as any}
                                name={name}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage()
                                    }
                                }}
                                tabIndex={0}
                                rows={2}
                                placeholder={placeholder}
                                className='m-0 w-full resize-none border-0 bg-transparent p-0 pl-2 pr-7 outline-none md:pl-0'
                                style={{ maxHeight: 200, height: '100%', minHeight: 24 }}
                            />
                        )}

                        <VoiceListeningButton
                            isListening={isListening}
                            toggleListening={toggleListening}
                            icons={icons}
                        />
                        <AttachFileButton
                            name={name}
                            fileInputRef={fileInputRef}
                            accept={fileAccept}
                            onSelectFile={setSelectedFile}
                            icons={icons}
                        />
                        <SendButton onClick={handleSendMessage} icons={icons} />
                    </div>
                </div>
                {options && optionsPosition === 'bottom' && (
                    <Options options={options} handleOptionClick={handleOptionClick} />
                )}
            </div>
        )
    },
)

export default ChatCardInput
