/**
 * Tiny declarative keymap.
 *
 * Bindings are values: `{ id, description, keys, when?, run }`. A pure
 * `dispatch` looks up the first matching, enabled binding for a key event
 * and runs it. The same array drives the help overlay, so there is one
 * source of truth.
 *
 * Deliberately *not* a port of ghui's `@ghui/keymap`: no chord sequences,
 * no count prefixes, no scope contramaps. See DESIGN.md §12 for the full
 * trigger that would warrant adopting that machinery.
 */

/** The shape of a parsed key event we care about. `KeyEvent` from opentui satisfies this. */
export interface KeyMatch {
	readonly name: string
	readonly shift?: boolean
	readonly ctrl?: boolean
	readonly meta?: boolean
}

export interface KeyBinding<C> {
	/** Stable id; used for tests and (later) command-palette routing. */
	readonly id: string
	/** Human-readable summary, shown in the help overlay. */
	readonly description: string
	/** Key chords that trigger this binding, e.g. ["j", "down"], ["shift+k"], ["ctrl+c"]. */
	readonly keys: readonly string[]
	/** If present, the binding only fires when this returns true. */
	readonly when?: (ctx: C) => boolean
	readonly run: (ctx: C) => void
}

interface ParsedChord {
	readonly key: string
	readonly shift: boolean
	readonly ctrl: boolean
	readonly meta: boolean
}

const parseChord = (raw: string): ParsedChord => {
	const parts = raw.toLowerCase().split("+")
	const key = parts.at(-1) ?? ""
	return {
		key,
		shift: parts.includes("shift"),
		ctrl: parts.includes("ctrl"),
		meta: parts.includes("meta"),
	}
}

const chordMatches = (chord: ParsedChord, key: KeyMatch): boolean => {
	if (chord.key !== key.name) return false
	if (chord.shift !== Boolean(key.shift)) return false
	if (chord.ctrl !== Boolean(key.ctrl)) return false
	if (chord.meta !== Boolean(key.meta)) return false
	return true
}

/**
 * Return the first binding that (a) is enabled for `ctx` and (b) has a key
 * that matches `key`. Runs the binding's action and returns it. Returns null
 * if nothing matched.
 */
export const dispatch = <C>(
	bindings: readonly KeyBinding<C>[],
	ctx: C,
	key: KeyMatch,
): KeyBinding<C> | null => {
	for (const binding of bindings) {
		if (binding.when && !binding.when(ctx)) continue
		for (const raw of binding.keys) {
			if (chordMatches(parseChord(raw), key)) {
				binding.run(ctx)
				return binding
			}
		}
	}
	return null
}
