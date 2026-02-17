export default function waitForSidAvailable(interval = 1000) {
    return new Promise<void>((resolve) => {
        if (typeof window === 'undefined') {
            // На сервере просто резолвим сразу или кидаем ошибку
            resolve()
            return
        }

        const check = () => {
            if (typeof window.sid !== 'undefined') {
                resolve()
            } else {
                setTimeout(check, interval)
            }
        }

        check()
    })
}
