import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Solarized Dark — low-contrast blue-green base with calibrated accents.
 * Anchors from Ethan Schoonover's Solarized spec.
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#002b36", // base03
	foreground: "#839496", // base0
	red: "#dc322f",
	green: "#859900",
	yellow: "#b58900",
	blue: "#268bd2",
	magenta: "#d33682",
	cyan: "#2aa198",
	muted: "#586e75", // base01
}

export const solarizedDarkPalette: ColorPalette = derivePalette(input)
