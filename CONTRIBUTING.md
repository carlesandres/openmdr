# Contributing to openmdr

Thanks for considering a contribution. openmdr is a small project; the bar
for changes is "reads cleanly, fits the design, doesn't accidentally bind a
reserved key." This doc covers the local loop and the rules that aren't
obvious from the code.

Read [`DESIGN.md`](./DESIGN.md) before opening a PR that adds a feature.
§3 lists hard non-goals, §5.3 lists what's deliberately deferred, and §7.3
lists keys reserved for v2.

All project communication happens in **GitHub issues** — bugs, feature
requests, design questions, scope debates. There is no Discussions tab,
no Discord, no chat. If you're not sure whether something is a bug or by
design, open an issue.

If you're an AI assistant pairing on this repo, also read
[`AGENTS.md`](./AGENTS.md) — it's the cookbook for the moves
(commands, release process, things-not-to-do).

## Local loop

```bash
bun install
bun run dev <path>      # watch + run from source
bun test                # full test suite
bun run typecheck
bun run lint
bun run format          # write
bun run format:check    # check (CI uses this)

npm pack --dry-run      # show exactly what would ship to npm
```

Any PR has to pass `typecheck`, `lint`, `format:check`, `test`, and
`npm pack --dry-run` — that's what `.github/workflows/ci.yml` enforces.

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

Release-event-driven. See `.github/workflows/publish.yml` and the more
detailed step-by-step in `AGENTS.md`. Quick version:

1. Move `[Unreleased]` items in `CHANGELOG.md` under a new dated
   heading; update link refs.
2. Bump `version` in `package.json`.
3. Branch off `main` (e.g. `release/vX.Y.Z`), commit
   `chore: release vX.Y.Z`, push, open a PR into `main`. Wait for
   CI; merge. Direct commits to `main` are blocked by branch
   protection.
4. After merge, pull `main` locally, then
   `gh release create vX.Y.Z --target main --title vX.Y.Z --generate-notes`
   — the workflow takes it from there (`npm publish` via Trusted
   Publisher).

The release workflow builds on five runners (mac arm64/x64, linux
arm64/x64, windows x64), runs smoke on each, and attaches archives to
a GitHub release with auto-generated notes. There is no npm or
Homebrew distribution yet — see DESIGN.md §10.5.

## License

By contributing, you agree your contribution is licensed under MIT,
the same as the rest of the project.
