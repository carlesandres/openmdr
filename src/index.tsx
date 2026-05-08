#!/usr/bin/env bun
/**
 * openmdr — entry point.
 *
 * Reads a markdown file path from argv and renders it via opentui's built-in
 * <markdown> component inside a scrollbox. q / ctrl+c to quit.
 *
 * Discovery, sidebar, theming, and richer Effect wiring all land after this.
 */

import { stat } from "node:fs/promises"
import { createCliRenderer, parseColor, SyntaxStyle } from "@opentui/core"
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { Effect } from "effect"
import { useMemo } from "react"
import { Browser } from "./Browser.tsx"
import { parseArgv } from "./cli/argv.ts"
import { walk } from "./discovery/walk.ts"
import { readFileText } from "./io/readFile.ts"

// Minimal dark theme — straight from opentui's markdown demo (Nord-ish).
// Will move to src/theme/ when theme detection lands.
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

export interface AppProps {
	/** Markdown source to render. */
	readonly content: string
	/** Optional title shown in the frame border. Defaults to a generic label. */
	readonly title?: string
	/** Override quit behavior. Tests pass a spy; the binary uses the default. */
	readonly onQuit?: () => void
}

export const App = ({ content, title = "openmdr", onQuit }: AppProps) => {
	const renderer = useRenderer()
	const { width, height } = useTerminalDimensions()
	const syntaxStyle = useMemo(() => SyntaxStyle.fromStyles(darkStyles), [])

	useKeyboard((key) => {
		if (key.name === "q" || (key.ctrl && key.name === "c")) {
			if (onQuit) {
				onQuit()
				return
			}
			renderer?.destroy()
			process.exit(0)
		}
	})

	return (
		<box style={{ width, height, flexDirection: "column", backgroundColor: BG }}>
			<box
				title={` ${title} `}
				titleAlignment="left"
				style={{
					border: true,
					borderColor: "#4C566A",
					padding: 1,
					flexGrow: 1,
					flexShrink: 1,
					backgroundColor: BG,
				}}
			>
				<scrollbox
					style={{
						scrollY: true,
						scrollX: false,
						flexGrow: 1,
						flexShrink: 1,
						backgroundColor: BG,
					}}
					focused
				>
					<markdown
						content={content}
						syntaxStyle={syntaxStyle}
						fg={FG}
						bg={BG}
						conceal
						style={{ width: "100%" }}
					/>
				</scrollbox>
			</box>
		</box>
	)
}

if (import.meta.main) {
	const args = parseArgv(Bun.argv.slice(2))
	const target = args.path ?? "."

	let stats: Awaited<ReturnType<typeof stat>>
	try {
		stats = await stat(target)
	} catch (err) {
		console.error(`openmdr: cannot access ${target}: ${String(err)}`)
		process.exit(1)
	}

	const renderer = await createCliRenderer({ exitOnCtrlC: false })

	if (stats.isDirectory()) {
		const files = await Effect.runPromise(
			walk(target).pipe(
				Effect.tapError((err) =>
					Effect.sync(() => {
						console.error(`openmdr: cannot walk ${target}: ${String(err.cause)}`)
					}),
				),
			),
		).catch(() => {
			process.exit(1)
		})
		if (!Array.isArray(files)) process.exit(1)
		createRoot(renderer).render(<Browser files={files} title={target} />)
	} else {
		const content = await Effect.runPromise(
			readFileText(target).pipe(
				Effect.tapError((err) =>
					Effect.sync(() => {
						console.error(`openmdr: cannot read ${err.path}: ${String(err.cause)}`)
					}),
				),
			),
		).catch(() => {
			process.exit(1)
		})
		if (typeof content !== "string") process.exit(1)
		createRoot(renderer).render(<App content={content} title={target} />)
	}
}
