# Ajax Extra Contract — Plan 1: pie source markers + ajax manifest

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a pie ajax handler's signature the machine-readable source of truth for its submit inputs — add `Dep.*` / `Kwarg` source markers, record a `source` per argument, and emit a `pieui.ajax.json` manifest via `pie web <module:app> ajax-manifest`.

**Architecture:** Extend pie's existing field-marker + introspection pipeline (`pie/types.py` markers → `taskgen.extract_args`) with a new marker family and a `source` field on `ActionArg`. Add a self-contained manifest builder that walks `web.pages` ajax registries, runs `extract_args`, and serializes to JSON. A new `web` subcommand wires it into the CLI. No frontend or express changes in this plan.

**Tech Stack:** Python 3, FastAPI/pydantic (existing), argparse CLI, pytest.

## Global Constraints

- **pie is the authoritative CLI reference.** This plan adds surface to the pie CLI first; the pieui mirror (delegating `pieui … ajax-manifest` → `pie web … ajax-manifest`) is Plan 2. (`/Users/kaspar_george/pieui/CLAUDE.md`, "Cross-repo CLI symmetry".)
- **Backward compatible.** Existing ajax handlers with no markers must still work — an unmarked param has `source = "extra"`. Existing `extract_args` consumers (`taskgen` YAML rendering) must be unaffected; the new `source` field is additive with a default.
- **Marker source families mirror the frontend `DepSource` grammar** in `/Users/kaspar_george/pieui/src/util/ajaxCommonUtils.ts:42-59`: `sid`, `localStorage`, `sessionStorage`, `cookie`, `url`, `telegram:cloud`, `telegram:secure`, `dom`.
- **All work is in `/Users/kaspar_george/pie`.** Run tests with `/Users/kaspar_george/pie/.venv/bin/python -m pytest`.
- **Manifest `version` is `1`.** Endpoint keys are the ajax pathname with a leading slash (`/save`).

---

### Task 1: `Dep` and `Kwarg` marker classes

**Files:**
- Modify: `pie/types.py` (add after `RawPieField`, i.e. after line 99)
- Test: `tests/step4-ci/test_module_ajax_markers.py` (create)

**Interfaces:**
- Produces: `Dep` and `Kwarg` classes in `pie.types`.
  - `Kwarg(default=..., alias: str | None = None)` — attrs `.default`, `.alias`.
  - `Dep(family: str, key: str | None = None, default=..., alias: str | None = None)` — attrs `.family`, `.default`, `.alias` (`.alias = alias or key`), and classmethods `Dep.sid()`, `Dep.local(key)`, `Dep.session(key)`, `Dep.cookie(key)`, `Dep.url(key)`, `Dep.dom(key=None)`, `Dep.tg_cloud(key)`, `Dep.tg_secure(key)`. Constructing with an unknown `family` raises `ValueError`.

- [ ] **Step 1: Write the failing test**

Create `tests/step4-ci/test_module_ajax_markers.py`:

```python
import pytest

from pie.types import Dep, Kwarg


def test_kwarg_holds_default_and_alias():
    k = Kwarg("feedback")
    assert k.default == "feedback"
    assert k.alias is None
    assert Kwarg().default is Ellipsis  # no literal → required


def test_dep_sid_family_and_alias():
    d = Dep.sid()
    assert d.family == "sid"
    assert d.alias == "sid"
    assert d.default is Ellipsis


def test_dep_local_uses_key_as_alias():
    d = Dep.local("token")
    assert d.family == "localStorage"
    assert d.alias == "token"


def test_dep_all_frontend_families_construct():
    assert Dep.session("s").family == "sessionStorage"
    assert Dep.cookie("c").family == "cookie"
    assert Dep.url("u").family == "url"
    assert Dep.tg_cloud("k").family == "telegram:cloud"
    assert Dep.tg_secure("k").family == "telegram:secure"
    assert Dep.dom("name").family == "dom"


def test_dep_rejects_unknown_family():
    with pytest.raises(ValueError):
        Dep("bogus", "k")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_markers.py -v`
Expected: FAIL with `ImportError: cannot import name 'Dep'`.

