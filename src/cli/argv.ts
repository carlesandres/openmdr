export interface ParsedArgs {
	/** First positional argument, or null if none was given. */
	readonly path: string | null
	/** Value of `--theme <id>`, or null. Validated by the boot layer against the registry. */
	readonly theme: string | null
}

/**
 * Minimal argv parser. Will grow as more flags land (--width, --all, …).
 *
 * The parser does not validate flag values — boot layers do, so error
 * messages can reference domain knowledge (e.g., the list of registered
 * themes) without coupling the parser to it.
 */
export const parseArgv = (argv: readonly string[]): ParsedArgs => {
	let path: string | null = null
	let theme: string | null = null

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]!
		if (arg === "--theme") {
			theme = argv[i + 1] ?? null
			i++
			continue
		}
		if (path === null && !arg.startsWith("-")) {
			path = arg
		}
	}

	return { path, theme }
}
