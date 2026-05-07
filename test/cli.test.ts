import { describe, expect, test } from "bun:test"
import { parseArgv } from "../src/cli/argv.ts"

describe("parseArgv", () => {
	test("returns null path when no args", () => {
		expect(parseArgv([])).toEqual({ path: null })
	})

	test("returns the first positional as path", () => {
		expect(parseArgv(["README.md"])).toEqual({ path: "README.md" })
	})

	test("ignores extra args (for now)", () => {
		expect(parseArgv(["foo.md", "bar.md"])).toEqual({ path: "foo.md" })
	})
})
