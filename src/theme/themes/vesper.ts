import { derivePalette, type ThemeInput } from "../derive.ts"
import type { ColorPalette } from "../types.ts"

/**
 * Vesper — minimal black surfaces with peach and aqua accents.
 * Anchors from raunofreiberg/vesper (VS Code).
 *
 * Vesper is intentionally restrained; it doesn't ship a full ANSI palette.
 * `magenta` and `cyan` reuse adjacent accent colors rather than introducing
 * additional hues.
 */
const input: ThemeInput = {
	tone: "dark",
	background: "#101010",
	foreground: "#ffffff",
	red: "#ff8080",
	green: "#99ffe4",
	yellow: "#ffc799", // peach
	blue: "#65b1ff",
	magenta: "#ff8080",
	cyan: "#99ffe4",
	muted: "#8c8c8c",
}

export const vesperPalette: ColorPalette = derivePalette(input)
