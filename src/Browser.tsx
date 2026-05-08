/**
 * Browser — two-pane mode: file sidebar (left) + reader (right).
 *
 * Minimum-viable iteration:
 *  - j/k or arrow keys move selection in the sidebar.
 *  - The reader always shows the currently selected file's contents.
 *  - q / ctrl+c quit.
 *
 * Deferred to next iteration: focus model, reader scrolling via j/k,
 * sidebar collapse with `\`, help overlay.
 */

import { parseColor, SyntaxStyle } from "@opentui/core"
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { Effect } from "effect"
import { useEffect, useMemo, useState } from "react"
import { type FileEntry } from "./discovery/walk.ts"
import { readFileText } from "./io/readFile.ts"
import { browserBindings, type BrowserCtx } from "./keymap/browser.ts"
import { dispatch } from "./keymap/keymap.ts"

// TODO(revisit: theme tokens) — see DESIGN.md §12.
// Duplicated in src/index.tsx (App). Extract to src/theme/ before adding the
// light theme; replace raw constants with a Theme interface of semantic tokens.
const darkStyles = {
	keyword: { fg: parseColor("#81A1C1"), bold: true },
	string: { fg: parseColor("#A3BE8C") },
	comment: { fg: parseColor("#616E88"), italic: true },
	number: { fg: parseColor("#B48EAD") },
	function: { fg: parseColor("#88C0D0") },
	type: { fg: parseColor("#8FBCBB") },
	operator: { fg: parseColor("#81A1C1") },
	variable: { fg: parseColor("#D8DEE9") },
	property: { fg: parseColor("#88C0D0") },
	"punctuation.bracket": { fg: parseColor("#ECEFF4") },
	"punctuation.delimiter": { fg: parseColor("#ECEFF4") },
	"markup.heading": { fg: parseColor("#88C0D0"), bold: true },
	"markup.heading.1": { fg: parseColor("#8FBCBB"), bold: true, underline: true },
	"markup.heading.2": { fg: parseColor("#88C0D0"), bold: true },
	"markup.heading.3": { fg: parseColor("#81A1C1") },
	"markup.bold": { fg: parseColor("#ECEFF4"), bold: true },
	"markup.strong": { fg: parseColor("#ECEFF4"), bold: true },
	"markup.italic": { fg: parseColor("#ECEFF4"), italic: true },
	"markup.list": { fg: parseColor("#EBCB8B") },
	"markup.quote": { fg: parseColor("#81A1C1"), italic: true },
	"markup.raw": { fg: parseColor("#A3BE8C"), bg: parseColor("#3B4252") },
	"markup.raw.block": { fg: parseColor("#A3BE8C"), bg: parseColor("#3B4252") },
	"markup.raw.inline": { fg: parseColor("#A3BE8C"), bg: parseColor("#3B4252") },
	"markup.link": { fg: parseColor("#88C0D0"), underline: true },
	"markup.link.label": { fg: parseColor("#A3BE8C"), underline: true },
	"markup.link.url": { fg: parseColor("#88C0D0"), underline: true },
	label: { fg: parseColor("#A3BE8C") },
	conceal: { fg: parseColor("#4C566A") },
	"punctuation.special": { fg: parseColor("#616E88") },
	default: { fg: parseColor("#D8DEE9") },
}

const BG = "#2E3440"
const FG = "#D8DEE9"
const FG_BRIGHT = "#ECEFF4"
const FG_MUTED = "#7B8794"
const SIDEBAR_BG = "#3B4252"
/** Highlighted selection in the active sidebar. */
const SELECTED_BG_ACTIVE = "#5E81AC"
/** Dimmed selection when sidebar is not the focused pane. */
const SELECTED_BG_INACTIVE = "#434C5E"
const BORDER_INACTIVE = "#4C566A"
const BORDER_ACTIVE = "#88C0D0"

export interface BrowserProps {
	readonly files: readonly FileEntry[]
	readonly title?: string
	readonly initialIndex?: number
	readonly onQuit?: () => void
	/** Test seam: replaces the file reader. */
	readonly readFile?: (path: string) => Promise<string>
}

