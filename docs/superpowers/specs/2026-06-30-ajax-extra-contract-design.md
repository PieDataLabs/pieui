# Ajax `extra` contract: declare submit inputs from the handler signature

**Date:** 2026-06-30
**Status:** Draft (pending review)

## Problem

The frontend submit function returned by `getAjaxSubmit` / `useAjaxSubmit`
(`src/util/ajaxCommonUtils.ts`) is called as `submit(extra)`, where `extra` is
an untyped `Record<string, any>` (`extraKwargs`). The full set of fields that
reach the backend ajax handler is assembled from three layers that **nobody
reconciles**:

| Source                  | Declared in                          | Who knows the shape |
| ----------------------- | ------------------------------------ | ------------------- |
| `kwargs` (static)       | the card's `data` (frontend UIConfig)| the backend that renders the card |
| `depsNames` (client sources: dom/sid/localStorage/sessionStorage/cookie/url/telegram) | the card's `data` | the backend |
| **`extra`** (call-time, code-supplied) | **nowhere** | **nobody** |

So a card author writing `submit({ rating: 5 })` has no way to know which fields
the endpoint expects, no type checking, and no runtime guardrail — the backend
just reads `data['rating']` ad hoc and silently gets `undefined` when it is
missing or misspelled.

Meanwhile the backend **already has a single source of truth**: the ajax
handler's typed signature (`rating: int, comment: str = ""`). `pie`'s
`pie/code/taskgen.py:extract_args` already introspects it — name, type,
required, default, and model JSON shape — for task generation. That information
simply never reaches the frontend or the `extra` call site.

## Goal

Make the **backend handler signature the single declaration** of an ajax
endpoint's inputs. Annotate each parameter with where its value comes from, then
derive everything else from it:

1. **Discoverability** — generated TS types so `submit(extra)` autocompletes and
   type-checks in the IDE.
2. **Runtime validation** — backend rejects/coerces against the declared schema
   instead of silently reading `data['foo']`; frontend validates the merged
   payload before POST.
3. **Declaration at the card** — the card carries a compact `inputsSchema` so the
   contract is visible in the UIConfig tree.
4. **Auto-derivation from the backend** — no hand-maintained duplicate; the
   card's `depsNames` / `kwargs` are derived from the same signature.

`pie` is the authoritative reference for CLI/handler surface; every new marker
and CLI command is mirrored in both repos (cross-repo symmetry, see `CLAUDE.md`).

## Approach

### Section 1 — Source markers (a new field-marker family)

`pie` already supports field markers (`Form`, `Query`, `ParsedPieField` /
`RawPieField`) and `extract_args._unwrap_field` already unwraps them into
`(is_marker, required, default_repr, alias)`. We add a new marker family in the
**same slot** — no parallel mechanism:

```python
# pie
async def submit_feedback_ajax(
    self,
    rating: int,                       # no marker  → source = extra (code supplies it)
    comment: str = "",                 # source = extra, optional
    sid: str   = Dep.sid(),            # source = dep:sid
    token: str = Dep.local("token"),   # source = dep:localStorage
    page_id: str = Kwarg("feedback"),  # source = kwarg (static)
) -> Card: ...
```

The markers map 1:1 onto the existing frontend `DepSource` taxonomy in
`ajaxCommonUtils.ts`:

| Backend marker            | Frontend `DepSource` / magic name | Resolution on the client |
| ------------------------- | --------------------------------- | ------------------------ |
| `Dep.sid()`               | `sid`                             | `window.sid` (via `waitForSidAvailable`) |
| `Dep.local(key)`          | `localStorage:<key>`              | `localStorage.getItem(key)` |
| `Dep.session(key)`        | `sessionStorage:<key>`            | `sessionStorage.getItem(key)` |
| `Dep.cookie(key)`         | `cookie:<key>`                    | parsed `document.cookie` |
| `Dep.url(key)`            | `url:<key>`                       | `URLSearchParams(location.search).getAll(key)` |
| `Dep.tgCloud(key)`        | `telegram:cloud:<key>`            | Telegram `CloudStorage.getItem` |
| `Dep.tgSecure(key)`       | `telegram:secure:<key>`           | Telegram `SecureStorage.getItem` |
| `Kwarg(value)`            | (static, baked into card `data`)  | n/a |
| _(none)_                  | `extra`                           | supplied by `submit(extra)` |

