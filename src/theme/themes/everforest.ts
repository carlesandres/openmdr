import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Everforest (Dark, medium) — soft green-gray forest tones.
 * Anchors from sainnhe/everforest (dark medium variant).
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#2d353b",
	foreground: "#d3c6aa",
	red: "#e67e80",
	green: "#a7c080",
	yellow: "#dbbc7f",
	blue: "#7fbbb3",
	magenta: "#d699b6",
	cyan: "#83c092",
	muted: "#859289",
}

export const everforestPalette: ColorPalette = derivePalette(input)
