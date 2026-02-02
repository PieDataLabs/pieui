import { registerPieComponent } from './registry'
import { isRenderingLogEnabled } from '../config/constant'

// Import all components that need registration
import SequenceCard from '../components/Containers/SequenceCard/ui/SequenceCard'
import UnionCard from '../components/Containers/UnionCard/ui/UnionCard'
import AjaxGroupCard from '../components/Containers/AjaxGroupCard/ui/AjaxGroupCard'

import AjaxButtonCard from '../components/Buttons/AjaxButtonCard/ui/AjaxButtonCard'

import ChatCard from '../components/Chats/ChatCard/ui/ChatCard'

let initialized = false

/**
 * Initialize all PieUI components by registering them in the component registry.
 * This function should be called once before using PieRoot or any dynamic components.
 *
 * @example
 * ```typescript
 * import { initializePieComponents } from 'pieui'
 *
 * // Call this once in your app initialization
 * initializePieComponents()
 * ```
 */
export function initializePieComponents(): void {
    if (initialized) {
        if (isRenderingLogEnabled()) {
            console.log('[PieUI] Components already initialized')
        }
        return
    }

    if (isRenderingLogEnabled()) {
        console.log('[PieUI] Initializing built-in components...')
    }

    // Register all built-in components
    registerPieComponent({
        name: 'SequenceCard',
        component: SequenceCard,
        metadata: {
            author: "PieData",
            description: "Simple div with styles joining few components"
        }
    })

    registerPieComponent({
        name: 'UnionCard',
        component: UnionCard,
        metadata: {
            author: "PieData",
            description: "Renders one of many components"
        }
    })

    registerPieComponent({
        name: 'AjaxGroupCard',
        component: AjaxGroupCard,
        metadata: {
            author: "PieData",
            description: "Group card with AJAX support"
        }
    })

    registerPieComponent({
        name: 'AjaxButtonCard',
        component: AjaxButtonCard,
        metadata: {
            author: "PieData",
            description: "Button with AJAX support"
        }
    })

    registerPieComponent({
        name: 'ChatCard',
        component: ChatCard,
        metadata: {
            author: "PieData",
        }
    })

    initialized = true

    if (isRenderingLogEnabled()) {
        console.log('[PieUI] Built-in components initialized successfully')
    }
}

/**
 * Check if PieUI components have been initialized
 */
export function isPieComponentsInitialized(): boolean {
    return initialized
}
