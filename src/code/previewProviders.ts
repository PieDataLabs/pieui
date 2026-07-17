import fs from 'node:fs'
import path from 'node:path'

export const PREVIEW_PROVIDERS_BASENAME = 'preview-providers.tsx'

/**
 * Default pass-through wrapper scaffolded into the components dir. The
 * `pieui registry` preview harness wraps every previewed card with this
 * file's default export — the injection point for app context providers (or
 * mocks) that provider-dependent cards need to render outside the app.
 *
 * Kept in sync with pie's copy at
 * `../pie/pie/code/templates/snippets/preview-providers.tsx.j2`.
 */
const TEMPLATE = `'use client'

// Wraps every card previewed by \`pie card show\` / \`pie card show-mcp\`.
// If a card crashes in preview with "useX must be used within XProvider",
// add that provider (or a lightweight mock of it) here. Keep it fast: this
// runs on every preview render, so prefer mocks over real network clients.
import type { ReactNode } from 'react'

export default function PreviewProviders({ children }: { children: ReactNode }) {
    return <>{children}</>
}
`

/**
 * Create `<componentsDir>/preview-providers.tsx` if missing.
 * Returns true when the file was created, false when it already existed.
 * Never overwrites an existing file.
 */
export const ensurePreviewProviders = (componentsDir: string): boolean => {
    const target = path.join(componentsDir, PREVIEW_PROVIDERS_BASENAME)
    if (fs.existsSync(target)) {
        return false
    }
    fs.mkdirSync(componentsDir, { recursive: true })
    fs.writeFileSync(target, TEMPLATE, 'utf8')
    return true
}
