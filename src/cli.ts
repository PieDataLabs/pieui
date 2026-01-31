#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

const MANIFEST_FILENAME = 'pieui.components.json'
const REGISTER_PATTERN = /registerPieComponent\s*\(\s*\{\s*name\s*:\s*['"`]([^'"`]+)['"`]/g

type ParsedArgs = {
    command: string
    outDir: string
    srcDir: string
}

type ComponentManifestEntry = {
    name: string
    file: string
}

const parseArgs = (argv: string[]): ParsedArgs => {
    const [command = ''] = argv
    const outDirFlag = argv.find((arg) => arg.startsWith('--out-dir='))
    const srcDirFlag = argv.find((arg) => arg.startsWith('--src-dir='))
    const outDirIndex = argv.findIndex((arg) => arg === '--out-dir' || arg === '-o')
    const srcDirIndex = argv.findIndex((arg) => arg === '--src-dir' || arg === '-s')

    let outDir = 'dist'
    let srcDir = 'src'

    if (outDirFlag) {
        outDir = outDirFlag.split('=')[1] || outDir
    } else if (outDirIndex !== -1 && argv[outDirIndex + 1]) {
        outDir = argv[outDirIndex + 1]
    }

    if (srcDirFlag) {
        srcDir = srcDirFlag.split('=')[1] || srcDir
    } else if (srcDirIndex !== -1 && argv[srcDirIndex + 1]) {
        srcDir = argv[srcDirIndex + 1]
    }

    return { command, outDir, srcDir }
}

const printUsage = () => {
    console.log('Usage: pieui postbuild [--out-dir <dir>] [--src-dir <dir>]')
    console.log('Scans the project for registerPieComponent calls and writes pieui.components.json into the build directory.')
}

const readFileSafe = (filepath: string): string => {
    try {
        return fs.readFileSync(filepath, 'utf8')
    } catch {
        return ''
    }
}

const isLikelyName = (name: string) => {
    const noise = new Set(['component', 'registration'])
    return !noise.has(name)
}

const extractNamesFromSource = (source: string): string[] => {
    const names = new Set<string>()

    let match
    while ((match = REGISTER_PATTERN.exec(source))) {
        names.add(match[1])
    }
    return Array.from(names)
}

const discoverRegisteredComponents = async (srcDir: string): Promise<ComponentManifestEntry[]> => {
    const files = await glob(`${srcDir}/**/*.{ts,tsx,js,jsx}`, {
        ignore: ['**/*.d.ts', '**/dist/**', '**/node_modules/**', '**/registry.ts', '**/registry.tsx'],
    })

    const entries = new Map<string, string>()

    files.forEach((file) => {
        const source = readFileSafe(file)
        const names = extractNamesFromSource(source)

        names.forEach((name) => {
            if (!entries.has(name)) {
                const relativePath = path.relative(process.cwd(), file)
                entries.set(name, relativePath)
            }
        })
    })

    return Array.from(entries.entries())
        .map(([name, file]) => ({ name, file }))
        .sort((a, b) => a.name.localeCompare(b.name))
}

const writeManifest = (outDir: string, components: ComponentManifestEntry[]) => {
    const resolvedOutDir = path.resolve(process.cwd(), outDir)
    fs.mkdirSync(resolvedOutDir, { recursive: true })
    const manifestPath = path.join(resolvedOutDir, MANIFEST_FILENAME)
    fs.writeFileSync(manifestPath, JSON.stringify(components, null, 2), 'utf8')
    console.log(`[pieui] Component manifest saved to ${manifestPath}`)
}

const main = async () => {
    const { command, outDir, srcDir } = parseArgs(process.argv.slice(2))

    if (command !== 'postbuild') {
        printUsage()
        process.exit(1)
    }

    try {
        const components = await discoverRegisteredComponents(srcDir)
        writeManifest(outDir, components)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[pieui] Failed to generate component manifest: ${message}`)
        process.exit(1)
    }
}

void main()
