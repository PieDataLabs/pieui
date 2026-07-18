import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

import { loadSettings } from '../services/settings'

/**
 * `pieui registry [dev|build]` — run or build a standalone preview harness that
 * mounts ONLY {@link PiePreviewRoot} + the project's card registry, with none
 * of the application's own layout/providers/gating.
 *
 * The harness is a self-contained mini Next app generated under
 * `.pie/registry/` inside the frontend project, so it resolves the host's
 * `node_modules` and `@/...` imports (including `@/<components>/registry`).
 *
 * - `dev`   → `next dev` on the harness (reads `PIE_API_SERVER`, cross-origin
 *             to an ephemeral backend with CORS). Used by `pie card show`.
 * - `build` → `next build` with `output: "export"` → a static SPA in
 *             `.pie/registry/out`, served same-origin by `pie`
 *             (`disable_serving=False`); the card API is relative (`/`).
 */

const REGISTRY_DIR = '.pie/registry'
const OUT_DIRNAME = 'out'

type RegistryOptions = {
    port?: number
    apiServer?: string
    out?: string
}

const writeIfChanged = (filePath: string, contents: string): void => {
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === contents) {
        return
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, contents, 'utf8')
}

/** Major version of tailwindcss installed in the frontend project (0 if absent). */
const tailwindMajor = (frontendRoot: string): number => {
    try {
        const pkg = path.join(
            frontendRoot,
            'node_modules',
            'tailwindcss',
            'package.json'
        )
        const { version } = JSON.parse(fs.readFileSync(pkg, 'utf8'))
        return parseInt(String(version).split('.')[0], 10) || 0
    } catch {
        return 0
    }
}

/** The project's tailwind config file, if any. */
const findTailwindConfig = (frontendRoot: string): string | null => {
    for (const name of [
        'tailwind.config.js',
        'tailwind.config.cjs',
        'tailwind.config.mjs',
        'tailwind.config.ts',
    ]) {
        const candidate = path.join(frontendRoot, name)
        if (fs.existsSync(candidate)) return candidate
    }
    return null
}

const packageType = (frontendRoot: string): string => {
    try {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(frontendRoot, 'package.json'), 'utf8')
        )
        return pkg.type === 'module' ? 'module' : 'commonjs'
    } catch {
        return 'commonjs'
    }
}

/**
 * Tailwind v3 support. Two things break a v3 project in the harness:
 *
 *  - the harness is its own Next app with no PostCSS config, so the project's
 *    `@tailwind` directives are never processed and the preview renders with no
 *    styling at all. (v4 needs none of this: `@import "tailwindcss"` + `@config`
 *    are resolved relative to the CSS file, which already works here.)
 *  - v3 resolves `content` globs against the build CWD — the harness dir — so
 *    the project's own `./piecomponents/**` globs match nothing and not a single
 *    utility class is generated.
 *
 * Emit a harness PostCSS config plus a Tailwind config that re-exports the
 * project's one (keeping its theme and plugins) with every relative glob
 * rewritten to an absolute path.
 */
const scaffoldTailwindV3 = (frontendRoot: string, dir: string): void => {
    if (tailwindMajor(frontendRoot) !== 3) return
    const config = findTailwindConfig(frontendRoot)
    if (!config) return

    writeIfChanged(
        path.join(dir, 'postcss.config.js'),
        `// The harness is a separate Next app, so it needs its own PostCSS config —
// without it the project's \`@tailwind\` directives are never processed and the
// preview renders completely unstyled.
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
`
    )

    if (config.endsWith('.ts')) {
        console.log(
            `[pieui]   ${path.basename(config)} cannot be re-exported from the ` +
                `harness; if the preview renders unstyled, make its \`content\` ` +
                `globs absolute.`
        )
        return
    }

    const rewrite = `const toAbsolute = (glob) =>
  typeof glob === 'string' && !isAbsolute(glob)
    ? join(projectRoot, glob.replace(/^\\.\\//, ''))
    : glob

const declared = Array.isArray(base.content)
  ? base.content
  : (base.content && base.content.files) || []
`
    const banner = `// Tailwind v3 resolves \`content\` globs against the build CWD, which for this
// harness is this directory — the project's own relative globs would match
// nothing and no utilities would be emitted. Re-export the project's config
// (theme, plugins and all) with every relative glob made absolute.
`
    const asEsm = config.endsWith('.mjs') || packageType(frontendRoot) === 'module'
    if (asEsm) {
        writeIfChanged(
            path.join(dir, 'tailwind.config.mjs'),
            `${banner}import { isAbsolute, join } from 'node:path'
import base from '../../${path.basename(config)}'

const projectRoot = new URL('../../', import.meta.url).pathname

${rewrite}
export default { ...base, content: declared.map(toAbsolute) }
`
        )
        return
    }
    writeIfChanged(
        path.join(dir, 'tailwind.config.js'),
        `${banner}const { isAbsolute, join, resolve } = require('node:path')

const projectRoot = resolve(__dirname, '..', '..')
const base = require(join(projectRoot, '${path.basename(config)}'))

${rewrite}
module.exports = { ...base, content: declared.map(toAbsolute) }
`
    )
}

