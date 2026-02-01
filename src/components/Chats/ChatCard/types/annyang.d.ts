declare module 'annyang' {
    interface Annyang {
        start: (options?: { autoRestart?: boolean; continuous?: boolean }) => void
        abort: () => void
        addCallback: (type: string, callback: (...args: any[]) => void) => void
        removeCallback: (type?: string) => void
    }

    const annyang: Annyang
    export = annyang
}
