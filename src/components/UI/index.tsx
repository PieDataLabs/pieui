import { UIConfigType, SetUiAjaxConfigurationType } from '../../types'
import { getRegistryEntry } from "../../util/registry.ts";
import {Suspense, useContext, ReactNode} from "react";
import FallbackContext from "../../util/fallback";
import { ENABLE_RENDERING_LOG } from '../../config/constant';


function UI({
    uiConfig,
    setUiAjaxConfiguration,
}: {
    uiConfig: UIConfigType
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}) {
    const Fallback: ReactNode = useContext(FallbackContext)

    if (ENABLE_RENDERING_LOG) {
        console.log('[UI] Rendering component:', uiConfig.card)
        console.log('[UI] Component data:', uiConfig.data)
        console.log('[UI] Component content:', uiConfig.content)
        console.log('[UI] Has setUiAjaxConfiguration:', !!setUiAjaxConfiguration)
    }

    const entry = getRegistryEntry(uiConfig.card)
    if (!entry?.component) {
        if (ENABLE_RENDERING_LOG) {
            console.warn(`[UI] Component not found in registry: ${uiConfig.card}`)
            console.log('[UI] Returning fallback component')
        }
        return Fallback
    }

    if (ENABLE_RENDERING_LOG) {
        console.log('[UI] Found component in registry:', {
            name: entry.name,
            isLazy: entry.isLazy,
            hasMetadata: !!entry.metadata
        })
    }

    const Component = entry.component

    const node = (
        <Component
            data={uiConfig.data}
            content={uiConfig.content}
            setUiAjaxConfiguration={setUiAjaxConfiguration}
        />
    )

    if (entry.isLazy) {
        if (ENABLE_RENDERING_LOG) {
            console.log('[UI] Rendering lazy component with Suspense:', entry.name)
        }
        return (
            <Suspense key={`${entry.name}`} fallback={entry.fallback ?? Fallback}>
                {node}
            </Suspense>
        )
    }

    if (ENABLE_RENDERING_LOG) {
        console.log('[UI] Rendering component directly:', entry.name)
    }

    return node
}

export default UI
