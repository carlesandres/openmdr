import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Catppuccin (Mocha flavor) — soft pastel contrast on a deep mocha base.
 * Anchors from catppuccin/catppuccin spec.
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#1e1e2e", // Base
	foreground: "#cdd6f4", // Text
	red: "#f38ba8",
	green: "#a6e3a1",
	yellow: "#f9e2af",
	blue: "#89b4fa",
	magenta: "#cba6f7", // Mauve
	cyan: "#94e2d5", // Teal
	muted: "#6c7086", // Overlay0
}

export const catppuccinPalette: ColorPalette = derivePalette(input)