/**
 * Link the project's `public/` into the harness. Next serves static assets from
 * the app root — here the harness dir — so a card referencing `/icons/foo.svg`
 * or a `@font-face` under `/fonts/` 404s (broken images, fallback fonts) unless
 * the project's public dir is reachable from it.
 */
const linkPublicAssets = (frontendRoot: string, dir: string): void => {
    const source = path.join(frontendRoot, 'public')
    if (!fs.existsSync(source)) return
    const target = path.join(dir, 'public')
    try {
        let existing: fs.Stats | null = null
        try {
            existing = fs.lstatSync(target)
        } catch {
            existing = null
        }
        if (existing) {
            if (
                existing.isSymbolicLink() &&
                path.resolve(dir, fs.readlinkSync(target)) === source
            ) {
                return
            }
            fs.rmSync(target, { recursive: true, force: true })
        }
        fs.symlinkSync(source, target, 'dir')
    } catch (error) {
        console.log(
            `[pieui]   could not link public/ into the harness (${String(error)}); ` +
                `static assets may 404 in the preview.`
        )
    }
}

/** Env files Next never loads — templates, not values. */
const ENV_TEMPLATE_SUFFIXES = ['.example', '.sample', '.template']

/**
 * Mirror the project's `.env*` files into the harness as symlinks.
 *
 * The harness is its own Next app rooted at `.pie/registry/`, so Next resolves
 * env files against THAT directory — the project's `.env.local` is invisible
 * and every `NEXT_PUBLIC_*` a card reads comes back `undefined`. Cards that
 * mount a credentialed provider (Turnkey, analytics, a payments kit) then
 * initialize against a dummy config and render a permanently-"loading" state,
 * which looks like a bug in the card.
 *
 * Symlinks rather than copies: the harness always reads what the project
 * currently has, and no secrets are duplicated on disk. Next applies its own
 * precedence (`.env.<mode>.local` → `.env.local` → `.env.<mode>` → `.env`) over
 * the mirrored set, and `@next/env` only fills vars MISSING from the inherited
 * process env — so what the CLI exports still wins (see `registryCommand`).
 */
const linkEnvFiles = (frontendRoot: string, dir: string): string[] => {
    const isEnvFile = (name: string): boolean =>
        (name === '.env' || name.startsWith('.env.')) &&
        !ENV_TEMPLATE_SUFFIXES.some((suffix) => name.endsWith(suffix))

    let names: string[] = []
    try {
        names = fs.readdirSync(frontendRoot).filter(isEnvFile).sort()
    } catch {
        return []
    }

    // Drop symlinks left over from an env file the project no longer has.
    try {
        for (const stale of fs.readdirSync(dir)) {
            if (!isEnvFile(stale) || names.includes(stale)) continue
            const target = path.join(dir, stale)
            if (fs.lstatSync(target).isSymbolicLink()) fs.rmSync(target)
        }
    } catch {
        // Harness dir may not exist yet on the first scaffold.
    }

    const linked: string[] = []
    for (const name of names) {
        const source = path.join(frontendRoot, name)
        const target = path.join(dir, name)
        try {
            if (!fs.statSync(source).isFile()) continue
            let existing: fs.Stats | null = null
            try {
                existing = fs.lstatSync(target)
            } catch {
                existing = null
            }
            if (existing) {
                if (
                    existing.isSymbolicLink() &&
                    path.resolve(dir, fs.readlinkSync(target)) === source
                ) {
                    linked.push(name)
                    continue
                }
                fs.rmSync(target, { recursive: true, force: true })
            }
            fs.mkdirSync(dir, { recursive: true })
            fs.symlinkSync(source, target, 'file')
            linked.push(name)
        } catch (error) {
            console.log(
                `[pieui]   could not link ${name} into the harness ` +
                    `(${String(error)}); its variables stay unset in the preview.`
            )
        }
    }
    return linked
}

