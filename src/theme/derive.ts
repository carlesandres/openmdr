import type { ColorPalette } from "./types.ts"

/**
 * Minimal per-theme input. Every named community theme (Tokyo Night,
 * Catppuccin, Gruvbox, ...) publishes at least these values. We derive
 * the full {@link ColorPalette} from this anchor so adding a new theme
 * is a ~12-line file, not 50 hand-tuned hex values.
 *
 * Fidelity tradeoff: derivation produces a *plausible* rendering of the
 * upstream theme, not a pixel-perfect copy. For a markdown reader that
 * matters far less than the theme's overall character, which lives in
 * background / foreground / accents / ANSI-8 — all captured here.
 */
export interface ThemeInput {
	readonly tone: "dark" | "light"
	readonly background: string
	readonly foreground: string
	readonly red: string
	readonly green: string
	readonly yellow: string
	readonly blue: string
	readonly magenta: string
	readonly cyan: string
	/** Optional: muted text color (a.k.a. ANSI bright-black). Derived if absent. */
	readonly muted?: string
}

interface RGB {
	readonly r: number
	readonly g: number
	readonly b: number
}

const hexToRgb = (hex: string): RGB => {
	const v = hex.replace("#", "")
	const n = parseInt(
		v.length === 3
			? v
					.split("")
					.map((c) => c + c)
					.join("")
			: v,
		16,
	)
	return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

const rgbToHex = ({ r, g, b }: RGB): string =>
	"#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")

/** Linear interpolation between two hex colors. `t=0` returns `a`, `t=1` returns `b`. */
const mix = (a: string, b: string, t: number): string => {
	const ar = hexToRgb(a)
	const br = hexToRgb(b)
	return rgbToHex({
		r: ar.r + (br.r - ar.r) * t,
		g: ar.g + (br.g - ar.g) * t,
		b: ar.b + (br.b - ar.b) * t,
	})
}

/**
 * Derive the full {@link ColorPalette} from a theme's anchor colors.
 *
 * - UI surfaces (`surface`, `border`, `selectedBg{,Inactive}`) come from
 *   small mixes of background and foreground, scaled by tone.
 * - The accent / active-border slot is the theme's blue.
 * - `error` is the theme's red.
 * - `syntax` keys map to the theme's ANSI colors directly:
 *     keyword → blue, string → green, comment → muted (italic),
 *     number → magenta, function/type → cyan, list → yellow,
 *     headings → cyan/blue, link → cyan, raw (code) → green on surface.
 */
export const derivePalette = (input: ThemeInput): ColorPalette => {
	const { tone, background, foreground, red, green, yellow, blue, magenta, cyan } = input
	const isDark = tone === "dark"

	// Surface is the sidebar / help-overlay background. Lightened from bg
	// for panel separation, then tinted toward the theme's blue so chrome
	// carries a hint of theme character (otherwise sidebars look the same
	// "neutral gray panel" across every theme).
	const surfaceBase = mix(background, foreground, isDark ? 0.13 : 0.09)
	const surface = mix(surfaceBase, blue, isDark ? 0.06 : 0.04)
	// Border doubles as the inactive pane's title text color (opentui has no
	// separate title color). Mix factors target ~4.5:1 contrast against bg
	// so the title still reads on the inactive pane.
	const border = mix(background, foreground, isDark ? 0.5 : 0.55)
	const muted = input.muted ?? mix(foreground, background, isDark ? 0.45 : 0.4)
	const selectedBg = mix(background, blue, isDark ? 0.45 : 0.32)
	// Inactive selection — tinted with the theme's accent so each theme's
	// selection color bleeds through even when the sidebar isn't focused.
	const selectedBgInactive = mix(background, blue, isDark ? 0.22 : 0.16)
	// Strong text — emphasized rows and headings in chrome. Pushed further
	// toward white/black than the body fg for visible weight.
	const textStrong = mix(foreground, isDark ? "#ffffff" : "#000000", 0.3)

	return {
		background,
		surface,
		text: foreground,
		textStrong,
		textMuted: muted,
		border,
		borderActive: blue,
		selectedBg,
		selectedBgInactive,
		error: red,
		syntax: {
			keyword: { fg: blue, bold: true },
			string: { fg: green },
			comment: { fg: muted, italic: true },
			number: { fg: magenta },
			function: { fg: cyan },
			type: { fg: cyan },
			operator: { fg: blue },
			variable: { fg: foreground },
			property: { fg: cyan },
			"punctuation.bracket": { fg: textStrong },
			"punctuation.delimiter": { fg: textStrong },
			"punctuation.special": { fg: muted },
			"markup.heading": { fg: cyan, bold: true },
			"markup.heading.1": { fg: cyan, bold: true, underline: true },
			"markup.heading.2": { fg: cyan, bold: true },
			"markup.heading.3": { fg: blue },
			"markup.bold": { fg: textStrong, bold: true },
			"markup.strong": { fg: textStrong, bold: true },
			"markup.italic": { fg: textStrong, italic: true },
			"markup.list": { fg: yellow },
			"markup.quote": { fg: blue, italic: true },
			"markup.raw": { fg: green, bg: surface },
			"markup.raw.block": { fg: green, bg: surface },
			"markup.raw.inline": { fg: green, bg: surface },
			"markup.link": { fg: cyan, underline: true },
			"markup.link.label": { fg: green, underline: true },
			"markup.link.url": { fg: cyan, underline: true },
			label: { fg: green },
			conceal: { fg: border },
			default: { fg: foreground },
		},
	}
}
