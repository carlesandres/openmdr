import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * One Dark — Atom-style charcoal with clean blue and green accents.
 * Anchors from atom-community/atom-one-dark.
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#282c34",
	foreground: "#abb2bf",
	red: "#e06c75",
	green: "#98c379",
	yellow: "#e5c07b",
	blue: "#61afef",
	magenta: "#c678dd",
	cyan: "#56b6c2",
	muted: "#5c6370",
}

export const oneDarkPalette: ColorPalette = derivePalette(input)
