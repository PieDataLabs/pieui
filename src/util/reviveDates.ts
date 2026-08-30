/**
 * Ревайв ISO-строк в `Date` для тел, которые пришли мимо axios.
 *
 * Роуты ходят за конфигом инстансом `createAxiosDateTransformer`, который
 * рекурсивно превращает ISO-строки в `Date`. Прогрев (см. `contentRequest`)
 * приходит из хостового `fetch` и этой обработки не проходит, поэтому правило
 * продублировано здесь — регулярка намеренно совпадает с регуляркой
 * `axios-date-transformer`, чтобы оба пути давали одинаковый конфиг.
 */

export const ISO_DATE_RE =
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:[-+]\d{2}:?\d{2}|Z)?)?$/

/** ISO-строка ли это по правилу axios-date-transformer. */
export const isIsoDateString = (value: unknown): value is string =>
    typeof value === 'string' && ISO_DATE_RE.test(value)

/**
 * Обходит структуру на месте и заменяет ISO-строки на `Date`.
 * Примитивы и `null` возвращаются как есть.
 */
export function reviveDates<T>(data: T): T {
    if (data === null || typeof data !== 'object') {
        return data
    }
    if (data instanceof Date) {
        return data
    }
    const record = data as unknown as Record<string, unknown>
    for (const key of Object.keys(record)) {
        const value = record[key]
        if (isIsoDateString(value)) {
            record[key] = new Date(value)
        } else if (value !== null && typeof value === 'object') {
            record[key] = reviveDates(value)
        }
    }
    return data
}
