import { afterEach, beforeAll, describe, expect, test } from "bun:test"
import { act } from "react"
import { testRender } from "@opentui/react/test-utils"
import { Footer } from "../src/Footer.tsx"

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

describe("Footer — filter mode", () => {
	test("renders ↵:open and esc:cancel alongside the input on a wide row", async () => {
		await act(async () => {
			setup = await testRender(
				<Footer bindings={[]} ctx={{}} width={80} filter={{ query: "abc" }} />,
				{ width: 80, height: 5 },
			)
		})
		await setup!.renderOnce()
		const frame = setup!.captureCharFrame()
		expect(frame).toContain("/abc▏")
		expect(frame).toContain("↵:open")
		expect(frame).toContain("esc:cancel")
	})

	test("drops the hints when the row is too narrow to fit input + gap + hints", async () => {
		// Threshold: input(2) + GAP(2) + FILTER_HINTS(18) = 22 usable; usable
		// is width - 2 padding. At width 20, usable = 18 < 22 → drop.
		await act(async () => {
			setup = await testRender(
				<Footer bindings={[]} ctx={{}} width={20} filter={{ query: "" }} />,
				{ width: 20, height: 5 },
			)
		})
		await setup!.renderOnce()
		const frame = setup!.captureCharFrame()
		// Input stays — it's the primary surface and must not be pushed off.
		expect(frame).toContain("/▏")
		// Hints dropped entirely.
		expect(frame).not.toContain("↵:open")
		expect(frame).not.toContain("esc:cancel")
	})

	test("a long enough query also pushes hints off (hint drop is dynamic, not just viewport-based)", async () => {
		// Query length grows the input. At width 30 (usable 28), threshold
		// requires input ≤ 28 - 2 - 18 = 8. A 10-char query exceeds it.
		await act(async () => {
			setup = await testRender(
				<Footer bindings={[]} ctx={{}} width={30} filter={{ query: "abcdefghij" }} />,
				{ width: 30, height: 5 },
			)
		})
		await setup!.renderOnce()
		const frame = setup!.captureCharFrame()
		expect(frame).toContain("/abcdefghij▏")
		expect(frame).not.toContain("↵:open")
	})
})
