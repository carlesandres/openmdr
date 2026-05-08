/**
 * Browser keymap — the data backing `Browser.tsx`'s `useKeyboard` handler
 * and (next iteration) the `?` help overlay.
 */

import type { FileEntry } from "../discovery/walk.ts"
import type { KeyBinding } from "./keymap.ts"

export type BrowserFocus = "sidebar" | "reader"

export interface BrowserCtx {
	readonly files: readonly FileEntry[]
	readonly focus: BrowserFocus
	readonly setFocus: (next: BrowserFocus | ((prev: BrowserFocus) => BrowserFocus)) => void
	readonly setSelectedIndex: (updater: (prev: number) => number) => void
	readonly quit: () => void
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const lastIndex = (c: BrowserCtx) => Math.max(0, c.files.length - 1)
const haveFiles = (c: BrowserCtx) => c.files.length > 0

const inSidebar = (c: BrowserCtx) => c.focus === "sidebar"
const inReader = (c: BrowserCtx) => c.focus === "reader"
const inSidebarWithFiles = (c: BrowserCtx) => inSidebar(c) && haveFiles(c)

export const browserBindings: readonly KeyBinding<BrowserCtx>[] = [
	// Global
	{ id: "quit", description: "Quit", keys: ["q", "ctrl+c"], run: (c) => c.quit() },
	{
		id: "focus.toggle",
		description: "Toggle focus (sidebar ↔ reader)",
		keys: ["tab"],
		run: (c) => c.setFocus((f) => (f === "sidebar" ? "reader" : "sidebar")),
	},

	// Sidebar
	{
		id: "sidebar.down",
		description: "Move selection down",
		keys: ["j", "down"],
		when: inSidebarWithFiles,
		run: (c) => c.setSelectedIndex((i) => clamp(i + 1, 0, lastIndex(c))),
	},
	{
		id: "sidebar.up",
		description: "Move selection up",
		keys: ["k", "up"],
		when: inSidebarWithFiles,
		run: (c) => c.setSelectedIndex((i) => clamp(i - 1, 0, lastIndex(c))),
	},
	{
		id: "sidebar.top",
		description: "Jump to first file",
		keys: ["g"],
		when: inSidebarWithFiles,
		run: (c) => c.setSelectedIndex(() => 0),
	},
	{
		id: "sidebar.bottom",
		description: "Jump to last file",
		keys: ["shift+g"],
		when: inSidebarWithFiles,
		run: (c) => c.setSelectedIndex(() => lastIndex(c)),
	},
	{
		id: "sidebar.open",
		description: "Open file (focus reader)",
		keys: ["return", "right", "l"],
		when: inSidebar,
		run: (c) => c.setFocus("reader"),
	},

	// Reader
	{
		id: "reader.back",
		description: "Back to sidebar",
		keys: ["escape", "left", "h"],
		when: inReader,
		run: (c) => c.setFocus("sidebar"),
	},
]
