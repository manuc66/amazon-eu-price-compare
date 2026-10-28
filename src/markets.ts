export type Currency = 'EUR' | 'GBP' | 'SEK' | 'PLN' | 'USD'

export interface Market {
	/** country code, also used as the key of the redux state */
	country: string
	/** store domain, e.g. `amazon.com.be` */
	domain: string
	currency: Currency
	/** compared only when the user enables it in the options page */
	optional?: boolean
	/** caveat displayed next to the price */
	note?: string
}

/**
 * The ten European Amazon marketplaces, plus amazon.com as an optional extra.
 * https://sell.amazon.fr/en/programmes/vendre-en-europe
 */
export const MARKETS: Market[] = [
	{ country: 'uk', domain: 'amazon.co.uk', currency: 'GBP' },
	{ country: 'de', domain: 'amazon.de', currency: 'EUR' },
	{ country: 'fr', domain: 'amazon.fr', currency: 'EUR' },
	{ country: 'it', domain: 'amazon.it', currency: 'EUR' },
	{ country: 'es', domain: 'amazon.es', currency: 'EUR' },
	{ country: 'nl', domain: 'amazon.nl', currency: 'EUR' },
	{ country: 'se', domain: 'amazon.se', currency: 'SEK' },
	{ country: 'pl', domain: 'amazon.pl', currency: 'PLN' },
	{ country: 'be', domain: 'amazon.com.be', currency: 'EUR' },
	{ country: 'ie', domain: 'amazon.ie', currency: 'EUR' },
	{
		country: 'us',
		domain: 'amazon.com',
		currency: 'USD',
		optional: true,
		note: 'excl. VAT & shipping'
	}
]

/** The currency every price is converted to, for the comparison. */
export const REFERENCE_CURRENCY: Currency = 'EUR'

/**
 * Euros per unit of currency. Amazon no longer provides a usable exchange rate
 * API, so these are fixed values: update them by hand when they drift too far.
 */
export const EUR_PER_UNIT: Record<Currency, number> = {
	EUR: 1,
	GBP: 1.17,
	SEK: 0.088,
	PLN: 0.235,
	USD: 0.86
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
	EUR: '€',
	GBP: '£',
	SEK: 'kr',
	PLN: 'zł',
	USD: '$'
}

export function getMarket(country: string): Market | undefined {
	return MARKETS.find((market) => market.country === country)
}

/** Finds the marketplace of an absolute url, `https://www.<domain>/...`. */
export function getMarketForUrl(url: string): Market | undefined {
	const host = extractHostname(url)
	if (host === null) {
		return undefined
	}
	return MARKETS.find((market) => host === market.domain || host.endsWith('.' + market.domain))
}

/** The stores to compare with the page being browsed. */
export function marketsToCompare(currentCountry: string, includeOptionalMarkets: boolean): Market[] {
	return MARKETS.filter((market) =>
		market.country !== currentCountry && (market.optional !== true || includeOptionalMarkets)
	)
}

function extractHostname(url: string): string | null {
	const match = /^(?:[a-z][a-z0-9+.-]*:\/\/)?([^/?#]+)/i.exec(url.trim())
	if (match === null) {
		return null
	}
	return match[1].toLowerCase().replace(/^www\./, '')
}
