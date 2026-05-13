/**
 * Footer — single-row chrome under the two-pane area.
 *
 * Renders either a notice line (when one is active) or a compact hint row
 * derived from the keymap. Hints are filtered by each binding's `when`
 * against the current context, so the row reflects what the user can
 * actually do right now. Overflow is handled by truncating from the right
 * (later-in-array bindings drop off first).
 */

import type { KeyBinding } from "./keymap/keymap.ts"
import { colors } from "./theme/colors.ts"

export interface FooterProps<C> {
	readonly bindings: readonly KeyBinding<C>[]
	readonly ctx: C
	readonly width: number
	readonly notice?: string | null
}

const HINT_SEPARATOR = "  "

/** Display form for the first key of a binding. Picks the first chord and
 *  rewrites a few names to terminal-friendly shorthands. */
const displayKey = (raw: string): string => {
	switch (raw) {
		case "return":
			return "↵"
		case "escape":
			return "esc"
		case "space":
			return "␣"
		case "pageup":
			return "pgup"
		case "pagedown":
			return "pgdn"
		default:
			return raw
	}
}

const formatHint = <C,>(b: KeyBinding<C>): string | null => {
	if (!b.hint) return null
	const first = b.keys[0]
	if (!first) return null
	return `${displayKey(first)}:${b.hint}`
}

/** Drop hints from the end until the joined string fits within `width`. */
const fitHints = (hints: readonly string[], width: number): string => {
	if (width <= 0) return ""
	let acc = ""
	for (const h of hints) {
		const next = acc.length === 0 ? h : `${acc}${HINT_SEPARATOR}${h}`
		if (next.length > width) break
		acc = next
	}
	return acc
}

export const Footer = <C,>({ bindings, ctx, width, notice }: FooterProps<C>) => {
	const usableWidth = Math.max(0, width - 2) // 1-cell horizontal padding each side

	const content = notice
		? notice.length > usableWidth
			? notice.slice(0, usableWidth)
			: notice
		: fitHints(
				bindings
					.filter((b) => (b.when ? b.when(ctx) : true))
					.map(formatHint)
					.filter((s): s is string => s !== null),
				usableWidth,
			)

	return (
		<box
			style={{
				width,
				height: 1,
				flexShrink: 0,
				flexDirection: "row",
				paddingLeft: 1,
				paddingRight: 1,
				backgroundColor: colors.background,
			}}
		>
			<text
				content={content}
				wrapMode="none"
				style={{ fg: notice ? colors.textStrong : colors.textMuted }}
			/>
		</box>
	)
}
