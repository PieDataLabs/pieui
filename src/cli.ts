#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import * as ts from 'typescript'
import * as TJS from 'typescript-json-schema'

const MANIFEST_FILENAME = 'pieui.components.json'
const REGISTER_FUNCTION = 'registerPieComponent'

type ParsedArgs = {
    command: string
    outDir: string
    srcDir: string
}

type ComponentManifestEntry = {
    card: string
    data: TJS.Definition
}

type ComponentInfo = {
    name: string
    file: string
    dataTypeName: string
}

const parseArgs = (argv: string[]): ParsedArgs => {
    const [command = ''] = argv
    const outDirFlag = argv.find((arg) => arg.startsWith('--out-dir='))
    const srcDirFlag = argv.find((arg) => arg.startsWith('--src-dir='))
    const outDirIndex = argv.findIndex((arg) => arg === '--out-dir' || arg === '-o')
    const srcDirIndex = argv.findIndex((arg) => arg === '--src-dir' || arg === '-s')

    let outDir = 'public'
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
    console.log('Scans for registerPieComponent calls and generates JSON Schema for data props.')
}

const findComponentRegistrations = (srcDir: string): ComponentInfo[] => {
    console.log(`[pieui] Searching for components in: ${srcDir}`)

    const files = glob.sync(`${srcDir}/**/*.{ts,tsx}`, {
        ignore: ['**/*.d.ts', '**/dist/**', '**/node_modules/**', '**/cli.ts'],
    })

    console.log(`[pieui] Found ${files.length} files to scan`)

    const compilerOptions: ts.CompilerOptions = {
        allowJs: true,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
    }

    const program = ts.createProgram(files, compilerOptions)
    const checker = program.getTypeChecker()
    const components: ComponentInfo[] = []

    for (const sourceFile of program.getSourceFiles()) {
        if (sourceFile.isDeclarationFile) continue

        const relativePath = path.relative(process.cwd(), sourceFile.fileName)
        if (!files.some(f => path.resolve(f) === path.resolve(sourceFile.fileName))) continue

        function visit(node: ts.Node) {
            if (ts.isCallExpression(node)) {
                const expr = node.expression
                const isRegisterCall =
                    (ts.isIdentifier(expr) && expr.text === REGISTER_FUNCTION) ||
                    (ts.isPropertyAccessExpression(expr) && expr.name.text === REGISTER_FUNCTION)

                if (isRegisterCall && node.arguments.length > 0) {
                    const arg = node.arguments[0]
                    if (ts.isObjectLiteralExpression(arg)) {
                        let componentName: string | null = null
                        let componentRef: ts.Expression | null = null

                        for (const prop of arg.properties) {
                            if (ts.isPropertyAssignment(prop)) {
                                if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) {
                                    const propName = ts.isIdentifier(prop.name) ? prop.name.text : prop.name.text

                                    if (propName === 'name' && ts.isStringLiteral(prop.initializer)) {
                                        componentName = prop.initializer.text
                                    }

                                    if (propName === 'component') {
                                        componentRef = prop.initializer
                                    }
                                }
                            } else if (ts.isShorthandPropertyAssignment(prop)) {
                                if (prop.name.text === 'component') {
                                    componentRef = prop.name
                                }
                            }
                        }

                        if (componentName && componentRef) {
                            console.log(`[pieui] Found component registration: ${componentName}`)

                            let foundDataType = false

                            // Try to determine the data type name
                            const componentType = checker.getTypeAtLocation(componentRef)
                            const symbol = componentType.getSymbol()

                            if (symbol) {
                                const componentTypeName = symbol.getName()

                                // Try to find the actual data type from props
                                const signatures = checker.getSignaturesOfType(componentType, ts.SignatureKind.Call)
                                if (signatures.length > 0) {
                                    const propsParam = signatures[0].getParameters()[0]
                                    if (propsParam) {
                                        const propsType = checker.getTypeOfSymbolAtLocation(propsParam, componentRef)
                                        const dataProperty = propsType.getProperty('data')

                                        if (dataProperty) {
                                            const dataType = checker.getTypeOfSymbolAtLocation(dataProperty, componentRef)
                                            const dataSymbol = dataType.getSymbol()

                                            if (dataSymbol && dataSymbol.declarations && dataSymbol.declarations.length > 0) {
                                                const declaration = dataSymbol.declarations[0]
                                                const sourceFile = declaration.getSourceFile()

                                                // Check if it's exported
                                                if (ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration)) {
                                                    const hasExport = declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
                                                    if (hasExport) {
                                                        const dataTypeName = dataSymbol.getName()
                                                        console.log(`[pieui]   Found exported data type: ${dataTypeName}`)

                                                        components.push({
                                                            name: componentName,
                                                            file: sourceFile.fileName,
                                                            dataTypeName: dataTypeName
                                                        })
                                                        foundDataType = true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                // Fallback: try to find exported type in the same file
                                if (!foundDataType) {
                                    // Common patterns for data type names
                                    const possibleDataTypes = [
                                        `${componentName}Data`,
                                        `${componentTypeName}Data`,
                                        `${componentTypeName}Props`,
                                        `I${componentName}Data`,
                                        `I${componentTypeName}Data`,
                                    ]

                                    for (const typeName of possibleDataTypes) {
                                        const typeSymbol = checker.resolveName(typeName, undefined, ts.SymbolFlags.Type, false)
                                        if (typeSymbol && typeSymbol.declarations && typeSymbol.declarations.length > 0) {
                                            const declaration = typeSymbol.declarations[0]
                                            if (ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration)) {
                                                const hasExport = declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
                                                if (hasExport) {
                                                    console.log(`[pieui]   Found data type: ${typeName}`)
                                                    components.push({
                                                        name: componentName,
                                                        file: declaration.getSourceFile().fileName,
                                                        dataTypeName: typeName
                                                    })
                                                    foundDataType = true
                                                    break
                                                }
                                            }
                                        }
                                    }
                                }

                                if (!foundDataType) {
                                    console.log(`[pieui]   Warning: Could not find exported data type for ${componentName}`)
                                }
                            }
                        }
                    }
                }
            }

            ts.forEachChild(node, visit)
        }

        visit(sourceFile)
    }

    console.log(`[pieui] Found ${components.length} components with data types`)
    return components
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
        const components = findComponentRegistrations(srcDir)

        if (components.length === 0) {
            console.log('[pieui] Warning: No components with data types found!')
        }

        // Get all unique files that contain components
        const cliSchemaPath = path.join(__dirname, 'cli-schema.d.ts')
        const uniqueFiles = [cliSchemaPath, ...new Set(components.map(c => c.file))]

        console.log('[pieui] Creating TypeScript program for schema generation...')

        // Create program with all files
        const program = TJS.getProgramFromFiles(uniqueFiles, {
            allowJs: true,
            jsx: ts.JsxEmit.ReactJSX,
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.NodeNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
        })

        // Create schema generator
        const generator = TJS.buildGenerator(program, {
            required: true,
            strictNullChecks: true,
            excludePrivate: true,
            ref: false,
            aliasRef: false,
            topRef: false,
            noExtraProps: true,
            ignoreErrors: true,
        })

        if (!generator) {
            throw new Error('Failed to create JSON Schema generator')
        }

        const entries: ComponentManifestEntry[] = []

        // Generate schema for each component
        for (const component of components) {
            console.log(`[pieui] Generating schema for ${component.name} (type: ${component.dataTypeName})...`)

            try {
                const schema = generator.getSchemaForSymbol(component.dataTypeName)

                if (schema) {
                    entries.push({
                        card: component.name,
                        data: schema
                    })
                    console.log(`[pieui]   ✓ Schema generated successfully`)
                } else {
                    console.log(`[pieui]   ✗ Could not generate schema`)
                    entries.push({
                        card: component.name,
                        data: {
                            type: 'object',
                            additionalProperties: true
                        }
                    })
                }
            } catch (error) {
                console.error(`[pieui]   ✗ Error: ${error instanceof Error ? error.message : error}`)
                entries.push({
                    card: component.name,
                    data: {
                        type: 'object',
                        additionalProperties: true
                    }
                })
            }
        }

        // Try to load existing manifest from pieui library
        let existingEntries: ComponentManifestEntry[] = []

        // First, try to find pieui's manifest in node_modules
        const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'pieui', 'dist', MANIFEST_FILENAME)

        if (fs.existsSync(nodeModulesPath)) {
            try {
                const existingManifest = fs.readFileSync(nodeModulesPath, 'utf8')
                existingEntries = JSON.parse(existingManifest)
                console.log(`[pieui] Loaded ${existingEntries.length} existing components from pieui library at ${nodeModulesPath}`)
            } catch (error) {
                console.error(`[pieui] Error reading manifest from ${nodeModulesPath}:`, error)
            }
        } else {
            console.log(`[pieui] No existing pieui manifest found at ${nodeModulesPath}`)
        }

        // Merge existing and new entries
        const componentMap = new Map<string, ComponentManifestEntry>()

        // Add existing entries first
        for (const entry of existingEntries) {
            componentMap.set(entry.card, entry)
        }

        // Add/update with new entries
        for (const entry of entries) {
            componentMap.set(entry.card, entry)
        }

        // Convert back to array
        const mergedEntries = Array.from(componentMap.values())

        // Write manifest
        const resolvedOutDir = path.resolve(process.cwd(), outDir)
        fs.mkdirSync(resolvedOutDir, { recursive: true })
        const manifestPath = path.join(resolvedOutDir, MANIFEST_FILENAME)
        fs.writeFileSync(manifestPath, JSON.stringify(mergedEntries, null, 2), 'utf8')

        console.log(`[pieui] Component manifest saved to ${manifestPath}`)
        console.log(`[pieui] Total components: ${mergedEntries.length} (${existingEntries.length} from pieui, ${entries.length} new/updated)`)

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