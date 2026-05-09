#!/usr/bin/env bun
/**
 * Smoke test the compiled standalone binary.
 *
 * Verifies the artifact at dist/openmdr responds to the non-interactive
 * surface (--version, --help) and rejects bad inputs (--theme neon).
 * The TUI itself can't be exercised without a real terminal — that's
 * what test/browser.test.tsx covers via headless render.
 */

import { existsSync } from "node:fs"
import { join } from "node:path"

const binary = join(process.cwd(), "dist", "openmdr")
if (!existsSync(binary)) {
	console.error(`binary not found at ${binary}; run "bun run build" first`)
	process.exit(1)
}

const run = (args: readonly string[]) =>
	Bun.spawnSync({ cmd: [binary, ...args], stdout: "pipe", stderr: "pipe" })

const fail = (msg: string): never => {
	console.error(`✗ ${msg}`)
	process.exit(1)
}

// --version → semver-shaped string, exit 0
{
	const r = run(["--version"])
	if (r.exitCode !== 0) fail(`--version exited ${r.exitCode}: ${r.stderr.toString()}`)
	const out = r.stdout.toString().trim()
	if (!/^\d+\.\d+\.\d+/.test(out)) fail(`--version output not semver: ${out}`)
	console.log(`✓ --version: ${out}`)
}

// --help → contains 'usage:', exit 0
{
	const r = run(["--help"])
	if (r.exitCode !== 0) fail(`--help exited ${r.exitCode}: ${r.stderr.toString()}`)
	if (!r.stdout.toString().includes("usage:")) fail(`--help missing 'usage:'`)
	console.log(`✓ --help`)
}

// --theme neon → exit 2, stderr mentions 'unknown theme'
{
	const r = run(["--theme", "neon"])
	if (r.exitCode !== 2) fail(`--theme neon should exit 2, got ${r.exitCode}`)
	if (!r.stderr.toString().includes("unknown theme")) fail(`expected 'unknown theme' in stderr`)
	console.log(`✓ --theme neon errors`)
}

// --width abc → exit 2, stderr mentions 'positive integer'
{
	const r = run(["--width", "abc"])
	if (r.exitCode !== 2) fail(`--width abc should exit 2, got ${r.exitCode}`)
	if (!r.stderr.toString().includes("positive integer")) fail(`expected 'positive integer' in stderr`)
	console.log(`✓ --width abc errors`)
}

// missing path → exit 1 with cannot-access-style message (target defaults to ".")
// Skip this — '.' always exists, so missing-path is not a failure mode anymore.

console.log("\nall smoke checks passed")
