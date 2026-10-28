import { describe, expect, it } from 'vitest'
import {
	generateAmazonProductPageUrl,
	getCountryFromAmazonProductPageUrl,
	getPriceFromAmazonProductDetailPage,
	getProductIDFromAmazonProductPageUrl,
	getRank
} from '../src/util/AmazonUtils'
import { getMarket } from '../src/markets'

function parsePage(body: string): Document {
	return new DOMParser().parseFromString(`<!doctype html><html><body>${body}</body></html>`, 'text/html')
}

/** Current Amazon markup: whole and fraction are two separate spans. */
function newPriceMarkup(whole: string, fraction: string | null): string {
	const fractionSpan = fraction === null ? '' : `<span class="a-price-fraction">${fraction}</span>`
	return `<div class="a-price aok-align-center">
		<span class="a-offscreen">ignored</span>
		<span aria-hidden="true">
			<span class="a-price-whole">${whole}</span>
			${fractionSpan}
		</span>
	</div>`
}

/** Legacy markup (before Feb 2022), price in a single span. */
function oldPriceMarkup(price: string): string {
	return `<div class="a-price a-text-price a-size-medium apexPriceToPay">
		<span aria-hidden="true">${price}</span>
	</div>`
}

describe('getPriceFromAmazonProductDetailPage', () => {
	it('parses the current markup', () => {
		const doc = parsePage(newPriceMarkup('12', '34'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBe(12.34)
	})

	it('parses a German price with a thousands separator', () => {
		const doc = parsePage(newPriceMarkup('1.234', '56'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBe(1234.56)
	})

	it('parses a British price with a thousands separator', () => {
		const doc = parsePage(newPriceMarkup('1,234', '56'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBe(1234.56)
	})

	it('parses the legacy markup with a decimal comma', () => {
		const doc = parsePage(oldPriceMarkup('12,34 €'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBe(12.34)
	})

	it('parses the legacy markup with a German thousands separator', () => {
		const doc = parsePage(oldPriceMarkup('1.234,56 €'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBe(1234.56)
	})

	it('parses the legacy markup with a British thousands separator', () => {
		const doc = parsePage(oldPriceMarkup('£1,234.56'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBe(1234.56)
	})

	it('parses the legacy markup without decimals', () => {
		const doc = parsePage(oldPriceMarkup('€ 99'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBe(99)
	})

	it('returns null when there is no price on the page', () => {
		expect(getPriceFromAmazonProductDetailPage(parsePage('<p>no price here</p>'))).toBeNull()
	})

	it('returns null when the whole part is empty instead of a bogus decimal', () => {
		const doc = parsePage(newPriceMarkup('', '56'))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBeNull()
	})

	it('returns null when the fraction is missing, like the old behaviour', () => {
		const doc = parsePage(newPriceMarkup('12', null))
		expect(getPriceFromAmazonProductDetailPage(doc)).toBeNull()
	})
})

describe('getRank', () => {
	it('reads the sales rank without the category link', () => {
		const doc = parsePage('<div id="SalesRank"><span class="value">#1,234 in Electronics (<a href="#">See Top 100</a>)</span></div>')
		expect(getRank(doc)).toBe('#1,234 in Electronics')
	})

	it('decodes every escaped ampersand', () => {
		const doc = parsePage('<div id="SalesRank"><span class="value">#5 in Books &amp; Media &amp; More</span></div>')
		expect(getRank(doc)).toBe('#5 in Books & Media & More')
	})

	it('returns null when the page has no sales rank', () => {
		expect(getRank(parsePage('<p>no rank</p>'))).toBeNull()
	})
})

describe('getProductIDFromAmazonProductPageUrl', () => {
	const productID = 'B08N5WRWNW'

	it.each([
		[`https://www.amazon.de/dp/${productID}`, productID],
		[`https://www.amazon.de/dp/${productID}/`, productID],
		[`https://www.amazon.de/gp/product/${productID}/ref=ox_sc_act_title_1`, productID],
		[`https://www.amazon.co.uk/Some-Product-Name/dp/${productID}/ref=sr_1_1?keywords=usb+cable`, productID],
		[`https://www.amazon.com.be/dp/${productID}?th=1`, productID]
	])('extracts the ASIN from %s', (url, expected) => {
		expect(getProductIDFromAmazonProductPageUrl(url)).toBe(expected)
	})

	it('returns null for a search page', () => {
		expect(getProductIDFromAmazonProductPageUrl('https://www.amazon.de/s?k=usb+cable')).toBeNull()
	})
})

describe('getCountryFromAmazonProductPageUrl', () => {
	it.each([
		['https://www.amazon.de/dp/B08N5WRWNW', 'de'],
		['https://www.amazon.fr/dp/B08N5WRWNW', 'fr'],
		['https://www.amazon.it/dp/B08N5WRWNW', 'it'],
		['https://www.amazon.es/dp/B08N5WRWNW', 'es'],
		['https://www.amazon.nl/dp/B08N5WRWNW', 'nl'],
		['https://www.amazon.se/dp/B08N5WRWNW', 'se'],
		['https://www.amazon.co.uk/dp/B08N5WRWNW', 'uk'],
		['https://www.amazon.com.be/dp/B08N5WRWNW', 'be'],
		['https://www.amazon.pl/dp/B08N5WRWNW', 'pl'],
		['https://www.amazon.ie/dp/B08N5WRWNW', 'ie']
	])('finds the store of %s', (url, expected) => {
		expect(getCountryFromAmazonProductPageUrl(url)).toBe(expected)
	})

	it('knows about amazon.com, compared only on demand', () => {
		expect(getCountryFromAmazonProductPageUrl('https://www.amazon.com/dp/B08N5WRWNW')).toBe('us')
	})

	it('returns null for a store the extension does not support', () => {
		expect(getCountryFromAmazonProductPageUrl('https://www.amazon.com.tr/dp/B08N5WRWNW')).toBeNull()
	})
})

describe('generateAmazonProductPageUrl', () => {
	it.each([
		['uk', 'https://www.amazon.co.uk/dp/B08N5WRWNW/'],
		['be', 'https://www.amazon.com.be/dp/B08N5WRWNW/'],
		['de', 'https://www.amazon.de/dp/B08N5WRWNW/'],
		['pl', 'https://www.amazon.pl/dp/B08N5WRWNW/']
	])('builds the %s product url', (country, expected) => {
		const market = getMarket(country)
		expect(market).toBeDefined()
		expect(generateAmazonProductPageUrl('B08N5WRWNW', market!)).toBe(expected)
	})
})
