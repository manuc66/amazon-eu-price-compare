#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const TARGETS = ['chrome', 'firefox']

const rootDir = path.resolve(__dirname, '..')
const assetsDir = path.join(rootDir, 'extension')
const target = process.argv[2]

if (!TARGETS.includes(target)) {
	console.error(`Usage: node scripts/build.js <${TARGETS.join('|')}>`)
	process.exit(1)
}

const outDir = path.join(rootDir, 'dist', target)
const manifestPath = path.join(rootDir, 'manifests', `manifest.${target}.json`)

if (!fs.existsSync(manifestPath)) {
	console.error(`Missing manifest: ${path.relative(rootDir, manifestPath)}`)
	process.exit(1)
}

// fresh output dir, so a chrome build never leaves firefox files behind
fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

// static assets (html, icons, ...), without previous build artifacts
fs.cpSync(assetsDir, outDir, {
	recursive: true,
	filter: (src) => !/\.(js|zip)$/i.test(src)
})

fs.copyFileSync(manifestPath, path.join(outDir, 'manifest.json'))

console.log(`Building ${target} extension into ${path.relative(rootDir, outDir)}`)

execFileSync(
	process.execPath,
	[path.join(rootDir, 'node_modules', 'webpack-cli', 'bin', 'cli.js')],
	{
		cwd: rootDir,
		stdio: 'inherit',
		env: {
			...process.env,
			NODE_ENV: 'production',
			EXTENSION_OUTPUT_DIR: outDir
		}
	}
)
