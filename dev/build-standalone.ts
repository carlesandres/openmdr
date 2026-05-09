#!/usr/bin/env bun
/**
 * Compile a single-file standalone binary for the host platform.
 *
 * Usage:
 *   bun run dev/build-standalone.ts             # host target
 *   bun run dev/build-standalone.ts <bunTarget> # explicit target
 *
 * Cross-compile is supported by Bun (--target=bun-darwin-arm64 etc.) but
 * we only build for the host by default. Multi-target release builds and
 * tarballing are deferred to v2 — see DESIGN.md §10.5.
 */

import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const outDir = join(root, "dist")
const outBinary = join(outDir, "openmdr")

const hostTarget = (() => {
	const os = process.platform === "darwin" ? "darwin" : process.platform === "linux" ? "linux" : null
	const arch = process.arch === "arm64" ? "arm64" : process.arch === "x64" ? "x64" : null
	if (!os || !arch) {
		console.error(`unsupported host: ${process.platform}/${process.arch}`)
		process.exit(1)
	}
	return `bun-${os}-${arch}`
})()

const target = Bun.argv[2] ?? hostTarget

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

const proc = Bun.spawnSync({
	cmd: [
		"bun",
		"build",
		"--compile",
		"--minify",
		"--bytecode",
		"--format=esm",
		`--target=${target}`,
		`--outfile=${outBinary}`,
		"src/index.tsx",
	],
	cwd: root,
	stdout: "inherit",
	stderr: "inherit",
})

if (proc.exitCode !== 0) {
	console.error(`build failed (exit ${proc.exitCode})`)
	process.exit(1)
}

const stat = await Bun.file(outBinary).stat()
const sizeMB = (stat.size / 1024 / 1024).toFixed(1)
console.log(`built ${outBinary} (${sizeMB} MB, target=${target})`)
