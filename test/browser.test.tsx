import { afterEach, beforeAll, describe, expect, test } from "bun:test"
import { act } from "react"
import React from "react"
import { testRender } from "@opentui/react/test-utils"
import { RegistryProvider } from "@effect/atom-react"
import { Browser } from "../src/Browser.tsx"
import type { FileEntry } from "../src/discovery/walk.ts"
import { colors, setActiveTheme } from "../src/theme/colors.ts"
import { themeAtom } from "../src/theme/atom.ts"
import { themeDefinitions } from "../src/theme/registry.ts"
import { resolveTheme } from "../src/theme/resolve.ts"

beforeAll(() => {
	// @ts-expect-error — globalThis.IS_REACT_ACT_ENVIRONMENT is a React internal
	globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

let setup: Awaited<ReturnType<typeof testRender>> | null = null

afterEach(() => {
	if (setup) {
		act(() => {
			setup!.renderer.destroy()
		})
		setup = null
	}
})

const VIEWPORT = { width: 120, height: 30 }

const makeFiles = (relativePaths: readonly string[]): FileEntry[] =>
	relativePaths.map((rel) => ({
		path: `/virtual/${rel}`,
		relativePath: rel,
		name: rel.split("/").pop() ?? rel,
	}))

const makeReader =
	(contents: Record<string, string>) =>
	(path: string): Promise<string> => {
		const rel = path.replace("/virtual/", "")
		const content = contents[rel]
		return content !== undefined
			? Promise.resolve(content)
			: Promise.reject(new Error(`no fixture for ${rel}`))
	}

/** Re-render and tick the event loop, in act(). */
const stepFrame = async (renderOnce: () => Promise<void>) => {
	await act(async () => {
		await renderOnce()
		await new Promise<void>((resolve) => setTimeout(resolve, 1))
	})
}

/** Wrap a <Browser> element in RegistryProvider so atom hooks resolve.
 *  Pass initialValues to seed atom state (e.g. active theme). */
const renderBrowser = (
	element: React.ReactNode,
	viewport: { width: number; height: number },
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	initialValues?: Iterable<readonly [any, any]>,
) => {
	const wrapped = React.createElement(
		RegistryProvider,
		{ initialValues } as Parameters<typeof RegistryProvider>[0],
		element,
	)
	return testRender(wrapped, viewport)
}

describe("Browser — sidebar", () => {
	test("renders all file relative paths", async () => {
		const files = makeFiles(["README.md", "docs/intro.md", "docs/api.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser files={files} readFile={makeReader({})} onQuit={() => {}} />,
				VIEWPORT,
			)
		})
		await setup!.renderOnce()
		const frame = setup!.captureCharFrame()
		expect(frame).toContain("README.md")
		expect(frame).toContain("docs/intro.md")
		expect(frame).toContain("docs/api.md")
	})

	test("shows '(no markdown files)' when files is empty", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser files={[]} readFile={makeReader({})} onQuit={() => {}} />,
				VIEWPORT,
			)
		})
		await setup!.renderOnce()
		expect(setup!.captureCharFrame()).toContain("no markdown files")
	})
})

// We assert on the reader pane's border title (which file is being read)
// rather than the markdown body. The body goes through opentui's <markdown>
// + <scrollbox> stack, which doesn't render reliably on the first frame in
// the headless renderer (matches the spike's FIXME). The border title is
// the user-visible signal of "which file is selected" and is plain <text>,
// rendered immediately. Real-terminal rendering of the body is verified by
// eyeballing.
const readerTitleContains = (frame: string, name: string): boolean =>
	// Active reader title: " ▸ <name> ". Inactive: "   <name> " (3 leading spaces).
	frame.includes(`▸ ${name} `) || frame.includes(`   ${name} `)