/**
 * (Re)generate the mini Next app under `<frontend>/.pie/registry/`.
 * `registryName` is the basename of the components dir (e.g. `piecomponents`),
 * used to import the host card registry as `@/<name>/registry`.
 *
 * If the host project ships `<components>/preview-providers.tsx` (default
 * export: a component wrapping `children`), the harness wraps the previewed
 * card with it — the injection point for app context providers or mocks
 * (e.g. a fake TurnkeyProvider) that provider-dependent cards need to render.
 * `hasProviders` is decided at scaffold time (every `registry dev|build` run),
 * so adding/removing the file just needs a harness restart.
 */
const scaffoldHarness = (
    frontendRoot: string,
    registryName: string,
    hasProviders: boolean
): string => {
    const dir = path.join(frontendRoot, REGISTRY_DIR)

    // Minimal package.json so Next treats this dir as the project root; deps
    // resolve upward to the host's node_modules.
    writeIfChanged(
        path.join(dir, 'package.json'),
        JSON.stringify(
            { name: 'pie-registry-preview', version: '0.0.0', private: true },
            null,
            2
        ) + '\n'
    )

    // Static-export Next config. `@` → frontend root is provided via tsconfig
    // paths (honored by both Turbopack and webpack); `env` exposes
    // PIE_API_SERVER to the client (set at `next dev` start; empty for the
    // static build so the client falls back to a same-origin `/`).
    writeIfChanged(
        path.join(dir, 'next.config.mjs'),
        `import path from 'node:path'

// Next runs with cwd = this harness dir; the frontend project is two levels up.
const harnessRoot = process.cwd()
const frontendRoot = path.resolve(harnessRoot, '..', '..')

/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  reactStrictMode: true,
  // Next 16 blocks dev requests from non-localhost origins; allow loopback so
  // the HMR socket / lazy chunk loading work when opened via 127.0.0.1.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@swarm.ing/pieui'],
  experimental: {
    // Next 16 defaults Turbopack's persistent dev disk cache ON. Its
    // shared-string-table (.sst) serializer splits long escaped Tailwind
    // arbitrary-value selectors (e.g. \`py-[max(1.25rem,env(safe-area-inset-top))]\`)
    // mid-token across a string-table boundary, then reassembles them corrupted
    // on read-back -> \`env(safe-area-%<ctrl>top)\` -> "Parsing CSS source code
    // failed". A fresh \`.next\` compiles clean once; the next restart reads the
    // poisoned cache and breaks. Disable the persistent cache so the harness
    // recompiles from source every time (in-memory caching still applies).
    turbopackFileSystemCacheForDev: false,
  },
  // The workspace root must be the frontend project: that's where node_modules
  // (incl. \`next\`) lives and where the card registry + cards are imported from
  // (outside this harness dir). The app dir stays this harness (cwd).
  outputFileTracingRoot: frontendRoot,
  env: {
    PIE_API_SERVER: process.env.PIE_API_SERVER ?? '',
    NEXT_PUBLIC_PIE_API_SERVER: process.env.NEXT_PUBLIC_PIE_API_SERVER ?? '',
  },
  turbopack: { root: frontendRoot, resolveAlias: { '@': frontendRoot } },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = { ...(config.resolve.alias || {}), '@': frontendRoot }
    return config
  },
}
`
    )

    // baseUrl = frontend root so \`@/*\` resolves to the host project (the card
    // registry and every card it imports rely on the \`@\` alias).
    writeIfChanged(
        path.join(dir, 'tsconfig.json'),
        JSON.stringify(
            {
                compilerOptions: {
                    target: 'ES2017',
                    lib: ['dom', 'dom.iterable', 'esnext'],
                    allowJs: true,
                    skipLibCheck: true,
                    strict: false,
                    noEmit: true,
                    esModuleInterop: true,
                    module: 'esnext',
                    moduleResolution: 'bundler',
                    resolveJsonModule: true,
                    isolatedModules: true,
                    jsx: 'preserve',
                    incremental: true,
                    baseUrl: '../..',
                    paths: { '@/*': ['./*'] },
                    plugins: [{ name: 'next' }],
                },
                include: [
                    'next-env.d.ts',
                    '**/*.ts',
                    '**/*.tsx',
                    '.next/types/**/*.ts',
                ],
                exclude: ['node_modules'],
            },
            null,
            2
        ) + '\n'
    )

    // Bare root layout — no providers, no gating, no host chrome.
    writeIfChanged(
        path.join(dir, 'app', 'layout.tsx'),
        `import '@/app/globals.css'

export const metadata = { title: 'Pie Registry Preview' }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
    )

    // Client-only mount: keep the card graph out of prerender (mirrors how host
    // apps load the registry via \`dynamic(..., { ssr: false })\`).
    writeIfChanged(
        path.join(dir, 'app', 'page.tsx'),
        `'use client'

import dynamic from 'next/dynamic'

const PreviewClient = dynamic(
  () =>
    import('./preview-client').catch((e) => ({
      default: () => (
        <pre style={{ color: 'red', padding: 16, whiteSpace: 'pre-wrap' }}>
          {'[pie] preview harness failed to load:\\n' + String(e && e.stack ? e.stack : e)}
        </pre>
      ),
    })),
  { ssr: false, loading: () => <div style={{ padding: 16 }}>harness loading…</div> }
)

export default function Page() {
  return <PreviewClient />
}
`
    )

    const providersImport = hasProviders
        ? `import PreviewProviders from '@/${registryName}/preview-providers'\n`
        : ''
    const previewTree = hasProviders
        ? `<PreviewProviders>
        <PiePreviewRoot apiServer={apiServer} pathname="/" previewEvents />
      </PreviewProviders>`
        : `<PiePreviewRoot apiServer={apiServer} pathname="/" previewEvents />`
    writeIfChanged(
        path.join(dir, 'app', 'preview-client.tsx'),
        `'use client'

import React from 'react'
import '@/${registryName}/registry'
import { PiePreviewRoot } from '@swarm.ing/pieui'
${providersImport}
const PROVIDERS_FILE = '${registryName}/preview-providers.tsx'
const PROVIDER_HINT =
  '[pie] This card seems to need an app context provider. Add the provider ' +
  '(or a lightweight mock of it) to ' + PROVIDERS_FILE + ' in the frontend ' +
  'project, then restart the preview harness.'

// Catches render-time crashes (most commonly "useX must be used within
// XProvider") and shows them with a fix hint — so both the browser view and
// the show-mcp screenshot are self-explanatory instead of a blank page.
// Sits OUTSIDE PreviewProviders so a crash in the providers file itself is
// caught too. Effect/promise errors are surfaced via the page console instead.
class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const message = String(error && error.message ? error.message : error)
    const needsProvider = /must be used within|provider|context/i.test(message)
    return (
      <div
        data-pie-preview-error
        style={{ padding: 16, fontFamily: 'monospace' }}
      >
        {needsProvider ? (
          <p style={{ color: '#b45309', fontWeight: 700, whiteSpace: 'pre-wrap' }}>
            {PROVIDER_HINT}
          </p>
        ) : null}
        <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
          {'[pie] card crashed while rendering:\\n' + (error.stack || message)}
        </pre>
        {needsProvider ? null : (
          <p style={{ color: '#666', whiteSpace: 'pre-wrap' }}>
            {'If the error mentions a missing context/provider: ' + PROVIDER_HINT}
          </p>
        )}
      </div>
    )
  }
}

