'use client'

import '../types'
import { SetUiAjaxConfigurationType, UIEventType } from '../types'
import waitForSidAvailable from './waitForSidAvailable'
import { usePieConfig } from './pieConfig.ts'
import { useMemo } from 'react'
import clientSources from '../platform/clientSources'
import { joinApiPath } from './apiPath'

/**
 * Retry policy configuration for AJAX requests.
 */
export type RetryPolicy = {
    /** Maximum number of retry attempts (default: 0 — no retries). */
    maxRetries?: number
    /** Base delay in ms between retries (default: 1000). Doubled on each attempt. */
    baseDelay?: number
    /** HTTP status codes that should trigger a retry (default: [502, 503, 504]). Timeouts and network errors always retry regardless of this list. */
    retryOn?: number[]
}

/**
 * Options for {@link getAjaxSubmit}. Passed explicitly so that the helper can
 * stay a plain function — callers forward the values they already obtained
 * from {@link usePieConfig} instead of the helper calling hooks on its own.
 */
export type GetAjaxSubmitOptions = {
    /** Base URL of the PieUI API server (must end with `/`). */
    apiServer?: string | null
    /** When `true`, the helper will log registration and error details. */
    renderingLogEnabled?: boolean
    /** Request timeout in milliseconds. No timeout if omitted. */
    timeout?: number
    /** Retry policy for failed requests. No retries if omitted. */
    retryPolicy?: RetryPolicy
    /**
     * Extra `fetch` options merged into every request the submit function
     * makes (`headers`, `credentials`, `mode`, `cache`, a caller `signal`, …).
     * `body` is ignored — it is always the collected FormData. See
     * {@link buildRequestInit} for how the merge works.
     */
    fetchOptions?: RequestInit
}

/**
 * Submit function returned by {@link getAjaxSubmit}. `fetchOptions` given here
 * override the ones passed when the submit function was built.
 */
export type AjaxSubmitFn = (
    extraKwargs?: Record<string, any>,
    fetchOptions?: RequestInit
) => Promise<any>

/**
 * The origin a dep value is read from. `dom` is the default for any name
 * without a recognized prefix.
 */
export type DepSource =
    | 'dom'
    | 'sid'
    | 'localStorage'
    | 'sessionStorage'
    | 'cookie'
    | 'url'
    | 'telegram:cloud'
    | 'telegram:secure'

const DEP_SOURCE_PREFIXES: Array<Exclude<DepSource, 'dom' | 'sid'>> = [
    'localStorage',
    'sessionStorage',
    'cookie',
    'url',
    'telegram:cloud',
    'telegram:secure',
]

/**
 * Sources whose values can only be read asynchronously (Telegram Cloud/Secure
 * storage expose callback-based `getItem`). These are resolved by
 * {@link readAjaxKeyAsync}; the synchronous {@link readAjaxKey} cannot serve
 * them and returns `[]`.
 */
const ASYNC_DEP_SOURCES = new Set<DepSource>([
    'telegram:cloud',
    'telegram:secure',
])

/**
 * A `stored` resolver produces the current submit value(s) for a card, keyed by
 * the card's `data.name`. Populated by {@link PieCard} when its `stored` prop is
 * a function, so an ajax submit reads the *current* stored value at submit time
 * rather than a static hidden `<input>` snapshot. Internal wiring — the public
 * surface is `<PieCard stored={() => …}>`.
 */
export type StoredResolver = () =>
    | Array<string | File>
    | Promise<Array<string | File>>

const storedResolvers = new Map<string, StoredResolver>()

/** Register a card's `stored` resolver under its `data.name`. */
export const registerStoredResolver = (
    name: string,
    resolver: StoredResolver
): void => {
    storedResolvers.set(name, resolver)
}

/** Remove a card's `stored` resolver (on unmount / when it stops being a fn). */
export const unregisterStoredResolver = (name: string): void => {
    storedResolvers.delete(name)
}