describe("Browser — selection", () => {
	test("opens the initially selected file in the reader pane", async () => {
		const files = makeFiles(["a.md", "b.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					readFile={makeReader({ "a.md": "x", "b.md": "y" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "a.md")).toBe(true)
	})

	test("j moves selection down — reader title updates to next file", async () => {
		const files = makeFiles(["a.md", "b.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					readFile={makeReader({ "a.md": "x", "b.md": "y" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("j")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "b.md")).toBe(true)
	})

	test("k moves selection up", async () => {
		const files = makeFiles(["a.md", "b.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					initialIndex={1}
					readFile={makeReader({ "a.md": "x", "b.md": "y" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "b.md")).toBe(true)

		await act(async () => {
			setup!.mockInput.pressKey("k")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "a.md")).toBe(true)
	})

	test("j clamps at the last file", async () => {
		const files = makeFiles(["a.md", "b.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					initialIndex={1}
					readFile={makeReader({ "a.md": "x", "b.md": "y" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("j")
			setup!.mockInput.pressKey("j")
			setup!.mockInput.pressKey("j")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "b.md")).toBe(true)
	})

	test("g jumps to top, shift+g jumps to bottom", async () => {
		const files = makeFiles(["a.md", "b.md", "c.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					readFile={makeReader({ "a.md": "x", "b.md": "y", "c.md": "z" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("g", { shift: true })
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "c.md")).toBe(true)

		await act(async () => {
			setup!.mockInput.pressKey("g")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "a.md")).toBe(true)
	})
})

describe("Browser — focus", () => {
	test("starts with the sidebar focused (▸ on sidebar title)", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)
		const frame = setup!.captureCharFrame()
		expect(frame).toContain("▸ files")
		// The reader title should NOT have the active marker on initial render.
		expect(frame).not.toContain("▸ a.md")
	})

	test("tab toggles focus between sidebar and reader", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressTab()
		})
		await stepFrame(setup!.renderOnce)
		let frame = setup!.captureCharFrame()
		expect(frame).toContain("▸ a.md")
		expect(frame).not.toContain("▸ files")

		await act(async () => {
			setup!.mockInput.pressTab()
		})
		await stepFrame(setup!.renderOnce)
		frame = setup!.captureCharFrame()
		expect(frame).toContain("▸ files")
		expect(frame).not.toContain("▸ a.md")
	})

	test("return / l / right focus the reader; escape / h / left focus the sidebar", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		// return → reader
		await act(async () => {
			setup!.mockInput.pressEnter()
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("▸ a.md")

		// escape → sidebar (escape needs extra time: \x1b is the lead of
		// escape sequences, so the parser waits to disambiguate before emitting).
		await act(async () => {
			setup!.mockInput.pressEscape()
			await new Promise<void>((resolve) => setTimeout(resolve, 60))
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("▸ files")

		// l → reader
		await act(async () => {
			setup!.mockInput.pressKey("l")
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("▸ a.md")

		// h → sidebar
		await act(async () => {
			setup!.mockInput.pressKey("h")
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("▸ files")

		// right → reader
		await act(async () => {
			setup!.mockInput.pressArrow("right")
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("▸ a.md")

		// left → sidebar
		await act(async () => {
			setup!.mockInput.pressArrow("left")
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("▸ files")
	})

	test("j/k do not move sidebar selection while reader is focused", async () => {
		const files = makeFiles(["a.md", "b.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					readFile={makeReader({ "a.md": "x", "b.md": "y" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		// Switch to reader, then press j a couple times. Selection must stay on a.md.
		await act(async () => {
			setup!.mockInput.pressTab()
		})
		await stepFrame(setup!.renderOnce)
		await act(async () => {
			setup!.mockInput.pressKey("j")
			setup!.mockInput.pressKey("j")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "a.md")).toBe(true)
	})
})

describe("Browser — sidebar toggle", () => {
	test("s hides the sidebar and shifts focus to the reader", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("files")

		await act(async () => {
			setup!.mockInput.pressKey("s")
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		expect(frame).not.toContain("files")
		// Reader becomes the active pane.
		expect(frame).toContain("▸ a.md")
	})

	test("pressing s again restores the sidebar and focuses it", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("s")
		})
		await stepFrame(setup!.renderOnce)
		await act(async () => {
			setup!.mockInput.pressKey("s")
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		expect(frame).toContain("▸ files")
	})
})

describe("Browser — jump and page keys", () => {
	const tenFiles = makeFiles(Array.from({ length: 10 }, (_, i) => `f${i}.md`))
	const reader = makeReader(
		Object.fromEntries(tenFiles.map((f) => [f.relativePath, f.relativePath])),
	)

	test("shift+j jumps 8 lines down", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser files={tenFiles} readFile={reader} onQuit={() => {}} />,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("j", { shift: true })
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "f8.md")).toBe(true)
	})

	test("shift+k jumps 8 lines up", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser files={tenFiles} initialIndex={9} readFile={reader} onQuit={() => {}} />,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("k", { shift: true })
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "f1.md")).toBe(true)
	})

	test("space pages selection down by 8", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser files={tenFiles} readFile={reader} onQuit={() => {}} />,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			// pressKey expects a single-char string for space — not the literal "space".
			setup!.mockInput.pressKey(" ")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "f8.md")).toBe(true)
	})

	test("b pages selection up by 8", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser files={tenFiles} initialIndex={9} readFile={reader} onQuit={() => {}} />,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("b")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "f1.md")).toBe(true)
	})
})

describe("Browser — reader [ / ] navigates files", () => {
	test("] selects next file while reader is focused", async () => {
		const files = makeFiles(["a.md", "b.md", "c.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					readFile={makeReader({ "a.md": "x", "b.md": "y", "c.md": "z" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)
		// Switch to reader focus.
		await act(async () => {
			setup!.mockInput.pressTab()
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("]")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "b.md")).toBe(true)
	})

	test("[ selects previous file while reader is focused", async () => {
		const files = makeFiles(["a.md", "b.md", "c.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					initialIndex={2}
					readFile={makeReader({ "a.md": "x", "b.md": "y", "c.md": "z" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)
		await act(async () => {
			setup!.mockInput.pressTab()
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("[")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "b.md")).toBe(true)
	})
})

describe("Browser — help overlay", () => {
	// The overlay lists all bindings across 3 groups; needs enough height to show all.
	const TALL_VIEWPORT = { width: 120, height: 50 }

	test("? opens the help overlay; section headers and bindings appear", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				TALL_VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		expect(frame).toContain("Help")
		// Section headers from the binding groups
		expect(frame).toContain("Global")
		expect(frame).toContain("Sidebar")
		expect(frame).toContain("Reader")
		// At least one binding's keys + description visible
		expect(frame).toContain("Quit")
		expect(frame).toContain("Toggle sidebar visibility")
	})

	test("? again closes the help overlay", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				TALL_VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("Help")

		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).not.toContain("Help")
	})

	test("escape closes the help overlay", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				TALL_VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressEscape()
			await new Promise<void>((resolve) => setTimeout(resolve, 60))
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).not.toContain("Help")
	})

	test("while help is open, q does not trigger quit", async () => {
		let quitCount = 0
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {
						quitCount += 1
					}}
				/>,
				TALL_VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("q")
		})
		await stepFrame(setup!.renderOnce)

		expect(quitCount).toBe(0)
		// Overlay should still be open.
		expect(setup!.captureCharFrame()).toContain("Help")
	})

	test("while help is open, j does not move sidebar selection", async () => {
		const files = makeFiles(["a.md", "b.md"])
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={files}
					readFile={makeReader({ "a.md": "x", "b.md": "y" })}
					onQuit={() => {}}
				/>,
				TALL_VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		// Open help.
		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)

		// j should be swallowed.
		await act(async () => {
			setup!.mockInput.pressKey("j")
		})
		await stepFrame(setup!.renderOnce)

		// Close help, then check sidebar is still on a.md.
		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)
		expect(readerTitleContains(setup!.captureCharFrame(), "a.md")).toBe(true)
	})
})

describe("Browser — quit", () => {
	test("q invokes onQuit", async () => {
		let calls = 0
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {
						calls++
					}}
				/>,
				VIEWPORT,
			)
		})
		await setup!.renderOnce()
		await act(async () => {
			setup!.mockInput.pressKey("q")
		})
		expect(calls).toBe(1)
	})

	test("ctrl+c invokes onQuit", async () => {
		let calls = 0
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {
						calls++
					}}
				/>,
				VIEWPORT,
			)
		})
		await setup!.renderOnce()
		await act(async () => {
			setup!.mockInput.pressCtrlC()
		})
		expect(calls).toBe(1)
	})
})

