import { CodeRenderable } from "@opentui/core"
import type { MarkdownOptions } from "@opentui/core"

type RenderNode = NonNullable<MarkdownOptions["renderNode"]>

export const renderMarkdownNode: RenderNode = (token, context) => {
	if (token.type !== "code") return null

	const renderable = context.defaultRender()
	if (renderable instanceof CodeRenderable) {
		// v1 promises plain fenced code blocks. Avoid the async highlighter path,
		// which can leave unsupported language fences blank in the terminal.
		renderable.filetype = undefined
	}
	return renderable
}
