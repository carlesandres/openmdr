# Changelog

All notable changes to openmdr land here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) from
v0.1.0 onward.

The publish workflow (`.github/workflows/publish.yml`) runs on the
`release: published` event, runs `npm publish` via Trusted Publisher,
and lets GitHub auto-generate release notes from commit subjects; this
file is the curated, narrative version.

## [Unreleased]

### Added — themes

- **33 bundled JSON themes** selectable via `--theme <id>`: `aura`, `ayu`,
  `carbonfox`, `catppuccin`, `catppuccin-frappe`, `catppuccin-macchiato`,
  `cobalt2`, `cursor`, `dracula`, `everforest`, `flexoki`, `github`,
  `gruvbox`, `kanagawa`, `lucent-orng`, `material`, `matrix`, `mercury`,
  `monokai`, `nightowl`, `nord`, `one-dark`, `opencode`, `orng`,
  `osaka-jade`, `palenight`, `rosepine`, `solarized`, `synthwave84`,
  `tokyonight`, `vercel`, `vesper`, `zenburn`. Token values sourced
  directly from each upstream's canonical palette via
  `dev/build-themes.ts`.
- **`--tone dark|light`** flag to select the variant of a theme. Defaults
  to `dark`. Not all themes have a well-tuned light variant; quality is
  best-effort for those.
- **JSON theme format**: each theme is a `{defs, theme: {dark, light}}`
  file validated against `schema/openmdr-theme.schema.json`. The format
  mirrors opencode's TUI theme shape; `defs` supports variable
  substitution.
- **`dev/build-themes.ts`**: fetches themes from the opencode GitHub API,
  strips diff tokens, resolves variables, and regenerates `src/theme/loader.ts`.
  Supports `GITHUB_TOKEN` and `--dry-run`. Not shipped in the npm package.
- **Runtime theme cycling**: press `t` / `T` to step forward / backward
  through all themes without restarting. Press `L` (shift+l) to toggle
  between dark and light tone. Works in both browser mode and single-file
  mode. Theme changes take effect immediately; syntax highlighting
  rebuilds with the new palette.

### Changed

- Theme system replaced: derivation engine (`derive.ts`) and the 12
  TS-value themes removed in favour of the JSON format above. The
  `ColorPalette` interface is unchanged; existing consumers (`Browser`,
  `App`, `HelpOverlay`) required no changes beyond the re-render wiring.
- `--theme` default changed from `dark` to `opencode` (the opencode
  project's own palette).
- Effect Atoms (`@effect/atom-react`) wired for re-render signalling:
  `themeAtom` holds `{ id, tone }`; `RegistryProvider` wraps both render
  paths in `index.tsx`.

## [0.1.0] — 2026-05-10

The v1 MVP, published as `@carlesandres/openmdr` on npm.

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

- Distribution as `@carlesandres/openmdr` on npm (Bun runtime required
  on user's `PATH`, no compiled binary). Modeled on ghui.
- `.github/workflows/ci.yml`: typecheck, lint, format:check, test,
  and `npm pack --dry-run` on every push and PR.
- `.github/workflows/publish.yml`: `release: published` triggers
  `npm publish` via Trusted Publisher (OIDC, no token), with a
  tag-vs-`package.json`-version assertion before publish.
- `.oxfmtrc.json`: pinned formatting so `format:check` is meaningful.

### Added — docs

- `DESIGN.md`: foundational design doc (13 sections; §3 non-goals,
  §5.3 deferred, §7.3 reserved keys, §10 v2 gates, §12 deferred
  patterns with triggers).
- `README.md`, `CONTRIBUTING.md`, `AGENTS.md` (cookbook for AI
  assistants), `LICENSE` (MIT).
- Issue templates (bug + feature + blank), PR template. All
  communication routes through GitHub issues.

### Added — tests

- 75 headless tests via `testRender` + `captureCharFrame` +
  `mockInput`.

### Out of scope (deliberate, see DESIGN.md §3 / §5.3)

Search, stdin, URL fetching, cross-file link following, `$EDITOR`
hand-off, syntax highlighting, persistent config, OS-appearance
auto-detect, single-binary distribution (issue
[#2](https://github.com/carlesandres/openmdr/issues/2)),
Homebrew tap. All tracked.

[Unreleased]: https://github.com/carlesandres/openmdr/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/carlesandres/openmdr/releases/tag/v0.1.0
