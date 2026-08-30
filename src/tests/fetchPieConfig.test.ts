/**
 * `fetchPieConfig` — единственный путь рута за конфигом. Проверяем три вещи,
 * которые ломались, пока он был копипастой в каждом руте: прогрев
 * действительно экономит запрос, промах не мешает и виден в логе, а сетевой
 * путь ходит с куками по тому же URL.
 */

import { describe, test, expect } from 'bun:test'
import type { AxiosInstance } from 'axios'
import { fetchPieConfig } from '../util/fetchPieConfig'
import { buildContentUrl, type PieConfigPrefetch } from '../util/contentRequest'

const API = 'https://api.example.com'

const stubAxios = (data: unknown) => {
    const calls: Array<{ url: string; config: any }> = []
    const instance = {
        get: async (url: string, config: any) => {
            calls.push({ url, config })
            return { data }
        },
    } as unknown as AxiosInstance
    return { instance, calls }
}

const base = {
    apiServer: API,
    pathname: '/chat',
    search: '',
    root: 'web' as const,
    logPrefix: '[PieRoot]',
}

describe('fetchPieConfig', () => {
    test('uses a matching prefetch instead of hitting the network', async () => {
        const { instance, calls } = stubAxios({ card: 'FromNetwork' })
        const prefetch: PieConfigPrefetch = {
            url: buildContentUrl(base),
            promise: Promise.resolve('{"card":"FromPrefetch"}'),
        }
        const config = await fetchPieConfig({
            ...base,
            axiosInstance: instance,
            configPrefetch: prefetch,
        })
        expect((config as any).card).toBe('FromPrefetch')
        expect(calls.length).toBe(0)
    })

    test('falls back to the network on a miss and sends credentials', async () => {
        const { instance, calls } = stubAxios({ card: 'FromNetwork' })
        const prefetch: PieConfigPrefetch = {
            url: buildContentUrl({ ...base, pathname: '/other' }),
            promise: Promise.resolve('{"card":"FromPrefetch"}'),
        }
        const config = await fetchPieConfig({
            ...base,
            axiosInstance: instance,
            configPrefetch: prefetch,
        })
        expect((config as any).card).toBe('FromNetwork')
        expect(calls[0].url).toBe(buildContentUrl(base))
        expect(calls[0].config.withCredentials).toBe(true)
    })

    test('logs the miss when rendering log is on', async () => {
        const { instance } = stubAxios({ card: 'FromNetwork' })
        const lines: string[] = []
        const original = console.log
        console.log = (...args: unknown[]) => lines.push(args.join(' '))
        try {
            await fetchPieConfig({
                ...base,
                axiosInstance: instance,
                renderingLogEnabled: true,
                configPrefetch: {
                    url: buildContentUrl({ ...base, pathname: '/other' }),
                    promise: Promise.resolve(null),
                },
            })
        } finally {
            console.log = original
        }
        expect(lines.some((l) => l.includes('url mismatch'))).toBe(true)
        expect(lines.every((l) => l.startsWith('[PieRoot]'))).toBe(true)
    })

    test('includes initData in the url for mini-app roots', async () => {
        const { instance, calls } = stubAxios({ card: 'FromNetwork' })
        await fetchPieConfig({
            ...base,
            root: 'telegram',
            initData: 'q=1',
            axiosInstance: instance,
        })
        expect(calls[0].url).toContain('__pieroot=telegram')
        expect(calls[0].url).toContain('initData=q%3D1')
    })
    test('accepts a native platform id as the root kind', async () => {
        const { instance, calls } = stubAxios({ card: 'FromNetwork' })
        await fetchPieConfig({
            ...base,
            root: 'ios',
            axiosInstance: instance,
            logPrefix: '[PieNativeRoot]',
        })
        expect(calls[0].url).toBe(
            'https://api.example.com/api/content/chat?__pieroot=ios'
        )
    })
})
