# Config Prefetch Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `configPrefetch` безопасным по умолчанию: прогрев больше не может подвесить страницу, подменить авторизованный конфиг анонимным, отдать картам `string` вместо `Date` или молча уйти впустую.

**Architecture:** Три сдвига. (1) Контракт с хостом перестаёт быть словесным: библиотека сама генерирует инлайновый сниппет (`buildConfigPrefetchScript`), который шлёт запрос с нужными `credentials`, проверяет статус и никогда не реджектится — хост только вставляет строку в `<head>`. (2) `consumeConfigPrefetch` становится по-настоящему защитным: гонка с таймаутом, разбор и ревайв дат так же, как это делает axios-инстанс рута, диагностика промаха, одноразовость без мутации пропа. (3) Копипаста `queryFn` из четырёх рутов уезжает в общий `fetchPieConfig`, куда наконец включается и `PieNativeRoot`.

**Tech Stack:** TypeScript, React 18/19, @tanstack/react-query v5, axios + axios-date-transformer, bun test, prettier.

**Spec:** этот же документ, раздел «Спецификация: что чиним» ниже.

## Global Constraints

- Форматирование — `prettier.config.mjs`: `tabWidth: 4`, `semi: false`, `singleQuote: true`, `printWidth: 80`, `trailingComma: 'es5'`. После правок гонять `bun run lint`.
- Тесты — `bun test` (preload `./src/tests/setup.ts`), файлы кладутся в `src/tests/*.test.ts`. RTL/jsdom в проекте нет: React-компоненты тестами не покрываем, вся логика выносится в чистые модули и тестируется там.
- Типы — `bun run typecheck` (`tsc --noEmit`) должен быть зелёным на каждом коммите.
- Язык комментариев — как в соседнем коде: `src/util/contentRequest.ts` и новые util-модули комментируются по-русски, JSDoc в `src/components/PieRoot/types/index.ts` — по-английски.
- Публичный API не ломаем: `PieConfigPrefetch`, `buildContentUrl`, `consumeConfigPrefetch` уже экспортированы из `src/index.ts` (версия пакета 3.0.11). Поля можно добавлять и помечать `@deprecated`, удалять — нет.
- Никаких новых зависимостей.

---

## Спецификация: что чиним

| #   | Проблема                                                                                                                          | Где                                                             | Задача |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| 1   | `await prefetch.promise` без таймаута: зависший хостовый `fetch` навсегда вешает `queryFn`, ретраи react-query не срабатывают     | `src/util/contentRequest.ts:89`                                 | 2      |
| 2   | Прогретое тело не проходит ревайв дат, который axios-инстанс рута делает через `createAxiosDateTransformer`                       | `src/components/PieRoot/index.tsx:52` vs `contentRequest.ts:89` | 1, 2   |
| 3   | Статус ответа не проверяется: тело ошибки 500 будет принято как `UIConfigType`                                                    | контракт с хостом                                               | 3      |
| 4   | `withCredentials: true` у рута против дефолтного `same-origin` у `fetch`: прогрев может подменить авторизованный конфиг анонимным | контракт с хостом                                               | 3      |
| 5   | Промах прогрева абсолютно молчалив — логируется только попадание                                                                  | `contentRequest.ts:85`, роуты                                   | 2, 4   |
| 6   | Реджект прогрева, который рут не забрал, остаётся необработанным (`Unhandled promise rejection`)                                  | `contentRequest.ts:85`                                          | 2, 3   |
| 7   | `prefetch.used = true` мутирует объект, пришедший React-пропом                                                                    | `contentRequest.ts:88`                                          | 2      |
| 8   | `PieNativeRoot` собирает URL мимо `buildContentUrl` и не знает про прогрев; `PieRootKind` не покрывает `Platform.OS`              | `src/native/PieNativeRoot.tsx:67`                               | 5      |
| 9   | `apiServer` трактуется двумя способами: `buildContentUrl` срезает хвостовой слэш, `action` формы и ajax-эндпоинт его требуют      | `PieRoot/index.tsx:187`, `ajaxCommonUtils.ts:617`               | 6      |
| 10  | Для Telegram/MAX прогрев требует готовый `initData` в `<head>` — ограничение нигде не описано                                     | `PieTelegramRoot/index.tsx:83`                                  | 3, 7   |