/**
 * Resolve every function-`stored` and mirror it into the global form's DOM as
 * hidden inputs, so a native `form.submit()` serializes them. Called once, at
 * submit time — each (possibly expensive) resolver runs exactly once here,
 * which is why we don't render a live hidden input per render.
 *
 * `HTMLFormElement.submit()` fires no `submit`/`formdata` event, so this cannot
 * hook browser events; it is an explicit step in {@link submitGlobalForm}.
 *
 * Async resolvers and File values are skipped: a native submit cannot await and
 * a hidden `<input>` cannot carry a File. In practice `PieCard` registers a
 * synchronous resolver that yields a single JSON string, which this handles
 * fully; the ajax submit path still resolves async/File values via
 * {@link readAjaxKeyAsync}. Plain-value `stored` registers no resolver and is
 * untouched here — its own static hidden input remains the only one.
 *
 * `target` is the form's element id (default `piedata_global_form`, resolved via
 * the global `document`) or the form element itself. No-op when the id is not
 * found, or when `document` is undefined (SSR / React Native).
 */
export const flushStoredResolversToForm = (
    target: string | HTMLElement = 'piedata_global_form'
): void => {
    let form: HTMLElement | null
    if (typeof target === 'string') {
        if (typeof document === 'undefined') return
        form = document.getElementById(target)
    } else {
        form = target
    }
    if (!form) return

    // Create inputs in the form's own document (the global document in
    // production) so the function stays testable with an isolated form element.
    const doc = form.ownerDocument

    // Remove inputs injected by a previous submit so re-submits replace rather
    // than accumulate. (getElementsByTagName + attribute check rather than a
    // querySelector so it needs no CSS-selector engine.)
    for (const el of Array.from(form.getElementsByTagName('input'))) {
        if (el.getAttribute('data-pie-stored') !== null) el.remove()
    }

    for (const [name, resolver] of storedResolvers) {
        const result = resolver()
        if (result instanceof Promise) continue // native submit can't await
        for (const value of result) {
            if (typeof value !== 'string') continue // hidden input can't carry a File
            const input = doc.createElement('input')
            input.type = 'hidden'
            input.name = name
            input.value = value
            input.setAttribute('data-pie-stored', '1')
            form.appendChild(input)
        }
    }
}

/**
 * Splits a dep name into its source and bare key, following the magic-name
 * convention used by Ajax cards.
 *
 * - `'sid'` → `{ source: 'sid', key: 'sid' }` (SocketIO session id).
 * - `'localStorage:token'` → `{ source: 'localStorage', key: 'token' }`; the
 *   same for `sessionStorage:`, `cookie:`, `url:`, `telegram:cloud:` and
 *   `telegram:secure:` prefixes.
 * - Anything else (including a name that contains a colon but no recognized
 *   prefix) → `{ source: 'dom', key: <name> }`.
 *
 * The returned `key` is what gets sent to the backend as the field name, so a
 * prefixed dep is submitted under its bare key (`localStorage:token` → `token`).
 */
export const parseDepName = (
    depName: string
): { source: DepSource; key: string } => {
    if (depName === 'sid') return { source: 'sid', key: 'sid' }

    for (const source of DEP_SOURCE_PREFIXES) {
        const prefix = source + ':'
        if (depName.startsWith(prefix)) {
            return { source, key: depName.slice(prefix.length) }
        }
    }

    return { source: 'dom', key: depName }
}

/**
 * Reads the value(s) for a single dep name, following the same convention used
 * by Ajax cards. Returns an array because file inputs (and cookies / repeated
 * URL params) can contribute multiple values for the same key.
 *
 * The source is determined by {@link parseDepName}:
 * - `'sid'` resolves to `window.sid`. The caller must ensure SocketIO is
 *   ready (e.g. via {@link waitForSidAvailable}) before calling this.
 * - `localStorage:` / `sessionStorage:` read `getItem(key)` (try/caught, since
 *   storage access can throw in private mode); missing/blocked → `[]`.
 * - `cookie:` reads and `decodeURIComponent`s the matching cookie; missing →
 *   `[]`.
 * - `url:` reads `URLSearchParams(location.search).getAll(key)` (repeated
 *   params supported); missing → `[]`.
 * - `telegram:cloud:` / `telegram:secure:` are asynchronous and cannot be
 *   served here — they return `[]`. Use {@link readAjaxKeyAsync} instead (the
 *   Ajax submit flow already does).
 * - DOM names are looked up via `document.getElementsByName`; only the first
 *   match is read. `<input type="file">` returns every selected `File`; other
 *   `<input>` / `<textarea>` returns the current `.value`.
 * - Missing values return `[]` (and emit a warning when `renderingLogEnabled`).
 *
 * Must run in a browser environment — relies on `document` and `window`.
 *
 * @throws if the resolved source is `sid` and `window.sid` is not initialized.
 */
