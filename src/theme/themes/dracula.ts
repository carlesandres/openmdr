import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Dracula — high-contrast purple, pink, cyan, and green.
 * Anchors from dracula/dracula iTerm palette.
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#282a36",
	foreground: "#f8f8f2",
	red: "#ff5555",
	green: "#50fa7b",
	yellow: "#f1fa8c",
	blue: "#bd93f9", // purple — Dracula maps purple to ANSI blue
	magenta: "#ff79c6", // pink
	cyan: "#8be9fd",
	muted: "#6272a4", // comment
}

export const draculaPalette: ColorPalette = derivePalette(input)