---

## Файловая структура

**Создаём:**

- `src/util/reviveDates.ts` — рекурсивный ISO→`Date` по правилу `axios-date-transformer`. Одна ответственность, ноль зависимостей.
- `src/util/configPrefetchScript.ts` — генератор инлайнового сниппета и чтение прогрева из `window`. Отделено от `contentRequest.ts`, потому что это код _для хоста_, а не для рута.
- `src/util/fetchPieConfig.ts` — общий `queryFn` всех рутов (URL + прогрев + axios + логи).
- `src/util/apiPath.ts` — `joinApiPath`, единая склейка `apiServer` с путём.
- Тесты: `src/tests/reviveDates.test.ts`, `src/tests/configPrefetchScript.test.ts`, `src/tests/fetchPieConfig.test.ts`, `src/tests/apiPath.test.ts`.

**Меняем:**

- `src/util/contentRequest.ts` — тип `PieConfigPrefetch`, тело `consumeConfigPrefetch`, `PieRootKind`.
- `src/components/{PieRoot,PieTelegramRoot,PieMaxRoot}/index.tsx`, `src/native/PieNativeRoot.tsx` — переход на `fetchPieConfig`.
- `src/components/PieBaseRoot/index.tsx`, `src/util/ajaxCommonUtils.ts` — `joinApiPath`.
- `src/components/PieRoot/types/index.ts` — JSDoc `configPrefetch`.
- `src/index.ts`, `README.md` — экспорты и документация.
- `src/tests/contentRequest.test.ts` — новые кейсы.

---

### Task 1: `reviveDates` — паритет с axios-date-transformer

Прогретое тело приходит из хостового `fetch`, а не через axios-инстанс рута, поэтому ISO-строки в нём остаются строками. Нужен отдельный ревайвер по тому же правилу, иначе одна и та же страница отдаёт картам `Date` на холодном пути и `string` на прогретом.

**Files:**

- Create: `src/util/reviveDates.ts`
- Test: `src/tests/reviveDates.test.ts`

**Interfaces:**

- Consumes: ничего.
- Produces: `reviveDates<T>(data: T): T`, `isIsoDateString(value: unknown): value is string`, константа `ISO_DATE_RE: RegExp`.

- [ ] **Step 1: Write the failing test**

Создать `src/tests/reviveDates.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/tests/reviveDates.test.ts`
Expected: FAIL — `Cannot find module '../util/reviveDates'`.

- [ ] **Step 3: Write minimal implementation**

Создать `src/util/reviveDates.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/tests/reviveDates.test.ts && bun run typecheck`
Expected: PASS, типы чистые.

- [ ] **Step 5: Commit**

```bash
git add src/util/reviveDates.ts src/tests/reviveDates.test.ts
git commit -m "feat(prefetch): add reviveDates for bodies that bypass axios"
```

---

### Task 2: Защитный `consumeConfigPrefetch`

Гонка с таймаутом (проблема 1), нормализация и ревайв тела (2), диагностика промаха (5), одноразовость без мутации пропа (7), контракт «промис не реджектится» (6).

**Files:**

- Modify: `src/util/contentRequest.ts:45-96`
- Test: `src/tests/contentRequest.test.ts` (дописать блоки)

**Interfaces:**

- Consumes: `reviveDates` из Task 1.
- Produces:
    - `type PieRootKind = 'telegram' | 'max' | 'web' | 'ios' | 'android' | (string & {})`
    - `interface PieConfigPrefetch { url: string; promise: Promise<UIConfigType | string | null>; timeoutMs?: number; used?: boolean }`
    - `const PIE_PREFETCH_TIMEOUT_MS = 10000`
    - `interface ConsumeConfigPrefetchOptions { onDebug?: (message: string) => void }`
    - `consumeConfigPrefetch(prefetch: PieConfigPrefetch | undefined, url: string, options?: ConsumeConfigPrefetchOptions): Promise<UIConfigType | null>`

