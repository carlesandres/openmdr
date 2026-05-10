import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Rose Pine — muted rose, pine, and gold on dusky violet.
 * Anchors from rose-pine/iterm (terminal palette).
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#191724", // base
	foreground: "#e0def4", // text
	red: "#eb6f92", // love
	green: "#9ccfd8", // foam (mapped to ANSI green)
	yellow: "#f6c177", // gold
	blue: "#31748f", // pine
	magenta: "#c4a7e7", // iris
	cyan: "#ebbcba", // rose
	muted: "#6e6a86", // muted
}

export const rosePinePalette: ColorPalette = derivePalette(input)
