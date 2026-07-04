/**
 * The `stored` resolver registry lets `PieCard` expose a `() => TStored` value
 * to an ajax submit: at submit time `readAjaxKey(cardName)` calls the resolver
 * instead of reading a hidden `<input>`. These tests exercise that resolution
 * path directly (registered keys never touch the DOM fallback).
 */

import { afterEach, describe, expect, test } from 'bun:test'
import {
    readAjaxKey,
    readAjaxKeyAsync,
    registerStoredResolver,
    unregisterStoredResolver,
} from '../util/ajaxCommonUtils'

const KEY = 'search'

afterEach(() => unregisterStoredResolver(KEY))

describe('stored resolver registry', () => {
    test('sync resolver supplies the value for a card name', async () => {
        registerStoredResolver(KEY, () => ['"hello"'])
        expect(readAjaxKey(KEY)).toEqual(['"hello"'])
        expect(await readAjaxKeyAsync(KEY)).toEqual(['"hello"'])
    })

    test('re-registering overwrites the resolver', () => {
        registerStoredResolver(KEY, () => ['first'])
        registerStoredResolver(KEY, () => ['second'])
        expect(readAjaxKey(KEY)).toEqual(['second'])
    })

    test('async resolver resolves only via readAjaxKeyAsync', async () => {
        registerStoredResolver(KEY, async () => ['async-val'])
        expect(readAjaxKey(KEY)).toEqual([]) // sync path can't await
        expect(await readAjaxKeyAsync(KEY)).toEqual(['async-val'])
    })
})
