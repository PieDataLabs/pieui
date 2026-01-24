# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PieUI is a React component library built with Bun and TypeScript. The primary component is `PieCard`, a flexible card component with customizable styling. The project emphasizes simplicity, type safety, and modern development practices.

## Essential Commands

### Development
```bash
bun install              # Install dependencies
bun run dev              # Run development mode
bun run build            # Full build (clean + esm + cjs + types)
bun run typecheck        # Type check without emitting files
```

### Build Components
```bash
bun run build:clean     # Remove dist directory
bun run build:esm       # Build ESM module (browser target)
bun run build:cjs       # Build CommonJS module (node target)
bun run build:types     # Generate TypeScript declarations
```

### Publishing/Releases
```bash
bun run release:patch   # Bump patch version, create tag, and trigger CI/CD
bun run release:minor   # Bump minor version, create tag, and trigger CI/CD
bun run release:major   # Bump major version, create tag, and trigger CI/CD
```

## Architecture

### Build System
- **Runtime**: Bun (primary build tool and package manager)
- **Outputs**: Dual CJS/ESM builds with TypeScript declarations
- **Targets**:
  - `dist/index.esm.js` - ESM for browsers (minified)
  - `dist/index.js` - CommonJS for Node.js (minified)
  - `dist/index.d.ts` - TypeScript type definitions

### Component Structure
```
src/
├── components/
│   ├── PieCard.tsx     # Main component implementation
│   └── index.ts        # Component exports
└── index.ts            # Library entry point
```

### PieCard Component
- **Props**: `title?`, `children?`, `className?`, `style?`
- **Styling**: Inline styles with sensible defaults (white background, rounded corners, shadow)
- **Type Safety**: Full TypeScript support with exported `PieCardProps` interface

### TypeScript Configuration
- Target: ES2020 with ESNext modules
- Strict mode enabled
- React JSX support
- Declaration files generated to `dist/`
- Bundler module resolution

## CI/CD Pipeline

### GitHub Actions Workflows
1. **CI** (`.github/workflows/ci.yml`)
   - Triggers: Push/PR to main/develop
   - Tests: Node 18.x and 20.x matrix
   - Validates: Build, type checking, output verification

2. **Publish** (`.github/workflows/publish.yml`)
   - Triggers: Version tags (v*)
   - Process: Build → Verify → Update version → Publish to npm → Create GitHub release
   - Requires: `NPM_TOKEN` secret

### Release Process
The `release:*` scripts handle the complete release workflow:
1. Update package.json version
2. Create git commit and tag
3. Push changes and tags to trigger CI/CD
4. Automated npm publishing and GitHub release creation

## Package Configuration

### Peer Dependencies
- React ^18.0.0
- React-DOM ^18.0.0

### Dev Dependencies
- TypeScript ^5.0.0
- React type definitions
- Bun types

### Package Exports
- `main`: `dist/index.js` (CommonJS)
- `module`: `dist/index.esm.js` (ESM)
- `types`: `dist/index.d.ts` (TypeScript)

## Development Notes

### Adding New Components
1. Create component in `src/components/ComponentName.tsx`
2. Export from `src/components/index.ts`
3. Re-export from `src/index.ts`
4. Build and test: `bun run build`

### Local Testing
Use `npm link` or `bun link` for local development testing before publishing.

### Publishing Requirements
- Setup npm account and generate automation token
- Add `NPM_TOKEN` to GitHub repository secrets
- Use semantic versioning for releases