export const readAjaxKey = (
    depName: string,
    renderingLogEnabled: boolean = false
): Array<string | File> => {
    const { source, key } = parseDepName(depName)

    if (source === 'sid') {
        const sid = clientSources.readSid()
        if (!sid) throw new Error("SocketIO isn't initialized properly")
        return [sid]
    }

    if (source === 'localStorage' || source === 'sessionStorage') {
        try {
            const value = clientSources.readWebStorage(
                source === 'localStorage' ? 'local' : 'session',
                key
            )
            if (value === null) {
                if (renderingLogEnabled) {
                    console.warn(`No ${source} value found for key ${key}`)
                }
                return []
            }
            return [value]
        } catch (err) {
            if (renderingLogEnabled) {
                console.warn(`Failed to read ${source} key ${key}:`, err)
            }
            return []
        }
    }

    if (source === 'cookie') {
        const value = clientSources.readCookie(key)
        if (value === null) {
            if (renderingLogEnabled) {
                console.warn(`No cookie found for key ${key}`)
            }
            return []
        }
        return [value]
    }

    if (source === 'url') {
        const values = clientSources.readUrlParams(key)
        if (!values.length && renderingLogEnabled) {
            console.warn(`No URL query param found for key ${key}`)
        }
        return values
    }

    if (ASYNC_DEP_SOURCES.has(source)) {
        if (renderingLogEnabled) {
            console.warn(
                `Source ${source} is async; use readAjaxKeyAsync (readAjaxKey returns [])`
            )
        }
        return []
    }

    const storedResolver = storedResolvers.get(key)
    if (storedResolver) {
        const result = storedResolver()
        if (result instanceof Promise) {
            if (renderingLogEnabled) {
                console.warn(
                    `stored resolver for ${key} is async; use readAjaxKeyAsync (readAjaxKey returns [])`
                )
            }
            return []
        }
        return result
    }

    const values = clientSources.readDomInput(key)
    if (values === null) {
        if (renderingLogEnabled) {
            console.warn(`No input found with name ${key}`)
        }
        return []
    }
    return values
}

/**
 * Reads a single value from Telegram `WebApp.CloudStorage` /
 * `WebApp.SecureStorage`. Both expose a callback-based `getItem`, so this is
 * inherently asynchronous. Resolves to `['<value>']` on success and `[]` when
 * the store is unavailable, the key is missing/empty, or the read errors.
 */
const readTelegramStorage = (
    source: 'telegram:cloud' | 'telegram:secure',
    key: string,
    renderingLogEnabled: boolean
): Promise<string[]> => {
    const webApp = window.Telegram?.WebApp
    const store =
        source === 'telegram:cloud'
            ? webApp?.CloudStorage
            : webApp?.SecureStorage
    const label =
        source === 'telegram:cloud'
            ? 'Telegram CloudStorage'
            : 'Telegram SecureStorage'

    if (!store) {
        if (renderingLogEnabled) console.warn(`${label} is not available`)
        return Promise.resolve([])
    }

    return new Promise((resolve) => {
        try {
            store.getItem(key, (error, value) => {
                if (error) {
                    if (renderingLogEnabled) {
                        console.warn(
                            `Failed to read ${label} key ${key}:`,
                            error
                        )
                    }
                    resolve([])
                    return
                }
                if (value == null || value === '') {
                    if (renderingLogEnabled) {
                        console.warn(`No ${label} value found for key ${key}`)
                    }
                    resolve([])
                    return
                }
                resolve([value])
            })
        } catch (err) {
            if (renderingLogEnabled) {
                console.warn(`Failed to read ${label} key ${key}:`, err)
            }
            resolve([])
        }
    })
}

/**
 * Asynchronous counterpart to {@link readAjaxKey}. Behaves identically for all
 * synchronous sources (it delegates to `readAjaxKey`) but additionally resolves
 * the asynchronous Telegram sources (`telegram:cloud:` / `telegram:secure:`).
 *
 * This is what the Ajax submit flow uses so that every supported source — sync
 * or async — can contribute values to the request.
 */