The express mirror (`@swarm.ing/pieui/server`) declares the same thing through
`registerAjax` with a field schema:

```ts
this.registerAjax('/submit_feedback', {
  inputs: {
    rating:  f.int(),
    comment: f.str().default(''),
    sid:     f.dep.sid(),
    token:   f.dep.local('token'),
    page_id: f.kwarg('feedback'),
  },
  handler: async ({ rating, comment, sid, token, page_id }) => { /* ... */ },
})
```

`f` is a small field-builder helper (`f.int`, `f.str`, `f.bool`, `f.float`,
`f.dep.*`, `f.kwarg`) carrying `{ type, required, default, source }`. The
existing `registerAjax(pathname, fn, method)` signature stays valid (untyped
`fn` → treated as all-`extra`, no schema) so current handlers keep working.

### Section 2 — Derivation (kill the card/handler drift)

Today `depsNames` / `kwargs` are written by hand on the card **and** the same
fields are read inside the handler — two places that drift. With markers, a
single signature yields:

- **`depsNames`** for the card's `data` = every `Dep.*` param → its magic name
  (`Dep.local("token")` → `"localStorage:token"`).
- **`kwargs`** for the card's `data` = every `Kwarg` param → key/value.
- **`extra` contract** = the bare (`source=extra`) params.

A card that renders an ajax endpoint references it by pathname; the framework
fills `depsNames` / `kwargs` from the endpoint's declared markers instead of the
author re-typing them. Manual `depsNames` / `kwargs` on a card remain allowed
(escape hatch) but a conflict — e.g. a field marked `extra` that also appears in
`kwargs`, or a `Dep` name that disagrees with the handler — is reported at
generation time rather than silently merged.

Resolution precedence at submit time stays as today (`kwargs` < `extra` <
`deps`), but because every field now has exactly one declared source, overlaps
are diagnosable instead of last-writer-wins.

#### What happens to `depsNames` / `kwargs` concretely

Both stay as fields on the card's `data` (the frontend still needs them on the
wire — `readAjaxKeyAsync` consumes `depsNames`, and `kwargs` are appended to the
FormData). What disappears is **hand-authoring the list of keys**: the framework
populates them from the endpoint's markers at render time.

- **`depsNames`** — fully derived. A `Dep.*` param has no value of its own; the
  client resolves it from its source. So `Dep.local("token")` →
  `depsNames` gains `"localStorage:token"`, and that is the whole story.

- **`kwargs`** — the *source and key* are derived, but the *value* has two cases:
  1. **Constant** — the literal lives in the marker and the value is derived too:
     `page_id: str = Kwarg("feedback")` → `kwargs["page_id"] = "feedback"`.
  2. **Per-render dynamic** — `Kwarg()` with no literal declares "this field is a
     static kwarg of this type, but you must supply its value when you build the
     card." The backend passes it at construction
     (`AjaxButtonCard(endpoint=..., kwargs={"item_id": str(item.id)})`). A missing
     value with no default is an error at generation/render time, not a silent
     `undefined` on the wire.

Manual `depsNames` / `kwargs` on a card remain a valid escape hatch (handlers
without markers, or non-standard wiring); they are validated against the markers
when both are present (see the conflict rule above).

### Section 3 — Manifest + codegen (mirrors `pieui postbuild`)

`extract_args` gains a `source` field on each `ActionArg` (derived from the
marker, defaulting to `extra`). A generator emits **`pieui.ajax.json`** — per
pathname, the list of `{ name, type, required, default, source, shape }`. This
mirrors the existing `pieui postbuild` → `pieui.components.json` flow and slots
into the same CLI surface.

From `pieui.ajax.json` we generate **`pieui.ajax.d.ts`**, an interface keyed by
pathname that contains **only `source=extra` params** (deps/kwargs are supplied
elsewhere, so they are excluded from what the caller must pass):

