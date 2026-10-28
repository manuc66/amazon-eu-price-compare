#!/usr/bin/env node
'use strict'

// Guards the properties the Firefox linter complains about and that we can
// control: no dynamic code evaluation, and no leftover development code.
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const bundles = ['dist/chrome/popup.js', 'dist/firefox/popup.js']
const forbidden = [
	{ pattern: /new Function\s*\(/, what: 'the Function constructor' },
	{ pattern: /\beval\s*\(/, what: 'eval()' },
	{ pattern: /prev state/, what: 'redux-logger (development only)' }
]

let checked = 0
let failed = false

for (const relative of bundles) {
	const file = path.join(rootDir, relative)
	if (!fs.existsSync(file)) {
		continue
	}
	checked++
	const source = fs.readFileSync(file, 'utf8')
	for (const rule of forbidden) {
		if (rule.pattern.test(source)) {
			console.error(`FAIL ${relative} ships ${rule.what}`)
			failed = true
		}
	}
	console.log(`OK   ${relative} (${Math.round(fs.statSync(file).size / 1024)} KiB)`)
}

if (checked === 0) {
	console.error('No bundle found: run npm run build first')
	process.exit(1)
}

process.exit(failed ? 1 : 0)
