import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const OPTIONS_HTML = readFileSync(resolve(__dirname, '..', 'extension', 'options.html'), 'utf8')

function checkbox(id: string): HTMLInputElement {
	const element = document.getElementById(id)
	if (!(element instanceof HTMLInputElement)) {
		throw new Error(`no checkbox #${id} in the options page`)
	}
	return element
}

describe('options page', () => {
	let stored: Record<string, boolean>
	let get: ReturnType<typeof vi.fn>
	let set: ReturnType<typeof vi.fn>

	beforeEach(async () => {
		vi.resetModules()
		document.open()
		document.write(OPTIONS_HTML)
		document.close()

		stored = { showRanks: false, showUsMarket: false }
		get = vi.fn((defaults: Record<string, boolean>, callback: (items: Record<string, boolean>) => void) => {
			callback({ ...defaults, ...stored })
		})
		set = vi.fn((items: Record<string, boolean>, callback: () => void) => {
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

	it('has a checkbox for every option', () => {
		expect(() => checkbox('show-ranks')).not.toThrow()
		expect(() => checkbox('show-us-market')).not.toThrow()
	})

	it('restores the stored options', () => {
		expect(checkbox('show-ranks').checked).toBe(false)
		expect(checkbox('show-us-market').checked).toBe(false)

		stored.showRanks = true
		stored.showUsMarket = true
		document.dispatchEvent(new Event('DOMContentLoaded'))

		expect(checkbox('show-ranks').checked).toBe(true)
		expect(checkbox('show-us-market').checked).toBe(true)
	})

	it('saves both checkboxes when the save button is clicked', () => {
		checkbox('show-ranks').checked = true
		checkbox('show-us-market').checked = true
		document.getElementById('save')?.dispatchEvent(new Event('click'))

		expect(set).toHaveBeenCalledWith({ showRanks: true, showUsMarket: true }, expect.any(Function))
	})
})