- [ ] **Step 3: Write minimal implementation**

Append to `pie/types.py` (after the `RawPieField` class, currently ending at line 99):

```python
class Kwarg:
    """Marks an ajax-handler param as a static kwarg baked into the card's ``data``
    (``source='kwarg'``). A literal default is the constant value; ``Kwarg()`` with no
    default declares the field but requires its value to be supplied when the card is
    constructed. ``.default``/``.alias`` are read uniformly by ``taskgen._unwrap_field``."""

    def __init__(self, default=..., alias: str = None):
        self.default = default
        self.alias = alias


class Dep:
    """Marks an ajax-handler param as resolved client-side from a source, mirroring the
    frontend ``depsNames`` source-prefix grammar (``source='dep:<family>'``). The browser
    pulls the value; the caller never passes it. The submitted form-field name is
    ``alias`` (defaults to ``key``, else the param name)."""

    _FAMILIES = {
        "sid",
        "localStorage",
        "sessionStorage",
        "cookie",
        "url",
        "telegram:cloud",
        "telegram:secure",
        "dom",
    }

    def __init__(self, family: str, key: str = None, default=..., alias: str = None):
        if family not in self._FAMILIES:
            raise ValueError(f"Unknown Dep family: {family!r}")
        self.family = family
        self.default = default
        self.alias = alias or key

    @classmethod
    def sid(cls, default=...):
        return cls("sid", "sid", default)

    @classmethod
    def local(cls, key, default=...):
        return cls("localStorage", key, default)

    @classmethod
    def session(cls, key, default=...):
        return cls("sessionStorage", key, default)

    @classmethod
    def cookie(cls, key, default=...):
        return cls("cookie", key, default)

    @classmethod
    def url(cls, key, default=...):
        return cls("url", key, default)

    @classmethod
    def dom(cls, key=None, default=...):
        return cls("dom", key, default)

    @classmethod
    def tg_cloud(cls, key, default=...):
        return cls("telegram:cloud", key, default)

    @classmethod
    def tg_secure(cls, key, default=...):
        return cls("telegram:secure", key, default)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_markers.py -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/kaspar_george/pie
git add pie/types.py tests/step4-ci/test_module_ajax_markers.py
git commit -m "feat(ajax): add Dep/Kwarg source markers"
```

---

### Task 2: `source` on `ActionArg` + `extract_args`

**Files:**
- Modify: `pie/code/taskgen.py:20` (import), `:24` (`_FIELD_MARKERS`), `:47-54` (`ActionArg`), `:153-165` (`_unwrap_field`), `:199-209` (`extract_args` construction)
- Test: `tests/step4-ci/test_module_ajax_markers.py` (extend)

**Interfaces:**
- Consumes: `Dep`, `Kwarg` from `pie.types` (Task 1).
- Produces:
  - `ActionArg` gains `source: str = "extra"` (last field, `compare=False`).
  - `extract_args(method)` sets `source` per arg: `"extra"` (unmarked / FastAPI `Form`/`Query` / `ParsedPieField` / `RawPieField`), `"kwarg"` (`Kwarg`), `"dep:<family>"` (`Dep`).
  - `_unwrap_field(default)` now returns a 5-tuple `(is_marker, required, default_repr, alias, source)`.

- [ ] **Step 1: Write the failing test**

Append to `tests/step4-ci/test_module_ajax_markers.py`:

```python
from pie.code.taskgen import ActionArg, extract_args
from pie.types import Dep, Kwarg


async def _handler(
    self,
    rating: int,
    comment: str = "",
    sid: str = Dep.sid(),
    token: str = Dep.local("token"),
    page_id: str = Kwarg("feedback"),
):
    return []


def test_extract_args_assigns_source():
    args = {a.name: a for a in extract_args(_handler)}
    assert args["rating"].source == "extra"
    assert args["rating"].required is True
    assert args["comment"].source == "extra"
    assert args["comment"].required is False
    assert args["sid"].source == "dep:sid"
    assert args["token"].source == "dep:localStorage"
    assert args["token"].name == "token"  # alias/key becomes the field name
    assert args["page_id"].source == "kwarg"


def test_action_arg_source_defaults_to_extra():
    assert ActionArg("x", "str", True, "").source == "extra"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_markers.py::test_extract_args_assigns_source -v`
