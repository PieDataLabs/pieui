# PieUI

A React component library featuring the PieCard component, built with Bun and TypeScript.

## Installation

```bash
npm install pieui
# or
yarn add pieui
# or
bun add pieui
```

## Usage

```tsx
import React from 'react';
import { PieCard } from 'pieui';

function App() {
  return (
    <div>
      <PieCard title="Welcome">
        <p>This is a beautiful card component!</p>
      </PieCard>

      <PieCard
        title="Custom Styled Card"
        style={{ backgroundColor: '#f3f4f6' }}
        className="my-custom-card"
      >
        <p>You can customize the appearance with style and className props.</p>
      </PieCard>
    </div>
  );
}

export default App;
```

## Components

### PieCard

A versatile card component with customizable styling.

#### Props

- `title?` (string): Optional title displayed at the top of the card
- `children?` (React.ReactNode): Content to display inside the card
- `className?` (string): Additional CSS classes to apply
- `style?` (React.CSSProperties): Inline styles to apply

#### Default Styling

The PieCard comes with sensible defaults:
- White background
- Rounded corners (8px border radius)
- Subtle shadow
- Light gray border
- 16px padding

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Development mode
bun run dev
```

## Building

The package is built using Bun and outputs:
- CommonJS bundle (`dist/index.js`)
- ESM bundle (`dist/index.esm.js`)
- TypeScript declarations (`dist/index.d.ts`)

## Deployment

This package uses automated CI/CD with GitHub Actions:

- **CI**: Runs tests and builds on every push/PR
- **CD**: Automatically publishes to npm when you push a version tag

### Quick Release

```bash
# Patch release (1.0.0 → 1.0.1)
bun run release:patch

# Minor release (1.0.0 → 1.1.0)
bun run release:minor

# Major release (1.0.0 → 2.0.0)
bun run release:major
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## License

MIT
