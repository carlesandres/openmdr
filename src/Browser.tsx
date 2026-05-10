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

import { SyntaxStyle } from "@opentui/core"
import { useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { Effect } from "effect"
import { useEffect, useMemo, useState } from "react"
import { type FileEntry } from "./discovery/walk.ts"
import { HelpOverlay } from "./HelpOverlay.tsx"
import { readFileText } from "./io/readFile.ts"
import { browserBindings, type BrowserCtx } from "./keymap/browser.ts"
import { dispatch } from "./keymap/keymap.ts"
import { colors } from "./theme/colors.ts"

export interface BrowserProps {
	readonly files: readonly FileEntry[]
	readonly title?: string
	readonly initialIndex?: number
	/** Cap the rendered markdown's width at N columns. Null = fill the pane. */
	readonly maxWidth?: number | null
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
	maxWidth = null,
	onQuit,
	readFile = defaultReadFile,
}: BrowserProps) => {
	const renderer = useRenderer()
	const { width, height } = useTerminalDimensions()
	const syntaxStyle = useMemo(() => SyntaxStyle.fromStyles(colors.syntax), [])

	const [selectedIndex, setSelectedIndex] = useState(() =>
		clamp(initialIndex, 0, Math.max(0, files.length - 1)),
	)
	const [content, setContent] = useState<string>("")
	const [error, setError] = useState<string | null>(null)
	const [focus, setFocus] = useState<"sidebar" | "reader">("sidebar")
	const [sidebarVisible, setSidebarVisible] = useState<boolean>(true)
	const [sidebarScroll, setSidebarScroll] = useState<number>(0)
	const [helpVisible, setHelpVisible] = useState<boolean>(false)

	const selected = files[selectedIndex]

	// Track the path whose content is currently rendered. Updated lazily via
	// a debounce: rapid j/k presses don't trigger a load+<markdown>-reflow
	// per keystroke. The reflow is the synchronous, main-thread-blocking
	// step inside opentui's host commit — useDeferredValue can't yield once
	// the host begins it. A real debounce gates the load itself.
	const [renderedPath, setRenderedPath] = useState<string | null>(selected?.path ?? null)

	useEffect(() => {
		const target = selected?.path ?? null
		if (target === renderedPath) return
		const timer = setTimeout(() => setRenderedPath(target), 80)
		return () => clearTimeout(timer)
	}, [selected, renderedPath])

	useEffect(() => {
		if (!renderedPath) {
			setContent("")
			return
		}
		let cancelled = false
		readFile(renderedPath).then(
			(text) => {
				if (!cancelled) {
					setContent(text)
					setError(null)
				}
			},
			(err: unknown) => {
				if (!cancelled) {
					setContent("")
					setError(`Cannot read ${renderedPath}: ${String(err)}`)
				}
			},
		)
		return () => {
			cancelled = true
		}
	}, [renderedPath, readFile])

	useKeyboard((key) => {
		// While help is open, swallow most keys: only ? (toggle) and esc
		// (close) work, so the user can read without driving the UI behind.
		// This is the one place we step outside the data-driven keymap; the
		// alternative — adding `when: !c.helpVisible` to every other binding
		// — would clutter the array. See DESIGN.md §12 (keymap composition).
		if (helpVisible) {
			if (key.name === "?" || key.name === "escape") setHelpVisible(false)
			return
		}
		const ctx: BrowserCtx = {
			files,
			focus,
			sidebarVisible,
			helpVisible,
			setFocus,
			setSelectedIndex,
			setSidebarVisible,
			setHelpVisible,
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

	// Min/max-clamped percentage of viewport: narrow terminals stay readable,
	// wide terminals get more room without wasting space at extremes.
	// User-configurable width is deferred — see DESIGN.md §12.
	const sidebarWidth = Math.max(28, Math.min(60, Math.floor(width * 0.25)))
	const sidebarActive = focus === "sidebar"
	const readerActive = focus === "reader"
	const sidebarTitle = sidebarActive ? " ▸ files " : "   files "
	const readerLabel = selected?.relativePath ?? title
	const readerTitle = readerActive ? ` ▸ ${readerLabel} ` : `   ${readerLabel} `

	// Sidebar virtualization: render only the visible window. Without this,
	// every keystroke re-renders all N file rows even though only the bg of
	// two of them changed (old + new selected). On a 195-file vault that
	// dominates the per-keystroke cost.
	const sidebarBodyHeight = Math.max(1, height - 2) // minus top/bottom border
	const maxScroll = Math.max(0, files.length - sidebarBodyHeight)
	const desiredScroll = (() => {
		let s = sidebarScroll
		if (selectedIndex < s) s = selectedIndex
		else if (selectedIndex >= s + sidebarBodyHeight) s = selectedIndex - sidebarBodyHeight + 1
		return clamp(s, 0, maxScroll)
	})()
	useEffect(() => {
		if (desiredScroll !== sidebarScroll) setSidebarScroll(desiredScroll)
	}, [desiredScroll, sidebarScroll])
	const visibleFiles = files.slice(desiredScroll, desiredScroll + sidebarBodyHeight)
	// Available width for sidebar text rows: box width minus 1-cell border on each side.
	const sidebarTextWidth = Math.max(4, sidebarWidth - 2)
	// Right-anchored truncation: keep the filename visible, lose the prefix
	// with a leading ellipsis when the path is too long.
	const truncatePath = (s: string): string =>
		s.length <= sidebarTextWidth ? s : "…" + s.slice(s.length - sidebarTextWidth + 1)

	return (
		<box style={{ width, height, flexDirection: "column", backgroundColor: colors.background }}>
			<box
				style={{
					flexDirection: "row",
					flexGrow: 1,
					flexShrink: 1,
					backgroundColor: colors.background,
				}}
			>
				{sidebarVisible && (
					<box
						title={sidebarTitle}
						titleAlignment="left"
						style={{
							border: true,
							borderColor: sidebarActive ? colors.borderActive : colors.border,
							width: sidebarWidth,
							flexShrink: 0,
							flexDirection: "column",
							backgroundColor: colors.surface,
						}}
					>
						{files.length === 0 ? (
							<text content="(no markdown files)" style={{ fg: colors.textMuted }} />
						) : (
							visibleFiles.map((file, idx) => {
								const realIdx = desiredScroll + idx
								const isSelected = realIdx === selectedIndex
								const display = truncatePath(file.relativePath)
								if (!isSelected) {
									return (
										<text
											key={file.path}
											content={display}
											wrapMode="none"
											style={{ fg: colors.text }}
										/>
									)
								}
								const bg = sidebarActive ? colors.selectedBg : colors.selectedBgInactive
								return (
									<text
										key={file.path}
										content={display}
										wrapMode="none"
										style={{ fg: colors.textStrong, bg }}
									/>
								)
							})
						)}
					</box>
				)}
				<box
					title={readerTitle}
					titleAlignment="left"
					style={{
						border: true,
						borderColor: readerActive ? colors.borderActive : colors.border,
						padding: 1,
						flexGrow: 1,
						flexShrink: 1,
						backgroundColor: colors.background,
					}}
				>
					{error ? (
						<text content={error} style={{ fg: colors.error }} />
					) : (
						<scrollbox
							style={{
								scrollY: true,
								scrollX: false,
								flexGrow: 1,
								flexShrink: 1,
								backgroundColor: colors.background,
							}}
							focused={readerActive}
						>
							<markdown
								key={renderedPath ?? "empty"}
								content={content}
								syntaxStyle={syntaxStyle}
								fg={colors.text}
								bg={colors.background}
								conceal
								style={{ width: maxWidth ?? "100%" }}
							/>
						</scrollbox>
					)}
				</box>
			</box>
			{helpVisible && (
				<HelpOverlay bindings={browserBindings} viewportWidth={width} viewportHeight={height} />
			)}
		</box>
	)
}