Expected: FAIL — `AttributeError: 'ActionArg' object has no attribute 'source'`.

- [ ] **Step 3: Write minimal implementation**

3a. In `pie/code/taskgen.py:20`, extend the import:

```python
from pie.types import Dep, Kwarg, ParsedPieField, RawPieField
```

3b. At `pie/code/taskgen.py:24`, add the new markers to the tuple:

```python
_FIELD_MARKERS = (FieldInfo, ParsedPieField, RawPieField, Kwarg, Dep)
```

3c. Add `source` to `ActionArg` (`pie/code/taskgen.py:47-54`):

```python
@dataclass
class ActionArg:
    name: str
    type_str: str
    required: bool
    default_repr: str
    json_shape: str | None = field(default=None, compare=False, repr=False)
    source: str = field(default="extra", compare=False)
```

3d. Add a source helper and extend `_unwrap_field` (`pie/code/taskgen.py:153-165`) to return it:

```python
def _field_source(default) -> str:
    """Map a field marker to its submit source. Unknown/plain markers → 'extra'."""
    if isinstance(default, Kwarg):
        return "kwarg"
    if isinstance(default, Dep):
        return f"dep:{default.family}"
    return "extra"


def _unwrap_field(default):
    """Unfold a field marker into (is_marker, required, default_repr, alias, source)."""
    if not isinstance(default, _FIELD_MARKERS):
        return False, False, "", None, "extra"
    inner = getattr(default, "default", PydanticUndefined)
    alias = getattr(default, "alias", None)
    required = inner is PydanticUndefined or inner is Ellipsis
    return True, required, ("" if required else repr(inner)), alias, _field_source(default)
```

3e. Update the `extract_args` construction block (`pie/code/taskgen.py:199-209`) to unpack the extra value and thread `source` into the marker branch:

```python
        is_marker, required, default_repr, alias, source = _unwrap_field(param.default)
        if is_marker:
            args.append(
                ActionArg(
                    alias or param.name,
                    type_str,
                    required,
                    default_repr,
                    shape,
                    source,
                )
            )
        elif param.default is inspect.Parameter.empty:
            args.append(ActionArg(param.name, type_str, True, "", shape))
        else:
            args.append(
                ActionArg(param.name, type_str, False, repr(param.default), shape)
            )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_markers.py -v`
Expected: PASS (8 tests).

- [ ] **Step 5: Run the existing taskgen suite for regressions**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_taskgen.py -v`
Expected: PASS (the added `source` field is `compare=False` and defaulted, so existing `ActionArg` equality and YAML rendering are unaffected).

- [ ] **Step 6: Commit**

```bash
cd /Users/kaspar_george/pie
git add pie/code/taskgen.py tests/step4-ci/test_module_ajax_markers.py
git commit -m "feat(ajax): record submit source per handler arg in extract_args"
```

---

### Task 3: `build_ajax_manifest` builder

**Files:**
- Modify: `pie/code/taskgen.py` (add `build_ajax_manifest` near `build_task_model:309`)
- Test: `tests/step4-ci/test_module_ajax_manifest.py` (create)

**Interfaces:**
- Consumes: `extract_args` with `source` (Task 2); `AsyncPage.register_ajax` semantics — registries `page.ajax_post` / `page.ajax_get` are dicts keyed by the **slash-stripped** pathname (`pie/async_page.py:232-253`).
- Produces: `build_ajax_manifest(web) -> dict`. Shape:

  ```python
  {
    "version": 1,
    "endpoints": {
      "/save": {
        "method": "POST",
        "page": "home",
        "inputs": [
          {"name": "item", "type": "str", "required": True,
           "default": None, "source": "extra", "shape": None},
        ],
      },
    },
  }
  ```

  `default` is `None` when the arg is required (empty `default_repr`), else the `default_repr` string. `shape` is the arg's `json_shape` (may be `None`).

- [ ] **Step 1: Write the failing test**

Create `tests/step4-ci/test_module_ajax_manifest.py`:

```python
from types import SimpleNamespace

