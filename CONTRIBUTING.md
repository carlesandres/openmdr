# Contributing to openmdr

Thanks for considering a contribution. openmdr is a small project; the bar
for changes is "reads cleanly, fits the design, doesn't accidentally bind a
reserved key." This doc covers the local loop and the rules that aren't
obvious from the code.

Read [`DESIGN.md`](./DESIGN.md) before opening a PR that adds a feature.
§3 lists hard non-goals, §5.3 lists what's deliberately deferred, and §7.3
lists keys reserved for v2.

## Local loop

```bash
bun install
bun run dev <path>      # watch + run from source
bun test                # full test suite
bun run typecheck
bun run lint
bun run format          # write
bun run format:check    # check (CI uses this)

bun run build           # standalone binary at dist/openmdr
bun run smoke           # exercise the built binary
```

Any PR has to pass `typecheck`, `lint`, `format:check`, `test`, and
`build` + `smoke` — that's what `.github/workflows/ci.yml` enforces.

## Project layout

See `DESIGN.md` §9.1 for the module map. In short:

- `src/cli/` — argv parsing
- `src/discovery/` — filesystem walk + `.gitignore`
- `src/io/` — file reads (Effect)
- `src/keymap/` — declarative bindings + dispatch
- `src/theme/` — typed palette + mutable singleton
- `src/Browser.tsx`, `src/HelpOverlay.tsx`, `src/index.tsx` — TUI
- `test/` — `bun test` runs only files under here (see `bunfig.toml`)
- `dev/` — build + smoke + bench scripts (not shipped)

## Testing

The headless test pattern is documented in `test/spike.test.tsx`. Use
`testRender` + `captureCharFrame` + `mockInput`. When asserting on
`<markdown>` body content, prefer asserting on stable surfaces (border
titles, sidebar rows) — the markdown body has first-frame quirks in
headless render.

Add tests alongside features. We don't enforce coverage, but every
keymap binding should have at least one integration test (see §10.2 of
DESIGN.md for the v2 gate).

## Keymap changes

Bindings are data: `src/keymap/browser.ts` is the single source for
`useKeyboard` *and* the `?` help overlay. To add a binding, append a
`KeyBinding` to `browserBindings` with `id`, `description`, `keys`, an
optional `group`, optional `when` predicate, and `run`. The help
overlay picks it up automatically.

Do not bind these keys — they are reserved for v2 (DESIGN.md §7.3):
`/`, `e`, `o`, `r`.

## Themes

A theme is a `ColorPalette` value (see `src/theme/types.ts`). To add
one: drop a new file in `src/theme/`, register it in
`src/theme/registry.ts`, and add it to the `--theme` validation in
`src/cli/argv.ts`. v2 has user-supplied stylesheets on the deferred
list; until then, themes are TS values shipped with the binary.

## Patterns we deliberately did not adopt

DESIGN.md §12 records design choices we deferred and the trigger that
should bring each one back. If you're tempted to land one of those
patterns, check that the trigger has fired — or update §12 with a new
one.

## Commits, branches, PRs

- Branch off `main`. Force-pushes to `main` are not allowed.
- Commit messages: imperative, lowercase prefix (`feat:`, `fix:`,
  `refactor:`, `docs:`, `ci:`, `chore:`, `build:`, `test:`). The
  one-line subject is the contract; bodies are encouraged when the
  *why* isn't obvious.
- PR titles match the same shape. Keep PRs small enough to review in
  one sitting.

## Release flow

Tag-driven, see `.github/workflows/release.yml`. Steps:

1. Move `[Unreleased]` items in `CHANGELOG.md` under a new
   `## [X.Y.Z] — YYYY-MM-DD` heading; update the link refs at the bottom.
2. Bump `version` in `package.json`.
3. Commit (`chore: release vX.Y.Z`), tag, push:

```bash
git tag vX.Y.Z
git push origin main vX.Y.Z
```

The release workflow builds on five runners (mac arm64/x64, linux
arm64/x64, windows x64), runs smoke on each, and attaches archives to
a GitHub release with auto-generated notes. There is no npm or
Homebrew distribution yet — see DESIGN.md §10.5.

## License

By contributing, you agree your contribution is licensed under MIT,
the same as the rest of the project.
