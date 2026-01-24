import '../types'

export function getProvider() {
    if (!window.ethereum) throw new Error('MetaMask not installed')

    const eth = (window as any).ethereum
    if (!eth) return null
    if (eth.providers?.length) {
        return eth.providers.find((p: any) => p.isMetaMask)
    }
    return eth
}
