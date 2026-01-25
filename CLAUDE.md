# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PieUI is a comprehensive React library for building modern web applications with real-time communication, blockchain integration, and advanced UI capabilities. It's built with Bun and TypeScript and provides far more than basic UI components—it's a full-featured toolkit for interactive, connected applications.

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

## Core Architecture

### Multi-Domain Library Structure
PieUI provides integrated functionality across multiple domains:

1. **Real-Time Communication**
   - Socket.IO integration (`src/util/socket.ts`)
   - Centrifuge WebSocket support (`src/util/centrifuge.ts`)
   - Event emitters and message handling (`src/util/mitt.ts`)

2. **WebRTC Audio/Video**
   - Full WebRTC client implementation (`src/util/webrtcClient.ts`)
   - Audio level analysis and device selection
   - OpenAI WebRTC integration (`src/util/useOpenAIWebRTC.ts`)

3. **Blockchain/Web3**
   - Ethereum provider integration (`src/util/getEthProvider.ts`)
   - MetaMask and wallet connectivity
   - Web3 window interface extensions

4. **HTTP/API Layer**
   - Axios with intelligent caching (`src/util/axiosWithCache.tsx`)
   - Common AJAX utilities (`src/util/ajaxCommonUtils.ts`)

### PieCard Component System
The core UI component is `PieCard` which serves as a wrapper for dynamic, event-driven content:

- **Props**: `card`, `data`, `children`, real-time support flags
- **Real-time Support**: Socket.IO, Centrifuge, and Mitt event systems
- **Dynamic Configuration**: Supports complex UI configuration objects
- **Event Handling**: Built-in method binding for real-time events

### Configuration Management
- **Environment Variables**: Dynamic resolution with fallbacks (`src/config/constant.ts`)
- **Multi-Runtime Support**: Works in browser, Node.js, and build environments
- **Auto-Discovery**: Automatic server endpoint detection based on hostname

### Type System Architecture
- **Global Extensions**: Window interface extended for Ethereum, Telegram, sid
- **Event Types**: Comprehensive typing for UI events and configurations
- **Provider Types**: Web3 and communication provider interfaces

### Utility Ecosystem
- **Responsive Design**: Screen size detection and body style management
- **Form Management**: Global form state management
- **Style Processing**: Tailwind utilities and SX-to-Radium conversion
- **Resource Loading**: Image loading with caching and error handling
- **Platform Detection**: Feature support detection and platform-specific helpers

## Build System

### Multi-Target Compilation
- **Browser (ESM)**: Optimized for modern browsers with tree-shaking
- **Node.js (CJS)**: Compatible with Node.js environments
- **Type Definitions**: Complete TypeScript declarations for all modules

### Dependency Management
Key runtime dependencies:
- **axios** + **axios-cache-interceptor**: HTTP with intelligent caching
- **centrifuge**: Real-time WebSocket communication
- **socket.io-client**: Real-time bidirectional communication
- **ethers5**: Ethereum blockchain interaction
- **clsx**: Conditional className utilities

## Development Patterns

### Adding Real-Time Features
When adding new real-time functionality:
1. Consider which transport: Socket.IO, Centrifuge, or Mitt
2. Add event types to `src/types/index.ts`
3. Update PieCard props if needed for automatic event binding
4. Use existing context providers for connection management

### Blockchain Integration
For Web3 features:
1. Use `getEthProvider.ts` for MetaMask detection
2. Leverage existing ethers5 integration
3. Add provider type extensions to global window interface

### WebRTC Implementation
For real-time audio/video:
1. Extend `WebRTCClient` class for new functionality
2. Use audio analysis utilities for level detection
3. Handle device selection and switching gracefully

### Configuration Changes
Environment variables follow the pattern:
- Use `getEnvVar()` helper for safe access
- Support both `import.meta.env` and `process.env`
- Provide sensible fallbacks for all environments

## CI/CD Pipeline

### GitHub Actions Workflows
1. **CI** (`.github/workflows/ci.yml`)
   - Multi-Node version testing (18.x, 20.x)
   - Build verification across all output formats
   - Type checking and validation

2. **Publish** (`.github/workflows/publish.yml`)
   - Tag-triggered publishing (v*)
   - Multi-format build verification
   - NPM publishing with provenance
   - Automatic GitHub release creation

### Release Process
Automated semantic versioning with CI/CD integration:
- Patch releases for bug fixes
- Minor releases for new features
- Major releases for breaking changes