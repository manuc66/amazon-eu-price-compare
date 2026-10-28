/** A price found on one Amazon store, as stored in the redux state. */
export interface CountryPrice {
	country: string
	price: number
	/** true for the store the user is currently browsing */
	current?: boolean
	url?: string
}

/**
 * Why a store did not produce a price:
 * - `not-found`: the store answered, but the product is not sold there
 * - `error`: the store could not be loaded at all (network, blocked, HTTP error)
 */
export type StoreOutcome = 'not-found' | 'error'

/** Stores that could not be compared, with the reason, for one product. */
export interface FailedPrices {
	productID: string | null
	outcomes: Record<string, StoreOutcome>
}

/** Best seller rank, keyed by country. */
export type CountryRanks = Record<string, string | null>

/** Values read from `chrome.storage.sync`. */
export interface Options {
	showRanks: boolean
	/** country codes of the stores to compare, see src/markets.ts */
	enabledCountries: string[]
}
