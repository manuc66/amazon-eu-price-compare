import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MARKETS } from '../src/markets'

const ROOT = resolve(__dirname, '..')
const MANIFESTS = ['manifest.chrome.json', 'manifest.firefox.json']

interface Permissions {
	permissions?: string[]
	host_permissions?: string[]
}

function readJson<T>(...parts: string[]): T {
	return JSON.parse(readFileSync(resolve(ROOT, ...parts), 'utf8')) as T
}

describe('manifest permissions', () => {
	it.each(MANIFESTS)('%s asks no host permission beyond the stores it fetches', (name) => {
		const manifest = readJson<Permissions>('manifests', name)
		const expected = MARKETS.map((market) => `*://www.${market.domain}/*`).sort()

		// anything else is a permission we do not exercise: the install prompt
		// should not mention a site the extension never talks to
		expect((manifest.host_permissions ?? []).slice().sort()).toEqual(expected)
	})

	it.each(MANIFESTS)('%s asks no API permission it does not use', (name) => {
		const manifest = readJson<Permissions>('manifests', name)
		expect((manifest.permissions ?? []).slice().sort()).toEqual(['activeTab', 'storage'])
	})
})

describe('build chain', () => {
	const pkg = readJson<{ scripts: Record<string, string>; devDependencies: Record<string, string> }>('package.json')

	it('pins the version of every tool it downloads with npx', () => {
		// `npx web-ext` would run whatever version is latest that day: a single
		// compromised release would run on the machine of whoever builds
		const unpinned = Object.entries(pkg.scripts)
			.filter(([, command]) => /\bnpx\b/.test(command) && !/@\d+\.\d+\.\d+/.test(command))
			.map(([name]) => name)

		expect(unpinned).toEqual([])
	})

	it('keeps the tooling out of the dependency tree', () => {
		// web-ext pulls addons-linter -> deepmerge, which npm audit reports; it is
		// a development tool, not something the extension ships
		expect(pkg.devDependencies['web-ext']).toBeUndefined()
	})
})
