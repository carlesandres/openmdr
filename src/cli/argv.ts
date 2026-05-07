export interface ParsedArgs {
	/** First positional argument, or null if none was given. */
	readonly path: string | null
}

/**
 * Minimal argv parser: takes the first positional argument as the path.
 * Will grow flag handling (--width, --theme, --all) once the matching
 * features land.
 */
export const parseArgv = (argv: readonly string[]): ParsedArgs => {
	const path = argv[0] ?? null
	return { path }
}