describe("Browser — footer", () => {
	test("renders global + sidebar hints when sidebar is focused", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		expect(frame).toContain("q:quit")
		expect(frame).toContain("?:help")
		expect(frame).toContain("s:sidebar")
		// sidebar.open hint surfaces because focus starts on sidebar.
		expect(frame).toContain("↵:open")
		// reader-only hints are absent.
		expect(frame).not.toContain("[:prev")
		expect(frame).not.toContain("]:next")
	})

	test("switches to reader-specific hints when focus moves to the reader", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressTab()
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		expect(frame).toContain("esc:back")
		expect(frame).toContain("[:prev")
		expect(frame).toContain("]:next")
		expect(frame).not.toContain("↵:open")
	})

	test("notice replaces hints after a theme cycle", async () => {
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)
		expect(setup!.captureCharFrame()).toContain("q:quit")

		await act(async () => {
			setup!.mockInput.pressKey("t")
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		expect(frame).toContain("theme:")
		// hint row is replaced while the notice is live.
		expect(frame).not.toContain("q:quit")
	})

	test("falls back to the first key when no full hint fits", async () => {
		// Ultra-narrow viewport: nothing like `q:quit` (6 chars) fits within
		// the usable width (terminal width minus 2 for padding).
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				{ width: 6, height: 12 },
			)
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		expect(frame).not.toContain("q:quit")
		// At minimum the bare key for the first hint (`q`) should appear so
		// the row is not silently blank.
		expect(frame).toContain("q")
	})

	test("narrows the hint row to help-allowed bindings while help is open", async () => {
		const TALL_VIEWPORT = { width: 120, height: 50 }
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				TALL_VIEWPORT,
			)
		})
		await stepFrame(setup!.renderOnce)

		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)

		const frame = setup!.captureCharFrame()
		// help-allowed hints survive; `?` is relabeled "close" since pressing
		// it now closes the overlay.
		expect(frame).toContain("?:close")
		expect(frame).not.toContain("?:help")
		expect(frame).toContain("t:theme")
		// suppressed bindings disappear from the row.
		expect(frame).not.toContain("q:quit")
		expect(frame).not.toContain("s:sidebar")
	})
})

