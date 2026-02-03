import { useEffect } from 'react'

export function useTitle(title: string) {
    useEffect(() => {
        // Skip if running on server or title is not provided
        if (typeof document === 'undefined' || title === null || title === undefined) {
            return
        }

        const prevTitle = document.title
        document.title = title
        return () => {
            document.title = prevTitle
        }
    }, [title])
}