- [ ] **Step 1: Write the failing test**

Дописать в конец `src/tests/contentRequest.test.ts` (существующие блоки не трогать — они должны остаться зелёными):

```ts
describe('consumeConfigPrefetch hardening', () => {
    const url = buildContentUrl({
        apiServer: API,
        pathname: '/chat',
        search: '',
        root: 'web',
    })

    test('parses a raw-text body and revives its dates', async () => {
        const body = JSON.stringify({
            card: 'ColCard',
            data: { createdAt: '2026-08-31T12:00:00Z' },
        })
        const config = await consumeConfigPrefetch(prefetch(url, body), url)
        expect((config as any).data.createdAt).toBeInstanceOf(Date)
    })

    test('revives dates in an already-parsed body too', async () => {
        const body = { card: 'ColCard', data: { createdAt: '2026-08-31' } }
        const config = await consumeConfigPrefetch(
            prefetch(url, body as any),
            url
        )
        expect((config as any).data.createdAt).toBeInstanceOf(Date)
    })

    test('a null body means the host saw a bad response', async () => {
        expect(await consumeConfigPrefetch(prefetch(url, null), url)).toBeNull()
    })

    test('malformed json falls through instead of throwing', async () => {
        expect(
            await consumeConfigPrefetch(prefetch(url, '<html>502</html>'), url)
        ).toBeNull()
    })

    test('a hanging prefetch gives up on its deadline', async () => {
        const started = Date.now()
        const hanging: PieConfigPrefetch = {
            url,
            promise: new Promise(() => {}),
            timeoutMs: 50,
        }
        expect(await consumeConfigPrefetch(hanging, url)).toBeNull()
        expect(Date.now() - started).toBeLessThan(1000)
    })

    test('does not mutate the caller-owned object to mark it used', async () => {
        const p = prefetch(url, CONFIG)
        await consumeConfigPrefetch(p, url)
        expect(Object.isFrozen(p)).toBe(false)
        const frozen = Object.freeze(prefetch(url, CONFIG))
        expect(await consumeConfigPrefetch(frozen, url)).not.toBeNull()
        expect(await consumeConfigPrefetch(frozen, url)).toBeNull()
    })

    test('reports every miss through onDebug', async () => {
        const seen: string[] = []
        const onDebug = (m: string) => seen.push(m)
        const other = buildContentUrl({
            apiServer: API,
            pathname: '/profile',
            search: '',
            root: 'web',
        })
        await consumeConfigPrefetch(prefetch(other, CONFIG), url, { onDebug })
        const reused = prefetch(url, CONFIG)
        await consumeConfigPrefetch(reused, url, { onDebug })
        await consumeConfigPrefetch(reused, url, { onDebug })

        expect(seen.length).toBe(2)
        expect(seen[0]).toContain('/profile')
        expect(seen[0]).toContain('/chat')
        expect(seen[1]).toContain('consumed')
    })
})
```

Поменять хелпер `prefetch` в шапке файла, чтобы он принимал любое тело:

```ts
const prefetch = (url: string, body: UIConfigType | string | null) =>
    ({ url, promise: Promise.resolve(body) }) as PieConfigPrefetch
```

Существующие тесты передавали `Promise.resolve(CONFIG)` / `Promise.reject(...)` — переписать их на новый хелпер, а кейс с реджектом оставить с явным объектом:

```ts
test('a rejected prefetch yields null instead of throwing', async () => {
    const p: PieConfigPrefetch = {
        url,
        promise: Promise.reject(new Error('offline')),
    }
    expect(await consumeConfigPrefetch(p, url)).toBeNull()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/tests/contentRequest.test.ts`
Expected: FAIL — даты остаются строками, зависший прогрев висит (тест на таймаут не завершается), `Object.freeze` роняет присваивание `used`.

- [ ] **Step 3: Write minimal implementation**

В `src/util/contentRequest.ts`: добавить импорт `import { reviveDates } from './reviveDates'`, расширить `PieRootKind`, заменить блок `PieConfigPrefetch` + `consumeConfigPrefetch` на:

