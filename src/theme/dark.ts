import { derivePalette, type ThemeInput } from "./derive.ts"
import type { ColorPalette } from "./types.ts"

/**
 * Nord — arctic blue-gray surfaces with frosty accents.
 * Anchors lifted from the canonical Nord palette
 * (https://www.nordtheme.com/docs/colors-and-palettes).
 */
const darkInput: ThemeInput = {
	tone: "dark",
	background: "#2E3440", // nord0 (Polar Night)
	foreground: "#D8DEE9", // nord4 (Snow Storm)
	red: "#BF616A", // nord11 (Aurora)
	green: "#A3BE8C", // nord14
	yellow: "#EBCB8B", // nord13
	blue: "#5E81AC", // nord10 (Frost — primary)
	magenta: "#B48EAD", // nord15
	cyan: "#88C0D0", // nord8 (Frost — secondary)
	muted: "#616E88", // nord3 brightened — Nord's canonical comment color
}

export const darkPalette: ColorPalette = derivePalette(darkInput)
