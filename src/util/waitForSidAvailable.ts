import '../types'

export default function waitForSidAvailable(interval = 1000) {
    return new Promise((resolve) => {
        const check = () => {
            if (typeof window.sid !== 'undefined') {
                resolve(null)
            } else {
                setTimeout(check, interval)
            }
        }
        check()
    })
}
