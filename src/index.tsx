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
import { createCliRenderer, SyntaxStyle } from "@opentui/core"
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { Effect } from "effect"
import { useMemo } from "react"
import { Browser } from "./Browser.tsx"
import { parseArgv } from "./cli/argv.ts"
import { walk } from "./discovery/walk.ts"
import { readFileText } from "./io/readFile.ts"
import { colors } from "./theme/colors.ts"

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
	const syntaxStyle = useMemo(() => SyntaxStyle.fromStyles(colors.syntax), [])

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
		<box style={{ width, height, flexDirection: "column", backgroundColor: colors.background }}>
			<box
				title={` ${title} `}
				titleAlignment="left"
				style={{
					border: true,
					borderColor: colors.border,
					padding: 1,
					flexGrow: 1,
					flexShrink: 1,
					backgroundColor: colors.background,
				}}
			>
				<scrollbox
					style={{
						scrollY: true,
						scrollX: false,
						flexGrow: 1,
						flexShrink: 1,
						backgroundColor: colors.background,
					}}
					focused
				>
					<markdown
						content={content}
						syntaxStyle={syntaxStyle}
						fg={colors.text}
						bg={colors.background}
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