describe("Browser — theme cycling", () => {
	// t / T cycle through themeDefinitions; shift+L toggles tone.
	// We assert on colors.background and colors.border because they are
	// reliably distinct across most themes. We pick adjacent theme pairs
	// that are known to differ in at least one of those tokens.

	// Find two adjacent themes where resolved dark backgrounds differ so tests are stable.
	const startIdx = (() => {
		for (let i = 0; i < themeDefinitions.length; i++) {
			const a = themeDefinitions[i]
			const b = themeDefinitions[(i + 1) % themeDefinitions.length]
			if (a && b) {
				const bgA = resolveTheme(a.source, "dark").background
				const bgB = resolveTheme(b.source, "dark").background
				if (bgA !== bgB) return i
			}
		}
		return 0
	})()
	const startTheme = themeDefinitions[startIdx]!

	// Seed helper: initialise colors singleton AND atom state to a known theme.
	const seedTheme = (id: string, tone: "dark" | "light" = "dark") => {
		const def = themeDefinitions.find((d) => d.id === id)!
		setActiveTheme(def, tone)
		return [[themeAtom, { id, tone }]] as Iterable<readonly [any, any]>
	}

	test("t advances to the next theme (colors.background changes)", async () => {
		const iv = seedTheme(startTheme.id)
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
				iv,
			)
		})
		await stepFrame(setup!.renderOnce)

		const before = colors.background
		await act(async () => {
			setup!.mockInput.pressKey("t")
		})
		await stepFrame(setup!.renderOnce)

		expect(colors.background).not.toBe(before)
	})

	test("T steps backward (t then T returns to original)", async () => {
		const iv = seedTheme(startTheme.id)
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
				iv,
			)
		})
		await stepFrame(setup!.renderOnce)

		const start = colors.background

		// advance one step
		await act(async () => {
			setup!.mockInput.pressKey("t")
		})
		await stepFrame(setup!.renderOnce)
		expect(colors.background).not.toBe(start)

		// step back — should return to start
		await act(async () => {
			setup!.mockInput.pressKey("t", { shift: true })
		})
		await stepFrame(setup!.renderOnce)
		expect(colors.background).toBe(start)
	})

	test("t wraps around — pressing t themeDefinitions.length times returns to start", async () => {
		const iv = seedTheme(startTheme.id)
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
				iv,
			)
		})
		await stepFrame(setup!.renderOnce)

		const start = colors.background

		for (let i = 0; i < themeDefinitions.length; i++) {
			await act(async () => {
				setup!.mockInput.pressKey("t")
			})
			await stepFrame(setup!.renderOnce)
		}

		expect(colors.background).toBe(start)
	})

	test("shift+L toggles tone (colors.background changes)", async () => {
		// Use the first theme that has a distinct light background to avoid false negatives.
		const toneTheme = themeDefinitions.find((d) => {
			const dark = resolveTheme(d.source, "dark")
			const light = resolveTheme(d.source, "light")
			return dark.background !== light.background
		})!
		const iv = seedTheme(toneTheme.id, "dark")
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
				iv,
			)
		})
		await stepFrame(setup!.renderOnce)

		const darkBg = colors.background
		await act(async () => {
			setup!.mockInput.pressKey("l", { shift: true })
		})
		await stepFrame(setup!.renderOnce)
		const lightBg = colors.background
		expect(lightBg).not.toBe(darkBg)

		// toggle back — should return to original dark background
		await act(async () => {
			setup!.mockInput.pressKey("l", { shift: true })
		})
		await stepFrame(setup!.renderOnce)
		expect(colors.background).toBe(darkBg)
	})

	test("theme keys still cycle while the help overlay is open", async () => {
		const iv = seedTheme(startTheme.id)
		await act(async () => {
			setup = await renderBrowser(
				<Browser
					files={makeFiles(["a.md"])}
					readFile={makeReader({ "a.md": "x" })}
					onQuit={() => {}}
				/>,
				VIEWPORT,
				iv,
			)
		})
		await stepFrame(setup!.renderOnce)

		// Open help.
		await act(async () => {
			setup!.mockInput.pressKey("?")
		})
		await stepFrame(setup!.renderOnce)

		const start = colors.background

		// t advances while help is open.
		await act(async () => {
			setup!.mockInput.pressKey("t")
		})
		await stepFrame(setup!.renderOnce)
		expect(colors.background).not.toBe(start)

		// T steps back to the original.
		await act(async () => {
			setup!.mockInput.pressKey("t", { shift: true })
		})
		await stepFrame(setup!.renderOnce)
		expect(colors.background).toBe(start)
	})
})
