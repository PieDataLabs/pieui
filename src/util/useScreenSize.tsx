import { useState, useEffect } from 'react'

const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState({
        width: 0,
        height: 0,
    })

    useEffect(() => {
        const updateSize = () => {
            setScreenSize({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        updateSize() // установить размер сразу при монтировании
        window.addEventListener('resize', updateSize)

        return () => {
            window.removeEventListener('resize', updateSize)
        }
    }, [])

    return screenSize
}

export default useScreenSize
