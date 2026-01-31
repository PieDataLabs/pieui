#!/usr/bin/env node

import fs from 'fs'
import path from 'path'


const MANIFEST_FILENAME = 'pieui.components.json'

type ParsedArgs = {
    command: string
    outDir: string
}


const listRegisteredComponents = () => {
    return []
}


const parseArgs = (argv: string[]): ParsedArgs => {
    const [command = ''] = argv
    const outDirFlag = argv.find((arg) => arg.startsWith('--out-dir='))
    const outDirIndex = argv.findIndex((arg) => arg === '--out-dir' || arg === '-o')

    let outDir = 'dist'
    if (outDirFlag) {
        outDir = outDirFlag.split('=')[1] || outDir
    } else if (outDirIndex !== -1 && argv[outDirIndex + 1]) {
        outDir = argv[outDirIndex + 1]
    }

    return { command, outDir }
}

const printUsage = () => {
    console.log('Usage: pieui postbuild [--out-dir <dir>]')
    console.log('Generates pieui.components.json describing registered components in the build directory.')
}

const writeManifest = (outDir: string) => {
    const resolvedOutDir = path.resolve(process.cwd(), outDir)
    fs.mkdirSync(resolvedOutDir, { recursive: true })
    const manifestPath = path.join(resolvedOutDir, MANIFEST_FILENAME)

    const manifest = listRegisteredComponents()

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
    console.log(`[pieui] Component manifest saved to ${manifestPath}`)
}

const main = async () => {
    const { command, outDir } = parseArgs(process.argv.slice(2))

    if (command !== 'postbuild') {
        printUsage()
        process.exit(1)
    }

    try {
        writeManifest(outDir)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[pieui] Failed to generate component manifest: ${message}`)
        process.exit(1)
    }
}

void main()
