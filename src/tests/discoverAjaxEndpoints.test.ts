/**
 * `discoverAjaxEndpoints` maps a card's `data` to one config per ajax endpoint,
 * by the same field-name convention the backend emits (primary `pathname` plus
 * named `<x>Pathname`). `useAjaxSubmits` builds a submit function per config.
 */

import { describe, expect, test } from 'bun:test'
import { discoverAjaxEndpoints } from '../util/ajaxCommonUtils'

describe('discoverAjaxEndpoints', () => {
    test('primary endpoint is keyed "default"', () => {
        const eps = discoverAjaxEndpoints({
            name: 'c',
            pathname: '/do',
            depsNames: ['user_id'],
            kwargs: { locale: 'en' },
        })
        expect(eps).toEqual([
            {
                key: 'default',
                pathname: '/do',
                depsNames: ['user_id'],
                kwargs: { locale: 'en' },
            },
        ])
    })

    test('named endpoints are keyed by their prefix', () => {
        const eps = discoverAjaxEndpoints({
            name: 'c',
            pathname: '/main',
            depsNames: ['user_id'],
            kwargs: {},
            searchPathname: '/search',
            searchDepsNames: ['q'],
            searchKwargs: { limit: 10 },
        })
        const byKey = Object.fromEntries(eps.map((e) => [e.key, e]))
        expect(Object.keys(byKey).sort()).toEqual(['default', 'search'])
        expect(byKey.search).toEqual({
            key: 'search',
            pathname: '/search',
            depsNames: ['q'],
            kwargs: { limit: 10 },
        })
    })

    test('missing deps/kwargs default to empty', () => {
        const eps = discoverAjaxEndpoints({ pathname: '/do' })
        expect(eps[0]).toEqual({
            key: 'default',
            pathname: '/do',
            depsNames: [],
            kwargs: {},
        })
    })

    test('cards without any endpoint yield nothing', () => {
        expect(discoverAjaxEndpoints({ name: 'c', title: 'x' })).toEqual([])
    })
})