export const readAjaxKeyAsync = async (
    depName: string,
    renderingLogEnabled: boolean = false
): Promise<Array<string | File>> => {
    const { source, key } = parseDepName(depName)
    if (source === 'telegram:cloud' || source === 'telegram:secure') {
        return readTelegramStorage(source, key, renderingLogEnabled)
    }
    if (
        (source === 'localStorage' || source === 'sessionStorage') &&
        clientSources.readWebStorageAsync
    ) {
        try {
            const value = await clientSources.readWebStorageAsync(
                source === 'localStorage' ? 'local' : 'session',
                key
            )
            if (value === null) {
                if (renderingLogEnabled) {
                    console.warn(`No ${source} value found for key ${key}`)
                }
                return []
            }
            return [value]
        } catch (err) {
            if (renderingLogEnabled) {
                console.warn(`Failed to read ${source} key ${key}:`, err)
            }
            return []
        }
    }
    if (source === 'dom') {
        const storedResolver = storedResolvers.get(key)
        if (storedResolver) {
            return storedResolver()
        }
    }
    return readAjaxKey(depName, renderingLogEnabled)
}

/** Normalize any `HeadersInit` shape (object, array, `Headers`) to entries. */
const toHeaderEntries = (init?: HeadersInit): Array<[string, string]> => {
    if (!init) return []
    if (Array.isArray(init))
        return init.map(([key, value]) => [String(key), String(value)])
    if (typeof (init as Headers).forEach === 'function') {
        const out: Array<[string, string]> = []
        ;(init as Headers).forEach((value, key) => out.push([key, value]))
        return out
    }
    return Object.entries(init as Record<string, string>)
}

/**
 * Combine several abort signals into one: the result aborts as soon as any of
 * them does. Returns the single signal unchanged when there is nothing to
 * combine, and `undefined` when there is none at all.
 */
const combineSignals = (
    signals: Array<AbortSignal | undefined | null>
): AbortSignal | undefined => {
    const present = signals.filter(Boolean) as AbortSignal[]
    if (present.length === 0) return undefined
    if (present.length === 1) return present[0]

    // `AbortSignal.any` is not available on every runtime PieUI targets
    // (older Safari, React Native), so mirror it by hand when it is missing.
    const anyOf = (AbortSignal as any).any
    if (typeof anyOf === 'function') return anyOf.call(AbortSignal, present)

    const controller = new AbortController()
    for (const signal of present) {
        if (signal.aborted) {
            controller.abort((signal as any).reason)
            break
        }
        signal.addEventListener(
            'abort',
            () => controller.abort((signal as any).reason),
            { once: true }
        )
    }
    return controller.signal
}

/**
 * Build the `RequestInit` for one ajax submit: helper defaults first, then the
 * caller's `fetchOptions` on top (registration-level, then call-level).
 *
 * `body` always stays the collected FormData; everything else — `method`,
 * `credentials`, `mode`, `cache`, … — can be overridden. Headers merge
 * key-by-key (case-insensitive) rather than replacing wholesale, and a caller
 * `signal` is combined with the timeout signal so either can abort.
 */
const buildRequestInit = (
    body: FormData,
    timeoutSignal: AbortSignal | undefined,
    overrides: Array<RequestInit | undefined>
): RequestInit => {
    const init: RequestInit = {
        method: 'POST',
        // Session cookies ride along, and — just as importantly —
        // `Set-Cookie` coming back is honoured. Without this the
        // browser silently drops both whenever the page and the API
        // sit on different origins (app.example.com → api.example.com),
        // which is the normal deployment shape. A login handler would
        // then succeed server-side and still leave the user signed out.
        // PieRoot's config request and gen_token already send
        // credentials; ajax submits were the odd one out.
        credentials: 'include',
    }

    const headers: Record<string, string> = {}
    const signals: Array<AbortSignal | undefined | null> = [timeoutSignal]

    for (const override of overrides) {
        if (!override) continue
        const {
            headers: overrideHeaders,
            signal,
            body: ignoredBody,
            ...rest
        } = override
        Object.assign(init, rest)
        for (const [key, value] of toHeaderEntries(overrideHeaders)) {
            headers[key.toLowerCase()] = value
        }
        signals.push(signal)
    }

    init.body = body
    if (Object.keys(headers).length > 0) init.headers = headers

    const signal = combineSignals(signals)
    if (signal) init.signal = signal

    return init
}

