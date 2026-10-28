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
		pending: 0,
		failed: { productID: null, outcomes: {} }
	}
}

function stubChrome(url: string, cached: Record<string, unknown> = {}): void {
	const data: Record<string, unknown> = { ...cached }
	const area = {
		get: (key: string, callback: (items: Record<string, unknown>) => void) =>
			callback(key in data ? { [key]: data[key] } : {}),
		set: (items: Record<string, unknown>, callback: () => void) => {
			Object.assign(data, items)
			callback()
		}
	}
	vi.stubGlobal('chrome', {
		tabs: {
			query: (_query: unknown, callback: (tabs: unknown[]) => void) => callback([{ id: 7, url }]),
			sendMessage: (_tabId: number, _message: unknown, callback: (response: unknown) => void) =>
				callback([12.34, '#1 in Electronics'])
		},
		storage: { session: area, local: area },
		runtime: { lastError: undefined }
	})
}

function stubFetch(): ReturnType<typeof vi.fn> {
	const fetchMock = vi.fn(() => Promise.resolve({
		ok: true,
		status: 200,
		text: () => Promise.resolve('<html></html>')
	}))
	vi.stubGlobal('fetch', fetchMock)
	return fetchMock
}

async function run(url: string, cached: Record<string, unknown> = {}, force = false): Promise<Action[]> {
	stubChrome(url, cached)
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
	getCurrentPageUrl(force)(dispatch, state, undefined)
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

	it('reuses a fresh cache instead of fetching everything again', async () => {
		const cached = {
			[`prices:${ASIN}`]: {
				savedAt: Date.now(),
				price: [{ country: 'de', price: 42.5, current: true }],
				rank: { de: '#1 in Electronics' },
				outcomes: {}
			}
		}
		const actions = await run(`https://www.amazon.de/dp/${ASIN}`, cached)

		expect(count(actions, 'REQUEST_STARTED')).toBe(0)
		expect(actions).toContainEqual({
			type: 'RESTORE_CACHED_PRICES',
			price: [{ country: 'de', price: 42.5, current: true }],
			rank: { de: '#1 in Electronics' },
			productID: ASIN,
			outcomes: {}
		})
	})

	it('ignores a fresh cache when the refresh button is used', async () => {
		const cached = {
			[`prices:${ASIN}`]: {
				savedAt: Date.now(),
				price: [{ country: 'de', price: 42.5, current: true }],
				rank: {},
				outcomes: {}
			}
		}
		const actions = await run(`https://www.amazon.de/dp/${ASIN}`, cached, true)

		expect(count(actions, 'RESTORE_CACHED_PRICES')).toBe(0)
		expect(count(actions, 'REQUEST_STARTED')).toBeGreaterThan(0)
	})

	it('shows a stale cache at once, then refreshes it', async () => {
		const cached = {
			[`prices:${ASIN}`]: {
				savedAt: Date.now() - 5 * 60 * 1000,
				price: [{ country: 'de', price: 42.5, current: true }],
				rank: {},
				outcomes: {}
			}
		}
		const actions = await run(`https://www.amazon.de/dp/${ASIN}`, cached)

		expect(count(actions, 'RESTORE_CACHED_PRICES')).toBe(1)
		expect(count(actions, 'REQUEST_STARTED')).toBeGreaterThan(0)
	})

	it('fetches the marketplace pages without credentials nor referrer', async () => {
		const actions: Action[] = []
		const dispatch = (action: unknown): void => {
			if (typeof action === 'function') {
				(action as (d: typeof dispatch, g: typeof state) => void)(dispatch, state)
				return
			}
			actions.push(action as Action)
		}
		stubChrome(`https://www.amazon.de/dp/${ASIN}`)
		const fetchMock = stubFetch()

		getCurrentPageUrl(false)(dispatch, state, undefined)
		await new Promise((resolve) => setTimeout(resolve, 20))

		// the extension is privileged: it must not send the user's amazon cookies
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('amazon.fr'),
			expect.objectContaining({
				credentials: 'omit',
				referrerPolicy: 'no-referrer'
			})
		)
	})

	it('reports every store without a parsable price as not found', async () => {
		const actions = await run(`https://www.amazon.de/dp/${ASIN}`)
		const notFound = actions.filter((a) => a.type === 'COUNTRY_UNAVAILABLE' && a.reason === 'not-found')

		expect(notFound).toHaveLength(marketsToCompare('de', DEFAULT_ENABLED_COUNTRIES).length)
		expect(notFound).toContainEqual({ type: 'COUNTRY_UNAVAILABLE', country: 'nl', reason: 'not-found' })
	})

	it('reports a store that cannot be loaded as an error', async () => {
		stubChrome(`https://www.amazon.de/dp/${ASIN}`)
		vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))))
		const actions: Action[] = []
		const dispatch = (action: unknown): void => {
			if (typeof action === 'function') {
				(action as (d: typeof dispatch, g: typeof state) => void)(dispatch, state)
				return
			}
			actions.push(action as Action)
		}
		getCurrentPageUrl(false)(dispatch, state, undefined)
		await new Promise((resolve) => setTimeout(resolve, 20))

		const errors = actions.filter((a) => a.type === 'COUNTRY_UNAVAILABLE' && a.reason === 'error')
		expect(errors).toHaveLength(marketsToCompare('de', DEFAULT_ENABLED_COUNTRIES).length)
	})

	it('starts nothing when the page is not a product page', async () => {
		const actions = await run('https://www.google.com/search?q=usb+cable')
		expect(count(actions, 'REQUEST_STARTED')).toBe(0)
	})
})
