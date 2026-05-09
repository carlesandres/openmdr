import { describe, expect, test } from "bun:test"
import { colors, setActiveTheme } from "../src/theme/colors.ts"
import { darkPalette } from "../src/theme/dark.ts"
import { lightPalette } from "../src/theme/light.ts"
import { getThemeDefinition, isThemeId, themeDefinitions } from "../src/theme/registry.ts"

describe("theme registry", () => {
	test("ships dark and light", () => {
		const ids = themeDefinitions.map((t) => t.id)
		expect(ids).toContain("dark")
		expect(ids).toContain("light")
	})

	test("dark and light have matching token shapes (no missing keys)", () => {
		expect(Object.keys(darkPalette).sort()).toEqual(Object.keys(lightPalette).sort())
	})

	test("isThemeId narrows known ids", () => {
		expect(isThemeId("dark")).toBe(true)
		expect(isThemeId("light")).toBe(true)
		expect(isThemeId("neon")).toBe(false)
		expect(isThemeId(42)).toBe(false)
	})

	test("getThemeDefinition returns the right palette", () => {
		expect(getThemeDefinition("dark").colors).toBe(darkPalette)
		expect(getThemeDefinition("light").colors).toBe(lightPalette)
	})
})

describe("setActiveTheme", () => {
	test("mutates the singleton in place; reference stays stable", () => {
		const ref = colors
		setActiveTheme("light")
		expect(colors).toBe(ref) // same reference
		expect(colors.background).toBe(lightPalette.background)
		expect(colors.text).toBe(lightPalette.text)

		setActiveTheme("dark")
		expect(colors.background).toBe(darkPalette.background)
		expect(colors.text).toBe(darkPalette.text)
	})
})
