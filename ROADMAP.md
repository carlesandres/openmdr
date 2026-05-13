# Roadmap

This file is the single index of planned work for openmdr. Each row points at
the GitHub issue that tracks it. Prose-only entries are items still waiting on
scoping before they become issues.

Architectural rationale, UX rules, and key reservations live in `DESIGN.md`.
This file is a tracking layer on top of that.

★ marks a confirmed competitive gap (mdcat / frogmouth / mdr — see issue #16).

## Near-term — v2 release gates

| Theme | Item | Issue |
|---|---|---|
| Chrome | Footer chrome v1 — hunk-style status bar with keymap-derived hints (lands before #22) | [#36](https://github.com/carlesandres/openmdr/issues/36) |
| Layout | Responsive auto-layout v2 (sidebar visibility + width, `--layout` mode, force-open override) | [#22](https://github.com/carlesandres/openmdr/issues/22) |
| Sidebar | Tree-style sidebar with collapsible folders | [#14](https://github.com/carlesandres/openmdr/issues/14) |
| Config | Hierarchical config file (prereq for several deferred features) | [#13](https://github.com/carlesandres/openmdr/issues/13) |
| Rendering | Markdown → HTML rendering investigation | [#18](https://github.com/carlesandres/openmdr/issues/18) |
| Distribution | Standalone binary (no Bun-on-PATH) | [#2](https://github.com/carlesandres/openmdr/issues/2) |
| Distribution | Auto-update mechanism | [#12](https://github.com/carlesandres/openmdr/issues/12) |

## Bug-fix backlog

| Item | Issue |
|---|---|
| Sort order of empty files in sidebar | [#21](https://github.com/carlesandres/openmdr/issues/21) |
| Theme cycling while help overlay is open | [#15](https://github.com/carlesandres/openmdr/issues/15) (fixed in `bbd3e29`, verify and close) |

## File-level interactions

| Item | Issue |
|---|---|
| Open current file in `$EDITOR` | [#19](https://github.com/carlesandres/openmdr/issues/19) |
| Delete current file with confirmation | [#20](https://github.com/carlesandres/openmdr/issues/20) |
| Read markdown from stdin (`openmdr -`) | [#23](https://github.com/carlesandres/openmdr/issues/23) |
| Cross-file link following | [#24](https://github.com/carlesandres/openmdr/issues/24) |
| Live reload on file change | [#27](https://github.com/carlesandres/openmdr/issues/27) |

## Navigation & discovery

| Item | Issue |
|---|---|
| Search — filename, full-text, fuzzy | [#25](https://github.com/carlesandres/openmdr/issues/25) |
| Navigation history stack (back/forward) ★ | [#29](https://github.com/carlesandres/openmdr/issues/29) |
| Heading jump / in-document TOC panel ★ | [#30](https://github.com/carlesandres/openmdr/issues/30) |
| Per-file bookmarks ★ (depends on #13) | [#33](https://github.com/carlesandres/openmdr/issues/33) |

## Networking

| Item | Issue |
|---|---|
| Fetch markdown from URL / `github.com/owner/repo` shorthand ★ | [#26](https://github.com/carlesandres/openmdr/issues/26) |

## Rendering polish

| Item | Issue |
|---|---|
| Line numbers toggle | [#28](https://github.com/carlesandres/openmdr/issues/28) |
| Inline images (iTerm2 / Kitty / Sixel) ★ | [#31](https://github.com/carlesandres/openmdr/issues/31) |
| OSC 8 hyperlinks for markdown links ★ | [#32](https://github.com/carlesandres/openmdr/issues/32) |

## Chrome (follow-ons)

| Item | Issue |
|---|---|
| Footer responsive behavior on tight viewports | [#37](https://github.com/carlesandres/openmdr/issues/37) |
| Evaluate adding a header chrome (breadcrumb / heading / mode chips) | [#38](https://github.com/carlesandres/openmdr/issues/38) |

## Theming & keymap

| Item | Issue |
|---|---|
| Theming v2 — user stylesheets, named theme sets | [#34](https://github.com/carlesandres/openmdr/issues/34) |
| Extract reusable keymap package (`@ghui/keymap` style) | [#35](https://github.com/carlesandres/openmdr/issues/35) |

## Unscoped — needs design pass before filing

- **Custom per-file actions** — `DESIGN.md §5.3`. Mechanism (config-driven? plugin?) unclear.
- **Mouse polish** — `DESIGN.md §5.3`. No concrete deficiency list yet; revisit once layout v2 (#22) lands.

## Featured plan: responsive auto-layout v2 (#22)

Today's layout is a single threshold: below ~80 cols the sidebar collapses;
above it the sidebar is fixed at ~30 cols. There is no way to reopen the
sidebar on a narrow terminal and no configurable width.

The plan in [#22](https://github.com/carlesandres/openmdr/issues/22) is to:

1. Keep the existing two-pane shape (no stack/split orientation work).
2. Replace the binary threshold with three viewport buckets (`tight`,
   `comfortable`, `roomy`) that drive default sidebar visibility and width
   independently.
3. Add an explicit `--layout auto|compact|full` flag and runtime keybinding so
   the responsive rule can be overridden.
4. Add a force-open override (`\` on a tight viewport opens the sidebar at min
   width when reader-min still fits).
5. Funnel all visibility/width math through one `resolveLayout(...)` helper so
   render code and key handlers cannot disagree.

Inspiration: `reference/hunk/src/ui/lib/responsive.ts` does the analogous job
for hunk. Notable differences here — openmdr only has one pane orientation, so
the "split vs stack" decision in hunk reduces to "sidebar shown vs hidden,"
and the width math gains a configurable preferred width that hunk does not
need.

See the issue for acceptance criteria and open questions.
