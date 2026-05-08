# openmdr — Design

> **Status:** Draft. `openmdr` is a provisional name; it may change before public release.
> **Inspiration:** [`glow`](https://github.com/charmbracelet/glow) (Go, bubbletea/glamour).
> **Stack target:** [`opentui`](https://github.com/anomalyco/opentui) on Bun + TypeScript.

## 1. Overview

`openmdr` is a TUI-first markdown reader for the terminal. It opens in the current
directory (or a path argument), shows a sidebar of markdown files, and renders the
selected file in an adjacent reader pane. It is meant to be a great daily-driver for
reading local project docs, and a showcase for what `opentui` can do in a real app.

It is explicitly **not** glow rewritten in TypeScript: glow's center of gravity is a
CLI formatter that also happens to have a TUI; ours is a TUI that also happens to
have a minimal CLI.

## 2. Goals

- Be the most pleasant way to read markdown sitting on your local filesystem.
- Take full advantage of `opentui`'s layout primitives — typographic, whitespace-rich
  presentation rather than the dense terminal aesthetic glow inherits from its
  rendering stack.
- Provide a foundation that can grow into a documentation explorer (cross-file
  navigation, search) without architectural rework.
- Serve as a learning vehicle for [Effect](https://effect.website) — the author has
  not used it before and wants to build production familiarity with it on a
  realistic but bounded codebase.

## 3. Non-Goals

These are hard non-goals. We will say no to PRs that pull in this direction.

- **Not an editor.** No buffer, no insert mode, no writes to disk. (v2 may shell out
  to `$EDITOR`, but that is a hand-off, not editing inside the app.)
- **Not an exporter.** No HTML, PDF, or image output.
- **Not a cloud / sync service.** Glow had a stash feature; it was removed. We will
  not reintroduce that class of feature.
- **Not a general-purpose pager.** We will not try to replace `less`. Piping
  arbitrary text into `openmdr` is out of scope.
- **Not a custom-stylesheet platform** in v1. No JSON/YAML theme files. Themes are
  TypeScript objects shipped with the binary.
- **No custom markdown parser.** v1 uses opentui's built-in `<markdown>` renderer.
  We reserve the right to swap to a custom remark/mdast pipeline in v2 if and only
  if a concrete need (theming gap, link-following, search highlighting) forces it.

## 4. Target User & Use Cases

The primary user is a **developer reading local docs**: someone who has a repo open,
wants to skim the README and `docs/`, and would rather stay in the terminal than
open a browser or VS Code preview.

The likely future user is a **documentation explorer**: someone pointing `openmdr`
at a `docs/` tree (or a wiki, or an Obsidian vault) and navigating it like a small
static site. v1 is built so this is reachable, not delivered.

Out of scope for both: scripts piping markdown through a CLI formatter
(glow's other persona). We will keep stdin support on the v2+ list, but it is not
the design center.

## 5. Product Scope

### 5.1 v1 — MVP

v1 is a personal-use MVP. It may never be published to npm, GitHub, or Homebrew. It
exists to prove the architecture and the UX.

v1 ships when:

1. `openmdr` and `openmdr <path>` open a TUI with a sidebar of `.md` / `.markdown` /
   `.mdx` files discovered recursively from the path (default cwd).
2. Discovery respects `.gitignore`, skips `node_modules` / `.git` / `.venv`
   unconditionally, and does not follow symlinks.
3. Selecting a file renders it in the reader pane with support for: headings,
   paragraphs, lists (ordered, unordered, nested), blockquotes, GFM tables, inline
   emphasis (bold/italic/strike), inline code, links (rendered, not followed),
   images-as-alt-text, horizontal rules, fenced code blocks (plain).
4. The keymap in §7.2 works end-to-end, including the help overlay.
5. Dark and light themes auto-detect from terminal background; `--theme` overrides.
6. `--width N` controls word-wrap column.
7. The app builds as a Bun standalone binary and an npm package, with a smoke test
   on the binary.
8. `README.md` covers install + run; `DESIGN.md` reflects shipped behavior.

There is no performance gate, no coverage gate, and no public release in v1.

### 5.2 v2 — Public release gates

v2 is when we put the project in front of strangers. The gates are in §10.

### 5.3 Deferred / future

Tracked here so we don't accidentally bind keys or pour concrete that blocks them:

- **Second batch (post-v1):** stdin (`openmdr -`), cross-file link following,
  `$EDITOR` integration, custom per-file actions.
- **Search:** filename filter, full-text search, fuzzy search across both titles
  and contents.
- **Networking:** fetch from URL; resolve `github.com/owner/repo` shorthand.
- **Polish:** syntax highlighting in code blocks, live reload on file change, line
  numbers toggle, mouse polish, persistent config file.
- **Theming v2:** user-supplied stylesheets; named theme set (dracula, solarized,
  etc.).
- **Reusable keymap package** (extracted in the style of `@ghui/keymap`).

## 6. Discovery Rules

| Rule | v1 behavior |
|---|---|
| Root | Path argument if given, else `cwd`. |
| Recursion | Unbounded depth from root. |
| Extensions | `.md`, `.markdown`, `.mdx` (mdx rendered as plain markdown — no JSX evaluation). |
| Ignore files | `.gitignore` honored. Nested `.gitignore` files honored. |
| Hard skips | `node_modules`, `.git`, `.venv` (always, even with `--all`). |
| Hidden files | Skipped by default; `--all` to include. |
| Symlinks | Not followed (loop hazard). |
| Sort | Alphabetical within a directory; directories before files. |

Discovery is a **non-trivial product decision** — users notice when their mental
model of "what shows up" doesn't match. Changing these rules is a versioned change.

## 7. UX Architecture

### 7.1 Layout — hybrid two-pane

Default: sidebar (~30 cols) on the left, reader on the right.
A key collapses the sidebar to give the reader full width. On terminals narrower
than ~80 cols, the sidebar collapses by default.

```
default                         sidebar collapsed
┌────┬─────────────────┐        ┌──────────────────────┐
│ ▸R │ # Title         │        │ # Title              │
│  d │                 │        │                      │
│  x │ Body...         │        │ Body...              │
└────┴─────────────────┘        └──────────────────────┘
```

This is more work than glow's sequential full-screen views, but it is what
`opentui`'s layout system was designed for, and it is the natural seed for the
future doc-explorer (a tree sidebar already in the right place).

### 7.2 Keymap — v1

Conventions follow `ghui` (escape-to-back, return-to-confirm, vim letters as
arrow-key siblings) rather than glow.

| Key | Action |
|---|---|
| `j` / `k`, `↑` / `↓` | Move selection / scroll line |
| `shift+j` / `shift+k` | Jump (8 lines) |
| `space` / `b`, `pagedown` / `pageup`, `ctrl+d` / `ctrl+u` | Page / half-page |
| `g` / `G` | Top / bottom |
| `return`, `l`, `→` | Open file / focus reader |
| `escape`, `h`, `←` | Back / focus sidebar |
| `[` / `]` | Previous / next file in list (from reader) |
| `tab` | Toggle focus between sidebar and reader |
| `\` | Toggle sidebar visibility |
| `?` | Help overlay |
| `q`, `ctrl+c` | Quit |

### 7.3 Reserved keys (v2+)

Do not bind these in v1:

| Key | Reserved for |
|---|---|
| `/` | Search |
| `e` | Open in `$EDITOR` |
| `o` | Open externally (browser / Finder / xdg-open) |
| `r` | Reload current file |

### 7.4 Theming

v1 ships **dark + light**, auto-detected from terminal background. Override via
`--theme dark|light|auto`. A theme is a flat TypeScript object of ~15–20 tokens
covering: heading colors, body fg/bg, link, code-block bg, blockquote accent, list
bullets, table borders, hr, selection highlight.

Background detection: prefer OSC 11 via `opentui`'s terminal info; fall back to
`COLORFGBG`; fall back to dark.

Visual direction is **typographic**: generous whitespace, light accents, lots of
contrast on headings. Glow's dense background-bar style is a workaround for
constrained renderers — we are not constrained.

## 8. Technical Constraints / Stack

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Bun | Matches `ghui`; standalone-binary build pipeline already proven. |
| Language | TypeScript | Strict mode. |
| TUI framework | `@opentui/react` | JSX + hooks fit a multi-view app; matches `ghui`. |
| State / IO | [Effect](https://effect.website) | Author wants to learn it; well-suited to async/IO when v2 features land. |
| Markdown rendering | `opentui`'s built-in `<markdown>` (`MarkdownRenderable`) | opentui ships a production-hardened markdown renderer with tables, tree-sitter syntax highlighting, and theme support via `SyntaxStyle`. Reusing it skips a large class of parsing/layout work and matches the "showcase opentui" goal. |
| Linter | `oxlint` | Matches `ghui`. |
| Formatter | `oxfmt` | Matches `ghui`. |
| Tests | `bun test` | Stays in-runtime. |
| Distribution | Bun standalone binary + npm package | Brew tap deferred to v2. |

**Note on Effect.** The author has not shipped Effect before. Some early code will
read like "Effect by way of Promises" until the patterns settle. That is expected
and acceptable; refactors-toward-idiomatic-Effect are tracked as work in v1→v2.

## 9. Architecture Sketch

### 9.1 Module map

```
src/
├── cli/         argv parsing; `openmdr [path]`, `--theme`, `--width`, `--all`, `--help`
├── discovery/   walk filesystem, apply gitignore, produce a sorted file list
├── reader/      wraps opentui's <markdown> (and any per-doc state: scroll, theme)
├── theme/       dark.ts, light.ts, detect.ts, types.ts
├── tui/         top-level App, Sidebar, Reader, HelpOverlay; keymap wiring
└── index.tsx    Effect entry point: parse argv, build Layer, hand off to tui
```

### 9.2 Data flow

```
argv ──► cli ──► (path, options)
                    │
                    ▼
              discovery ─► file list (signal/atom)
                                │
                       user selects ▼
                          read file → string
                                │
                                ▼
                          <markdown content={...} syntaxStyle={theme} />
                                │
                                ▼
                          rendered pane (inside scrollbox)
```

Discovery, parsing, and rendering are pure (Effect-y) functions of their inputs.
The TUI layer wires them to user input and screen output. Keeping these layers
strictly separated is what lets us add search, link-following, and live-reload in
v2 without touching the renderer.

### 9.3 Effect layering (sketch)

- `Discovery` service — `walk(path, opts) → Stream<FileEntry>`.
- `FileReader` service — `read(path) → Effect<string, ReadError>`.
- `Theme` service — `detect() → Effect<Theme, never>`; produces a `SyntaxStyle` for `<markdown>`.
- App `Layer` composes these and hands the live runtime to the React tree via
  `@effect/atom-react`.

Errors are tagged unions. No `throw` in domain code; errors-as-values flow up to
the TUI layer, which renders them inline (e.g., a "couldn't parse this file" box).

## 10. v2 Quality Gates

These are gates for *calling it v2 and shipping publicly*, not blockers for
individual PRs.

### 10.1 Performance (targets to validate)

Numbers below are guesses informed by "feels fast" expectations; treat them as
targets to validate against measured baselines, not hard contracts.

| Metric | Target |
|---|---|
| Cold start to first paint (200-file repo) | <150ms |
| Render of a typical README (≤500 lines) | <50ms |
| Render of a 5,000-line stress doc | <250ms |
| Scroll latency (input → frame) | <16ms (60fps) |
| Discovery on a 10k-file monorepo | <500ms |
| Resident memory on a typical repo | <80MB |

A `bun run bench` script checks these against a fixture corpus checked into
`test/fixtures/`.

### 10.2 Tests

- Every markdown node type the renderer claims to support has at least one
  snapshot test of its `opentui` output.
- Every keymap binding has at least one integration test (boot TUI, send keys,
  assert state).
- Discovery edge cases covered: `.gitignore`, nested `.gitignore`, hidden files,
  symlinks not followed, missing dir, empty dir.
- Smoke test on the built standalone binary in CI.
- No coverage % gate. Coverage rewards the wrong thing.

### 10.3 Structure

- Module boundaries from §9.1 enforced. No circular imports (lint rule).
- Effect services exposed as Layers; errors as tagged unions; no `throw` in
  domain code.
- Every exported symbol has TSDoc.

### 10.4 Documentation

- `README.md` — install, run, screenshots / asciicast, key cheatsheet.
- `DESIGN.md` — shipped behavior matches doc.
- `CONTRIBUTING.md` — dev, build, test, release flow.
- `CHANGELOG.md` — generated via changesets.

### 10.5 Release / OSS hygiene

- Published to npm, Homebrew tap, GitHub releases (prebuilt binaries:
  linux/mac/win × x64/arm64).
- Semver, driven by changesets.
- CI: typecheck + lint + test on PR; build + publish on tag.
- Issue & PR templates.
- MIT license, single `LICENSE` file.

## 11. Open Questions

Things we will learn by building, not by debating.

- Does Effect's Layer model fit a single-process TUI cleanly, or does it feel
  oversized for the amount of IO we actually do? Revisit before v2.
- How much does `opentui`'s React reconciler cost on full re-renders of long
  documents? May need windowing/virtualization for large files; will be measured
  against §10.1 targets.
- What's the right boundary between "render plain markdown" (v1) and "follow a
  link to another file" (v2)? Done well, the renderer already produces
  navigable link nodes; done poorly, we re-architect.
- Bun's standalone binary size — acceptable, or do we need a slim build path?

## 12. Patterns to revisit

Approaches we deliberately did *not* adopt, with the trigger that should bring
us back. Each entry pairs a deferred pattern with a concrete signal — when that
signal fires, re-read this section.

Inline `// TODO(revisit: <topic>)` markers in the code point here from the
relevant call sites. Grep for `TODO(revisit:` to enumerate them.

- **Declarative keymap as data — small in-house version landed.**
  Bindings as values with `{ id, description, keys, when?, run }` and a pure
  `dispatch` live in `src/keymap/`. The shape is enough to drive `useKeyboard`
  *and* the upcoming `?` help overlay from one source of truth.
  - **Outstanding ghui machinery (still deferred):** chord sequences (`g g`),
    vim count prefixes (`5j`), scoped contexts via contramap, conflict
    detection, command-palette routing.
  - Trigger to revisit: a third interactive overlay/modal lands (search,
    filter, command palette), OR a real need for chord/count input emerges.

- **Theme as a typed token interface (ghui's `ColorPalette`)**
  - What it is: a `Theme` interface with semantic tokens (`background`,
    `text`, `muted`, `accent`, `selectedBg`, `border.active`,
    `border.inactive`, …). Multiple themes implement it; consumers reference
    tokens, not raw colors.
  - Why deferred: only one (dark) theme exists; named constants in
    `Browser.tsx` are clearer at this scale.
  - Trigger: **before** introducing the light theme. Doing it as part of the
    auto-detect change is fine; doing it after means duplicating constants
    twice.

- **Keymap composition / scoped contexts**
  - What it is: per-view keymaps that compose via `Keymap.scope(predicate)` so
    modal bindings stack on top of base bindings without giant if/else
    routing in one handler.
  - Why deferred: routing-by-state in our single `useKeyboard` is fine for
    sidebar-vs-reader.
  - Trigger: when the third overlay surface lands, OR when the focus-routing
    `if` chain in `Browser.tsx` gets uncomfortable to read.

- **User-configurable sidebar width**
  - What it is: a setting (CLI flag and/or config file) that overrides the
    sidebar width heuristic. Power users with strong layout preferences want
    this; the heuristic alone won't satisfy everyone.
  - Why deferred: the in-code heuristic
    `clamp(28, floor(width * 0.25), 60)` is a sensible default and ships with
    zero ceremony.
  - Trigger: when the persistent config file lands (already on the deferred
    list in §5.3) — wire `sidebarWidth` through it at the same time. A
    standalone `--sidebar-width` flag is fine sooner if a real user asks.

- **Sidebar truncation strategy**
  - What it is: how long file paths are shortened when they exceed the
    sidebar's width. Today: leading ellipsis, keeping the filename visible
    (`…l/job_search/cv.md`). Plausible alternatives: middle-truncation
    (`Personal/…/cv.md`), filename-first with dimmed parent dir, or a
    two-line entry that shows both.
  - Why deferred: the leading-ellipsis form is fine for a first pass; we
    don't yet know which case is actually annoying in real use.
  - Trigger: real-use friction with the leading-ellipsis form, OR feedback
    that filename context is being lost.

- **Custom remark/mdast renderer (replacing opentui's `<markdown>`)**
  - What it is: parse with `remark` + `remark-gfm`, walk the mdast, emit
    opentui boxes/text directly. Already noted in §3 non-goals as a
    reserved-right swap.
  - Trigger: a concrete need we can't solve inside `<markdown>` —
    cross-file link following, in-document search highlighting, theming
    tokens that `SyntaxStyle` doesn't expose.

## 13. References

- glow — https://github.com/charmbracelet/glow (Go reference; in `reference/glow/`)
- ghui — https://github.com/kitlangton/ghui (opentui+Effect precedent; in `reference/ghui/`)
- opentui — https://github.com/anomalyco/opentui (rendering core; in `reference/opentui/`)
- Effect — https://effect.website
- remark / mdast — https://github.com/remarkjs/remark
