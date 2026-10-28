import { describe, expect, it } from 'vitest'
import { CURRENCY_SYMBOLS, EUR_PER_UNIT, MARKETS, getMarket, getMarketForUrl, marketsToCompare } from '../src/markets'

describe('MARKETS', () => {
	it('covers the ten European Amazon marketplaces', () => {
		const european = MARKETS.filter((market) => market.optional !== true)
		expect(european.map((market) => market.country).sort()).toEqual(
			['be', 'de', 'es', 'fr', 'ie', 'it', 'nl', 'pl', 'se', 'uk']
		)
	})

	it('offers amazon.com only as an optional market', () => {
		expect(MARKETS.filter((market) => market.optional === true).map((market) => market.country)).toEqual(['us'])
		expect(getMarket('us')?.note).toBeTruthy()
	})

	it('has one unique country and one unique domain per market', () => {
		expect(new Set(MARKETS.map((m) => m.country)).size).toBe(MARKETS.length)
		expect(new Set(MARKETS.map((m) => m.domain)).size).toBe(MARKETS.length)
	})

	it('gives every market a currency with a known symbol and rate', () => {
		for (const market of MARKETS) {
			expect(CURRENCY_SYMBOLS[market.currency]).toBeTruthy()
			expect(EUR_PER_UNIT[market.currency]).toBeGreaterThan(0)
		}
	})

	it('has a euro as reference currency, at a rate of exactly 1', () => {
		expect(EUR_PER_UNIT.EUR).toBe(1)
	})
})

describe('getMarket', () => {
	it('finds a market by country code', () => {
		expect(getMarket('pl')).toEqual({ country: 'pl', domain: 'amazon.pl', currency: 'PLN' })
		expect(getMarket('ie')).toEqual({ country: 'ie', domain: 'amazon.ie', currency: 'EUR' })
	})

	it('returns undefined for an unknown country', () => {
		expect(getMarket('jp')).toBeUndefined()
	})
})

describe('getMarketForUrl', () => {
	it.each([
		['https://www.amazon.pl/dp/B08N5WRWNW', 'pl'],
		['https://amazon.pl/dp/B08N5WRWNW', 'pl'],
		['https://www.amazon.ie/gp/product/B08N5WRWNW?th=1', 'ie'],
		['https://www.amazon.co.uk/dp/B08N5WRWNW', 'uk'],
		['https://www.amazon.com.be/dp/B08N5WRWNW', 'be'],
		['https://smile.amazon.de/dp/B08N5WRWNW', 'de'],
		['https://www.amazon.de/dp/B08N5WRWNW', 'de']
	])('detects %s as %s', (url, country) => {
		expect(getMarketForUrl(url)?.country).toBe(country)
	})

	it('does not confuse amazon.com.be with a store named "be"', () => {
		expect(getMarketForUrl('https://www.amazon.com.be/dp/B08N5WRWNW')?.domain).toBe('amazon.com.be')
	})

	it('detects amazon.com, which is only compared on demand', () => {
		expect(getMarketForUrl('https://www.amazon.com/dp/B08N5WRWNW')?.country).toBe('us')
	})

	it('ignores marketplaces the extension does not compare', () => {
		expect(getMarketForUrl('https://www.amazon.com.tr/dp/B08N5WRWNW')).toBeUndefined()
		expect(getMarketForUrl('https://www.amazon.co.jp/dp/B08N5WRWNW')).toBeUndefined()
	})

	it('does not match a domain that merely contains amazon.de', () => {
		expect(getMarketForUrl('https://www.amazon.de.evil.example/dp/B08N5WRWNW')).toBeUndefined()
	})

	it('returns undefined for a relative or malformed url', () => {
		expect(getMarketForUrl('/dp/B08N5WRWNW')).toBeUndefined()
		expect(getMarketForUrl('')).toBeUndefined()
	})
})

describe('marketsToCompare', () => {
	it('compares the other European stores by default', () => {
		const countries = marketsToCompare('de', false).map((market) => market.country)
		expect(countries).toHaveLength(9)
		expect(countries).not.toContain('de')
		expect(countries).not.toContain('us')
	})

	it('adds amazon.com when the user enabled it', () => {
		const countries = marketsToCompare('de', true).map((market) => market.country)
		expect(countries).toHaveLength(10)
		expect(countries).toContain('us')
	})

	it('never compares the store the user is browsing', () => {
		expect(marketsToCompare('us', true).map((market) => market.country)).not.toContain('us')
	})
})
