import {
    buildContentUrl,
    ContentUrlParams,
    PieConfigPrefetch,
} from './contentRequest'

/**
 * Ранний запрос конфига — код, который исполняется в `<head>` хоста ДО того,
 * как загрузился бандл. Импортировать из библиотеки там нечего, поэтому
 * сниппет отдаётся строкой: так `credentials`, проверка статуса и правило
 * сборки URL остаются в библиотеке, а не в памяти того, кто пишет layout.
 *
 * Next.js:
 *
 * ```tsx
 * <script
 *     dangerouslySetInnerHTML={{
 *         __html: buildConfigPrefetchScript({
 *             apiServer: process.env.NEXT_PUBLIC_PIE_API_SERVER!,
 *             pathname,
 *             search,
 *             root: 'web',
 *         }),
 *     }}
 * />
 * ```
 *
 * Рут подхватит прогрев из `window` сам; передавать его пропом
 * `configPrefetch` нужно только при нестандартном `globalName`.
 */

/** Имя глобальной переменной, куда сниппет кладёт прогрев. */
export const PIE_CONFIG_PREFETCH_GLOBAL = '__pieConfigPrefetch'

export interface ConfigPrefetchScriptParams extends ContentUrlParams {
    /**
     * Имя глобальной переменной. По умолчанию
     * {@link PIE_CONFIG_PREFETCH_GLOBAL}.
     */
    globalName?: string
}

/**
 * Строка JS для инлайнового `<script>`. Заголовков не шлём намеренно: любой
 * несейфлистовый заголовок заставил бы браузер сходить preflight'ом OPTIONS и
 * съел бы весь выигрыш.
 */
export function buildConfigPrefetchScript({
    globalName = PIE_CONFIG_PREFETCH_GLOBAL,
    ...urlParams
}: ConfigPrefetchScriptParams): string {
    const url = JSON.stringify(buildContentUrl(urlParams))
    const name = JSON.stringify(globalName)
    return (
        '(function(){var u=' +
        url +
        ';window[' +
        name +
        ']={url:u,promise:fetch(u,{credentials:"include"})' +
        '.then(function(r){return r.ok?r.text():null})' +
        '.catch(function(){return null})};})()'
    )
}

/**
 * Читает прогрев, положенный сниппетом. Чужой или недоделанный объект
 * игнорируется — рут просто сходит в сеть.
 */
export function readConfigPrefetch(
    globalName: string = PIE_CONFIG_PREFETCH_GLOBAL
): PieConfigPrefetch | undefined {
    if (typeof window === 'undefined') {
        return undefined
    }
    const candidate = (window as unknown as Record<string, unknown>)[globalName]
    if (!candidate || typeof candidate !== 'object') {
        return undefined
    }
    const { url, promise } = candidate as Partial<PieConfigPrefetch>
    if (typeof url !== 'string' || typeof promise?.then !== 'function') {
        return undefined
    }
    return candidate as PieConfigPrefetch
}
