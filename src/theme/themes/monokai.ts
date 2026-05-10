import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Monokai — classic dark olive with electric syntax colors.
 * Anchors from Wimer Hazenberg's original Monokai palette.
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#272822",
	foreground: "#f8f8f2",
	red: "#f92672",
	green: "#a6e22e",
	yellow: "#e6db74",
	blue: "#66d9ef",
	magenta: "#ae81ff",
	cyan: "#a1efe4",
	muted: "#75715e",
}

export const monokaiPalette: ColorPalette = derivePalette(input)