/**
 * Builds an async "submit" function that issues an AJAX request to
 * `api/ajax_content{pathname}` and streams (or JSON-decodes) the response
 * into a `setUiAjaxConfiguration` callback supplied by an Ajax container.
 *
 * The returned function collects form data from:
 * 1. the static `kwargs` object,
 * 2. any `extraKwargs` passed at call time,
 * 3. the dep names in `depsNames`, each resolved by {@link readAjaxKeyAsync}
 *    from its source: DOM inputs by default, `sid` (resolved via
 *    {@link waitForSidAvailable}), or the `localStorage:`, `sessionStorage:`,
 *    `cookie:`, `url:`, `telegram:cloud:` and `telegram:secure:` prefixes —
 *    submitted under the bare key, and
 * 4. file inputs (multiple files supported).
 *
 * If the server streams NDJSON, each line is parsed as a `UIEventType` and
 * applied incrementally; otherwise the full JSON body replaces the current
 * Ajax configuration.
 *
 * On missing `apiServer`, `pathname` or `setUiAjaxConfiguration` the helper
 * returns a no-op function so call sites do not need to null-check.
 *
 * @param setUiAjaxConfiguration Setter provided by the enclosing Ajax card.
 * @param kwargs                 Static key/value pairs appended to the request.
 * @param depsNames              Dep names whose current values should also be
 *                               sent. Plain names read DOM inputs; the
 *                               `localStorage:`, `sessionStorage:`, `cookie:`,
 *                               `url:`, `telegram:cloud:` and `telegram:secure:`
 *                               prefixes read those client sources.
 * @param pathname               Path segment appended to `api/ajax_content`.
 * @param options                See {@link GetAjaxSubmitOptions}, including
 *                               `fetchOptions` — arbitrary `fetch` init merged
 *                               into every request (see
 *                               {@link buildRequestInit}).
 * @returns An {@link AjaxSubmitFn}: `async (extraKwargs?, fetchOptions?)`,
 *          where the call-time `fetchOptions` win over the ones given here.
 */
