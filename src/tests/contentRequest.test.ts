/**
 * Unit tests for `util/contentRequest.ts`.
 *
 * Two things here are worth guarding with tests.
 *
 * `buildContentUrl` is the single rule for assembling the page-config URL, and
 * the whole prefetch mechanism hinges on it: the host warms a URL before the
 * bundle loads and the root matches it by exact string. Any drift — parameter
 * order, a stray slash, encoding — silently costs a second round trip instead
 * of failing loudly, so the exact output is asserted rather than merely parsed.
 *
 * `consumeConfigPrefetch` guards a cache: it must hand the warmed response over
 * exactly once and never substitute it for a different URL or a refetch.
 */

import { describe, test, expect } from 'bun:test'
import {
    buildContentUrl,
    consumeConfigPrefetch,
    type PieConfigPrefetch,
} from '../util/contentRequest'
import type { UIConfigType } from '../types'

const API = 'https://api.example.com'
const CONFIG = { card: 'ColCard' } as unknown as UIConfigType

const prefetch = (url: string, body: UIConfigType | string | null) =>
    ({ url, promise: Promise.resolve(body) }) as PieConfigPrefetch

describe('buildContentUrl', () => {
    test('appends __pieroot for the web root', () => {
        expect(
            buildContentUrl({
                apiServer: API,
                pathname: '/chat',
                search: '',
                root: 'web',
            })
        ).toBe('https://api.example.com/api/content/chat?__pieroot=web')
    })

    test('keeps existing query params and appends its own after them', () => {
        expect(
            buildContentUrl({
                apiServer: API,
                pathname: '/topics',
                search: 'tab=all&sort=new',
                root: 'telegram',
                initData: 'q=1&hash=abc',
            })
        ).toBe(
            'https://api.example.com/api/content/topics' +
                '?tab=all&sort=new&__pieroot=telegram&initData=q%3D1%26hash%3Dabc'
        )
    })

    test('tolerates a trailing slash on apiServer', () => {
        expect(
            buildContentUrl({
                apiServer: 'https://api.example.com/',
                pathname: '/chat',
                search: '',
                root: 'max',
            })
        ).toBe('https://api.example.com/api/content/chat?__pieroot=max')
    })

    test('omits initData when absent, empty or null', () => {
        for (const initData of [undefined, '', null]) {
            expect(
                buildContentUrl({
                    apiServer: API,
                    pathname: '/chat',
                    search: '',
                    root: 'telegram',
                    initData,
                })
            ).toBe(
                'https://api.example.com/api/content/chat?__pieroot=telegram'
            )
        }
    })

    test('is stable: same input yields the same string', () => {
        const args = {
            apiServer: API,
            pathname: '/chat',
            search: 'a=1',
            root: 'telegram' as const,
            initData: 'x',
        }
        expect(buildContentUrl(args)).toBe(buildContentUrl(args))
    })
})

describe('consumeConfigPrefetch', () => {
    const url = buildContentUrl({
        apiServer: API,
        pathname: '/chat',
        search: '',
        root: 'web',
    })

    test('returns the warmed config when the url matches', async () => {
        const p = prefetch(url, CONFIG)
        expect(await consumeConfigPrefetch(p, url)).toBe(CONFIG)
    })

    test('serves it only once, so refetches go to the network', async () => {
        const p = prefetch(url, CONFIG)
        expect(await consumeConfigPrefetch(p, url)).toBe(CONFIG)
        expect(await consumeConfigPrefetch(p, url)).toBeNull()
    })

    test('ignores a prefetch warmed for a different url', async () => {
        const other = buildContentUrl({
            apiServer: API,
            pathname: '/profile',
            search: '',
            root: 'web',
        })
        const p = prefetch(other, CONFIG)
        expect(await consumeConfigPrefetch(p, url)).toBeNull()
        // Не тронут — значит достанется тому руту, для которого он грелся.
        expect(p.used).toBeUndefined()
    })

    test('a rejected prefetch yields null instead of throwing', async () => {
        const p: PieConfigPrefetch = {
            url,
            promise: Promise.reject(new Error('offline')),
        }
        expect(await consumeConfigPrefetch(p, url)).toBeNull()
    })

    test('no prefetch at all is not an error', async () => {
        expect(await consumeConfigPrefetch(undefined, url)).toBeNull()
    })
})

describe('consumeConfigPrefetch hardening', () => {
    const url = buildContentUrl({
        apiServer: API,
        pathname: '/chat',
        search: '',
        root: 'web',
    })

    test('parses a raw-text body and revives its dates', async () => {
        const body = JSON.stringify({
            card: 'ColCard',
            data: { createdAt: '2026-08-31T12:00:00Z' },
        })
        const config = await consumeConfigPrefetch(prefetch(url, body), url)
        expect((config as any).data.createdAt).toBeInstanceOf(Date)
    })

    test('revives dates in an already-parsed body too', async () => {
        const body = { card: 'ColCard', data: { createdAt: '2026-08-31' } }
        const config = await consumeConfigPrefetch(
            prefetch(url, body as any),
            url
        )
        expect((config as any).data.createdAt).toBeInstanceOf(Date)
    })

    test('a null body means the host saw a bad response', async () => {
        expect(await consumeConfigPrefetch(prefetch(url, null), url)).toBeNull()
    })

    test('malformed json falls through instead of throwing', async () => {
        expect(
            await consumeConfigPrefetch(prefetch(url, '<html>502</html>'), url)
        ).toBeNull()
    })

    test('a hanging prefetch gives up on its deadline', async () => {
        const started = Date.now()
        const hanging: PieConfigPrefetch = {
            url,
            promise: new Promise(() => {}),
            timeoutMs: 50,
        }
        expect(await consumeConfigPrefetch(hanging, url)).toBeNull()
        expect(Date.now() - started).toBeLessThan(1000)
    })

    test('does not mutate the caller-owned object to mark it used', async () => {
        const p = prefetch(url, CONFIG)
        await consumeConfigPrefetch(p, url)
        expect(Object.isFrozen(p)).toBe(false)
        const frozen = Object.freeze(prefetch(url, CONFIG))
        expect(await consumeConfigPrefetch(frozen, url)).not.toBeNull()
        expect(await consumeConfigPrefetch(frozen, url)).toBeNull()
    })

    test('reports every miss through onDebug', async () => {
        const seen: string[] = []
        const onDebug = (m: string) => seen.push(m)
        const other = buildContentUrl({
            apiServer: API,
            pathname: '/profile',
            search: '',
            root: 'web',
        })
        await consumeConfigPrefetch(prefetch(other, CONFIG), url, { onDebug })
        const reused = prefetch(url, CONFIG)
        await consumeConfigPrefetch(reused, url, { onDebug })
        await consumeConfigPrefetch(reused, url, { onDebug })

        expect(seen.length).toBe(2)
        expect(seen[0]).toContain('/profile')
        expect(seen[0]).toContain('/chat')
        expect(seen[1]).toContain('consumed')
    })
})
