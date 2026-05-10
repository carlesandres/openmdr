import { darkPalette } from "./dark.ts"
import { lightPalette } from "./light.ts"
import { catppuccinPalette } from "./themes/catppuccin.ts"
import { draculaPalette } from "./themes/dracula.ts"
import { everforestPalette } from "./themes/everforest.ts"
import { gruvboxPalette } from "./themes/gruvbox.ts"
import { kanagawaPalette } from "./themes/kanagawa.ts"
import { monokaiPalette } from "./themes/monokai.ts"
import { oneDarkPalette } from "./themes/one-dark.ts"
import { opencodePalette } from "./themes/opencode.ts"
import { rosePinePalette } from "./themes/rose-pine.ts"
import { solarizedDarkPalette } from "./themes/solarized-dark.ts"
import { tokyoNightPalette } from "./themes/tokyo-night.ts"
import { vesperPalette } from "./themes/vesper.ts"
import type { ThemeDefinition, ThemeId } from "./types.ts"

/**
 * All known themes. Order is the canonical display order (used by
 * `--help` output and any future theme picker UI). New themes append
 * to this list.
 */
export const themeDefinitions: readonly ThemeDefinition[] = [
	{ id: "dark", name: "Dark", tone: "dark", colors: darkPalette },
	{ id: "light", name: "Light", tone: "light", colors: lightPalette },
	{ id: "tokyo-night", name: "Tokyo Night", tone: "dark", colors: tokyoNightPalette },
	{ id: "catppuccin", name: "Catppuccin", tone: "dark", colors: catppuccinPalette },
	{ id: "rose-pine", name: "Rose Pine", tone: "dark", colors: rosePinePalette },
	{ id: "gruvbox", name: "Gruvbox", tone: "dark", colors: gruvboxPalette },
	{ id: "dracula", name: "Dracula", tone: "dark", colors: draculaPalette },
	{ id: "kanagawa", name: "Kanagawa", tone: "dark", colors: kanagawaPalette },
	{ id: "one-dark", name: "One Dark", tone: "dark", colors: oneDarkPalette },
	{ id: "monokai", name: "Monokai", tone: "dark", colors: monokaiPalette },
	{ id: "solarized-dark", name: "Solarized Dark", tone: "dark", colors: solarizedDarkPalette },
	{ id: "everforest", name: "Everforest", tone: "dark", colors: everforestPalette },
	{ id: "vesper", name: "Vesper", tone: "dark", colors: vesperPalette },
	{ id: "opencode", name: "OpenCode", tone: "dark", colors: opencodePalette },
]

export const getThemeDefinition = (id: ThemeId): ThemeDefinition =>
	themeDefinitions.find((t) => t.id === id) ?? themeDefinitions[0]!

export const isThemeId = (value: unknown): value is ThemeId =>
	typeof value === "string" && themeDefinitions.some((t) => t.id === value)
