import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARKETS } from '../src/markets'

const OPTIONS_HTML = readFileSync(resolve(__dirname, '..', 'extension', 'options.html'), 'utf8')

function checkbox(id: string): HTMLInputElement {
	const element = document.getElementById(id)
	if (!(element instanceof HTMLInputElement)) {
		throw new Error(`no checkbox #${id} in the options page`)
	}
	return element
}

describe('options page', () => {
	let stored: Record<string, unknown>
	let set: ReturnType<typeof vi.fn>

	beforeEach(async () => {
		vi.resetModules()
		document.open()
		document.write(OPTIONS_HTML)
		document.close()

		stored = { showRanks: false }
		const get = vi.fn((defaults: Record<string, unknown>, callback: (items: Record<string, unknown>) => void) => {
			callback({ ...defaults, ...stored })
		})
		set = vi.fn((items: Record<string, unknown>, callback: () => void) => {
			Object.assign(stored, items)
			callback()
		})
		vi.stubGlobal('chrome', { storage: { sync: { get, set } } })

		await import('../src/chrome/options')
		document.dispatchEvent(new Event('DOMContentLoaded'))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('builds one checkbox per marketplace, from the market table', () => {
		for (const market of MARKETS) {
			expect(() => checkbox(`market-${market.country}`)).not.toThrow()
		}
		expect(document.querySelectorAll('#markets input[type="checkbox"]')).toHaveLength(MARKETS.length)
	})

	it('restores the default selection: every European store, amazon.com off', () => {
		expect(checkbox('market-de').checked).toBe(true)
		expect(checkbox('market-pl').checked).toBe(true)
		expect(checkbox('market-us').checked).toBe(false)
	})

	it('restores a stored selection', () => {
		stored.enabledCountries = ['de', 'us']
		document.dispatchEvent(new Event('DOMContentLoaded'))

		expect(checkbox('market-de').checked).toBe(true)
		expect(checkbox('market-us').checked).toBe(true)
		expect(checkbox('market-fr').checked).toBe(false)
	})

	it('saves the selected stores', () => {
		checkbox('market-pl').checked = false
		document.getElementById('save')?.dispatchEvent(new Event('click'))

		const items = set.mock.calls[0][0] as { showRanks: boolean; enabledCountries: string[] }
		expect(items.showRanks).toBe(false)
		expect(items.enabledCountries).toContain('de')
		expect(items.enabledCountries).not.toContain('pl')
		expect(items.enabledCountries).not.toContain('us')
	})

	it('saves the ranks switch too', () => {
		checkbox('show-ranks').checked = true
		document.getElementById('save')?.dispatchEvent(new Event('click'))

		const items = set.mock.calls[0][0] as { showRanks: boolean }
		expect(items.showRanks).toBe(true)
	})
})
