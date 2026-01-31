import { lazy, ComponentType, LazyExoticComponent } from 'react'

const moduleCache = new Map<string, any>()

export function trackLazy<T extends ComponentType<any>>(
    loader: () => Promise<{ default: T }>,
    name: string,
): LazyExoticComponent<T> {
    return lazy(() => {
        if (moduleCache.has(name)) {
            return moduleCache.get(name)!
        }
        const promise = loader().then((mod) => mod)
        moduleCache.set(name, promise)
        return promise
    })
}

export const preloadComponent = async (name: string, loader?: () => Promise<any>) => {
    if (!loader) return
    if (moduleCache.has(name)) return moduleCache.get(name)
    const promise = loader().then((mod) => mod)
    moduleCache.set(name, promise)
    return promise
}