export default function PreviewClient() {
  // Dev: NEXT_PUBLIC_PIE_API_SERVER points at the ephemeral backend (Next
  // statically inlines NEXT_PUBLIC_* into the client bundle). Static build:
  // unset → falls back to same-origin '/' (pie serves both the SPA and API).
  const apiServer = process.env.NEXT_PUBLIC_PIE_API_SERVER || '/'
  return (
    <PreviewErrorBoundary>
      ${previewTree}
    </PreviewErrorBoundary>
  )
}
`
    )

    // Tailwind v3 needs its own PostCSS + absolute content globs here; v4 works
    // as-is. Static assets are served from the app root, so link the project's.
    scaffoldTailwindV3(frontendRoot, dir)
    linkPublicAssets(frontendRoot, dir)
    const envFiles = linkEnvFiles(frontendRoot, dir)
    if (envFiles.length) {
        console.log(`[pieui]   env: ${envFiles.join(', ')}`)
    }

    // .gitignore the generated harness by default.
    writeIfChanged(path.join(dir, '.gitignore'), '*\n')

    return dir
}

const resolveNextBin = (frontendRoot: string): string => {
    const bin = path.join(frontendRoot, 'node_modules', '.bin', 'next')
    if (!fs.existsSync(bin)) {
        throw new Error(
            `Next.js binary not found at ${bin}. Install dependencies in the ` +
                `frontend project first (the registry harness reuses them).`
        )
    }
    return bin
}

export const registryCommand = (
    action: 'dev' | 'build',
    opts: RegistryOptions = {}
): void => {
    const frontendRoot = process.cwd()
    const settings = loadSettings(frontendRoot)
    const registryName = path.basename(settings.componentsDir)
    const hasProviders = fs.existsSync(
        path.join(settings.componentsDir, 'preview-providers.tsx')
    )
    if (hasProviders) {
        console.log(
            `[pieui]   preview providers: ${registryName}/preview-providers.tsx`
        )
    }

    const dir = scaffoldHarness(frontendRoot, registryName, hasProviders)
    const nextBin = resolveNextBin(frontendRoot)

    // The harness's card API is owned by --api-server, never by a mirrored
    // `.env*` (a project's .env.local routinely points PIE_API_SERVER at a
    // deployed backend — the preview must talk to the one we were handed).
    // Exporting '' rather than leaving it unset is what makes that stick:
    // `@next/env` only fills variables MISSING from the inherited process env,
    // so a defined-but-empty value blocks the file. Empty → the client's
    // `|| '/'` fallback, i.e. today's behavior when no flag is passed.
    const env = { ...process.env }
    env.PIE_API_SERVER = opts.apiServer ?? ''
    env.NEXT_PUBLIC_PIE_API_SERVER = opts.apiServer ?? ''

    if (action === 'dev') {
        const port = opts.port ?? 3210
        console.log(`[pieui] registry dev → http://localhost:${port}`)
        console.log(`[pieui]   harness: ${dir}`)
        console.log(`[pieui]   PIE_API_SERVER=${env.PIE_API_SERVER || '(unset → /)'}`)
        const result = spawnSync(nextBin, ['dev', '-p', String(port)], {
            cwd: dir,
            stdio: 'inherit',
            env,
        })
        if (result.error) throw result.error
        if (typeof result.status === 'number' && result.status !== 0) {
            process.exitCode = result.status
        }
        return
    }

    // build → static export. Force a same-origin client (no baked API server):
    // pie serves the SPA and the card API together. '' rather than `delete` —
    // deleting would re-open the slot for a mirrored `.env*` to fill.
    env.PIE_API_SERVER = ''
    env.NEXT_PUBLIC_PIE_API_SERVER = ''
    console.log(`[pieui] registry build (static export) → ${path.join(dir, OUT_DIRNAME)}`)
    const result = spawnSync(nextBin, ['build'], {
        cwd: dir,
        stdio: 'inherit',
        env,
    })
    if (result.error) throw result.error
    if (typeof result.status === 'number' && result.status !== 0) {
        process.exitCode = result.status
        return
    }
    const outDir = opts.out
        ? path.resolve(frontendRoot, opts.out)
        : path.join(dir, OUT_DIRNAME)
    console.log(`[pieui] registry build complete: ${outDir}`)
}