export const getAjaxSubmit = (
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType,
    kwargs: Record<string, any> = {},
    depsNames: Array<string> = [],
    pathname?: string,
    options?: GetAjaxSubmitOptions
): AjaxSubmitFn => {
    const renderingLogEnabled = options?.renderingLogEnabled ?? false
    const timeout = options?.timeout
    const retryPolicy = options?.retryPolicy
    const maxRetries = retryPolicy?.maxRetries ?? 0
    const baseDelay = retryPolicy?.baseDelay ?? 1000
    const retryOn = retryPolicy?.retryOn ?? [502, 503, 504]

    if (renderingLogEnabled) {
        console.log('Registering AJAX: ', pathname, kwargs, depsNames)
    }

    return async (
        extraKwargs: Record<string, any> = {},
        callFetchOptions?: RequestInit
    ) => {
        if (!clientSources.isClient()) {
            if (renderingLogEnabled) {
                console.warn(
                    'getAjaxSubmit called on server, skipping DOM-dependent logic'
                )
            }
            return
        }

        const apiServer = options?.apiServer
        if (!apiServer) {
            if (renderingLogEnabled) {
                console.warn('AJAX skipped: apiServer is missing')
            }
            return
        }

        if (!pathname || !setUiAjaxConfiguration) {
            if (renderingLogEnabled) {
                console.warn(
                    'AJAX skipped: pathname or setUiAjaxConfiguration is missing'
                )
            }
            return
        }

        if (depsNames.includes('sid')) {
            await waitForSidAvailable()
        }

        const data = new FormData()
        for (const [key, value] of Object.entries({
            ...kwargs,
            ...extraKwargs,
        })) {
            data.append(key, value)
        }

        for (const depName of depsNames) {
            const { key: fieldName } = parseDepName(depName)
            for (const value of await readAjaxKeyAsync(
                depName,
                renderingLogEnabled
            )) {
                data.append(fieldName, value)
            }
        }

        const apiEndpoint =
            joinApiPath(apiServer, 'api/ajax_content') + pathname

        setUiAjaxConfiguration(null)

        let lastError: unknown
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (attempt > 0) {
                const delay = baseDelay * 2 ** (attempt - 1)
                if (renderingLogEnabled) {
                    console.log(
                        `AJAX retry ${attempt}/${maxRetries} after ${delay}ms`
                    )
                }
                await new Promise((r) => setTimeout(r, delay))
            }

            const controller = timeout != null ? new AbortController() : null
            const timer =
                controller && setTimeout(() => controller.abort(), timeout)

            try {
                const response = await fetch(
                    apiEndpoint,
                    buildRequestInit(data, controller?.signal, [
                        options?.fetchOptions,
                        callFetchOptions,
                    ])
                )

                if (timer) clearTimeout(timer)

                if (
                    !response.ok &&
                    retryOn.includes(response.status) &&
                    attempt < maxRetries
                ) {
                    lastError = new Error(`HTTP ${response.status}`)
                    continue
                }

                const contentType = response.headers.get('content-type') || ''
                const isJson = contentType.includes('application/json')
                const isStream = !!response.body?.getReader && !isJson

                if (isStream) {
                    const reader = response.body!.getReader()
                    const decoder = new TextDecoder()
                    let buffer = ''

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        buffer += decoder.decode(value, { stream: true })

                        const lines = buffer.split('\n')
                        buffer = lines.pop() ?? ''

                        for (const line of lines) {
                            const trimmed = line.trim()
                            if (!trimmed) continue
                            try {
                                const currentEvent = JSON.parse(
                                    trimmed
                                ) as UIEventType
                                ;(
                                    setUiAjaxConfiguration as (
                                        events: UIEventType[]
                                    ) => void
                                )([currentEvent])
                            } catch {
                                if (renderingLogEnabled) {
                                    console.warn(
                                        'Failed to parse streamed line:',
                                        trimmed
                                    )
                                }
                            }
                        }
                    }

                    if (buffer.trim()) {
                        try {
                            const currentEvent = JSON.parse(
                                buffer
                            ) as UIEventType
                            ;(
                                setUiAjaxConfiguration as (
                                    events: UIEventType[]
                                ) => void
                            )([currentEvent])
                        } catch {
                            if (renderingLogEnabled) {
                                console.warn(
                                    'Failed to parse final streamed line:',
                                    buffer
                                )
                            }
                        }
                    }
                    return {}
                } else {
                    const data = await response.json()
                    setUiAjaxConfiguration(data)
                    return data
                }
            } catch (err) {
                if (timer) clearTimeout(timer)
                lastError = err
                if (attempt < maxRetries) continue
                if (renderingLogEnabled) {
                    console.error('AJAX request failed:', err)
                }
                setUiAjaxConfiguration(null)
                return err
            }
        }

        // All retries exhausted with a retryable HTTP status
        if (renderingLogEnabled) {
            console.error('AJAX request failed after retries:', lastError)
        }
        setUiAjaxConfiguration(null)
        return lastError
    }
}

/**
 * React hook wrapper around {@link getAjaxSubmit}. Reads `apiServer` and
 * `enableRenderingLog` from {@link usePieConfig} and memoizes the submit
 * function so that stable inline literals from server-driven UIConfig don't
 * cause a new function identity on every render — memoization is keyed on
 * the stringified `kwargs`/`depsNames` rather than their reference.
 *
 * @param setUiAjaxConfiguration Setter provided by the enclosing Ajax card.
 * @param kwargs                 Static key/value pairs appended to the request.
 * @param depsNames              Names of DOM inputs whose current values should
 *                               be sent alongside the request.
 * @param pathname               Path segment appended to `api/ajax_content`.
 * @param options                Optional `timeout` (ms), `retryPolicy` and
 *                               `fetchOptions`. Since memoization is keyed on
 *                               the stringified options, pass values that
 *                               survive `JSON.stringify` here — a per-call
 *                               `AbortSignal` belongs in the submit call's own
 *                               `fetchOptions` argument instead.
 * @returns A memoized submit function; see {@link getAjaxSubmit}.
 */
