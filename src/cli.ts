#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import * as ts from 'typescript'

const MANIFEST_FILENAME = 'pieui.components.json'
const REGISTER_FUNCTION = 'registerPieComponent'

type ParsedArgs = {
    command: string
    outDir: string
    srcDir: string
}

type ComponentManifestEntry = {
    card: string
    data: Record<string, string>
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
    console.log('Scans for registerPieComponent calls and writes pieui.components.json with data prop types.')
}

const getPropertyName = (name: ts.PropertyName): string | null => {
    if (ts.isIdentifier(name)) return name.text
    if (ts.isStringLiteralLike(name)) return name.text
    if (ts.isNumericLiteral(name)) return name.text
    return null
}

const getStringLiteralValue = (node: ts.Expression): string | null => {
    if (ts.isStringLiteralLike(node)) return node.text
    return null
}

const getCompilerOptions = (): ts.CompilerOptions => {
    const baseOptions: ts.CompilerOptions = {
        allowJs: true,
        checkJs: false,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
    }

    const configPath =
        ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json') ||
        ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'jsconfig.json')

    if (!configPath) return baseOptions

    const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
    if (configFile.error) return baseOptions

    const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
    )

    return { ...baseOptions, ...parsed.options }
}

const unwrapExpression = (expression: ts.Expression): ts.Expression => {
    let current = expression
    while (
        ts.isAsExpression(current) ||
        ts.isTypeAssertionExpression(current) ||
        ts.isParenthesizedExpression(current) ||
        ts.isNonNullExpression(current) ||
        ts.isSatisfiesExpression(current)
    ) {
        current = current.expression
    }

    if (ts.isCallExpression(current) && current.arguments.length > 0) {
        const candidate = current.arguments[0]
        if (
            ts.isIdentifier(candidate) ||
            ts.isArrowFunction(candidate) ||
            ts.isFunctionExpression(candidate) ||
            ts.isCallExpression(candidate) ||
            ts.isParenthesizedExpression(candidate)
        ) {
            return unwrapExpression(candidate)
        }
    }

    return current
}

const getPropsTypeFromComponent = (
    expression: ts.Expression,
    checker: ts.TypeChecker
): ts.Type | null => {
    const getPropsFromExpression = (node: ts.Expression): ts.Type | null => {
        const type = checker.getTypeAtLocation(node)
        const apparent = checker.getApparentType(type)

        const callSignatures = checker.getSignaturesOfType(apparent, ts.SignatureKind.Call)
        if (callSignatures.length > 0) {
            const param = callSignatures[0].getParameters()[0]
            return param ? checker.getTypeOfSymbolAtLocation(param, node) : null
        }

        const constructSignatures = checker.getSignaturesOfType(
            apparent,
            ts.SignatureKind.Construct
        )
        if (constructSignatures.length > 0) {
            const param = constructSignatures[0].getParameters()[0]
            return param ? checker.getTypeOfSymbolAtLocation(param, node) : null
        }

        return null
    }

    const direct = getPropsFromExpression(expression)
    if (direct) return direct

    const unwrapped = unwrapExpression(expression)
    if (unwrapped !== expression) {
        return getPropsFromExpression(unwrapped)
    }

    return null
}

const describeObjectType = (
    type: ts.Type,
    checker: ts.TypeChecker,
    location: ts.Expression
): Record<string, string> => {
    const normalized = checker.getApparentType(type)
    const result: Record<string, string> = {}

    const properties = checker.getPropertiesOfType(normalized)
    properties.forEach((prop) => {
        const propNode = prop.valueDeclaration || prop.declarations?.[0] || location
        const propType = checker.getTypeOfSymbolAtLocation(prop, propNode)
        const typeLabel = checker.typeToString(propType, propNode, ts.TypeFormatFlags.NoTruncation)
        const isOptional = (prop.getFlags() & ts.SymbolFlags.Optional) !== 0
        const key = isOptional ? `${prop.getName()}?` : prop.getName()
        result[key] = typeLabel
    })

    const stringIndex = normalized.getStringIndexType()
    if (stringIndex) {
        result['[key: string]'] = checker.typeToString(
            stringIndex,
            location,
            ts.TypeFormatFlags.NoTruncation
        )
    }

    const numberIndex = normalized.getNumberIndexType()
    if (numberIndex) {
        result['[index: number]'] = checker.typeToString(
            numberIndex,
            location,
            ts.TypeFormatFlags.NoTruncation
        )
    }

    if (Object.keys(result).length > 0) return result

    const fallback = checker.typeToString(normalized, location, ts.TypeFormatFlags.NoTruncation)
    return fallback ? { $type: fallback } : {}
}