```ts
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

/** Сколько ждём прогрев, прежде чем пойти в сеть самим. */
export const PIE_PREFETCH_TIMEOUT_MS = 10000

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/tests/contentRequest.test.ts && bun run typecheck`
Expected: PASS, включая все ранее существовавшие кейсы.

- [ ] **Step 5: Commit**

```bash
git add src/util/contentRequest.ts src/tests/contentRequest.test.ts
git commit -m "fix(prefetch): add deadline, body parsing and miss diagnostics"
```

---

### Task 3: Генератор инлайнового сниппета

Убирает словесный контракт с хостом: `credentials`, проверка статуса и «промис не реджектится» перестают быть тем, что хост должен помнить (проблемы 3, 4, 6). Заодно гарантирует побайтовое совпадение URL, потому что обе стороны зовут `buildContentUrl`.

**Files:**

- Create: `src/util/configPrefetchScript.ts`
- Test: `src/tests/configPrefetchScript.test.ts`
- Modify: `src/index.ts:55-63`

**Interfaces:**

- Consumes: `buildContentUrl`, `ContentUrlParams`, `PieConfigPrefetch` (Task 2).
- Produces:
    - `const PIE_CONFIG_PREFETCH_GLOBAL = '__pieConfigPrefetch'`
    - `interface ConfigPrefetchScriptParams extends ContentUrlParams { globalName?: string }`
    - `buildConfigPrefetchScript(params: ConfigPrefetchScriptParams): string`
    - `readConfigPrefetch(globalName?: string): PieConfigPrefetch | undefined`

- [ ] **Step 1: Write the failing test**

Создать `src/tests/configPrefetchScript.test.ts`:

```ts
/**
 * Сниппет исполняется в чужом `<head>` до загрузки бандла, поэтому его нельзя
 * проверить типами — только выполнив. Тесты гоняют его через `new Function`
 * с подставными `window` и `fetch` и проверяют ровно то, что отличает
 * рабочий прогрев от вредного: тот же URL, куки, отсев не-2xx и обещание
 * никогда не реджектиться.
 */

import { describe, test, expect } from 'bun:test'
import {
    buildConfigPrefetchScript,
    readConfigPrefetch,
    PIE_CONFIG_PREFETCH_GLOBAL,
} from '../util/configPrefetchScript'
import { buildContentUrl, consumeConfigPrefetch } from '../util/contentRequest'

const API = 'https://api.example.com'

type FetchCall = { url: string; init: RequestInit }

const runSnippet = (script: string, fetchImpl: (...a: any[]) => any) => {
    const win: any = {}
    const calls: FetchCall[] = []
    const spy = (url: string, init: RequestInit) => {
        calls.push({ url, init })
        return fetchImpl(url, init)
    }
    new Function('window', 'fetch', script)(win, spy)
    return { win, calls }
}

const response = (ok: boolean, body: string) => ({
    ok,
    text: async () => body,
})

describe('buildConfigPrefetchScript', () => {
    const params = {
        apiServer: API,
        pathname: '/chat',
        search: 'tab=all',
        root: 'web' as const,
    }
    const script = buildConfigPrefetchScript(params)

    test('warms exactly the url the root will request', () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(true, '{}'))
        )
        expect(win[PIE_CONFIG_PREFETCH_GLOBAL].url).toBe(
            buildContentUrl(params)
        )
    })

    test('sends cookies, or the warmed config is an anonymous one', () => {
        const { calls } = runSnippet(script, () =>
            Promise.resolve(response(true, '{}'))
        )
        expect(calls[0].init.credentials).toBe('include')
    })

    test('resolves with the raw body on 2xx', async () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(true, '{"card":"ColCard"}'))
        )
        expect(await win[PIE_CONFIG_PREFETCH_GLOBAL].promise).toBe(
            '{"card":"ColCard"}'
        )
    })

    test('resolves with null on a non-2xx instead of handing over an error body', async () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(false, '{"detail":"boom"}'))
        )
        expect(await win[PIE_CONFIG_PREFETCH_GLOBAL].promise).toBeNull()
    })

    test('never rejects, so an unclaimed prefetch cannot raise unhandled', async () => {
        const { win } = runSnippet(script, () =>
            Promise.reject(new Error('offline'))
        )
        expect(await win[PIE_CONFIG_PREFETCH_GLOBAL].promise).toBeNull()
    })

    test('honours a custom global name', () => {
        const custom = buildConfigPrefetchScript({
            ...params,
            globalName: '__myPrefetch',
        })
        const { win } = runSnippet(custom, () =>
            Promise.resolve(response(true, '{}'))
        )
        expect(win.__myPrefetch).toBeDefined()
        expect(win[PIE_CONFIG_PREFETCH_GLOBAL]).toBeUndefined()
    })

    test('feeds the root end to end', async () => {
        const { win } = runSnippet(script, () =>
            Promise.resolve(response(true, '{"card":"ColCard"}'))
        )
        const previous = (globalThis as any).window
        ;(globalThis as any).window = win
        try {
            const config = await consumeConfigPrefetch(
                readConfigPrefetch(),
                buildContentUrl(params)
            )
            expect(config).toEqual({ card: 'ColCard' } as any)
        } finally {
            ;(globalThis as any).window = previous
        }
    })
})

describe('readConfigPrefetch', () => {
    test('ignores a global that is not a prefetch', () => {
        const previous = (globalThis as any).window
        ;(globalThis as any).window = { [PIE_CONFIG_PREFETCH_GLOBAL]: 'nope' }
        try {
            expect(readConfigPrefetch()).toBeUndefined()
        } finally {
            ;(globalThis as any).window = previous
        }
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/tests/configPrefetchScript.test.ts`
Expected: FAIL — `Cannot find module '../util/configPrefetchScript'`.