export const useAjaxSubmit = (
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType,
    kwargs: Record<string, any> = {},
    depsNames: Array<string> = [],
    pathname?: string,
    options?: {
        timeout?: number
        retryPolicy?: RetryPolicy
        fetchOptions?: RequestInit
    }
): AjaxSubmitFn => {
    const { apiServer, enableRenderingLog } = usePieConfig()
    // kwargs/depsNames чаще всего приходят как инлайн-литералы из серверного
    // UIConfig — ссылка меняется на каждом рендере, поэтому ключом мемоизации
    // должно быть значение, а не ссылка.
    const kwargsKey = JSON.stringify(kwargs)
    const depsKey = JSON.stringify(depsNames)
    const optionsKey = JSON.stringify(options)
    return useMemo(
        () =>
            getAjaxSubmit(setUiAjaxConfiguration, kwargs, depsNames, pathname, {
                apiServer,
                renderingLogEnabled: enableRenderingLog,
                timeout: options?.timeout,
                retryPolicy: options?.retryPolicy,
                fetchOptions: options?.fetchOptions,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            setUiAjaxConfiguration,
            kwargsKey,
            depsKey,
            pathname,
            apiServer,
            enableRenderingLog,
            optionsKey,
        ]
    )
}

/** One ajax endpoint's submit config, discovered from a card's `data`. */
export type AjaxEndpointConfig = {
    /** `'default'` for the primary `pathname`, else the field prefix (`search`). */
    key: string
    pathname?: string
    depsNames: Array<string>
    kwargs: Record<string, any>
}

/**
 * Discover every ajax endpoint triple in a card's `data` by convention: the
 * primary `pathname`/`depsNames`/`kwargs`, plus any named
 * `<x>Pathname`/`<x>DepsNames`/`<x>Kwargs` (mirrors the backend, where a card
 * may carry several endpoints paired by field name). Keyed by the prefix, with
 * `'default'` for the primary `pathname`.
 */
export const discoverAjaxEndpoints = (
    data: Record<string, any> = {}
): Array<AjaxEndpointConfig> => {
    const out: Array<AjaxEndpointConfig> = []
    for (const field of Object.keys(data ?? {})) {
        let key: string | null = null
        if (field === 'pathname') key = 'default'
        else if (field.endsWith('Pathname'))
            key = field.slice(0, -'Pathname'.length)
        if (key === null) continue

        const prefix = key === 'default' ? '' : key
        out.push({
            key,
            pathname: data[field],
            depsNames: data[prefix ? `${prefix}DepsNames` : 'depsNames'] ?? [],
            kwargs: data[prefix ? `${prefix}Kwargs` : 'kwargs'] ?? {},
        })
    }
    return out
}

/**
 * Like {@link useAjaxSubmit} but for a whole card: discovers every endpoint in
 * `data` ({@link discoverAjaxEndpoints}) and returns a submit function per
 * endpoint, keyed the same way (`'default'` for the primary `pathname`). Lets a
 * component drive a card that carries multiple ajax endpoints.
 */
export const useAjaxSubmits = (
    data: Record<string, any> = {},
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType,
    options?: {
        timeout?: number
        retryPolicy?: RetryPolicy
        fetchOptions?: RequestInit
    }
): Record<string, AjaxSubmitFn> => {
    const { apiServer, enableRenderingLog } = usePieConfig()
    const dataKey = JSON.stringify(data ?? {})
    const optionsKey = JSON.stringify(options)
    return useMemo(
        () => {
            const submits: Record<string, AjaxSubmitFn> = {}
            for (const ep of discoverAjaxEndpoints(data ?? {})) {
                submits[ep.key] = getAjaxSubmit(
                    setUiAjaxConfiguration,
                    ep.kwargs,
                    ep.depsNames,
                    ep.pathname,
                    {
                        apiServer,
                        renderingLogEnabled: enableRenderingLog,
                        timeout: options?.timeout,
                        retryPolicy: options?.retryPolicy,
                        fetchOptions: options?.fetchOptions,
                    }
                )
            }
            return submits
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            dataKey,
            setUiAjaxConfiguration,
            apiServer,
            enableRenderingLog,
            optionsKey,
        ]
    )
}
