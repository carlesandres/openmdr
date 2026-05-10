import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Kanagawa (Wave) — ink-wash indigo with autumn accents.
 * Anchors from rebelot/kanagawa.nvim (Wave variant).
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#1f1f28", // sumiInk1
	foreground: "#dcd7ba", // fujiWhite
	red: "#c34043", // autumnRed
	green: "#76946a", // autumnGreen
	yellow: "#c0a36e", // boatYellow2
	blue: "#7e9cd8", // crystalBlue
	magenta: "#957fb8", // oniViolet
	cyan: "#6a9589", // waveAqua1
	muted: "#727169", // fujiGray
}

export const kanagawaPalette: ColorPalette = derivePalette(input)