from pie import AsyncPage
from pie.code.taskgen import build_ajax_manifest
from pie.types import Dep, Kwarg


class _Home(AsyncPage):
    def __init__(self):
        super().__init__()
        self.register_ajax("/save", self.save, method="POST")
        self.register_ajax("/search", self.search, method="GET")

    async def save(self, item: str, token: str = Dep.local("token")):
        return [item]

    async def search(self, q: str = ""):
        return [q]


def test_build_ajax_manifest_shape():
    web = SimpleNamespace(pages={"home": _Home()})
    manifest = build_ajax_manifest(web)

    assert manifest["version"] == 1
    save = manifest["endpoints"]["/save"]
    assert save["method"] == "POST"
    assert save["page"] == "home"
    assert save["inputs"][0] == {
        "name": "item", "type": "str", "required": True,
        "default": None, "source": "extra", "shape": None,
    }
    assert save["inputs"][1]["name"] == "token"
    assert save["inputs"][1]["source"] == "dep:localStorage"

    search = manifest["endpoints"]["/search"]
    assert search["method"] == "GET"
    assert search["inputs"][0] == {
        "name": "q", "type": "str", "required": False,
        "default": "''", "source": "extra", "shape": None,
    }


def test_build_ajax_manifest_empty_when_no_handlers():
    class _Bare(AsyncPage):
        def __init__(self):
            super().__init__()

    web = SimpleNamespace(pages={"bare": _Bare()})
    assert build_ajax_manifest(web) == {"version": 1, "endpoints": {}}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_manifest.py -v`
Expected: FAIL — `ImportError: cannot import name 'build_ajax_manifest'`.

- [ ] **Step 3: Write minimal implementation**

Add to `pie/code/taskgen.py` immediately after `build_task_model` (ends at `:314`):

```python
def _arg_to_manifest(arg: ActionArg) -> dict:
    return {
        "name": arg.name,
        "type": arg.type_str,
        "required": arg.required,
        "default": None if arg.default_repr == "" else arg.default_repr,
        "source": arg.source,
        "shape": arg.json_shape,
    }


def build_ajax_manifest(web) -> dict:
    """Serialize every registered ajax handler's declared inputs to the
    ``pieui.ajax.json`` shape. Self-contained: walks the ``ajax_post``/``ajax_get``
    registries directly and runs ``extract_args`` per handler."""
    endpoints: dict = {}
    for page_key, page in web.pages.items():
        registries = (
            ("POST", getattr(page, "ajax_post", {})),
            ("GET", getattr(page, "ajax_get", {})),
        )
        for method, registry in registries:
            for pathname, handler in registry.items():
                key = pathname if pathname.startswith("/") else "/" + pathname
                endpoints[key] = {
                    "method": method,
                    "page": page_key,
                    "inputs": [_arg_to_manifest(a) for a in extract_args(handler)],
                }
    return {"version": 1, "endpoints": endpoints}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_manifest.py -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/kaspar_george/pie
git add pie/code/taskgen.py tests/step4-ci/test_module_ajax_manifest.py
git commit -m "feat(ajax): build_ajax_manifest from handler signatures"
```

---

### Task 4: `handle_ajax_manifest` + CLI wiring

**Files:**
- Modify: `pie/code/build.py` (add `handle_ajax_manifest`)
- Modify: `pie/__main__.py:91-92` (web subparser), `:775-780` (web dispatch)
- Test: `tests/step4-ci/test_module_ajax_manifest.py` (extend)

**Interfaces:**
- Consumes: `build_ajax_manifest(web)` (Task 3).
- Produces:
  - `handle_ajax_manifest(web_path: str, out: str = "pieui.ajax.json") -> None` in `pie/code/build.py` — imports `module:app`, builds the manifest, writes pretty JSON to `out` (resolved against cwd), prints a one-line summary.
  - CLI: `pie web <module:app> ajax-manifest [--out pieui.ajax.json]`.

- [ ] **Step 1: Write the failing test**

Append to `tests/step4-ci/test_module_ajax_manifest.py`:

```python
import json
import sys
import textwrap


