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
import pkg from "../package.json" with { type: "json" }
import { Browser } from "./Browser.tsx"
import { parseArgv, usage } from "./cli/argv.ts"
import { walk } from "./discovery/walk.ts"
import { readFileText } from "./io/readFile.ts"
import { colors, setActiveTheme } from "./theme/colors.ts"
import { getThemeDefinition, isThemeId, themeDefinitions } from "./theme/registry.ts"

export interface AppProps {
	/** Markdown source to render. */
	readonly content: string
	/** Optional title shown in the frame border. Defaults to a generic label. */
	readonly title?: string
	/** Cap the rendered markdown's width at N columns (left-aligned). Null = fill the pane. */
	readonly maxWidth?: number | null
	/** Override quit behavior. Tests pass a spy; the binary uses the default. */
	readonly onQuit?: () => void
}

export const App = ({ content, title = "openmdr", maxWidth = null, onQuit }: AppProps) => {
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
						style={{ width: maxWidth ?? "100%" }}
					/>
				</scrollbox>
			</box>
		</box>
	)
}

if (import.meta.main) {
	const args = parseArgv(Bun.argv.slice(2))

	if (args.help) {
		console.log(usage)
		process.exit(0)
	}
	if (args.version) {
		console.log(pkg.version)
		process.exit(0)
	}

	const themeId = args.theme ?? "opencode"
	if (!isThemeId(themeId)) {
		const known = themeDefinitions.map((t) => t.id).join(", ")
		console.error(`openmdr: unknown theme "${themeId}". Known: ${known}`)
		process.exit(2)
	}
	const tone = args.tone ?? "dark"
	if (tone !== "dark" && tone !== "light") {
		console.error(`openmdr: --tone must be "dark" or "light", got "${tone}"`)
		process.exit(2)
	}
	const themeDef = getThemeDefinition(themeId)
	if (themeDef === undefined) {
		console.error(`openmdr: unknown theme "${themeId}"`)
		process.exit(2)
	}
	setActiveTheme(themeDef, tone)

	let maxWidth: number | null = null
	if (args.width !== null) {
		const n = Number.parseInt(args.width, 10)
		if (!Number.isFinite(n) || n <= 0) {
			console.error(`openmdr: --width must be a positive integer, got "${args.width}"`)
			process.exit(2)
		}
		maxWidth = n
	}

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
			walk(target, { all: args.all }).pipe(
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
		createRoot(renderer).render(<Browser files={files} title={target} maxWidth={maxWidth} />)
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
		createRoot(renderer).render(<App content={content} title={target} maxWidth={maxWidth} />)
	}
}
