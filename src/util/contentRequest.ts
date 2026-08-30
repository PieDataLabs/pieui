import { UIConfigType } from '../types'
import { reviveDates } from './reviveDates'
import { joinApiPath } from './apiPath'

/**
 * Единый источник правды для запроса конфига страницы (`/api/content`).
 *
 * Раньше URL собирался копипастой в каждом руте (PieRoot / PieTelegramRoot /
 * PieMaxRoot). Пока запрос делал только сам рут, это было терпимо. Но хост
 * умеет прогревать этот запрос ДО загрузки бандла (см. {@link PieConfigPrefetch}),
 * а прогрев находят по точному совпадению URL — значит правило сборки обязано
 * быть ровно одно, иначе прогрев молча уходит впустую.
 */

/**
 * Идентификатор рута, который уезжает на бэкенд параметром `__pieroot`.
 * Нативный рут шлёт сюда `Platform.OS`, поэтому список не замкнут.
 */
export type PieRootKind =
    | 'telegram'
    | 'max'
    | 'web'
    | 'ios'
    | 'android'
    | (string & {})

export interface ContentUrlParams {
    /** Базовый URL API; завершающий слэш не важен. */
    apiServer: string
    pathname: string
    /** Строка запроса БЕЗ ведущего «?» — как отдаёт `URLSearchParams.toString()`. */
    search: string
    root: PieRootKind
    /** initData мини-аппа (Telegram / MAX). Для веб-рута не передаётся. */
    initData?: string | null
}

/**
 * Абсолютный URL запроса конфига. Абсолютный, а не относительный, именно чтобы
 * его можно было сравнить с тем, что прогрел хост; axios с абсолютным URL
 * работает так же (baseURL просто игнорируется).
 */
export function buildContentUrl({
    apiServer,
    pathname,
    search,
    root,
    initData,
}: ContentUrlParams): string {
    const params = new URLSearchParams(search)
    params.set('__pieroot', root)
    if (initData) {
        params.set('initData', initData)
    }
    const base = joinApiPath(apiServer, 'api/content')
    return `${base}${pathname}?${params.toString()}`
}

/**
 * Запрос конфига, который хост запустил заранее — до того, как загрузился и
 * сгидрировался бандл.
 *
 * Зачем. Рут просит конфиг из хука, то есть в самом раннем случае после
 * гидрации. На медленной сети это означает, что загрузка бандла и поход к
 * бэкенду идут строго последовательно (в замерах приложения — около 4.5 с на
 * Slow 4G до первого байта запроса). Хост может выстрелить тем же запросом из
 * инлайнового скрипта в <head>, параллельно загрузке бандла, и отдать сюда
 * промис — тогда рут заберёт готовый ответ вместо нового запроса.
 *
 * Собирать этот скрипт руками не нужно: `buildConfigPrefetchScript` отдаёт
 * готовую строку, которая соблюдает все требования ниже.
 *
 * Прогрев одноразовый: рефетчи (смена роута, `refetchOnMount`, ретраи
 * react-query) честно идут в сеть и не получают устаревший ответ.
 */
export interface PieConfigPrefetch {
    /** Абсолютный URL, по которому хост уже отправил запрос. */
    url: string
    /**
     * Тело ответа: сырой текст (предпочтительно — разбор и ревайв дат тогда
     * делает библиотека, ровно как для обычного ответа), уже разобранный
     * JSON, либо `null`, если хост увидел не-2xx или сетевую ошибку.
     *
     * Промис не должен реджектиться: рут может его не забрать (URL не совпал,
     * рут не смонтировался), и тогда реджект остаётся необработанным.
     * `buildConfigPrefetchScript` соблюдает это за хоста.
     */
    promise: Promise<UIConfigType | string | null>
    /** Дедлайн ожидания, мс. По умолчанию {@link PIE_PREFETCH_TIMEOUT_MS}. */
    timeoutMs?: number
    /** @deprecated Не читается: одноразовость ведётся внутри модуля. */
    used?: boolean
}

/** Сколько ждём прогрев, прежде чем пойти в сеть самим. */
export const PIE_PREFETCH_TIMEOUT_MS = 10000

export interface ConsumeConfigPrefetchOptions {
    /** Диагностика: вызывается с причиной, по которой прогрев не подошёл. */
    onDebug?: (message: string) => void
}

/** Одноразовость без мутации объекта, пришедшего React-пропом. */
const consumedPrefetches = new WeakSet<PieConfigPrefetch>()

const TIMED_OUT = Symbol('pie:prefetch-timeout')

function parsePrefetchBody(
    body: UIConfigType | string | null
): UIConfigType | null {
    if (body === null) {
        return null
    }
    const parsed = typeof body === 'string' ? JSON.parse(body) : body
    if (parsed === null || typeof parsed !== 'object') {
        return null
    }
    return reviveDates(parsed as UIConfigType)
}

/**
 * Отдаёт прогретый ответ, если он относится к этому же URL и ещё не был
 * использован. Во всех остальных случаях — `null`, и рут идёт в сеть сам.
 *
 * Промах никогда не ломает страницу: не тот URL, повторный вызов, не-2xx,
 * битый JSON, реджект и молчание дольше `timeoutMs` — всё это `null` плюс
 * запись в `onDebug`. Дедлайн здесь принципиален: без него зависший хостовый
 * `fetch` подвешивал бы `queryFn` навсегда, а ретраи react-query срабатывают
 * на реджект, а не на молчание.
 */
export async function consumeConfigPrefetch(
    prefetch: PieConfigPrefetch | undefined,
    url: string,
    options: ConsumeConfigPrefetchOptions = {}
): Promise<UIConfigType | null> {
    const { onDebug } = options
    if (!prefetch) {
        return null
    }
    if (consumedPrefetches.has(prefetch)) {
        onDebug?.('Prefetch already consumed, going to the network')
        return null
    }
    if (prefetch.url !== url) {
        onDebug?.(
            'Prefetch url mismatch, going to the network' +
                `\n  warmed:    ${prefetch.url}` +
                `\n  requested: ${url}`
        )
        return null
    }
    consumedPrefetches.add(prefetch)

    const timeoutMs = prefetch.timeoutMs ?? PIE_PREFETCH_TIMEOUT_MS
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs)
    })

    try {
        const body = await Promise.race([prefetch.promise, deadline])
        if (body === TIMED_OUT) {
            onDebug?.(
                `Prefetch did not settle in ${timeoutMs}ms, going to the network`
            )
            return null
        }
        const config = parsePrefetchBody(body)
        if (!config) {
            onDebug?.('Prefetch body is not a UI config, going to the network')
        }
        return config
    } catch (error) {
        onDebug?.(`Prefetch failed (${String(error)}), going to the network`)
        return null
    } finally {
        clearTimeout(timer)
    }
}
