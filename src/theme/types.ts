import type { StyleDefinitionInput } from "@opentui/core"

/** Registered theme ids. Add a new id here when registering a new theme. */
export type ThemeId = "dark"

export type ThemeTone = "dark" | "light"

/**
 * Semantic color tokens. Components reference these names, not raw hex values,
 * so swapping themes is a one-line change at the boot layer.
 */
export interface ColorPalette {
	/** Main reader/page background. */
	readonly background: string
	/** Sidebar and modal panels — slightly raised from background. */
	readonly surface: string
	/** Default foreground text. */
	readonly text: string
	/** Emphasized text (selected rows, headings in chrome). */
	readonly textStrong: string
	/** Muted text (hints, footers, placeholders). */
	readonly textMuted: string
	/** Inactive border color. */
	readonly border: string
	/** Active border color, also used as a general accent. */
	readonly borderActive: string
	/** Background of the selected row in the active sidebar. */
	readonly selectedBg: string
	/** Background of the selected row when sidebar is not the active pane. */
	readonly selectedBgInactive: string
	/** Error text (load failures, etc.). */
	readonly error: string
	/** Tree-sitter / markdown syntax styles for opentui's `<markdown>`. */
	readonly syntax: Record<string, StyleDefinitionInput>
}

export interface ThemeDefinition {
	readonly id: ThemeId
	readonly name: string
	readonly tone: ThemeTone
	readonly colors: ColorPalette
}
