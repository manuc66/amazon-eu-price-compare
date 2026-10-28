import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MARKETS } from '../src/markets'

interface Manifest {
	host_permissions?: string[]
	content_scripts?: { matches?: string[] }[]
	browser_specific_settings?: {
		gecko?: { strict_min_version?: string; data_collection_permissions?: unknown }
		gecko_android?: { strict_min_version?: string }
	}
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

	it('declares a Firefox for Android version that understands the data collection key', () => {
		const settings = manifest.browser_specific_settings
		if (settings?.gecko?.data_collection_permissions === undefined) {
			return
		}

		// the key is understood from Firefox for Android 142 only: without this,
		// the add-on claims Android support from a version that ignores it
		const android = settings.gecko_android?.strict_min_version
		expect(android).toBeDefined()
		expect(Number.parseFloat(android as string)).toBeGreaterThanOrEqual(142)
	})

	it('declares no amazon store that is not in the market table', () => {
		const known = MARKETS.map((market) => `*://www.${market.domain}/*`)
		const staleHosts = hosts.filter((pattern) => pattern.includes('amazon') && !known.includes(pattern))
		const staleMatches = matches.filter((pattern) => pattern.includes('amazon') && !known.includes(pattern))

		expect(staleHosts).toEqual([])
		expect(staleMatches).toEqual([])
	})
})
