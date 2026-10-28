import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isFresh, persistPricesWhenIdle, readCachedPrices, writeCachedPrices } from '../src/cache'
import type { CountryPrice } from '../src/types'

const ASIN = 'B08N5WRWNW'
const PRICES: CountryPrice[] = [{ country: 'de', price: 42.5, current: true }]
const RANKS = { de: '#1 in Electronics' }

function stubStorage(): Record<string, unknown> {
	const data: Record<string, unknown> = {}
	const area = {
		get: (key: string, callback: (items: Record<string, unknown>) => void) =>
			callback(key in data ? { [key]: data[key] } : {}),
		set: (items: Record<string, unknown>, callback: () => void) => {
			Object.assign(data, items)
			callback()
		}
	}
	vi.stubGlobal('chrome', {
		storage: { session: area, local: area },
		runtime: { lastError: undefined }
	})
	return data
}

describe('price cache', () => {
	beforeEach(() => {
		stubStorage()
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-10-28T12:00:00Z'))
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	it('returns nothing for an unknown product', async () => {
		expect(await readCachedPrices(ASIN)).toBeNull()
	})

	it('gives back what was written', async () => {
		await writeCachedPrices(ASIN, PRICES, RANKS, { nl: 'not-found' })
		const entry = await readCachedPrices(ASIN)
		expect(entry?.price).toEqual(PRICES)
		expect(entry?.rank).toEqual(RANKS)
		expect(entry?.outcomes).toEqual({ nl: 'not-found' })
	})

	it('keeps the entries of different products apart', async () => {
		await writeCachedPrices(ASIN, PRICES, RANKS, { nl: 'not-found' })
		expect(await readCachedPrices('B000000000')).toBeNull()
	})

	it('ignores an entry older than ten minutes', async () => {
		await writeCachedPrices(ASIN, PRICES, RANKS, { nl: 'not-found' })
		vi.setSystemTime(new Date('2026-10-28T12:11:00Z'))
		expect(await readCachedPrices(ASIN)).toBeNull()
	})

	it('still serves an entry older than ten minutes ago but inside the window', async () => {
		await writeCachedPrices(ASIN, PRICES, RANKS, { nl: 'not-found' })
		vi.setSystemTime(new Date('2026-10-28T12:05:00Z'))
		expect(await readCachedPrices(ASIN)).not.toBeNull()
	})

	it('considers an entry fresh for two minutes, then stale', async () => {
		await writeCachedPrices(ASIN, PRICES, RANKS, { nl: 'not-found' })
		const entry = await readCachedPrices(ASIN)
		expect(entry).not.toBeNull()
		expect(isFresh(entry!)).toBe(true)

		vi.setSystemTime(new Date('2026-10-28T12:03:00Z'))
		expect(isFresh(entry!)).toBe(false)
	})

	it('saves once every request has settled', async () => {
		vi.useFakeTimers()
		persistPricesWhenIdle({ productID: ASIN, price: PRICES, rank: RANKS, pending: 3, failed: { outcomes: {} } })
		vi.advanceTimersByTime(500)
		expect(await readCachedPrices(ASIN)).toBeNull()

		persistPricesWhenIdle({ productID: ASIN, price: PRICES, rank: RANKS, pending: 0, failed: { outcomes: {} } })
		vi.advanceTimersByTime(500)
		await Promise.resolve()
		expect(await readCachedPrices(ASIN)).not.toBeNull()
	})

	it('does not save when there is nothing to show', () => {
		const data = stubStorage()
		persistPricesWhenIdle({ productID: null, price: PRICES, rank: RANKS, pending: 0, failed: { outcomes: {} } })
		persistPricesWhenIdle({ productID: ASIN, price: [], rank: {}, pending: 0, failed: { outcomes: {} } })
		vi.advanceTimersByTime(500)
		expect(Object.keys(data)).toEqual([])
	})
})
