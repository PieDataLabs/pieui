'use client'

import { useEffect, useMemo, type ReactNode } from 'react'

import PieRoot from '../PieRoot'
import { getEmitter } from '../../util/mitt'
import type { PieConfig } from '../../types'

/**
 * Props for {@link PiePreviewRoot}.
 */
export interface PiePreviewRootProps {
    /**
     * Base URL of the PieUI backend (must end with `/`). Defaults to
     * `process.env.PIE_API_SERVER`. When used with `pie card show` /
     * `pieui card show`, the dev server is launched with this pointed at the
     * ephemeral preview backend.
     */
    apiServer?: string
    /** Route fetched from the backend. The preview backend serves at `/`. */
    pathname?: string
    /** Query string for the fetch / react-query key. */
    search?: string
    /** Optional Centrifuge URL (preview works without real-time). */
    centrifugeServer?: string
    /**
     * Bridge the show backend's SSE event stream (`{apiServer}api/preview/events`)
     * onto the Mitt bus, so `render_card` siblings like the show-mcp `emit_event`
     * tool can drive a card's realtime method handlers (addMessage, setOptions,
     * clear, …) live — no Centrifuge/Socket.IO server needed. Requires the card
     * rendered with `useMittSupport`. Defaults to off.
     */
    previewEvents?: boolean
    /** Node shown while the card config loads or on fetch error. */
    fallback?: ReactNode
    /** Enable PieUI's verbose `[PieRoot]` console logging. */
    enableRenderingLog?: boolean
}

const DEFAULT_FALLBACK = (
    <div
        style={{
            padding: 16,
            fontFamily: 'system-ui, sans-serif',
            color: '#888',
        }}
    >
        Loading card…
    </div>
)

/**
 * Ungated, host-chrome-free root for previewing a single card.
 *
 * Wraps {@link PieRoot} (the plain web root — `pageProcessor: "web"`, no
 * Telegram/MAX host integration) with preview-friendly defaults: it fetches
 * the card config from `{apiServer}api/content{pathname}` and renders it with
 * none of an application's auth/lock/boot providers. Drop it into a dedicated
 * route (e.g. `app/__pieshow__/page.tsx`) — after importing the app's card
 * registry — so `pie card show` / `pieui card show` can render an arbitrary
 * card without the app's gating screens taking over.
 */
const PiePreviewRoot = ({
    apiServer,
    pathname = '/',
    search = '',
    centrifugeServer,
    previewEvents = false,
    fallback,
    enableRenderingLog = false,
}: PiePreviewRootProps) => {
    const resolvedApiServer =
        apiServer ??
        (typeof process !== 'undefined'
            ? process.env.PIE_API_SERVER
            : undefined) ??
        ''

    // Bridge the show backend's SSE events onto the same Mitt emitter PieRoot
    // provides (getEmitter singleton), so events published via the show-mcp
    // `emit_event` tool / `POST /api/preview/emit` reach the card's Mitt method
    // handlers. Reconnects automatically (EventSource) if the backend blips.
    useEffect(() => {
        if (
            !previewEvents ||
            !resolvedApiServer ||
            typeof window === 'undefined' ||
            typeof EventSource === 'undefined'
        ) {
            return
        }
        const base = resolvedApiServer.endsWith('/')
            ? resolvedApiServer
            : `${resolvedApiServer}/`
        const source = new EventSource(`${base}api/preview/events`)
        const emitter = getEmitter()
        source.onmessage = (event: MessageEvent) => {
            try {
                const parsed = JSON.parse(event.data)
                if (parsed && typeof parsed.name === 'string') {
                    emitter.emit(parsed.name, parsed.payload)
                }
            } catch {
                // Ignore keepalive comments / malformed frames.
            }
        }
        return () => source.close()
    }, [previewEvents, resolvedApiServer])

    const config: PieConfig = useMemo(
        () => ({
            apiServer: resolvedApiServer,
            centrifugeServer,
            enableRenderingLog,
            pageProcessor: 'web',
        }),
        [resolvedApiServer, centrifugeServer, enableRenderingLog]
    )

    const onNavigate = (url: string) => {
        if (typeof window !== 'undefined') {
            window.history.pushState(null, '', url)
        }
    }

    return (
        <PieRoot
            location={{ pathname, search }}
            config={config}
            fallback={fallback ?? DEFAULT_FALLBACK}
            onNavigate={onNavigate}
        />
    )
}

export default PiePreviewRoot