- [ ] **Step 3: Write minimal implementation**

Создать `src/util/configPrefetchScript.ts`:

````ts
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
    /** Имя глобальной переменной. По умолчанию {@link PIE_CONFIG_PREFETCH_GLOBAL}. */
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
````

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/tests/configPrefetchScript.test.ts && bun run typecheck`
Expected: PASS.

- [ ] **Step 5: Export from the package root**

В `src/index.ts` заменить блок экспортов прогрева (строки 55–63) на:

```ts
// Ранний запрос конфига страницы. `buildConfigPrefetchScript` отдаёт готовый
// инлайновый скрипт для `<head>`: он собирает URL тем же `buildContentUrl`,
// что и рут, шлёт куки и не реджектится. См. util/contentRequest.
export {
    buildContentUrl,
    consumeConfigPrefetch,
    PIE_PREFETCH_TIMEOUT_MS,
} from './util/contentRequest'
export type {
    PieConfigPrefetch,
    PieRootKind,
    ContentUrlParams,
    ConsumeConfigPrefetchOptions,
} from './util/contentRequest'
export {
    buildConfigPrefetchScript,
    readConfigPrefetch,
    PIE_CONFIG_PREFETCH_GLOBAL,
} from './util/configPrefetchScript'
export type { ConfigPrefetchScriptParams } from './util/configPrefetchScript'
```

Run: `bun test && bun run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/util/configPrefetchScript.ts src/tests/configPrefetchScript.test.ts src/index.ts
git commit -m "feat(prefetch): ship the inline warm-up snippet from the library"
```

---

### Task 4: Общий `fetchPieConfig` для веб-рутов

Одинаковый `queryFn` живёт в трёх файлах, и правки прогрева пришлось бы вносить трижды. Заодно подключается чтение прогрева из `window` и логи промаха (проблема 5).

**Files:**

- Create: `src/util/fetchPieConfig.ts`
- Test: `src/tests/fetchPieConfig.test.ts`
- Modify: `src/components/PieRoot/index.tsx:69-112`, `src/components/PieTelegramRoot/index.tsx:73-120`, `src/components/PieMaxRoot/index.tsx:70-118`

**Interfaces:**

- Consumes: `buildContentUrl`, `consumeConfigPrefetch` (Task 2), `readConfigPrefetch` (Task 3).
- Produces:
    - `interface FetchPieConfigParams { axiosInstance: AxiosInstance; apiServer: string; pathname: string; search: string; root: PieRootKind; initData?: string | null; configPrefetch?: PieConfigPrefetch; logPrefix: string; renderingLogEnabled?: boolean }`
    - `fetchPieConfig(params: FetchPieConfigParams): Promise<UIConfigType>`

- [ ] **Step 1: Write the failing test**

Создать `src/tests/fetchPieConfig.test.ts`:

```ts
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/tests/fetchPieConfig.test.ts`
Expected: FAIL — `Cannot find module '../util/fetchPieConfig'`.

- [ ] **Step 3: Write minimal implementation**

Создать `src/util/fetchPieConfig.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/tests/fetchPieConfig.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewire the three web roots**

