# openmdr

A TUI-first markdown reader. Open a directory; navigate files in a sidebar;
read them in a pager. Inspired by [`glow`](https://github.com/charmbracelet/glow);
built on [`opentui`](https://github.com/anomalyco/opentui).

> **Status:** v0.1.0 published to npm as
> [`@carlesandres/openmdr`](https://www.npmjs.com/package/@carlesandres/openmdr).
> Bun is required at runtime; there is no standalone binary yet (tracked
> in [#2](https://github.com/carlesandres/openmdr/issues/2)). The design
> doc (`DESIGN.md`) explains scope, decisions, and what stays deferred.

## Install

Requires [Bun](https://bun.sh) on your `PATH` (it's the runtime openmdr ships
against — there is no compiled binary).

```bash
npm install -g @carlesandres/openmdr
openmdr --help
```

Or, from source:

```bash
git clone https://github.com/carlesandres/openmdr.git
cd openmdr
bun install
bun run src/index.tsx [path]
```

A standalone single-binary distribution (no Bun on `PATH` required) is tracked
as a future option — see issue [#2](https://github.com/carlesandres/openmdr/issues/2)
and DESIGN.md §10.5.

## Usage

```
openmdr [path] [options]

  path           file or directory; defaults to the current directory

options:
  --theme <id>   color theme: dark, light (default: dark)
  --width <N>    cap rendered markdown width at N columns
  --all          include hidden and gitignored files in discovery
  -h, --help     show this help and exit
  -v, --version  print version and exit
```

Examples:

```bash
openmdr                       # browse markdown files in cwd
openmdr docs                  # browse a specific directory
openmdr README.md             # render a single file
openmdr --theme light docs    # light theme
openmdr --width 80 README.md  # cap content width for readability
```

## Keymap

Press `?` inside the app for the full list. Highlights:

| Key | Action |
|---|---|
| `j` / `k`, `↑` / `↓` | Move sidebar selection |
| `shift+j` / `shift+k`, `space` / `b`, `pagedown` / `pageup`, `ctrl+d` / `ctrl+u` | Jump / page through files |
| `g` / `G` | First / last file |
| `return`, `l`, `→` | Open file (focus reader) |
| `escape`, `h`, `←` | Back to sidebar |
| `[` / `]` | Previous / next file (from reader) |
| `tab` | Toggle focus between sidebar and reader |
| `\` | Toggle sidebar visibility |
| `?` | Show / dismiss help |
| `q`, `ctrl+c` | Quit |

## What's in / what's out

**In v1:**

- Browse markdown files (`.md`, `.markdown`, `.mdx`) in any directory.
- Discovery respects `.gitignore` (root + nested), skips `node_modules` /
  `.git` / `.venv`, doesn't follow symlinks.
- Two-pane layout (sidebar + reader) with a focus model and a help overlay.
- Dark and light themes via `--theme`.

**Deliberately deferred** (see `DESIGN.md`):

- Filename / full-text / fuzzy search.
- Stdin (`openmdr -`), URL fetching, `github.com/owner/repo` shorthand.
- Cross-file link following.
- "Open in `$EDITOR`" and other custom file actions.
- Live reload, persistent config file, OS-appearance auto-detect.
- Single-binary distribution (current install requires Bun on `PATH`).
- Homebrew tap.

**Hard non-goals:** not an editor, not an exporter, not a sync service, not a
general-purpose pager.

## Development

```bash
bun run dev              # watch + run from source
bun test                 # full test suite (currently 75 tests)
bun run typecheck        # strict TypeScript
bun run lint
bun run format

bun run dev/bench-markdown.ts <dir>   # microbenchmark <markdown> swap cost

# packaging sanity
npm pack --dry-run       # show what would land on npm
```

The full architecture and the rationale for what's deferred are in
[`DESIGN.md`](./DESIGN.md). Patterns we deliberately did *not* adopt — and the
trigger that should bring each one back — live in §12 of the same doc.

## License

MIT.
