# Function-valued `stored` in the native global form

**Date:** 2026-07-05
**Status:** Approved, ready for planning

## Problem

`PieCard`'s `stored` prop accepts either a plain value or a function
(`stored: TStored | (() => TStored)`, added in commit `77289ec`). `stored`
values feed two independent submit paths:

| Path | How values are collected | Plain value | Function value |
| --- | --- | --- | --- |
| **Ajax** (`getAjaxSubmit`) | JS reads `depsNames`; `readAjaxKey` checks `storedResolvers` before the DOM | works (hidden input read via DOM) | **works** — registry resolves at submit |
| **Native global form** (`#piedata_global_form` → `form.submit()` → `api/process`) | the *browser* serializes DOM inputs | works — `<input type="hidden">` | **broken** — nothing in the DOM, value is lost |

For a plain value, `PieCard` renders `<input type="hidden" name={data.name}
value={JSON.stringify(stored)}>` inside the global form, so the browser's native
form serialization picks it up. For a function value there is deliberately **no**
static hidden input — the value is registered as a resolver in the
`storedResolvers` map and resolved lazily at submit time. That registry is
plain JavaScript the browser's form serializer never sees, so a function-valued
`stored` is silently dropped from a native `form.submit()`.

### Why not just render the input for functions too

Rendering `<input value={JSON.stringify(stored())}>` for the function case would
call the function on **every render**. `stored` functions can be expensive
(serializing large objects, reading imperative/live state), which is the whole
reason the prior commit made them resolve lazily at submit. Eager per-render
evaluation is too costly and is explicitly rejected.

The function must therefore be resolved **exactly once, at submit time**, and its
result must be present in the DOM at the moment `form.submit()` serializes the
form.

## Design

Keep the existing `storedResolvers` registry and `PieCard` untouched. Add a
single flush step to the global-form submit path that mirrors each function
resolver's current value into the form DOM as a hidden input immediately before
the native submit.

Because `HTMLFormElement.submit()` fires no `submit`/`formdata` event, the flush
cannot rely on browser events — it is an explicit step in PieUI's own
`submitGlobalForm` wrapper, which we fully control.

### Component 1 — `flushStoredResolversToForm` (`src/util/ajaxCommonUtils.ts`)

Lives next to the existing `storedResolvers` map. Purpose: resolve every
registered function-`stored` and write its value(s) into the target form as
hidden inputs, replacing any inputs a previous submit injected.

```ts
/**
 * Resolve every function-`stored` and mirror it into the global form's DOM as
 * hidden inputs, so a native form.submit() serializes them. Called once, at
 * submit — each (possibly expensive) resolver runs exactly once here.
 *
 * Async resolvers and File values are skipped: a native form.submit() cannot
 * await, and a hidden <input> cannot carry a File. The ajax submit path still
 * handles both via readAjaxKeyAsync. In practice PieCard registers a synchronous
 * resolver that yields a single JSON string, which this handles fully.
 */
export const flushStoredResolversToForm = (
    formId = 'piedata_global_form'
): void => {
    if (typeof document === 'undefined') return
    const form = document.getElementById(formId)
    if (!form) return

    // Remove inputs injected by a previous submit so re-submits replace rather
    // than accumulate.
    form.querySelectorAll('input[data-pie-stored]').forEach((el) => el.remove())

    for (const [name, resolver] of storedResolvers) {
        const result = resolver()
        if (result instanceof Promise) continue // native submit can't await
        for (const value of result) {
            if (typeof value !== 'string') continue // hidden input can't carry a File
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = name
            input.value = value
            input.setAttribute('data-pie-stored', '1')
            form.appendChild(input)
        }
    }
}
```

Contract:
- **Input:** optional form id (default `piedata_global_form`); reads the module's
  `storedResolvers` map.
- **Effect:** the form's DOM gains one `<input type="hidden" data-pie-stored="1">`
  per resolved string value; previously injected `data-pie-stored` inputs are
  removed first.
- **Depends on:** `document`, `storedResolvers`. No-op when `document` is
  undefined (SSR / React Native) or the form is not mounted.

### Component 2 — `submitGlobalForm` flush hook (`src/util/globalForm.ts`)

```ts
import { flushStoredResolversToForm } from './ajaxCommonUtils'

export const submitGlobalForm = () => {
    flushStoredResolversToForm()
    clientSources.submitGlobalForm()
}
```

`globalForm.ts` already sits above `clientSources`; `ajaxCommonUtils` does not
import `globalForm`, so no import cycle is introduced. The flush runs, then the
existing platform delegation performs the native `form.submit()`.

## Data flow (native form submit)

```
user triggers submit
  → submitGlobalForm()
      → flushStoredResolversToForm()
          for each [name, resolver] in storedResolvers:
              value = resolver()          // expensive fn runs once, here
              append <input hidden name value data-pie-stored>
      → clientSources.submitGlobalForm()
          → form.submit()                 // browser serializes DOM, incl. injected inputs
  → POST api/process{pathname}            // function-stored values now present
```

Ajax path is unchanged: `getAjaxSubmit` still reads `storedResolvers` via
`readAjaxKey`/`readAjaxKeyAsync` and never touches these hidden inputs, so there
is no double submission.

## Non-goals / boundaries

- **Async resolvers and File values on the native form** are out of scope; they
  are skipped by the flush. PieCard registers a synchronous single-JSON-string
  resolver, so this covers the real surface. The ajax path already handles async
  and Files.
- **React Native native form.** `document` is undefined on RN, so the flush
  no-ops there. Wiring function-`stored` into the RN host form (via
  `nativeFormStore`) is a possible follow-up, not part of this change.
- **PieCard is not modified.** Plain-value behavior and the function resolver
  registration are unchanged.

## Testing

- `flushStoredResolversToForm` with a registered synchronous string resolver
  injects a matching hidden input into the form (jsdom).
- A second flush replaces rather than duplicates the injected input
  (`data-pie-stored` cleanup).
- A `Promise`-returning resolver and a `File` value are skipped (no input
  written).
- No-op when the form is absent or `document` is undefined.
- Plain-value `stored` (which does not register a resolver) is untouched by the
  flush — its own static hidden input remains the only one.
- `submitGlobalForm` calls the flush before delegating to
  `clientSources.submitGlobalForm` (spy on order).

## CLI symmetry

This is runtime frontend behavior (form submission), not a CLI surface —
cross-repo `pieui ↔ pie` CLI symmetry is unaffected.
