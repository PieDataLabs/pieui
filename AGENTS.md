# Repository Guidelines

## Project Structure & Module Organization
- Source lives in `src/` with React/TypeScript components in `src/components/` and barrel exports in `src/components/index.ts`.
- The package entry is `src/index.ts`; keep public exports funneled through this file and the component barrel.
- Shared helpers are in `src/util/`, context providers in `src/providers/`, constants in `src/config/constant.ts`, and types in `src/types/`.
- Build output is written to `dist/` (ESM, CJS, and `.d.ts`). Do not edit `dist/` directly.

## Build, Test, and Development Commands
- `bun install`: install dependencies (Bun is the expected runtime and bundler).
- `bun run dev`: run `src/index.ts` for a quick smoke check of exports.
- `bun run build`: clean and rebuild `dist/` (ESM, CJS, and type definitions).
- `bun run typecheck`: run TypeScript against `tsconfig.json` in strict mode.
- `npx pieui postbuild`: generate `dist/pieui.components.json` summarizing registered components (use `--out-dir <dir>` to target another folder).

## Coding Style & Naming Conventions
- TypeScript + React with `jsx: react-jsx` and strict mode; use ES module syntax.
- 4-space indentation, no trailing semicolons, and relative imports from `src/`.
- Components/providers in PascalCase (e.g., `PieCard.tsx`), utilities in camelCase, constants in SCREAMING_SNAKE_CASE.
- When adding new modules, expose them via the relevant `index.ts` barrel(s).

## Testing Guidelines
- No automated tests are present yet.
- Add targeted unit or hook tests under `src/__tests__/` or next to the module when needed.
- Prefer a Bun-friendly runner (e.g., Vitest/Jest via `bun test`) and mock external services (Axios, sockets, WebRTC) for determinism.

## Commit & Pull Request Guidelines
- Use short, imperative commit subjects (e.g., "register components", "test simple components"); add a body only when clarifying breaking changes or rationale.
- PRs should summarize scope, link relevant issues/tasks, and note any API or UI surface changes.
- Include before/after notes or screenshots when components change.
- Before requesting review, run `bun run build` and `bun run typecheck` and document limitations or follow-ups.

## Agent-Specific Instructions
- Keep changes in `src/` and avoid editing generated artifacts in `dist/`.
- Use `rg` for fast searches and prefer `apply_patch` for single-file edits.
