/**
 * Fuzzy filter for the sidebar.
 *
 * Matching: case-insensitive subsequence on `relativePath`. A query "drm"
 * matches "docs/readme.md". Scoring (higher is better):
 *   - +10 for a match at the start of the string or right after `/`
 *     (word boundary — what the user typed lines up with a path segment)
 *   - +5 when the current match is adjacent to the previous one
 *     (consecutive runs read as "drm" matching the literal substring)
 *   - +1 otherwise
 *
 * The scorer is intentionally tiny — the only goal is to surface the
 * "obvious" match for short queries against a few hundred paths. A full
 * fzf-style scorer (with bonuses for camelCase, separators, etc.) is
 * deferred until the simple version proves insufficient.
 */

import type { FileEntry } from "./walk.ts"

export const fuzzyScore = (query: string, target: string): number | null => {
	if (query.length === 0) return 0
	const q = query.toLowerCase()
	const t = target.toLowerCase()
	let qi = 0
	let score = 0
	let lastMatch = -2
	for (let i = 0; i < t.length && qi < q.length; i++) {
		if (t[i] !== q[qi]) continue
		const isWordStart = i === 0 || t[i - 1] === "/"
		score += isWordStart ? 10 : 1
		if (lastMatch === i - 1) score += 5
		lastMatch = i
		qi++
	}
	if (qi < q.length) return null
	return score
}

/**
 * Filter and re-rank a file list by a query. Empty query returns the input
 * unchanged (preserves the discovery sort order). Non-empty query keeps
 * matches only, sorted by score desc; ties fall back to the input order so
 * the discovery sort still leaks through.
 */
export const filterFiles = (files: readonly FileEntry[], query: string): readonly FileEntry[] => {
	if (query.length === 0) return files
	const scored: { file: FileEntry; score: number; index: number }[] = []
	for (let i = 0; i < files.length; i++) {
		const file = files[i]!
		const score = fuzzyScore(query, file.relativePath)
		if (score === null) continue
		scored.push({ file, score, index: i })
	}
	scored.sort((a, b) => b.score - a.score || a.index - b.index)
	return scored.map((s) => s.file)
}