В каждом из `src/components/{PieRoot,PieTelegramRoot,PieMaxRoot}/index.tsx`:

1. Заменить импорт
    ```ts
    import {
        buildContentUrl,
        consumeConfigPrefetch,
    } from '../../util/contentRequest'
    ```
    на
    ```ts
    import { fetchPieConfig } from '../../util/fetchPieConfig'
    ```
2. Заменить всё тело `queryFn` (от `queryFn: async () => {` до закрывающей `},` перед `staleTime`) на вызов хелпера. Для `PieRoot`:

```ts
        queryFn: () =>
            fetchPieConfig({
                axiosInstance,
                apiServer,
                pathname: location.pathname,
                search: location.search,
                root: 'web',
                configPrefetch,
                logPrefix: '[PieRoot]',
                renderingLogEnabled,
            }),
```

Для `PieTelegramRoot` — то же самое с `root: 'telegram'`, `initData: webApp?.initData`, `logPrefix: '[PieTelegramRoot]'`.
Для `PieMaxRoot` — `root: 'max'`, `initData: webApp?.initData`, `logPrefix: '[PieMaxRoot]'`.

(Префиксы логов в Telegram- и MAX-рутах сейчас ошибочно говорят `[PieRoot]` — это чинится тем же движением.)

- [ ] **Step 6: Verify nothing else regressed**

Run: `bun test && bun run typecheck && bun run lint`
Expected: PASS; в рутах не осталось неиспользованных импортов (`buildContentUrl`, `consumeConfigPrefetch`).

- [ ] **Step 7: Commit**

```bash
git add src/util/fetchPieConfig.ts src/tests/fetchPieConfig.test.ts src/components/PieRoot/index.tsx src/components/PieTelegramRoot/index.tsx src/components/PieMaxRoot/index.tsx
git commit -m "refactor(roots): route every config request through fetchPieConfig"
```

---

### Task 5: `PieNativeRoot` возвращается в общий путь

Нативный рут собирает URL руками (`src/native/PieNativeRoot.tsx:67`) — ровно та копипаста, ради устранения которой заводился `buildContentUrl`.

**Files:**

- Modify: `src/native/PieNativeRoot.tsx:59-89`
- Test: `src/tests/fetchPieConfig.test.ts` (дописать кейс)

**Interfaces:**

- Consumes: `fetchPieConfig` (Task 4), расширенный `PieRootKind` (Task 2).
- Produces: ничего нового.

- [ ] **Step 1: Write the failing test**

Дописать в `src/tests/fetchPieConfig.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/tests/fetchPieConfig.test.ts`
Expected: PASS по значению, но `bun run typecheck` до Task 2 падал бы на `'ios'`. Если после Task 2 тест зелёный сразу — это ожидаемо, он фиксирует контракт для шага 3.

- [ ] **Step 3: Rewire the native root**

В `src/native/PieNativeRoot.tsx`:

1. Добавить импорт:
    ```ts
    import { fetchPieConfig } from '../util/fetchPieConfig'
    ```
2. Заменить тело `queryFn` (строки ~65–89) на:

```ts
        queryFn: () =>
            fetchPieConfig({
                axiosInstance,
                apiServer,
                pathname: location.pathname,
                search: location.search,
                // Нативный аналог `telegram` / `max`: сообщаем серверу ОС.
                root: Platform.OS,
                configPrefetch,
                logPrefix: '[PieNativeRoot]',
                renderingLogEnabled,
            }),
```

