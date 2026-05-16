import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, test } from "bun:test"
import { Effect, Result } from "effect"
import { DiscoveryError, walk } from "../src/discovery/walk.ts"

type FixtureSpec = Record<string, string>

const buildFixture = async (spec: FixtureSpec): Promise<string> => {
	const root = await mkdtemp(join(tmpdir(), "house-discovery-"))
	for (const [relPath, content] of Object.entries(spec)) {
		const abs = join(root, relPath)
		await mkdir(dirname(abs), { recursive: true })
		await writeFile(abs, content, "utf8")
	}
	return root
}

let toCleanup: string[] = []
const fixture = async (spec: FixtureSpec) => {
	const dir = await buildFixture(spec)
	toCleanup.push(dir)
	return dir
}
afterEach(async () => {
	await Promise.all(toCleanup.map((d) => rm(d, { recursive: true, force: true })))
	toCleanup = []
})

const names = (entries: readonly { relativePath: string }[]): string[] =>
	entries.map((e) => e.relativePath)

const run = <A, E>(effect: Effect.Effect<A, E>): Promise<A> => Effect.runPromise(effect)

describe("walk — extensions", () => {
	test("includes .md, .markdown, .mdx", async () => {
		const root = await fixture({
			"a.md": "x",
			"b.markdown": "x",
			"c.mdx": "x",
			"d.txt": "x",
			"e.MD": "x", // case-insensitive extension match
		})
		const result = await run(walk(root))
		expect(names(result).sort()).toEqual(["a.md", "b.markdown", "c.mdx", "e.MD"])
	})

	test("excludes non-markdown files", async () => {
		const root = await fixture({ "README.md": "x", "code.ts": "x", "image.png": "x" })
		const result = await run(walk(root))
		expect(names(result)).toEqual(["README.md"])
	})
})

describe("walk — hard-skip directories", () => {
	test("skips node_modules even if it contains markdown", async () => {
		const root = await fixture({
			"top.md": "x",
			"node_modules/pkg/README.md": "x",
		})
		const result = await run(walk(root))
		expect(names(result)).toEqual(["top.md"])
	})

	test("skips .git", async () => {
		const root = await fixture({
			"top.md": "x",
			".git/HEAD.md": "x",
		})
		const result = await run(walk(root))
		expect(names(result)).toEqual(["top.md"])
	})

	test("skips .venv", async () => {
		const root = await fixture({
			"top.md": "x",
			".venv/lib/notes.md": "x",
		})
		const result = await run(walk(root))
		expect(names(result)).toEqual(["top.md"])
	})

	test("hard-skips apply even with all: true", async () => {
		const root = await fixture({
			"top.md": "x",
			"node_modules/x.md": "x",
			".git/y.md": "x",
		})
		const result = await run(walk(root, { all: true }))
		expect(names(result)).toEqual(["top.md"])
	})
})

describe("walk — hidden files", () => {
	test("skips hidden files by default", async () => {
		const root = await fixture({ "visible.md": "x", ".hidden.md": "x" })
		const result = await run(walk(root))
		expect(names(result)).toEqual(["visible.md"])
	})

	test("skips hidden directories by default", async () => {
		const root = await fixture({ "visible.md": "x", ".secret/inside.md": "x" })
		const result = await run(walk(root))
		expect(names(result)).toEqual(["visible.md"])
	})

	test("includes hidden files with all: true", async () => {
		const root = await fixture({ "visible.md": "x", ".hidden.md": "x" })
		const result = await run(walk(root, { all: true }))
		expect(names(result).sort()).toEqual([".hidden.md", "visible.md"])
	})
})

describe("walk — gitignore", () => {
	test("honors root .gitignore", async () => {
		const root = await fixture({
			".gitignore": "ignored.md\n",
			"visible.md": "x",
			"ignored.md": "x",
		})
		const result = await run(walk(root))
		expect(names(result)).toEqual(["visible.md"])
	})

	test("honors nested .gitignore (scoped to subdirectory)", async () => {
		const root = await fixture({
			"top.md": "x",
			"sub/.gitignore": "secret.md\n",
			"sub/public.md": "x",
			"sub/secret.md": "x",
		})
		const result = await run(walk(root))
		expect(names(result).sort()).toEqual(["sub/public.md", "top.md"])
	})

	test("nested .gitignore does not affect siblings", async () => {
		const root = await fixture({
			"sub/.gitignore": "secret.md\n",
			"sub/secret.md": "x",
			"other/secret.md": "x", // siblings unaffected
		})
		const result = await run(walk(root))
		expect(names(result).sort()).toEqual(["other/secret.md"])
	})

	test("all: true ignores .gitignore rules", async () => {
		const root = await fixture({
			".gitignore": "ignored.md\n",
			"visible.md": "x",
			"ignored.md": "x",
		})
		const result = await run(walk(root, { all: true }))
		expect(names(result).sort()).toEqual(["ignored.md", "visible.md"])
	})

	test("gitignore can ignore an entire directory", async () => {
		const root = await fixture({
			".gitignore": "build/\n",
			"src/main.md": "x",
			"build/dist.md": "x",
		})
		const result = await run(walk(root))
		expect(names(result).sort()).toEqual(["src/main.md"])
	})
})

describe("walk — symlinks", () => {
	test("does not follow symlinked directories", async () => {
		const root = await fixture({
			"top.md": "x",
			"real/inside.md": "x",
		})
		await symlink(join(root, "real"), join(root, "linked"))
		toCleanup.push(join(root, "linked")) // best-effort cleanup
		const result = await run(walk(root))
		// "real" is walked normally; "linked" is a symlink and is skipped.
		expect(names(result).sort()).toEqual(["real/inside.md", "top.md"])
	})
})

describe("walk — sort order", () => {
	test("directories before files, alphabetical within each group (default)", async () => {
		const root = await fixture({
			"zeta.md": "x",
			"alpha.md": "x",
			"docs/api.md": "x",
			"adocs/intro.md": "x", // dir starting with 'a' but lexicographically before 'docs'
		})
		const result = await run(walk(root))
		// adocs/intro.md comes before docs/api.md because adocs sorts first;
		// then alpha.md, zeta.md — files after dirs at each level.
		expect(names(result)).toEqual(["adocs/intro.md", "docs/api.md", "alpha.md", "zeta.md"])
	})

	test("files before directories with sort: 'files-first'", async () => {
		const root = await fixture({
			"zeta.md": "x",
			"alpha.md": "x",
			"docs/api.md": "x",
			"adocs/intro.md": "x",
		})
		const result = await run(walk(root, { sort: "files-first" }))
		// Top-level files first (alphabetical), then nested dir contents.
		expect(names(result)).toEqual(["alpha.md", "zeta.md", "adocs/intro.md", "docs/api.md"])
	})
})

describe("walk — errors", () => {
	test("returns DiscoveryError when root does not exist", async () => {
		const result = await run(Effect.result(walk("/no/such/path/__missing__")))
		expect(Result.isFailure(result)).toBe(true)
		if (Result.isFailure(result)) {
			expect(result.failure).toBeInstanceOf(DiscoveryError)
		}
	})
})

describe("walk — empty", () => {
	test("returns empty array for empty directory", async () => {
		const root = await fixture({})
		const result = await run(walk(root))
		expect(result).toEqual([])
	})
})
