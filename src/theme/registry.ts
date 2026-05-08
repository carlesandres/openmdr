import { darkPalette } from "./dark.ts"
import type { ThemeDefinition, ThemeId } from "./types.ts"

const dark: ThemeDefinition = {
	id: "dark",
	name: "Dark",
	tone: "dark",
	colors: darkPalette,
}

/** All known themes. New themes are added here. */
export const themeDefinitions: readonly ThemeDefinition[] = [dark]

export const getThemeDefinition = (id: ThemeId): ThemeDefinition =>
	themeDefinitions.find((t) => t.id === id) ?? themeDefinitions[0]!

export const isThemeId = (value: unknown): value is ThemeId =>
	typeof value === "string" && themeDefinitions.some((t) => t.id === value)
