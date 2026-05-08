import { darkPalette } from "./dark.ts"
import { getThemeDefinition } from "./registry.ts"
import type { ColorPalette, ThemeId } from "./types.ts"

/**
 * The active palette. Components import `colors` and read tokens directly:
 *
 *     <text style={{ fg: colors.text }} />
 *
 * On theme change, `Object.assign` mutates this object in place — the
 * reference stays stable, which is the whole point of the singleton pattern
 * (no Provider/context to thread through). Dark is the boot default;
 * `setActiveTheme(id)` replaces the contents.
 *
 * TODO(revisit: live theme switching) — when the app gains a runtime theme
 * picker, calling setActiveTheme alone won't trigger a React re-render
 * (the `colors` reference is unchanged). Pair the call with a top-level
 * "theme version" state that increments on switch and is read by the root
 * component, forcing the tree to re-render. See DESIGN.md §12.
 */
export const colors: ColorPalette = { ...darkPalette }

/** Replace the active palette with the named theme's colors. */
export const setActiveTheme = (id: ThemeId): void => {
	Object.assign(colors, getThemeDefinition(id).colors)
}
