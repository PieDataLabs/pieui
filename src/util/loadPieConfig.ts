import { UIConfigType } from '../types'
import { buildContentUrl, PieRootKind } from './contentRequest'

/**
 * Конфиг страницы, полученный НА СЕРВЕРЕ.
 *
 * Зачем это нужно. Рут просит конфиг из хука, то есть уже после гидрации: в
 * HTML, который отдаёт сервер, страницы нет — там пустой контейнер и запасной
 * скелет. Человеку это стоит одного лишнего похода в сеть, а поисковому роботу
 * — всей страницы: он видит пустой div и индексировать ему нечего.
 *
 * Функция изоморфная и намеренно на `fetch`, а не на axios: её вызывают из
 * серверного компонента, где ни `window`, ни инстанса axios нет. Результат
 * отдаётся руту пропом `initialConfig` — он рендерит дерево сразу, в том же
 * проходе, а клиент потом гидрируется поверх готовой разметки.
 *
 * Мини-аппам это не подходит по природе: `initData` есть только в браузере
 * внутри клиента, и на сервере запрос от имени пользователя не собрать. SSR
 * имеет смысл там, где страница публичная и одинаковая для всех, — витрины,
 * разборы по ссылке, лендинги.
 */

/**
 * `RequestInit` плюс расширение Next.js.
 *
 * Тип `next` в стандартном `RequestInit` не описан, а именно им хост задаёт
 * ревалидацию — без этого поля пришлось бы приводить объект через `as`, теряя
 * проверку остальных.
 */
export type PieRequestInit = RequestInit & {
    next?: { revalidate?: number | false; tags?: string[] }
}

export interface LoadPieConfigParams {
    /** Базовый URL API. */
    apiServer: string
    pathname: string
    /** Строка запроса БЕЗ ведущего «?». */
    search?: string
    /** Какой рут запрашивает конфиг. По умолчанию `web`. */
    root?: PieRootKind
    /**
     * Что делать с кэшем. Пробрасывается в `fetch` как есть, поэтому в Next.js
     * работают и `next: { revalidate }`, и `cache: 'no-store'` — режим
     * инвалидации выбирает хост, а не библиотека.
     */
    requestInit?: PieRequestInit
    /** Таймаут запроса, мс. По умолчанию 10 000. */
    timeoutMs?: number
}

/**
 * Забрать конфиг страницы на сервере.
 *
 * Бросает, если бэкенд ответил не 2xx: страница обязана решить сама, показать
 * ли 404, отдать пустую оболочку или упасть, — молча вернуть `null` значило бы
 * отдать роботу пустую страницу с кодом 200.
 */
export async function loadPieConfig({
    apiServer,
    pathname,
    search = '',
    root = 'web',
    requestInit,
    timeoutMs = 10000,
}: LoadPieConfigParams): Promise<UIConfigType> {
    const url = buildContentUrl({ apiServer, pathname, search, root })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const response = await fetch(url, {
            // Заголовок обязателен: тот же эндпоинт умеет отдавать и HTML.
            headers: { Accept: 'application/json' },
            signal: controller.signal,
            ...requestInit,
        })
        if (!response.ok) {
            throw new Error(
                `pieui: config request failed with ${response.status} for ${url}`
            )
        }
        return (await response.json()) as UIConfigType
    } finally {
        clearTimeout(timer)
    }
}
