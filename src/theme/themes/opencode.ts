import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * OpenCode — charcoal panels with peach, violet, and blue highlights.
 * Anchors from sst/opencode's terminal palette (per ghui's port).
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#0a0a0a",
	foreground: "#eeeeee",
	red: "#e06c75",
	green: "#7fd88f",
	yellow: "#fab283", // peach
	blue: "#5c9cf5",
	magenta: "#c678dd",
	cyan: "#56b6c2",
	muted: "#808080",
}

export const opencodePalette: ColorPalette = derivePalette(input)
