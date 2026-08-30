import { UIConfigType } from '../types'

/**
 * Единый источник правды для запроса конфига страницы (`/api/content`).
 *
 * Раньше URL собирался копипастой в каждом руте (PieRoot / PieTelegramRoot /
 * PieMaxRoot). Пока запрос делал только сам рут, это было терпимо. Но хост
 * умеет прогревать этот запрос ДО загрузки бандла (см. {@link PieConfigPrefetch}),
 * а прогрев находят по точному совпадению URL — значит правило сборки обязано
 * быть ровно одно, иначе прогрев молча уходит впустую.
 */

/** Идентификатор рута, который уезжает на бэкенд параметром `__pieroot`. */
export type PieRootKind = 'telegram' | 'max' | 'web'

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
    const base = apiServer.replace(/\/$/, '')
    return `${base}/api/content${pathname}?${params.toString()}`
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
 * URL хост собирает через {@link buildContentUrl}, тем же вызовом, что и рут.
 *
 * Прогрев одноразовый: `used` взводится при первом же использовании, поэтому
 * рефетчи (смена роута, `refetchOnMount`, ретраи react-query) честно идут в
 * сеть и не получают устаревший ответ.
 */
export interface PieConfigPrefetch {
    /** Абсолютный URL, по которому хост уже отправил запрос. */
    url: string
    /** Промис с распарсенным телом ответа. */
    promise: Promise<UIConfigType>
    /** Служебное поле; выставляет рут. Хосту трогать не нужно. */
    used?: boolean
}

/**
 * Отдаёт прогретый ответ, если он относится к этому же URL и ещё не был
 * использован. Во всех остальных случаях — `null`, и рут идёт в сеть сам.
 *
 * Провалившийся прогрев (сеть моргнула, бэкенд ответил ошибкой) тоже даёт
 * `null`: это не повод ронять страницу, обычный запрос сделает вторую попытку.
 */
export async function consumeConfigPrefetch(
    prefetch: PieConfigPrefetch | undefined,
    url: string
): Promise<UIConfigType | null> {
    if (!prefetch || prefetch.used || prefetch.url !== url) {
        return null
    }
    prefetch.used = true
    try {
        return await prefetch.promise
    } catch {
        return null
    }
}