3. Добавить `configPrefetch` в деструктуризацию пропсов `PieNativeRootContent` (сейчас там `location, fallback, piecache, onError, queryOptions`).

Заголовок `'Content-type': 'application/json'` на GET без тела уходит вместе со старым кодом — на нативе он и так ничего не давал.

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test && bun run typecheck`
Expected: PASS. `Platform.OS` типизируется как `string` и подходит под `PieRootKind` благодаря `(string & {})`.

- [ ] **Step 5: Commit**

```bash
git add src/native/PieNativeRoot.tsx src/tests/fetchPieConfig.test.ts
git commit -m "fix(native): build the config url through buildContentUrl"
```

---

### Task 6: Одна склейка `apiServer` с путём

`buildContentUrl` срезает хвостовой слэш, а `action` глобальной формы и ajax-эндпоинт его требуют (`apiServer + 'api/process'`). Формат `apiServer` из-за этого неоднозначен — а от него зависит побайтовое совпадение прогретого URL.

**Files:**

- Create: `src/util/apiPath.ts`
- Test: `src/tests/apiPath.test.ts`
- Modify: `src/util/contentRequest.ts` (внутри `buildContentUrl`), `src/util/ajaxCommonUtils.ts:617`, `src/components/PieRoot/index.tsx:185-189`, `src/components/PieTelegramRoot/index.tsx:184-188`, `src/components/PieMaxRoot/index.tsx:182-186`, `src/components/PieBaseRoot/index.tsx:62-66`

**Interfaces:**

- Consumes: ничего.
- Produces: `joinApiPath(apiServer: string, path: string): string`

- [ ] **Step 1: Write the failing test**

Создать `src/tests/apiPath.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/tests/apiPath.test.ts`
Expected: FAIL — `Cannot find module '../util/apiPath'`.

- [ ] **Step 3: Write minimal implementation**

Создать `src/util/apiPath.ts`:

```ts
/**
 * Склейка базового URL API с путём.
 *
 * `apiServer` в разных хостах написан и со слэшем на конце, и без; половина
 * кода раньше клеила его встык (`apiServer + 'api/process'`) и ломалась на
 * варианте без слэша, а `buildContentUrl` слэш срезал. Правило теперь одно.
 */
