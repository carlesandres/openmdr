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
import { useAtomValue, useAtomSet } from "@effect/atom-react"
import { Effect } from "effect"
import { useEffect, useMemo, useState } from "react"
import { type FileEntry } from "./discovery/walk.ts"
import { Footer, FOOTER_HEIGHT } from "./Footer.tsx"
import { HelpOverlay } from "./HelpOverlay.tsx"
import { readFileText } from "./io/readFile.ts"
import { browserBindings, type BrowserCtx } from "./keymap/browser.ts"
import { dispatch } from "./keymap/keymap.ts"
import { colors, setActiveTheme } from "./theme/colors.ts"
import { themeAtom } from "./theme/atom.ts"
import { themeDefinitions, getThemeDefinition } from "./theme/registry.ts"

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

/** Bindings the help overlay lets through. Single source of truth for both
 *  the keyboard early-return and the footer hint filter. */
const HELP_ALLOWED_IDS: ReadonlySet<string> = new Set([
	"help.toggle",
	"theme.next",
	"theme.prev",
	"theme.toneToggle",
])

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
	const theme = useAtomValue(themeAtom)
	const setTheme = useAtomSet(themeAtom)
	const syntaxStyle = useMemo(() => SyntaxStyle.fromStyles(colors.syntax), [theme])

	const [selectedIndex, setSelectedIndex] = useState(() =>
		clamp(initialIndex, 0, Math.max(0, files.length - 1)),
	)
	const [content, setContent] = useState<string>("")
	const [error, setError] = useState<string | null>(null)
	const [focus, setFocus] = useState<"sidebar" | "reader">("sidebar")
	const [sidebarVisible, setSidebarVisible] = useState<boolean>(true)
	const [sidebarScroll, setSidebarScroll] = useState<number>(0)
	const [helpVisible, setHelpVisible] = useState<boolean>(false)
	const [footerNotice, setFooterNotice] = useState<string | null>(null)

	// Single-slot notice with a 2s TTL. A new notice cancels the pending
	// timer so the latest message gets its own full window.
	useEffect(() => {
		if (footerNotice === null) return
		const timer = setTimeout(() => setFooterNotice(null), 2000)
		return () => clearTimeout(timer)
	}, [footerNotice])

	const cycleTheme = (delta: 1 | -1) => {
		const idx = themeDefinitions.findIndex((d) => d.id === theme.id)
		const next = themeDefinitions[(idx + delta + themeDefinitions.length) % themeDefinitions.length]
		if (!next) return
		setActiveTheme(next, theme.tone)
		setTheme({ id: next.id, tone: theme.tone })
		setFooterNotice(`theme: ${next.name}`)
	}

	const toggleTone = () => {
		const nextTone = theme.tone === "dark" ? "light" : "dark"
		const def = getThemeDefinition(theme.id)
		if (def) setActiveTheme(def, nextTone)
		setTheme({ id: theme.id, tone: nextTone })
		setFooterNotice(`tone: ${nextTone}`)
	}

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

	// One BrowserCtx per render, reused by the keyboard handler and the
	// footer's `when`-evaluation. Keeping a single object eliminates the
	// drift risk between the two consumers as BrowserCtx grows.
	const ctx: BrowserCtx = {
		files,
		focus,
		sidebarVisible,
		helpVisible,
		setFocus,
		setSelectedIndex,
		setSidebarVisible,
		setHelpVisible,
		cycleTheme,
		toggleTone,
		quit: () => {
			if (onQuit) {
				onQuit()
				return
			}
			renderer?.destroy()
			process.exit(0)
		},
	}

	useKeyboard((key) => {
		// While help is open, swallow most keys: only ? (toggle), esc
		// (close), and the theme bindings pass through. Theme keys stay live
		// so users can preview palette changes against the overlay itself —
		// it is the largest theme-painted surface in the app. Everything else
		// is suppressed so the user can read without driving the UI behind.
		// This is the one place we step outside the data-driven keymap; the
		// alternative — adding `when: !c.helpVisible` to every other binding
		// — would clutter the array. See DESIGN.md §12 (keymap composition).
		if (helpVisible) {
			if (key.name === "escape") {
				setHelpVisible(() => false)
				return
			}
			const allowed = browserBindings.filter((b) => HELP_ALLOWED_IDS.has(b.id))
			// `quit` is never reachable from the allowed set, so passing the
			// real ctx is safe even though `q` would otherwise exit.
			dispatch(allowed, ctx, key)
			return
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
	// Sidebar box adds top/bottom borders (2); footer eats FOOTER_HEIGHT.
	const sidebarBodyHeight = Math.max(1, height - 2 - FOOTER_HEIGHT)
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

	// While help is open, the `?` key closes the overlay — relabel its hint
	// so the footer accurately describes what pressing the key will do.
	const footerBindings = helpVisible
		? browserBindings
				.filter((b) => HELP_ALLOWED_IDS.has(b.id))
				.map((b) => (b.id === "help.toggle" ? { ...b, hint: "close" } : b))
		: browserBindings

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
			<Footer bindings={footerBindings} ctx={ctx} width={width} notice={footerNotice} />
			{helpVisible && (
				<HelpOverlay bindings={browserBindings} viewportWidth={width} viewportHeight={height} />
			)}
		</box>
	)
}