def test_handle_ajax_manifest_writes_file(tmp_path, monkeypatch):
    module = tmp_path / "myweb.py"
    module.write_text(
        textwrap.dedent(
            """
            from pie import AsyncPage, Web
            from pie.types import Dep

            class Home(AsyncPage):
                def __init__(self):
                    super().__init__()
                    self.register_ajax("/save", self.save, method="POST")
                async def save(self, item: str, token: str = Dep.local("token")):
                    return [item]

            app = Web({"home": Home()})
            """
        )
    )
    monkeypatch.chdir(tmp_path)
    monkeypatch.syspath_prepend(str(tmp_path))
    sys.modules.pop("myweb", None)

    from pie.code.build import handle_ajax_manifest

    handle_ajax_manifest("myweb:app", out="pieui.ajax.json")

    data = json.loads((tmp_path / "pieui.ajax.json").read_text())
    assert data["version"] == 1
    assert data["endpoints"]["/save"]["inputs"][1]["source"] == "dep:localStorage"
```

> Note: adjust the `Web({...})` construction in the fixture to match pie's actual `Web` constructor if it differs (check `pie/fastweb.py`); the manifest builder only needs `web.pages` to be a dict of pages.

- [ ] **Step 2: Run test to verify it fails**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_manifest.py::test_handle_ajax_manifest_writes_file -v`
Expected: FAIL — `ImportError: cannot import name 'handle_ajax_manifest'`.

- [ ] **Step 3: Write minimal implementation**

3a. Add to `pie/code/build.py`:

```python
def handle_ajax_manifest(web_path: str, out: str = "pieui.ajax.json") -> None:
    """Emit the ajax input manifest (pieui.ajax.json) from a Web application."""
    module_name, app_name = web_path.split(":")
    sys.path.insert(0, os.getcwd())
    module = importlib.import_module(module_name)
    web = getattr(module, app_name)

    from pie.code.taskgen import build_ajax_manifest

    manifest = build_ajax_manifest(web)
    output_path = Path(out).resolve()
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(
        f"[pie] Ajax manifest: {output_path} "
        f"({len(manifest['endpoints'])} endpoints)"
    )
```

3b. Register the subcommand in `pie/__main__.py` after line 92 (`web_subparsers.add_parser("build", ...)`):

```python
    ajax_manifest_parser = web_subparsers.add_parser(
        "ajax-manifest", help="Emit pieui.ajax.json from a Web application"
    )
    ajax_manifest_parser.add_argument(
        "--out", default="pieui.ajax.json", help="Output path (default: pieui.ajax.json)"
    )
```

3c. Dispatch in `pie/__main__.py` inside the `if command == "web":` block (`:775-780`), before the `else` fallback:

```python
            elif web_command == "build":
                handle_build(web)
            elif web_command == "ajax-manifest":
                from pie.code.build import handle_ajax_manifest

                handle_ajax_manifest(web, out=args.out)
            else:
                handle_web(web)
```

> Confirm the argparse `Namespace` attribute for `--out` is `args.out` in this dispatcher (the runner reads other flags off `args`/locals near `:697`+); if the file destructures a local `out` variable, wire it the same way as neighboring web flags.

- [ ] **Step 4: Run test to verify it passes**

