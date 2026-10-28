import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCurrentPageUrl } from '../src/actions'
import type { Action } from '../src/actions'
import type { RootState } from '../src/reducers'
import { DEFAULT_ENABLED_COUNTRIES, marketsToCompare } from '../src/markets'

const ASIN = 'B08N5WRWNW'

function state(): RootState {
	return {
		price: [],
		rank: {},
		options: { showRanks: false, enabledCountries: DEFAULT_ENABLED_COUNTRIES },
		productID: null,
		pending: 0
	}
}

function stubChrome(url: string): void {
	vi.stubGlobal('chrome', {
		tabs: {
			query: (_query: unknown, callback: (tabs: unknown[]) => void) => callback([{ id: 7, url }]),
			sendMessage: (_tabId: number, _message: unknown, callback: (response: unknown) => void) =>
				callback([12.34, '#1 in Electronics'])
		},
		runtime: { lastError: undefined }
	})
}

function stubFetch(): void {
	vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('<html></html>') })))
}

async function run(url: string): Promise<Action[]> {
	stubChrome(url)
	stubFetch()
	const actions: Action[] = []
	const dispatch = (action: unknown): void => {
		// the real store runs thunks; the fake one has to do the same
		if (typeof action === 'function') {
			(action as (d: typeof dispatch, g: typeof state) => void)(dispatch, state)
			return
		}
		actions.push(action as Action)
	}
	getCurrentPageUrl()(dispatch, state, undefined)
	await new Promise((resolve) => setTimeout(resolve, 20))
	return actions
}

const count = (actions: Action[], type: string) => actions.filter((action) => action.type === type).length

describe('getCurrentPageUrl', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('starts and finishes one request per store, plus the page itself', async () => {
		const actions = await run(`https://www.amazon.de/dp/${ASIN}`)
		const expected = 1 + marketsToCompare('de', DEFAULT_ENABLED_COUNTRIES).length

		expect(count(actions, 'REQUEST_STARTED')).toBe(expected)
		expect(count(actions, 'REQUEST_FINISHED')).toBe(expected)
	})

	it('dispatches the current page price', async () => {
		const actions = await run(`https://www.amazon.de/dp/${ASIN}`)
		expect(actions).toContainEqual({
			type: 'RECEIVE_CURRENT_PAGE_PRICE',
			country: 'de',
			price: 12.34,
			productID: ASIN
		})
	})

	it('starts nothing when the page is not a product page', async () => {
		const actions = await run('https://www.google.com/search?q=usb+cable')
		expect(count(actions, 'REQUEST_STARTED')).toBe(0)
	})
})
