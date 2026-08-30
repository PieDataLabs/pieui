/**
 * Ревайв дат в прогретом конфиге обязан совпадать с тем, что делает
 * `axios-date-transformer` с обычным ответом рута: иначе одна и та же
 * страница отдаёт картам `Date` или `string` в зависимости от того,
 * успел ли хост прогреть запрос.
 */

import { describe, test, expect } from 'bun:test'
import { reviveDates, isIsoDateString } from '../util/reviveDates'

describe('isIsoDateString', () => {
    test('accepts the formats axios-date-transformer accepts', () => {
        expect(isIsoDateString('2026-08-31')).toBe(true)
        expect(isIsoDateString('2026-08-31T12:00:00Z')).toBe(true)
        expect(isIsoDateString('2026-08-31T12:00:00.123+03:00')).toBe(true)
    })

    test('rejects anything else', () => {
        expect(isIsoDateString('31.08.2026')).toBe(false)
        expect(isIsoDateString('ColCard')).toBe(false)
        expect(isIsoDateString(20260831)).toBe(false)
        expect(isIsoDateString(null)).toBe(false)
    })
})

describe('reviveDates', () => {
    test('converts nested and arrayed date strings, leaves the rest alone', () => {
        const config = {
            card: 'ColCard',
            data: { createdAt: '2026-08-31T12:00:00Z', title: 'Hi' },
            content: [
                { card: 'TextCard', data: { at: '2026-08-30' } },
                { card: 'TextCard', data: { at: 'not-a-date' } },
            ],
        }

        const revived = reviveDates(config) as any

        expect(revived.data.createdAt).toBeInstanceOf(Date)
        expect(revived.data.createdAt.toISOString()).toBe(
            '2026-08-31T12:00:00.000Z'
        )
        expect(revived.data.title).toBe('Hi')
        expect(revived.content[0].data.at).toBeInstanceOf(Date)
        expect(revived.content[1].data.at).toBe('not-a-date')
    })

    test('is safe on null, primitives and already-revived values', () => {
        expect(reviveDates(null)).toBeNull()
        expect(reviveDates('2026-08-31')).toBe('2026-08-31')
        const withDate = { at: new Date('2026-08-31T00:00:00Z') }
        expect(reviveDates(withDate).at).toBeInstanceOf(Date)
    })
})
