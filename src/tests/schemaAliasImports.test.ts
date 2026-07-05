/**
 * A card whose props type imports a value object through a tsconfig path alias
 * (e.g. `@/piecomponents/Shared/types`) must resolve to a typed schema — not
 * degrade to `{ type: 'object' }`.
 *
 * Regression: schema generation built the TS program without the project's
 * `baseUrl`/`paths`, so alias imports never resolved, the imported file never
 * entered the program, and `HoldingRefData[]` collapsed to `object`. This broke
 * cross-side `check-sync` (Python array ↔ TS object).
 */

import { describe, test, expect } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildCardMetadata } from '../code/commands/cardDumpMetadata'

const mkTempDir = (prefix: string) =>
    fs.mkdtempSync(path.join(os.tmpdir(), prefix))

const runWithEnv = <T>(
    env: Record<string, string | undefined>,
    fn: () => T
): T => {
    const prev: Record<string, string | undefined> = {}
    for (const [k, v] of Object.entries(env)) {
        prev[k] = process.env[k]
        if (v === undefined) delete process.env[k]
        else process.env[k] = v
    }
    try {
        return fn()
    } finally {
        for (const [k, v] of Object.entries(prev)) {
            if (v === undefined) delete process.env[k]
            else process.env[k] = v
        }
    }
}

const write = (file: string, content: string) => {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content, 'utf8')
}

describe('schema generation — path-aliased imports', () => {
    test('a prop typed as an alias-imported interface[] resolves to a typed array', () => {
        const base = mkTempDir('pieui-alias-')
        const components = path.join(base, 'piecomponents')

        // tsconfig with the `@/*` alias, like a real Next.js pieui project.
        write(
            path.join(base, 'tsconfig.json'),
            JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } })
        )

        // Shared value object, imported by the card via the alias.
        write(
            path.join(components, 'Shared', 'types', 'index.ts'),
            `export interface HoldingRefData {\n  symbol: string\n  network: string\n}\n`
        )

        // The card's props type imports the shared type through `@/`.
        write(
            path.join(components, 'HomeBalanceCard', 'types', 'index.ts'),
            `import type { HoldingRefData } from '@/piecomponents/Shared/types'\n\n` +
                `export interface HomeBalanceCardData {\n` +
                `  name: string\n` +
                `  holdings?: HoldingRefData[]\n` +
                `}\n`
        )
        write(
            path.join(components, 'HomeBalanceCard', 'ui', 'HomeBalanceCard.tsx'),
            `'use client'\n` +
                `const HomeBalanceCard = ({ data }: any) => <PieCard card="HomeBalanceCard" />\n` +
                `export default HomeBalanceCard\n`
        )
        write(
            path.join(components, 'HomeBalanceCard', 'index.ts'),
            `export { default } from './ui/HomeBalanceCard'\n`
        )

        const meta = runWithEnv({ PIE_COMPONENTS_DIR: components }, () =>
            buildCardMetadata('HomeBalanceCard')
        )

        const holdings = (meta.propsSchema as any).properties.holdings
        expect(holdings.type).toBe('array')
        expect(holdings.items.type).toBe('object')
        expect(Object.keys(holdings.items.properties).sort()).toEqual([
            'network',
            'symbol',
        ])
    })
})
