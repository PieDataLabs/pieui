import { UIConfigType, SetUiAjaxConfigurationType } from '../../types'
import { getRegistryEntry } from "../../util/registry.ts";
import {Suspense, useContext, Component, ReactNode} from "react";
import FallbackContext from "../../util/fallback.ts";


function UI({
    uiConfig,
    setUiAjaxConfiguration,
}: {
    uiConfig: UIConfigType
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
}) {
    const Fallback: ReactNode = useContext(FallbackContext)

    const entry = getRegistryEntry(uiConfig.card)
    if (!entry?.component) {
        return Fallback
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
        return (
            <Suspense key={`${entry.name}`} fallback={entry.fallback ?? Fallback}>
                {node}
            </Suspense>
        )
    }

    return node
}

export default UI