const defaultReadFile = (path: string): Promise<string> => Effect.runPromise(readFileText(path))

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export const Browser = ({
	files,
	title = "openmdr",
	initialIndex = 0,
	onQuit,
	readFile = defaultReadFile,
}: BrowserProps) => {
	const renderer = useRenderer()
	const { width, height } = useTerminalDimensions()
	const syntaxStyle = useMemo(() => SyntaxStyle.fromStyles(darkStyles), [])

	const [selectedIndex, setSelectedIndex] = useState(() => clamp(initialIndex, 0, Math.max(0, files.length - 1)))
	const [content, setContent] = useState<string>("")
	const [error, setError] = useState<string | null>(null)
	const [focus, setFocus] = useState<"sidebar" | "reader">("sidebar")

	const selected = files[selectedIndex]

	useEffect(() => {
		if (!selected) {
			setContent("")
			return
		}
		let cancelled = false
		readFile(selected.path).then(
			(text) => {
				if (!cancelled) {
					setContent(text)
					setError(null)
				}
			},
			(err: unknown) => {
				if (!cancelled) {
					setContent("")
					setError(`Cannot read ${selected.relativePath}: ${String(err)}`)
				}
			},
		)
		return () => {
			cancelled = true
		}
	}, [selected, readFile])

	useKeyboard((key) => {
		const ctx: BrowserCtx = {
			files,
			focus,
			setFocus,
			setSelectedIndex: (updater) => setSelectedIndex(updater),
			quit: () => {
				if (onQuit) {
					onQuit()
					return
				}
				renderer?.destroy()
				process.exit(0)
			},
		}
		dispatch(browserBindings, ctx, key)
	})

	const sidebarWidth = 32
	const sidebarActive = focus === "sidebar"
	const readerActive = focus === "reader"
	const sidebarTitle = sidebarActive ? " ▸ files " : "   files "
	const readerLabel = selected?.relativePath ?? title
	const readerTitle = readerActive ? ` ▸ ${readerLabel} ` : `   ${readerLabel} `

	return (
		<box style={{ width, height, flexDirection: "column", backgroundColor: BG }}>
			<box style={{ flexDirection: "row", flexGrow: 1, flexShrink: 1, backgroundColor: BG }}>
				<box
					title={sidebarTitle}
					titleAlignment="left"
					style={{
						border: true,
						borderColor: sidebarActive ? BORDER_ACTIVE : BORDER_INACTIVE,
						width: sidebarWidth,
						flexShrink: 0,
						flexDirection: "column",
						backgroundColor: SIDEBAR_BG,
					}}
				>
					{files.length === 0 ? (
						<text content="(no markdown files)" style={{ fg: FG_MUTED }} />
					) : (
						files.map((file, idx) => {
							const isSelected = idx === selectedIndex
							if (!isSelected) return <text key={file.path} content={file.relativePath} style={{ fg: FG }} />
							const bg = sidebarActive ? SELECTED_BG_ACTIVE : SELECTED_BG_INACTIVE
							return <text key={file.path} content={file.relativePath} style={{ fg: FG_BRIGHT, bg }} />
						})
					)}
				</box>
				<box
					title={readerTitle}
					titleAlignment="left"
					style={{
						border: true,
						borderColor: readerActive ? BORDER_ACTIVE : BORDER_INACTIVE,
						padding: 1,
						flexGrow: 1,
						flexShrink: 1,
						backgroundColor: BG,
					}}
				>
					{error ? (
						<text content={error} style={{ fg: "#BF616A" }} />
					) : (
						<scrollbox
							style={{
								scrollY: true,
								scrollX: false,
								flexGrow: 1,
								flexShrink: 1,
								backgroundColor: BG,
							}}
							focused={readerActive}
						>
							<markdown
								key={selected?.path ?? "empty"}
								content={content}
								syntaxStyle={syntaxStyle}
								fg={FG}
								bg={BG}
								conceal
								style={{ width: "100%" }}
							/>
						</scrollbox>
					)}
				</box>
			</box>
		</box>
	)
}
