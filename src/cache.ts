import type { CountryPrice, CountryRanks, StoreOutcome } from './types'

/**
 * Prices are cached per ASIN so that reopening the popup shows the previous
 * comparison immediately instead of fetching ten marketplaces again.
 */
export interface CachedPrices {
	savedAt: number
	price: CountryPrice[]
	rank: CountryRanks
	outcomes: Record<string, StoreOutcome>
}

/** Older entries are not even displayed: the popup starts from a spinner. */
const MAX_AGE_MS = 10 * 60 * 1000
/** Fresher entries are displayed without refetching at all. */
const REFRESH_AFTER_MS = 2 * 60 * 1000
const KEY_PREFIX = 'prices:'

/** storage.session lives in memory and dies with the browser, storage.local is the fallback. */
function area(): chrome.storage.StorageArea {
	return chrome.storage.session ?? chrome.storage.local
}

function key(productID: string): string {
	return KEY_PREFIX + productID
}

export function readCachedPrices(productID: string): Promise<CachedPrices | null> {
	return new Promise((resolve) => {
		area().get(key(productID), function (items) {
			var entry = items[key(productID)] as CachedPrices | undefined
			if (
				entry === undefined ||
				typeof entry.savedAt !== 'number' ||
				!Array.isArray(entry.price) ||
				entry.outcomes === null ||
				typeof entry.outcomes !== 'object' ||
				Date.now() - entry.savedAt > MAX_AGE_MS
			) {
				resolve(null)
				return
			}
			resolve({ savedAt: entry.savedAt, price: entry.price, rank: entry.rank, outcomes: entry.outcomes })
		})
	})
}

export function writeCachedPrices(
	productID: string,
	price: CountryPrice[],
	rank: CountryRanks,
	outcomes: Record<string, StoreOutcome>
): Promise<void> {
	return new Promise((resolve) => {
		var entry: CachedPrices = { savedAt: Date.now(), price, rank, outcomes }
		area().set({ [key(productID)]: entry }, function () {
			// reading lastError keeps chrome from logging a quota error: a cache
			// that cannot be written is not worth breaking the popup for
			void chrome.runtime.lastError
			resolve()
		})
	})
}

export function isFresh(entry: CachedPrices): boolean {
	return Date.now() - entry.savedAt < REFRESH_AFTER_MS
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

/** Saves the last comparison once every request has settled. */
export function persistPricesWhenIdle(state: {
	productID: string | null
	price: CountryPrice[]
	rank: CountryRanks
	pending: number
	failed: { outcomes: Record<string, StoreOutcome> }
}): void {
	if (state.pending > 0 || state.productID === null || state.price.length === 0) {
		return
	}
	if (saveTimer !== undefined) {
		clearTimeout(saveTimer)
	}
	var productID = state.productID
	var price = state.price
	var rank = state.rank
	var outcomes = state.failed.outcomes
	saveTimer = setTimeout(function () {
		saveTimer = undefined
		void writeCachedPrices(productID, price, rank, outcomes)
	}, 200)
}
