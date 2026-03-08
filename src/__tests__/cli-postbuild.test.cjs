const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const writeFile = (filePath, contents) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, contents, 'utf8')
}

const resolveCliCommand = (repoRoot) => {
    const bunCheck = spawnSync('bun', ['--version'], { stdio: 'ignore' })
    if (bunCheck.status === 0) {
        return {
            cmd: ['bun', path.join(repoRoot, 'src', 'cli.ts')],
            cwd: repoRoot,
        }
    }

    const distCli = path.join(repoRoot, 'dist', 'cli.js')
    if (fs.existsSync(distCli)) {
        return { cmd: ['node', distCli], cwd: repoRoot }
    }

    throw new Error(
        'Cannot find dist/cli.js and bun is not available. Run `bun run build:cli` or install bun.'
    )
}

const runPostbuild = (cwd, outDir) => {
    const repoRoot = path.resolve(__dirname, '../..')
    const { cmd } = resolveCliCommand(repoRoot)

    const result = spawnSync(
        cmd[0],
        [...cmd.slice(1), 'postbuild', '--src-dir', 'src', '--out-dir', outDir],
        {
            cwd,
            env: {
                ...process.env,
                NODE_PATH: path.join(repoRoot, 'node_modules'),
            },
            stdio: 'pipe',
        }
    )

    if (result.status !== 0) {
        const stdout = result.stdout ? result.stdout.toString() : ''
        const stderr = result.stderr ? result.stderr.toString() : ''
        throw new Error(
            `postbuild failed (exit ${result.status})\n${stdout}\n${stderr}`
        )
    }
}

test('cli postbuild schema overrides', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pieui-postbuild-'))
    const srcDir = path.join(tempDir, 'src')
    const outDir = path.join(tempDir, 'out')

    writeFile(
        path.join(tempDir, 'node_modules', '@types', 'react', 'index.d.ts'),
        `declare module 'react' {
    export interface CSSProperties {
        color?: string
        width?: string | number
    }
}
`
    )

    writeFile(
        path.join(srcDir, 'TestCard.tsx'),
        `import { CSSProperties } from 'react'

export interface TestCardData {
    name: string
    sx?: CSSProperties
    kwargs?: Record<string, string>
    meta?: Record<string, any>
}

const TestCard = ({ data }: { data: TestCardData }) => null

const registerPieComponent = (_: any) => undefined

registerPieComponent({
    name: 'TestCard',
    component: TestCard,
})
`
    )

    runPostbuild(tempDir, outDir)

    const manifestPath = path.join(outDir, 'pieui.components.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const entry = manifest.find((item) => item.card === 'TestCard')

    assert.ok(entry)

    const schema = entry.data
    const sxSchema = schema.properties?.sx
    const kwargsSchema = schema.properties?.kwargs
    const metaSchema = schema.properties?.meta

    assert.equal(sxSchema?.type, 'object')
    assert.deepEqual(sxSchema?.additionalProperties, {})
    assert.equal(sxSchema?.properties, undefined)

    assert.equal(kwargsSchema?.type, 'object')
    assert.deepEqual(kwargsSchema?.additionalProperties, { type: 'string' })

    assert.equal(metaSchema?.type, 'object')
    assert.ok(metaSchema?.additionalProperties)
    assert.notEqual(metaSchema?.additionalProperties, false)
})

test('cli postbuild generates shadcn registry artifacts', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pieui-shadcn-'))
    const srcDir = path.join(tempDir, 'src')
    const outDir = path.join(tempDir, 'out')

    writeFile(
        path.join(tempDir, 'node_modules', '@types', 'react', 'index.d.ts'),
        `declare module 'react' {
    export interface CSSProperties {
        color?: string
        width?: string | number
    }
}
`
    )

    writeFile(
        path.join(srcDir, 'TestCard.tsx'),
        `import { CSSProperties } from 'react'

export interface TestCardData {
    name: string
    sx?: CSSProperties
}

const TestCard = ({ data }: { data: TestCardData }) => null

const registerPieComponent = (_: any) => undefined

registerPieComponent({
    name: 'TestCard',
    component: TestCard,
})
`
    )

    writeFile(
        path.join(srcDir, 'components', 'index.ts'),
        `export { default as TestCard } from '../TestCard'
`
    )

    runPostbuild(tempDir, outDir)

    const registryPath = path.join(outDir, 'registry.json')
    const shadcnIndexPath = path.join(outDir, 'r', 'index.json')
    const shadcnItemPath = path.join(outDir, 'r', 'test-card.json')

    assert.ok(fs.existsSync(registryPath))
    assert.ok(fs.existsSync(shadcnIndexPath))
    assert.ok(fs.existsSync(shadcnItemPath))

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
    const shadcnIndex = JSON.parse(fs.readFileSync(shadcnIndexPath, 'utf8'))
    const shadcnItem = JSON.parse(fs.readFileSync(shadcnItemPath, 'utf8'))

    assert.equal(registry.name, '@piedata/pieui')
    assert.equal(shadcnIndex[0]?.name, 'test-card')
    assert.equal(shadcnItem.type, 'registry:component')
    assert.equal(shadcnItem.files?.[0]?.type, 'registry:component')
    assert.match(
        shadcnItem.files?.[0]?.content || '',
        /@piedata\/pieui\/components/
    )
})
