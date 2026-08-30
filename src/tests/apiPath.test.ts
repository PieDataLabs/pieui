/**
 * `apiServer` приходит из хостовой конфигурации и в разных проектах написан
 * со слэшем на конце и без. Пока склейка была копипастой, половина мест ждала
 * слэш (`apiServer + 'api/process'`), а `buildContentUrl` его срезал.
 */

import { describe, test, expect } from 'bun:test'
import { joinApiPath } from '../util/apiPath'

describe('joinApiPath', () => {
    test('gives the same result with or without a trailing slash', () => {
        expect(joinApiPath('https://api.example.com', 'api/process')).toBe(
            'https://api.example.com/api/process'
        )
        expect(joinApiPath('https://api.example.com/', 'api/process')).toBe(
            'https://api.example.com/api/process'
        )
    })

    test('tolerates a leading slash on the path', () => {
        expect(joinApiPath('https://api.example.com/', '/api/process')).toBe(
            'https://api.example.com/api/process'
        )
    })

    test('keeps a relative api server usable', () => {
        expect(joinApiPath('', 'api/process/chat')).toBe('/api/process/chat')
    })
})
