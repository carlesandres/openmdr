#!/usr/bin/env bun
/**
 * openmdr — vertical-slice spike.
 *
 * Goal: prove the stack end-to-end. Render a hardcoded markdown string with
 * opentui's built-in <markdown> component inside a scrollbox, with q / ctrl+c
 * to quit. Discovery, file IO, sidebar, theming, and Effect wiring all land
 * after this works.
 */

import { createCliRenderer, parseColor, SyntaxStyle } from "@opentui/core"
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react"
import { useMemo } from "react"

const SAMPLE = `# openmdr

A *spike*. Just enough to prove that the stack works end-to-end.

## What you should see

- This page rendered with **opentui**'s built-in markdown component
- Headings, **bold**, *italic*, and \`inline code\`
- A list (this one), a blockquote, a code block, and a table

> Press **q** or **ctrl+c** to quit. Scroll with the **arrow keys** or **j/k**.

\`\`\`typescript
import { createCliRenderer } from "@opentui/core"

const renderer = await createCliRenderer()
console.log("hello, openmdr")
\`\`\`

## A small table

| Feature | Status | Notes |
|---|---|---|
| Render markdown | working | via opentui's <markdown> |
| Scroll | working | scrollbox |
| Discovery | next | sidebar of files from cwd |
| Theme detection | next | dark/light auto |

---

*That's the whole spike. If you can read this comfortably, the stack works.*
`

// Minimal dark theme — straight from opentui's markdown demo (Nord-ish).
// Will move to src/theme/ once the spike is done.
const darkStyles = {
  keyword: { fg: parseColor("#81A1C1"), bold: true },
  string: { fg: parseColor("#A3BE8C") },
  comment: { fg: parseColor("#616E88"), italic: true },
  number: { fg: parseColor("#B48EAD") },
  function: { fg: parseColor("#88C0D0") },
  type: { fg: parseColor("#8FBCBB") },
  operator: { fg: parseColor("#81A1C1") },
  variable: { fg: parseColor("#D8DEE9") },
  property: { fg: parseColor("#88C0D0") },
  "punctuation.bracket": { fg: parseColor("#ECEFF4") },
  "punctuation.delimiter": { fg: parseColor("#ECEFF4") },
  "markup.heading": { fg: parseColor("#88C0D0"), bold: true },
  "markup.heading.1": { fg: parseColor("#8FBCBB"), bold: true, underline: true },
  "markup.heading.2": { fg: parseColor("#88C0D0"), bold: true },
  "markup.heading.3": { fg: parseColor("#81A1C1") },
  "markup.bold": { fg: parseColor("#ECEFF4"), bold: true },
  "markup.strong": { fg: parseColor("#ECEFF4"), bold: true },
  "markup.italic": { fg: parseColor("#ECEFF4"), italic: true },
  "markup.list": { fg: parseColor("#EBCB8B") },
  "markup.quote": { fg: parseColor("#81A1C1"), italic: true },
  "markup.raw": { fg: parseColor("#A3BE8C"), bg: parseColor("#3B4252") },
  "markup.raw.block": { fg: parseColor("#A3BE8C"), bg: parseColor("#3B4252") },
  "markup.raw.inline": { fg: parseColor("#A3BE8C"), bg: parseColor("#3B4252") },
  "markup.link": { fg: parseColor("#88C0D0"), underline: true },
  "markup.link.label": { fg: parseColor("#A3BE8C"), underline: true },
  "markup.link.url": { fg: parseColor("#88C0D0"), underline: true },
  label: { fg: parseColor("#A3BE8C") },
  conceal: { fg: parseColor("#4C566A") },
  "punctuation.special": { fg: parseColor("#616E88") },
  default: { fg: parseColor("#D8DEE9") },
}

const BG = "#2E3440"
const FG = "#D8DEE9"

export interface AppProps {
  /** Override quit behavior. Tests pass a spy; the binary uses the default. */
  onQuit?: () => void
}

export const App = ({ onQuit }: AppProps = {}) => {
  const renderer = useRenderer()
  const { width, height } = useTerminalDimensions()
  const syntaxStyle = useMemo(() => SyntaxStyle.fromStyles(darkStyles), [])

  useKeyboard((key) => {
    if (key.name === "q" || (key.ctrl && key.name === "c")) {
      if (onQuit) {
        onQuit()
        return
      }
      renderer?.destroy()
      process.exit(0)
    }
  })

  return (
    <box style={{ width, height, flexDirection: "column", backgroundColor: BG }}>
      <box
        title=" openmdr — spike "
        titleAlignment="left"
        style={{
          border: true,
          borderColor: "#4C566A",
          padding: 1,
          flexGrow: 1,
          flexShrink: 1,
          backgroundColor: BG,
        }}
      >
        <scrollbox
          style={{
            scrollY: true,
            scrollX: false,
            flexGrow: 1,
            flexShrink: 1,
            backgroundColor: BG,
          }}
          focused
        >
          <markdown
            content={SAMPLE}
            syntaxStyle={syntaxStyle}
            fg={FG}
            bg={BG}
            conceal
            style={{ width: "100%" }}
          />
        </scrollbox>
      </box>
    </box>
  )
}

if (import.meta.main) {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
  })
  createRoot(renderer).render(<App />)
}
