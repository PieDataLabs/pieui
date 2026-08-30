import { AxiosInstance } from 'axios'
import { UIConfigType } from '../types'
import {
    buildContentUrl,
    consumeConfigPrefetch,
    PieConfigPrefetch,
    PieRootKind,
} from './contentRequest'
import { readConfigPrefetch } from './configPrefetchScript'

/**
 * Единственный путь рута за конфигом страницы.
 *
 * Раньше этот блок был копипастой в четырёх рутах, и любая правка прогрева
 * требовала четырёх одинаковых редактирований — а `PieNativeRoot` от них
 * отставал и собирал URL по-своему.
 */
export interface FetchPieConfigParams {
    axiosInstance: AxiosInstance
    apiServer: string
    pathname: string
    search: string
    root: PieRootKind
    /** initData мини-аппа (Telegram / MAX). */
    initData?: string | null
    /** Прогрев от хоста. Если не передан, читается из `window`. */
    configPrefetch?: PieConfigPrefetch
    /** Префикс логов, например `[PieTelegramRoot]`. */
    logPrefix: string
    renderingLogEnabled?: boolean
}

export async function fetchPieConfig({
    axiosInstance,
    apiServer,
    pathname,
    search,
    root,
    initData,
    configPrefetch,
    logPrefix,
    renderingLogEnabled,
}: FetchPieConfigParams): Promise<UIConfigType> {
    const url = buildContentUrl({ apiServer, pathname, search, root, initData })
    const log = renderingLogEnabled
        ? (message: string, ...rest: unknown[]) =>
              console.log(`${logPrefix} ${message}`, ...rest)
        : undefined

    // Хост мог выстрелить этим же запросом до загрузки бандла — тогда
    // забираем готовый ответ вместо второго похода в сеть.
    const prefetched = await consumeConfigPrefetch(
        configPrefetch ?? readConfigPrefetch(),
        url,
        { onDebug: log }
    )
    if (prefetched) {
        log?.('Using prefetched UI configuration')
        return prefetched
    }

    log?.(`Fetching UI configuration from: ${url}`)
    // Никаких `Access-Control-Allow-*` и `Content-type` здесь нет. Первые два —
    // заголовки ОТВЕТА, в запросе они бессмысленны; `Content-type` на GET без
    // тела тоже. При этом ни один из трёх не входит в CORS-safelist, поэтому
    // браузер был обязан перед каждым запросом сходить preflight'ом OPTIONS —
    // лишний round-trip на холодном открытии ради заголовков, которые ни на
    // что не влияли.
    const response = await axiosInstance.get(url, { withCredentials: true })
    log?.('Received UI configuration:', response.data)
    return response.data
}