const getDataSchema = (
    componentExpression: ts.Expression,
    checker: ts.TypeChecker
): Record<string, string> => {
    const propsType = getPropsTypeFromComponent(componentExpression, checker)
    if (!propsType) return {}

    const dataSymbol = propsType.getProperty('data')
    if (!dataSymbol) return {}

    const dataType = checker.getTypeOfSymbolAtLocation(dataSymbol, componentExpression)
    return describeObjectType(dataType, checker, componentExpression)
}

const extractEntryFromCall = (
    call: ts.CallExpression,
    checker: ts.TypeChecker
): ComponentManifestEntry | null => {
    if (call.arguments.length === 0) return null

    const argument = call.arguments[0]
    if (!ts.isObjectLiteralExpression(argument)) return null

    let name: string | null = null
    let componentExpression: ts.Expression | null = null

    for (const property of argument.properties) {
        if (ts.isPropertyAssignment(property)) {
            const propName = getPropertyName(property.name)
            if (propName === 'name') {
                name = getStringLiteralValue(property.initializer)
            }
            if (propName === 'component') {
                componentExpression = property.initializer
            }
        }

        if (ts.isShorthandPropertyAssignment(property)) {
            const propName = property.name.text
            if (propName === 'component') {
                componentExpression = property.name
            }
        }
    }

    if (!name) return null

    const data = componentExpression ? getDataSchema(componentExpression, checker) : {}

    return {
        card: name,
        data,
    }
}

const discoverRegisteredComponents = async (srcDir: string): Promise<ComponentManifestEntry[]> => {
    console.log(`[pieui] Searching for components in: ${srcDir}`)

    const files = await glob(`${srcDir}/**/*.{ts,tsx,js,jsx}`, {
        ignore: ['**/*.d.ts', '**/dist/**', '**/node_modules/**', '**/registry.ts', '**/registry.tsx'],
    })

    console.log(`[pieui] Found ${files.length} files to scan`)

    const resolvedFiles = files.map((file) => path.resolve(process.cwd(), file))
    if (resolvedFiles.length === 0) {
        console.log('[pieui] No files to process')
        return []
    }

    console.log('[pieui] Creating TypeScript program...')
    const program = ts.createProgram(resolvedFiles, getCompilerOptions())
    const checker = program.getTypeChecker()
    const entries = new Map<string, ComponentManifestEntry>()

    let callsFound = 0

    for (const file of resolvedFiles) {
        const sourceFile = program.getSourceFile(file)
        if (!sourceFile) {
            console.log(`[pieui] Warning: Could not get source file for ${file}`)
            continue
        }

        let fileCallsFound = 0

        const visit = (node: ts.Node) => {
            if (ts.isCallExpression(node)) {
                const expr = node.expression
                const isRegisterCall =
                    (ts.isIdentifier(expr) && expr.text === REGISTER_FUNCTION) ||
                    (ts.isPropertyAccessExpression(expr) && expr.name.text === REGISTER_FUNCTION)

                if (isRegisterCall) {
                    fileCallsFound++
                    callsFound++
                    console.log(`[pieui] Found ${REGISTER_FUNCTION} call in ${path.relative(process.cwd(), file)}`)

                    const entry = extractEntryFromCall(node, checker)
                    if (entry) {
                        if (!entries.has(entry.card)) {
                            entries.set(entry.card, entry)
                            console.log(`[pieui] Registered component: ${entry.card}`)
                            if (Object.keys(entry.data).length > 0) {
                                console.log(`[pieui]   Data schema:`, entry.data)
                            }
                        } else {
                            console.log(`[pieui] Skipping duplicate: ${entry.card}`)
                        }
                    } else {
                        console.log(`[pieui] Warning: Could not extract entry from ${REGISTER_FUNCTION} call`)
                    }
                }
            }

            ts.forEachChild(node, visit)
        }

        visit(sourceFile)

        if (fileCallsFound > 0) {
            console.log(`[pieui] File ${path.relative(process.cwd(), file)}: found ${fileCallsFound} calls`)
        }
    }

    console.log(`[pieui] Total ${REGISTER_FUNCTION} calls found: ${callsFound}`)
    console.log(`[pieui] Total unique components registered: ${entries.size}`)

    return Array.from(entries.values()).sort((a, b) => a.card.localeCompare(b.card))
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

    console.log(`[pieui] CLI started with command: "${command}"`)
    console.log(`[pieui] Source directory: ${srcDir}`)
    console.log(`[pieui] Output directory: ${outDir}`)

    if (command !== 'postbuild') {
        printUsage()
        process.exit(1)
    }

    try {
        const components = await discoverRegisteredComponents(srcDir)
        if (components.length === 0) {
            console.log('[pieui] Warning: No components found!')
        }
        writeManifest(outDir, components)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[pieui] Failed to generate component manifest: ${message}`)
        if (error instanceof Error && error.stack) {
            console.error('[pieui] Stack trace:', error.stack)
        }
        process.exit(1)
    }
}

void main()
