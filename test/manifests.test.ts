import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MARKETS } from '../src/markets'

interface Manifest {
	host_permissions?: string[]
	content_scripts?: { matches?: string[] }[]
}

function readManifest(name: string): Manifest {
	const path = resolve(__dirname, '..', 'manifests', name)
	return JSON.parse(readFileSync(path, 'utf8')) as Manifest
}

const MANIFESTS = ['manifest.chrome.json', 'manifest.firefox.json']

describe.each(MANIFESTS)('%s', (name) => {
	const manifest = readManifest(name)
	const hosts = manifest.host_permissions ?? []
	const matches = manifest.content_scripts?.[0]?.matches ?? []

	it('grants access to every market of the market table', () => {
		const missingHosts = MARKETS
			.map((market) => `*://www.${market.domain}/*`)
			.filter((pattern) => !hosts.includes(pattern))
		const missingMatches = MARKETS
			.map((market) => `*://www.${market.domain}/*`)
			.filter((pattern) => !matches.includes(pattern))

		expect(missingHosts).toEqual([])
		expect(missingMatches).toEqual([])
	})

	it('declares no amazon store that is not in the market table', () => {
		const known = MARKETS.map((market) => `*://www.${market.domain}/*`)
		const staleHosts = hosts.filter((pattern) => pattern.includes('amazon') && !known.includes(pattern))
		const staleMatches = matches.filter((pattern) => pattern.includes('amazon') && !known.includes(pattern))

		expect(staleHosts).toEqual([])
		expect(staleMatches).toEqual([])
	})
})
