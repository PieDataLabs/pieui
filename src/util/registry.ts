import {ComponentMetadata, ComponentRegistration} from "../types";
import {trackLazy} from "./lazy.ts";


const registry = new Map<string, ComponentRegistration>()


const normalizeRegistration = (registration: ComponentRegistration): ComponentRegistration => {
    if (!registration.name) {
        throw new Error('Component registration requires a name')
    }

    if (!registration.component && !registration.loader) {
        throw new Error(`Component "${registration.name}" requires component or loader`)
    }

    const entry: ComponentRegistration = {
        name: registration.name,
        component: registration.component,
        loader: registration.loader,
        metadata: registration.metadata,
        isLazy: false,
    }

    if (!entry.component && entry.loader) {
        entry.component = trackLazy(entry.loader, registration.name)
        entry.loader = undefined
        entry.isLazy = true
    }

    return entry
}

export function registerPieComponent(registration: ComponentRegistration): void {
    registry.set(registration.name, normalizeRegistration(registration))
}

export const registerMultipleComponents = (components: ComponentRegistration[]) => {
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

export const getRegistryEntry = (name: string): ComponentRegistration | undefined => {
    return registry.get(name)
}
