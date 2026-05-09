import { describe, expect, test } from "bun:test"
import { parseArgv } from "../src/cli/argv.ts"

describe("parseArgv — positional path", () => {
	test("returns null path when no args", () => {
		expect(parseArgv([])).toEqual({ path: null, theme: null })
	})

	test("returns the first positional as path", () => {
		expect(parseArgv(["README.md"])).toEqual({ path: "README.md", theme: null })
	})

	test("ignores extra positional args (for now)", () => {
		expect(parseArgv(["foo.md", "bar.md"])).toEqual({ path: "foo.md", theme: null })
	})
})

describe("parseArgv — --theme", () => {
	test("captures the value after --theme", () => {
		expect(parseArgv(["--theme", "light"])).toEqual({ path: null, theme: "light" })
	})

	test("works with --theme before a path", () => {
		expect(parseArgv(["--theme", "dark", "docs"])).toEqual({ path: "docs", theme: "dark" })
	})

	test("works with --theme after a path", () => {
		expect(parseArgv(["docs", "--theme", "light"])).toEqual({ path: "docs", theme: "light" })
	})

	test("captures unknown theme values verbatim (boot validates)", () => {
		expect(parseArgv(["--theme", "neon"])).toEqual({ path: null, theme: "neon" })
	})

	test("returns null theme when --theme has no value", () => {
		expect(parseArgv(["--theme"])).toEqual({ path: null, theme: null })
	})
})
