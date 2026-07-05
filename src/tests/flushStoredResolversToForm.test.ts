/**
 * `flushStoredResolversToForm` mirrors function-`stored` resolvers into a form's
 * DOM as hidden inputs so a native `form.submit()` serializes their current
 * values. These tests exercise the DOM side-effects against an isolated
 * happy-dom form passed by element — no global `document` is swapped, so the
 * suite-wide test environment (and its globals) is left untouched.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import {
    flushStoredResolversToForm,
    registerStoredResolver,
    unregisterStoredResolver,
} from '../util/ajaxCommonUtils'

// happy-dom's isolated `Window` has no working CSS-selector engine, so tests
// read inputs via getElementsByTagName (matching how the flush itself avoids
// querySelector).
let win: Window
let form: any

const makeForm = () => {
    win = new Window()
    const el = win.document.createElement('form')
    win.document.body.appendChild(el)
    return el
}

const addInput = (attrs: Record<string, string>) => {
    const input = win.document.createElement('input')
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'data-pie-stored') input.setAttribute(k, v)
        else (input as any)[k] = v
    }
    form.appendChild(input)
    return input
}

const injected = () =>
    Array.from(form.getElementsByTagName('input'))
        .filter((el: any) => el.getAttribute('data-pie-stored') !== null)
        .map((el: any) => ({ name: el.name, value: el.value, type: el.type }))

const NAMES = ['search', 'other']
beforeEach(() => {
    form = makeForm()
})
afterEach(() => NAMES.forEach(unregisterStoredResolver))

describe('flushStoredResolversToForm', () => {
    test('injects a hidden input for a sync string resolver', () => {
        registerStoredResolver('search', () => ['"hello"'])

        flushStoredResolversToForm(form)

        expect(injected()).toEqual([
            { name: 'search', value: '"hello"', type: 'hidden' },
        ])
    })

    test('a second flush replaces rather than duplicates', () => {
        registerStoredResolver('search', () => ['"first"'])
        flushStoredResolversToForm(form)

        registerStoredResolver('search', () => ['"second"'])
        flushStoredResolversToForm(form)

        expect(injected()).toEqual([
            { name: 'search', value: '"second"', type: 'hidden' },
        ])
    })

    test('skips async (Promise) resolvers', () => {
        registerStoredResolver('search', async () => ['async'])

        flushStoredResolversToForm(form)

        expect(injected()).toEqual([])
    })

    test('skips File values but keeps string values', () => {
        const file = new win.File(['x'], 'x.txt')
        registerStoredResolver('search', () => [file as any, '"kept"'])

        flushStoredResolversToForm(form)

        expect(injected()).toEqual([
            { name: 'search', value: '"kept"', type: 'hidden' },
        ])
    })

    test('leaves a non-stored static hidden input untouched', () => {
        addInput({ type: 'hidden', name: 'plain', value: '"static"' })

        registerStoredResolver('search', () => ['"fn"'])
        flushStoredResolversToForm(form)
        flushStoredResolversToForm(form) // re-run: cleanup must not touch the static input

        const plain = Array.from(form.getElementsByTagName('input')).find(
            (el: any) => el.name === 'plain'
        ) as any
        expect(plain?.value).toBe('"static"')
        expect(injected()).toEqual([
            { name: 'search', value: '"fn"', type: 'hidden' },
        ])
    })

    test('no-op (no throw) when a missing id is passed', () => {
        registerStoredResolver('search', () => ['"hello"'])
        expect(() => flushStoredResolversToForm('does-not-exist')).not.toThrow()
    })
})
