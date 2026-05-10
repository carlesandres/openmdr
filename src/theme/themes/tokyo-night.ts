import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Tokyo Night — cool indigo surfaces with neon editor accents.
 * Anchors from enkia/tokyo-night-vscode (Night variant).
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#1a1b26",
	foreground: "#c0caf5",
	red: "#f7768e",
	green: "#9ece6a",
	yellow: "#e0af68",
	blue: "#7aa2f7",
	magenta: "#bb9af7",
	cyan: "#7dcfff",
	muted: "#565f89",
}

export const tokyoNightPalette: ColorPalette = derivePalette(input)
