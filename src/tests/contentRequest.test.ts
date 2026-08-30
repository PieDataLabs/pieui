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

const prefetch = (url: string, promise: Promise<UIConfigType>) =>
    ({ url, promise }) as PieConfigPrefetch

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
        const p = prefetch(url, Promise.resolve(CONFIG))
        expect(await consumeConfigPrefetch(p, url)).toBe(CONFIG)
    })

    test('serves it only once, so refetches go to the network', async () => {
        const p = prefetch(url, Promise.resolve(CONFIG))
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
        const p = prefetch(other, Promise.resolve(CONFIG))
        expect(await consumeConfigPrefetch(p, url)).toBeNull()
        // Не тронут — значит достанется тому руту, для которого он грелся.
        expect(p.used).toBeUndefined()
    })

    test('a rejected prefetch yields null instead of throwing', async () => {
        const p = prefetch(url, Promise.reject(new Error('offline')))
        expect(await consumeConfigPrefetch(p, url)).toBeNull()
    })

    test('no prefetch at all is not an error', async () => {
        expect(await consumeConfigPrefetch(undefined, url)).toBeNull()
    })
})
