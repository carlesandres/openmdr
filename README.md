# openmdr

A TUI-first markdown reader. Open a directory; navigate files in a sidebar;
read them in a pager. Inspired by [`glow`](https://github.com/charmbracelet/glow);
built on [`opentui`](https://github.com/anomalyco/opentui).

> **Status:** v1 MVP. Not yet published to npm or Homebrew. The binary builds
> and runs; the design doc (`DESIGN.md`) explains scope, decisions, and what
> stays deferred.

## Install

Requires [Bun](https://bun.sh).

```bash
git clone <this repo> && cd openmdr
bun install
bun run build           # produces dist/openmdr (~75MB, host platform)
./dist/openmdr --help
```

Or run from source:

```bash
bun run src/index.tsx [path]
```

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
- npm and Homebrew distribution.

**Hard non-goals:** not an editor, not an exporter, not a sync service, not a
general-purpose pager.

## Development

```bash
bun run dev              # watch + run from source
bun test                 # full test suite (currently 75 tests)
bun run typecheck        # strict TypeScript
bun run lint
bun run format

bun run build            # compile dist/openmdr
bun run smoke            # exercise the built binary

bun run dev/bench-markdown.ts <dir>   # microbenchmark <markdown> swap cost
```

The full architecture and the rationale for what's deferred are in
[`DESIGN.md`](./DESIGN.md). Patterns we deliberately did *not* adopt — and the
trigger that should bring each one back — live in §12 of the same doc.

## License

MIT.