export function joinApiPath(apiServer: string, path: string): string {
    return `${apiServer.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/tests/apiPath.test.ts`
Expected: PASS.

- [ ] **Step 5: Use it everywhere**

1. `src/util/contentRequest.ts` — в `buildContentUrl` заменить
    ```ts
    const base = apiServer.replace(/\/$/, '')
    return `${base}/api/content${pathname}?${params.toString()}`
    ```
    на
    ```ts
    return `${joinApiPath(apiServer, 'api/content')}${pathname}?${params.toString()}`
    ```
    плюс импорт `import { joinApiPath } from './apiPath'`.
2. `src/util/ajaxCommonUtils.ts:617` —
    ```ts
    const apiEndpoint = joinApiPath(apiServer, 'api/ajax_content') + pathname
    ```
3. В четырёх рутах `action={apiServer + 'api/process' + location.pathname}` →
    ```tsx
    action={joinApiPath(apiServer, 'api/process') + location.pathname}
    ```

- [ ] **Step 6: Run the whole suite**

Run: `bun test && bun run typecheck && bun run lint`
Expected: PASS, включая существующие `contentRequest.test.ts` (URL-строки не меняются для входа со слэшем и без).

- [ ] **Step 7: Commit**

```bash
git add src/util/apiPath.ts src/tests/apiPath.test.ts src/util/contentRequest.ts src/util/ajaxCommonUtils.ts src/components/PieRoot/index.tsx src/components/PieTelegramRoot/index.tsx src/components/PieMaxRoot/index.tsx src/components/PieBaseRoot/index.tsx
git commit -m "refactor: join apiServer with api paths through one helper"
```

---

### Task 7: Документация прогрева

Механизм, который либо экономит секунды, либо не делает ничего, обязан быть описан с рабочим примером и честным списком ограничений (проблема 10).

**Files:**

- Modify: `src/components/PieRoot/types/index.ts:63-79`
- Modify: `README.md` (новый раздел после `## Root components`, строка ~176; плюс строка в `### Runtime exports`, ~668)

**Interfaces:**

- Consumes: всё из задач 2–5.
- Produces: ничего исполняемого.

- [ ] **Step 1: Update the prop JSDoc**

В `src/components/PieRoot/types/index.ts` заменить JSDoc над `configPrefetch` на:

```ts
/**
 * Config request the host already started before the bundle finished
 * loading, so the request overlaps bundle download instead of queueing
 * behind it. Build it with `buildConfigPrefetchScript` and inline the
 * result in `<head>`; the root then picks the prefetch up from `window`
 * on its own, and this prop is only needed for a custom `globalName` or
 * a hand-rolled prefetch.
 *
 * A hand-rolled prefetch must match `buildContentUrl` byte for byte, send
 * `credentials: 'include'`, resolve to `null` on a non-2xx response, and
 * never reject. Any mismatch is a silent no-op — enable
 * `enableRenderingLog` to see the reason.
 *
 * Single use, and never load-bearing: a stale, failed, slow (see
 * `PIE_PREFETCH_TIMEOUT_MS`) or malformed prefetch falls through to a
 * normal request.
 *
 * Telegram and MAX roots include `initData` in the URL and only fire once
 * the mini-app SDK has produced it, so a `<head>` prefetch there requires
 * the SDK to be loaded first and the exact same `initData` string.
 *
 * @see {@link PieConfigPrefetch}
 * @see buildConfigPrefetchScript
 */
```

- [ ] **Step 2: Add the README section**

Вставить после `### Platform roots` (перед `## Registering components`):

````markdown
### Warming the config request

The root asks for its `UIConfig` from a hook — that is, after hydration — so on
a slow connection the bundle download and the API round trip are serialised.
Inline the warm-up snippet in `<head>` and the two overlap:

```tsx
import { buildConfigPrefetchScript } from '@swarm.ing/pieui'

;<script
    dangerouslySetInnerHTML={{
        __html: buildConfigPrefetchScript({
            apiServer: process.env.NEXT_PUBLIC_PIE_API_SERVER!,
            pathname,
            search,
            root: 'web',
        }),
    }}
/>
```

The snippet stores `{ url, promise }` on `window.__pieConfigPrefetch`; the root
picks it up automatically. It sends cookies, treats a non-2xx as a miss and
never rejects, so a failed warm-up can only cost you a normal request.

| Behaviour      | Detail                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Matching       | Exact URL string, built by `buildContentUrl` on both sides. A mismatch is a silent no-op — turn on `enableRenderingLog` to see it. |
| Single use     | Refetches (route change, `refetchOnMount`, retries) always go to the network.                                                      |
| Deadline       | `PIE_PREFETCH_TIMEOUT_MS` (10 s), overridable per prefetch via `timeoutMs`.                                                        |
| Scope          | One URL, one page load. Use a module-singleton `queryClient` to keep configs across remounts.                                      |
| Telegram / MAX | The URL carries `initData`, so the snippet only works once the mini-app SDK has produced the same string.                          |
````

В `### Runtime exports` добавить строки таблицы:

```markdown
| `buildConfigPrefetchScript()` | Inline `<head>` snippet that warms the page-config request. |
| `buildContentUrl()` | The single rule for assembling the page-config URL. |
| `readConfigPrefetch()` | Reads a warmed prefetch off `window`. |
```

- [ ] **Step 3: Verify**

Run: `bun run lint && bun run typecheck && bun test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/PieRoot/types/index.ts README.md
git commit -m "docs(prefetch): document the warm-up snippet and its limits"
```

---

## Проверка после всех задач

```bash
bun test && bun run typecheck && bun run lint && bun run build
```

Ручная проверка на приложении-хосте: открыть страницу с DevTools → Network, убедиться, что `api/content` уходит до загрузки бандла и что рут второго запроса не делает; затем с `enableRenderingLog: true` увидеть в консоли `[PieRoot] Using prefetched UI configuration`.
