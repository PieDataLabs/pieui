/**
 * Сниппет исполняется в чужом `<head>` до загрузки бандла, поэтому его нельзя
 * проверить типами — только выполнив. Тесты гоняют его через `new Function`
 * с подставными `window` и `fetch` и проверяют ровно то, что отличает
 * рабочий прогрев от вредного: тот же URL, куки, отсев не-2xx и обещание
 * никогда не реджектиться.
 */

import { describe, test, expect } from 'bun:test'
import {
    buildConfigPrefetchScript,
    readConfigPrefetch,
    PIE_CONFIG_PREFETCH_GLOBAL,
} from '../util/configPrefetchScript'
import { buildContentUrl, consumeConfigPrefetch } from '../util/contentRequest'

const API = 'https://api.example.com'

type FetchCall = { url: string; init: RequestInit }

const runSnippet = (script: string, fetchImpl: (...a: any[]) => any) => {
    const win: any = {}
    const calls: FetchCall[] = []
    const spy = (url: string, init: RequestInit) => {
        calls.push({ url, init })
        return fetchImpl(url, init)
    }
    new Function('window', 'fetch', script)(win, spy)
    return { win, calls }
}

const response = (ok: boolean, body: string) => ({
    ok,
    text: async () => body,
})

describe('buildConfigPrefetchScript', () => {
    const params = {
        apiServer: API,
        pathname: '/chat',
        search: 'tab=all',
        root: 'web' as const,
    }
    const script = buildConfigPrefetchScript(params)

    test('warms exactly the url the root will request', () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(true, '{}'))
        )
        expect(win[PIE_CONFIG_PREFETCH_GLOBAL].url).toBe(buildContentUrl(params))
    })

    test('sends cookies, or the warmed config is an anonymous one', () => {
        const { calls } = runSnippet(script, () =>
            Promise.resolve(response(true, '{}'))
        )
        expect(calls[0].init.credentials).toBe('include')
    })

    test('resolves with the raw body on 2xx', async () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(true, '{"card":"ColCard"}'))
        )
        expect(await win[PIE_CONFIG_PREFETCH_GLOBAL].promise).toBe(
            '{"card":"ColCard"}'
        )
    })

    test('resolves with null on a non-2xx instead of handing over an error body', async () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(false, '{"detail":"boom"}'))
        )
        expect(await win[PIE_CONFIG_PREFETCH_GLOBAL].promise).toBeNull()
    })

    test('never rejects, so an unclaimed prefetch cannot raise unhandled', async () => {
        const { win } = runSnippet(script, () =>
            Promise.reject(new Error('offline'))
        )
        expect(await win[PIE_CONFIG_PREFETCH_GLOBAL].promise).toBeNull()
    })

    test('honours a custom global name', () => {
        const custom = buildConfigPrefetchScript({
            ...params,
            globalName: '__myPrefetch',
        })
        const { win } = runSnippet(custom, () =>
            Promise.resolve(response(true, '{}'))
        )
        expect(win.__myPrefetch).toBeDefined()
        expect(win[PIE_CONFIG_PREFETCH_GLOBAL]).toBeUndefined()
    })

    test('feeds the root end to end', async () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(true, '{"card":"ColCard"}'))
        )
        const previous = (globalThis as any).window
        ;(globalThis as any).window = win
        try {
            const config = await consumeConfigPrefetch(
                readConfigPrefetch(),
                buildContentUrl(params)
            )
            expect(config).toEqual({ card: 'ColCard' } as any)
        } finally {
            ;(globalThis as any).window = previous
        }
    })
})

describe('readConfigPrefetch', () => {
    test('ignores a global that is not a prefetch', () => {
        const previous = (globalThis as any).window
        ;(globalThis as any).window = { [PIE_CONFIG_PREFETCH_GLOBAL]: 'nope' }
        try {
            expect(readConfigPrefetch()).toBeUndefined()
        } finally {
            ;(globalThis as any).window = previous
        }
    })
})
