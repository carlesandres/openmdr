import { derivePalette, type ThemeInput } from "./derive.ts"
import type { ColorPalette } from "./types.ts"

/**
 * GitHub-Light-leaning palette. Anchors lifted from GitHub Primer's
 * published color tokens (https://primer.style/foundations/color).
 */
const lightInput: ThemeInput = {
	tone: "light",
	background: "#FFFFFF",
	foreground: "#24292F", // text-primary
	red: "#CF222E",
	green: "#1A7F37",
	yellow: "#9A6700",
	blue: "#0969DA",
	magenta: "#8250DF",
	cyan: "#0550AE",
	muted: "#6E7781",
}

export const lightPalette: ColorPalette = derivePalette(lightInput)
