import { ComponentMetadata, ComponentRegistration, PieComponentProps } from '../types'
import { trackLazy } from './lazy'
import { ComponentType } from 'react'
import { isRenderingLogEnabled } from '../config/constant'


const registry = new Map<string, ComponentRegistration<any>>()


const normalizeRegistration = <TProps,>(
    registration: ComponentRegistration<TProps>
): ComponentRegistration<TProps> => {
    if (!registration.name) {
        throw new Error('Component registration requires a name')
    }

    if (!registration.component && !registration.loader) {
        throw new Error(`Component "${registration.name}" requires component or loader`)
    }

    const entry: ComponentRegistration<TProps> = {
        name: registration.name,
        component: registration.component,
        loader: registration.loader,
        metadata: registration.metadata,
        fallback: registration.fallback,
        isLazy: false,
    }

    if (!entry.component && entry.loader) {
        entry.component = trackLazy(
            entry.loader,
            registration.name
        ) as ComponentType<TProps>
        entry.loader = undefined
        entry.isLazy = true
    }

    return entry
}


export function registerPieComponent<TProps>(
    registration: ComponentRegistration<TProps>
): ComponentType<TProps> | undefined {
    const entry = normalizeRegistration(registration)

    if (isRenderingLogEnabled()) {
        console.log('[Registry] Registering component:', entry.name, {
            isLazy: entry.isLazy,
            hasMetadata: !!entry.metadata,
            hasFallback: !!entry.fallback
        })
    }

    registry.set(entry.name, entry)
    return entry.component
}


export const registerMultipleComponents = (
    components: ComponentRegistration<any>[]
) => {
    components.forEach((component) => registerPieComponent(component))
}

export const unregisterComponent = (name: string) => {
    registry.delete(name)
}

export const hasComponent = (name: string) => {
    return registry.has(name)
}

export const getComponentMeta = (name: string): ComponentMetadata | undefined => {
    return registry.get(name)?.metadata
}


export const getRegistryEntry = (
    name: string
): ComponentRegistration<any> | undefined => {
    const entry = registry.get(name)

    if (isRenderingLogEnabled()) {
        if (entry) {
            console.log('[Registry] Found component:', name)
        } else {
            console.warn('[Registry] Component not found:', name)
            console.log('[Registry] Available components:', Array.from(registry.keys()))
        }
    }

    return entry
}

export const getAllRegisteredComponents = (): string[] => {
    return Array.from(registry.keys())
}

export const getRegistrySize = (): number => {
    return registry.size
}