```ts
// generated — do not edit
export interface AjaxExtra {
  '/submit_feedback': { rating: number; comment?: string }
  // ...one entry per ajax endpoint
}
```

CLI surface (mirrored in both repos, `pie` authoritative):

- `pieui` extends the existing scan to also emit `pieui.ajax.json` +
  `pieui.ajax.d.ts` (either folded into `postbuild` or a sibling
  `pieui page ajax-manifest` — decided during planning to match `pie`'s command
  layout).
- `pie` exposes the symmetric subcommand; the `cli-symmetry-check` hook covers
  the change.

### Section 4 — Typed submit + runtime validation

**Frontend.** `useAjaxSubmit` / `getAjaxSubmit` accept the endpoint pathname as a
key into `AjaxExtra`, typing the returned submit:

```ts
const submit = useAjaxSubmit('/submit_feedback', setUi)
submit({ rating: 5 })       // ✓
submit({})                  // ✗ TS: missing 'rating'
submit({ rating: 'x' })     // ✗ TS: wrong type
```

The generic is **optional** — when the pathname is not in `AjaxExtra` (or types
were not generated) `extra` falls back to `Record<string, any>`, preserving
backward compatibility.

**Runtime schema in `data`.** The backend echoes a compact `inputsSchema`
(the `source=extra` subset of the extracted args, plus required/type/default)
into the card's `data` at render time. Before POST, `getAjaxSubmit` validates the
merged FormData against it:

- missing required field → throw (or `setUiAjaxConfiguration(null)` + logged
  error), configurable as `strict` vs `warn`;
- unknown field → warn in `warn` mode, reject in `strict` mode;
- present fields are left as-is (FormData stays string/File).

**Backend on receipt.** `web.ts` (express) and the `pie` ajax route validate the
incoming `data` against the same declared schema: coerce declared types, reject
missing required with **422** instead of handing `undefined` to the handler.
This is the v1 closing of the "silent `data['foo']`" gap.

### Section 5 — CLI symmetry

New public surface mirrored in both CLIs (`pie` is the reference):

- Markers `Dep.*` / `Kwarg` (pie) and `f.dep.*` / `f.kwarg` (express helper).
- The ajax-manifest generation command.

All of these touch `src/cli.ts`, `src/code/**`, and the `pie` equivalents, so the
`cli-symmetry-check` PostToolUse hook will fire; symmetry is part of the work,
not an afterthought.

## Components and boundaries

- **`extract_args` (pie)** — extended to emit `source`. Single introspection
  point; no other code learns about markers.
- **Marker types** — `Dep` / `Kwarg` (pie), `f` builder (express). Pure value
  objects; carry `{ type, required, default, source }`.
- **Manifest generator** — reads handlers, writes `pieui.ajax.json`. Reused by
  the codegen step.
- **Type generator** — `pieui.ajax.json` → `pieui.ajax.d.ts`. Pure transform.
- **Runtime validator** — one function shared in shape between
  `getAjaxSubmit` (pre-POST) and the backend routes (on receipt), each reading
  the same compact schema.
- **`getAjaxSubmit` / `useAjaxSubmit`** — gain an optional pathname generic and a
  pre-POST validation call; merge logic unchanged otherwise.

## Backward compatibility

- Untyped `registerAjax(pathname, fn)` and hand-written `depsNames` / `kwargs`
  keep working — markers, schema, and types are all additive.
- `submit(extra)` without generated types falls back to `Record<string, any>`.
- Runtime validation defaults to `warn` (non-breaking) and can be flipped to
  `strict` per deployment.

## Out of scope (v1)

- Auto-generating frontend form inputs from the schema.
- Cross-endpoint shared input models / schema `$ref` reuse (flat per-endpoint
  schema only).
- Migrating existing handlers to markers — opt-in, not a rewrite.

## Open questions for planning

- Exact CLI command layout (`postbuild` fold-in vs dedicated subcommand) — pin to
  `pie`'s actual command tree during planning.
- Whether `inputsSchema` is emitted by default on every ajax card or gated behind
  a flag to keep UIConfig payloads small.
