/** A price found on one Amazon store, as stored in the redux state. */
export interface CountryPrice {
	country: string
	price: number
	/** true for the store the user is currently browsing */
	current?: boolean
	url?: string
}

/** Conversion rates, keyed by currency pair, e.g. `GBPEUR`. */
export type CurrencyRates = Record<string, number>

/** Best seller rank, keyed by country. */
export type CountryRanks = Record<string, string | null>

/** Values read from `chrome.storage.sync`. */
export interface Options {
	showRanks: boolean
}
