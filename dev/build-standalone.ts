#!/usr/bin/env bun
/**
 * Compile a single-file standalone binary for the host platform.
 *
 * Usage:
 *   bun run dev/build-standalone.ts             # host target
 *   bun run dev/build-standalone.ts <bunTarget> # explicit target
 *
 * This script always builds for the host. Cross-target release builds run
 * per-OS in .github/workflows/release.yml — opentui's native module discovery
 * doesn't cross-compile cleanly from a single host, so each target is built
 * on its native runner.
 */

import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const outDir = join(root, "dist")
const isWindows = process.platform === "win32"
const outBinary = join(outDir, isWindows ? "openmdr.exe" : "openmdr")

const hostTarget = (() => {
	const os =
		process.platform === "darwin"
			? "darwin"
			: process.platform === "linux"
				? "linux"
				: process.platform === "win32"
					? "windows"
					: null
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
