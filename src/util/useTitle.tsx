import { useEffect } from 'react'

export function useTitle(title: string) {
    useEffect(() => {
        if (title !== null && title !== undefined) {
            const prevTitle = document.title
            document.title = title
            return () => {
                document.title = prevTitle
            }
        }
    })
}
