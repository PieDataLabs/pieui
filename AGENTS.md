# Repository Guidelines

## Project Structure & Module Organization
- `src/components/` holds React components exported via `src/components/index.ts`; `src/index.ts` serves as the package entry.
- `src/util/` contains shared helpers (axios cache wrapper, sockets, WebRTC, tailwind utilities); `src/providers/` hosts context providers; `src/config/constant.ts` centralizes runtime constants; `src/types/` aggregates typings.
- Build artifacts write to `dist/` (ESM, CJS, and type definitions). Keep source TypeScript/TSX files under `src/` and add barrel exports when introducing new modules.

## Development, Build & Test Commands
- Install dependencies with `bun install` (Bun is the expected runtime and bundler).
- `bun run dev` runs `src/index.ts` for a quick smoke check of exports.
- `bun run build` cleans and rebuilds `dist/` in ESM, CJS, and `.d.ts` formats for publishing.
- `bun run typecheck` executes TypeScript against `tsconfig.json`; the `lint` script is a placeholder until a linter is configured.
- `npx pieui postbuild` writes `pieui.components.json` into `dist/` (use `--out-dir <dir>` to target another build folder) summarizing registered components.

## Coding Style & Naming Conventions
- TypeScript + React with `jsx: react-jsx` and `strict` mode enabled; use ES module syntax.
- Match the existing style: 4-space indentation, no trailing semicolons, and relative imports from `src/`.
- Name components and providers in PascalCase (e.g., `PieCard.tsx`), utilities in camelCase, and shared constants in SCREAMING_SNAKE_CASE.
- When adding shared utilities or components, expose them through the relevant `index.ts` barrel to keep public surface organized.

## Testing Guidelines
- No automated tests are present yet; add targeted unit/hook tests under `src/__tests__/` or next to the module being tested.
- Use a Bun-friendly runner (e.g., Vitest/Jest via `bun test`) and mock external services (Axios, sockets, WebRTC) to keep tests deterministic.
- Include minimal fixtures for component props and prefer fast, isolated tests over integration coverage unless necessary.

## Commit & Pull Request Guidelines
- Follow the repository’s history: short, imperative commit subjects (e.g., `register components`, `test simple components`); add bodies only when clarifying breaking changes or rationale.
- PRs should summarize scope, link relevant issues/tasks, and note UI or API surface changes. Attach before/after notes or screenshots when altering components.
- Before requesting review, run `bun run build` and `bun run typecheck`, and document any limitations or follow-ups in the PR description.
