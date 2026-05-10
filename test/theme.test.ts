import { describe, expect, test } from "bun:test"
import { colors, setActiveTheme } from "../src/theme/colors.ts"
import { darkPalette } from "../src/theme/dark.ts"
import { derivePalette, type ThemeInput } from "../src/theme/derive.ts"
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

describe("derivePalette", () => {
	const sample: ThemeInput = {
		tone: "dark",
		background: "#000000",
		foreground: "#ffffff",
		red: "#ff0000",
		green: "#00ff00",
		yellow: "#ffff00",
		blue: "#0000ff",
		magenta: "#ff00ff",
		cyan: "#00ffff",
	}

	test("primary anchors pass through to their semantic slots", () => {
		const p = derivePalette(sample)
		expect(p.background).toBe("#000000")
		expect(p.text).toBe("#ffffff")
		expect(p.borderActive).toBe("#0000ff") // blue → accent
		expect(p.error).toBe("#ff0000") // red
	})

	test("syntax tokens map ANSI colors to expected slots", () => {
		const p = derivePalette(sample)
		expect(p.syntax["keyword"]).toEqual({ fg: "#0000ff", bold: true })
		expect(p.syntax["string"]).toEqual({ fg: "#00ff00" })
		expect(p.syntax["number"]).toEqual({ fg: "#ff00ff" })
		expect(p.syntax["function"]).toEqual({ fg: "#00ffff" })
		expect(p.syntax["markup.list"]).toEqual({ fg: "#ffff00" })
	})

	test("muted is derived when not supplied", () => {
		const p = derivePalette(sample)
		expect(p.textMuted).toMatch(/^#[0-9a-f]{6}$/)
		// Mix of black bg and white fg leans gray; should sit between them.
		expect(p.textMuted).not.toBe("#000000")
		expect(p.textMuted).not.toBe("#ffffff")
	})

	test("muted overrides derivation when supplied", () => {
		const p = derivePalette({ ...sample, muted: "#abcdef" })
		expect(p.textMuted).toBe("#abcdef")
	})

	test("dark vs light tone changes derived surface contrast", () => {
		const dark = derivePalette({ ...sample, tone: "dark" })
		const light = derivePalette({ ...sample, tone: "light" })
		expect(dark.surface).not.toBe(light.surface)
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
