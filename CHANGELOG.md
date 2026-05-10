# Changelog

All notable changes to openmdr land here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once it
hits v0.1.0. Until then, breaking changes can land in any release.

The release workflow (`.github/workflows/release.yml`) auto-generates GitHub
release notes from commit subjects when a `v*` tag is pushed; this file is
the curated, narrative version.

## [Unreleased]

The v1 MVP is implemented but not yet tagged. Everything below is what
will land in the first release.

### Added — TUI

- Two-pane browser: sidebar + reader, with a focus model, sidebar
  visibility toggle (`\`), and a `?` help overlay generated from the
  bindings array.
- Single-file mode when invoked on a file path.
- Themes: dark + light as typed `ColorPalette` values, mutable singleton
  consumer, selected via `--theme`.

### Added — discovery

- Recursive walk from the path argument (or cwd), `.md` / `.markdown` /
  `.mdx` only.
- Honors `.gitignore` (root + nested).
- Hard-skips `node_modules`, `.git`, `.venv` (always, even with `--all`).
- Does not follow symlinks.

### Added — CLI

- `--help`, `--version`, `--width <N>`, `--all`, `--theme <id>`.

### Added — keymap

- `KeyBinding[]` with `id` / `description` / `keys` / `group` / optional
  `when` / `run`. Single source for both `useKeyboard` dispatch and the
  help overlay.
- Bindings: `j`/`k` + arrows, shift-jump, page/half-page, `g`/`G`,
  `return`/`l`/`→`, `escape`/`h`/`←`, `[`/`]`, `tab`, `\`, `?`,
  `q`/`ctrl+c`. Reserved (not bound): `/`, `e`, `o`, `r`.

### Added — release infra

- Distribution as `@carlesandres/openmdr` on npm (Bun runtime
  required on user's `PATH`, no compiled binary). Modeled on ghui.
- `.github/workflows/ci.yml`: typecheck, lint, format:check, test,
  and `npm pack --dry-run` on every push and PR.
- `.github/workflows/publish.yml`: `release: published` triggers
  `npm publish` via Trusted Publisher (OIDC, no token), with a
  tag-vs-`package.json`-version assertion before publish.
- `.oxfmtrc.json`: pinned formatting so `format:check` is meaningful.

### Removed (vs an earlier plan in this branch)

- Cross-target `bun --compile` release workflow + `dev/build-standalone.ts`
  + `dev/smoke.ts`. The bytes-per-user / build-cost trade-off doesn't
  pay off yet for a project with no real users; revisit when there is
  concrete demand for "one binary, no Bun required". Tracked as an
  issue.

### Added — docs

- `DESIGN.md`: foundational design doc (13 sections; §3 non-goals,
  §5.3 deferred, §7.3 reserved keys, §10 v2 gates, §12 deferred
  patterns with triggers).
- `README.md`, `CONTRIBUTING.md`, `AGENTS.md` (cookbook for AI
  assistants), `LICENSE` (MIT).
- Issue templates (bug + feature + Discussions link), PR template.

### Added — tests

- 75 headless tests via `testRender` + `captureCharFrame` +
  `mockInput`.

### Out of scope (deliberate, see DESIGN.md §3 / §5.3)

Search, stdin, URL fetching, cross-file link following, `$EDITOR`
hand-off, syntax highlighting, persistent config, OS-appearance
auto-detect, npm + Homebrew distribution. All tracked.

[Unreleased]: https://github.com/carlesandres/openmdr/commits/main