Run: `/Users/kaspar_george/pie/.venv/bin/python -m pytest tests/step4-ci/test_module_ajax_manifest.py -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Manual CLI smoke (optional but recommended)**

Run against any existing demo web in the repo, e.g.:
`cd /Users/kaspar_george/pie && .venv/bin/python -m pie web <known:app> ajax-manifest --out /tmp/pieui.ajax.json && cat /tmp/pieui.ajax.json`
Expected: a JSON file with `version: 1` and an `endpoints` map.

- [ ] **Step 6: Commit**

```bash
cd /Users/kaspar_george/pie
git add pie/code/build.py pie/__main__.py tests/step4-ci/test_module_ajax_manifest.py
git commit -m "feat(ajax): pie web ajax-manifest command"
```

---

### Task 5: Symmetry note + docs

**Files:**
- Modify: `/Users/kaspar_george/pieui/CLAUDE.md` (Cross-repo CLI symmetry section — record the new command and that the pieui mirror is pending in Plan 2)
- Modify: `pie` docs/help if the repo keeps a command index (check `pie/__main__.py` usage/help text for a list to update)

**Interfaces:**
- Consumes: the finished CLI from Task 4.
- Produces: a documented divergence note so the `cli-symmetry-check` hook's expectation is explicit — `pie web <app> ajax-manifest` exists; `pieui … ajax-manifest` (delegating) lands in Plan 2.

- [ ] **Step 1: Update CLAUDE.md**

In `/Users/kaspar_george/pieui/CLAUDE.md`, under "Cross-repo CLI symmetry (pieui ↔ pie)", add a bullet noting the new `pie web <module:app> ajax-manifest` command and that its pieui delegation is tracked in the ajax-extra-contract Plan 2 (so the symmetry hook nudge is expected until then).

- [ ] **Step 2: Commit**

```bash
cd /Users/kaspar_george/pieui
git add CLAUDE.md
git commit -m "docs(ajax): note pie ajax-manifest command; pieui mirror pending"
```

---

## Plan 1 self-review

- **Spec §1 (markers):** Tasks 1–2 add `Dep`/`Kwarg` and thread `source`. ✅
- **Spec §3 (manifest):** Tasks 3–4 emit `pieui.ajax.json` with `{name,type,required,default,source,shape}` per endpoint. ✅ (TS codegen `pieui.ajax.d.ts` is Plan 2.)
- **Spec §5 (CLI symmetry):** Task 4 adds pie surface; Task 5 records the pending pieui mirror. ✅
- **Not in this plan (by design):** §2 derivation (Plan 4), §4 typed submit + runtime validation (Plans 2–3). The manifest already carries `source` so `dep:*`/`kwarg` entries are ready for Plan 4 to derive `depsNames`/`kwargs`.
- **Type consistency:** `ActionArg.source` (Task 2) is read by `_arg_to_manifest` (Task 3) and surfaced by `handle_ajax_manifest` (Task 4). `Dep.family` (Task 1) → `dep:<family>` (Task 2) → manifest `source` (Task 3). Consistent.
- **Placeholders:** none — every step has concrete code. Two explicit "confirm against actual pie source" notes (Task 4 `args.out` attr; Task 4 test `Web(...)` constructor) are verification callouts, not deferred work.

---

## Roadmap: Plans 2–4 (to be expanded into their own plan docs)

**Plan 2 — pieui: codegen + typed submit (goal: discoverability + types).**
- New `pieui … ajax-manifest` command that shells out to `pie web <app> ajax-manifest` (delegation pattern, `src/code/commands/pageAjax.ts:52-56`), producing `pieui.ajax.json`.
- Generate `pieui.ajax.d.ts` (`AjaxExtra` interface keyed by pathname, `source=extra` params only) by feeding each endpoint's input schema through the existing `src/code/jsonSchemaToTs.ts:jsonSchemaToTsInterface`, mirroring `postbuild.ts`.
- Add an optional pathname generic to `useAjaxSubmit`/`getAjaxSubmit` (`src/util/ajaxCommonUtils.ts:324,530`) so `submit(extra)` is typed against `AjaxExtra`, falling back to `Record<string, any>`.

**Plan 3 — runtime validation both sides (goal: 422 instead of silent `data['foo']`).**
- Express: typed `registerAjax({ inputs, handler })` overload + `f` field-builder in `src/server/page.ts:35-42`; validate/coerce in `src/server/web.ts:179-183` (POST) and `:195-199` (GET).
- Echo a compact `inputsSchema` into ajax card `data` at render; pre-POST validation seam in `getAjaxSubmit` after FormData assembly (`ajaxCommonUtils.ts:389`), `strict`/`warn` configurable.

**Plan 4 — derivation (goal: kill card/handler drift).**
- Derive `depsNames` (from `dep:*` markers) and `kwargs` (from `Kwarg` markers, incl. `Kwarg()` per-render values) at card render, in both `pie/code/templates/pages/components/*ajax*.py.j2` and the pieui scaffold (`src/code/templates/pages/components/shared.ts`).
- Conflict detection when manual `depsNames`/`kwargs` disagree with the manifest.
