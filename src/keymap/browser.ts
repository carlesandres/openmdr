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
	readonly sidebarVisible: boolean
	readonly setFocus: (next: BrowserFocus | ((prev: BrowserFocus) => BrowserFocus)) => void
	readonly setSelectedIndex: (updater: (prev: number) => number) => void
	readonly setSidebarVisible: (updater: (prev: boolean) => boolean) => void
	readonly quit: () => void
}

/** Step size for shift+j/k and the space/b/page keys. Constant for v1; could
 *  later be derived from the visible window height. */
const JUMP = 8

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const lastIndex = (c: BrowserCtx) => Math.max(0, c.files.length - 1)
const haveFiles = (c: BrowserCtx) => c.files.length > 0
const stepBy = (c: BrowserCtx, delta: number) =>
	c.setSelectedIndex((i) => clamp(i + delta, 0, lastIndex(c)))

const inSidebar = (c: BrowserCtx) => c.focus === "sidebar"
const inReader = (c: BrowserCtx) => c.focus === "reader"
const inSidebarWithFiles = (c: BrowserCtx) => inSidebar(c) && haveFiles(c)
const inReaderWithFiles = (c: BrowserCtx) => inReader(c) && haveFiles(c)

export const browserBindings: readonly KeyBinding<BrowserCtx>[] = [
	// Global
	{ id: "quit", description: "Quit", keys: ["q", "ctrl+c"], run: (c) => c.quit() },
	{
		id: "focus.toggle",
		description: "Toggle focus (sidebar ↔ reader)",
		keys: ["tab"],
		run: (c) => c.setFocus((f) => (f === "sidebar" ? "reader" : "sidebar")),
	},
	{
		id: "sidebar.toggle",
		description: "Toggle sidebar visibility",
		keys: ["\\"],
		run: (c) => {
			const willHide = c.sidebarVisible
			c.setSidebarVisible((v) => !v)
			// When hiding the sidebar, move focus to the reader so input has a
			// target. When revealing it, move focus back to the sidebar.
			c.setFocus(willHide ? "reader" : "sidebar")
		},
	},

	// Sidebar
	{
		id: "sidebar.down",
		description: "Move selection down",
		keys: ["j", "down"],
		when: inSidebarWithFiles,
		run: (c) => stepBy(c, 1),
	},
	{
		id: "sidebar.up",
		description: "Move selection up",
		keys: ["k", "up"],
		when: inSidebarWithFiles,
		run: (c) => stepBy(c, -1),
	},
	{
		id: "sidebar.jumpDown",
		description: `Jump down ${JUMP}`,
		keys: ["shift+j"],
		when: inSidebarWithFiles,
		run: (c) => stepBy(c, JUMP),
	},
	{
		id: "sidebar.jumpUp",
		description: `Jump up ${JUMP}`,
		keys: ["shift+k"],
		when: inSidebarWithFiles,
		run: (c) => stepBy(c, -JUMP),
	},
	{
		id: "sidebar.pageDown",
		description: "Page down",
		keys: ["space", "pagedown", "ctrl+d"],
		when: inSidebarWithFiles,
		run: (c) => stepBy(c, JUMP),
	},
	{
		id: "sidebar.pageUp",
		description: "Page up",
		keys: ["b", "pageup", "ctrl+u"],
		when: inSidebarWithFiles,
		run: (c) => stepBy(c, -JUMP),
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
	{
		id: "reader.prevFile",
		description: "Previous file",
		keys: ["["],
		when: inReaderWithFiles,
		run: (c) => stepBy(c, -1),
	},
	{
		id: "reader.nextFile",
		description: "Next file",
		keys: ["]"],
		when: inReaderWithFiles,
		run: (c) => stepBy(c, 1),
	},
]
