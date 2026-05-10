import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Gruvbox (Dark, medium contrast) — retro warm earth tones.
 * Anchors from morhetz/gruvbox (bright variants for accent colors).
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#282828", // bg0
	foreground: "#ebdbb2", // fg
	red: "#fb4934", // bright red
	green: "#b8bb26", // bright green
	yellow: "#fabd2f", // bright yellow
	blue: "#83a598", // bright blue
	magenta: "#d3869b", // bright purple
	cyan: "#8ec07c", // bright aqua
	muted: "#928374", // gray
}

export const gruvboxPalette: ColorPalette = derivePalette(input)
