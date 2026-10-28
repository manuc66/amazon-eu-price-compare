import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PriceList from '../src/components/PriceList'
import type { CountryPrice, CountryRanks, Options } from '../src/types'

const ASIN = 'B08N5WRWNW'

function render(
	price: CountryPrice[],
	rank: CountryRanks = {},
	options: Options = { showRanks: false, enabledCountries: ['uk','de','fr','it','es','nl','se','pl','be','ie','us'] },
	productID: string | null = ASIN,
	loading = false
): string {
	return renderToStaticMarkup(
		<PriceList
			price={price}
			rank={rank}
			options={options}
			productID={productID}
			loading={loading}
			getOptions={() => {}}
			getCurrentPageUrl={() => {}}
		/>
	)
}

/** Splits the rendered table into one string per store row. */
function rows(html: string): string[] {
	return html.split('<tr>').slice(1)
}

function rowOf(html: string, country: string): string {
	const row = rows(html).find((r) => r.includes(`>${country.toUpperCase()}<`))
	if (row === undefined) {
		throw new Error(`no row for ${country}`)
	}
	return row
}

describe('PriceList', () => {
	it('shows the message when there is no price and nothing is loading', () => {
		expect(render([])).toContain('Not amazon product detail page')
	})

	it('shows a spinner instead of the message while the first prices load', () => {
		const html = render([], {}, { showRanks: false, enabledCountries: [] }, ASIN, true)
		expect(html).toContain('Fetching prices')
		expect(html).toContain('spinner')
		expect(html).not.toContain('Not amazon product detail page')
	})

	it('keeps the table and shows a progress bar while more prices load', () => {
		const html = render([{ country: 'de', price: 20 }], {}, { showRanks: false, enabledCountries: [] }, ASIN, true)
		expect(html).toContain('progress-bar')
		expect(html).toContain('>DE<')
	})

	it('hides the progress bar once loading is done', () => {
		expect(render([{ country: 'de', price: 20 }])).not.toContain('progress-bar')
	})

	it('shows a euro price for a euro store, without duplicating it', () => {
		const html = render([{ country: 'de', price: 42.5, url: 'https://www.amazon.de/dp/B08N5WRWNW/' }])
		const row = rowOf(html, 'de')
		expect(row).toContain('€ 42.50')
		expect(row.match(/class="price"/g)).toHaveLength(1)
	})

	it('shows the native price and the euro equivalent for a british store', () => {
		const row = rowOf(render([{ country: 'uk', price: 10, url: 'https://www.amazon.co.uk/dp/B08N5WRWNW/' }]), 'uk')
		expect(row).toContain('£ 10.00')
		expect(row).toContain('€ 11.70')
	})

	it('shows the native price and the euro equivalent for a swedish store', () => {
		const row = rowOf(render([{ country: 'se', price: 100 }]), 'se')
		expect(row).toContain('kr 100.00')
		expect(row).toContain('€ 8.80')
	})

	it('shows the native price and the euro equivalent for a polish store', () => {
		const row = rowOf(render([{ country: 'pl', price: 100, url: 'https://www.amazon.pl/dp/B08N5WRWNW/' }]), 'pl')
		expect(row).toContain('zł 100.00')
		expect(row).toContain('€ 23.50')
	})

	it('treats the irish store as a euro store', () => {
		const row = rowOf(render([{ country: 'ie', price: 20 }]), 'ie')
		expect(row).toContain('€ 20.00')
		expect(row.match(/class="price"/g)).toHaveLength(1)
	})

	it('sorts the stores by converted price, not by native price', () => {
		const html = render([
			{ country: 'pl', price: 100 },  // 23.50 EUR
			{ country: 'uk', price: 10 },   // 11.70 EUR
			{ country: 'de', price: 20 }    // 20.00 EUR
		])
		expect(rows(html).map((r) => r.match(/>([A-Z]{2})</)?.[1])).toEqual(['UK', 'DE', 'PL'])
	})

	it('marks the US price as excluding VAT and shipping', () => {
		const row = rowOf(render([{ country: 'us', price: 199 }]), 'us')
		expect(row).toContain('$ 199.00')
		expect(row).toContain('€ 171.14')
		expect(row).toContain('excl. VAT')
	})

	it('links to the camelcamelcamel price history of each covered store', () => {
		const html = render([{ country: 'de', price: 20 }, { country: 'uk', price: 10 }])
		expect(rowOf(html, 'de')).toContain(`https://de.camelcamelcamel.com/product/${ASIN}`)
		expect(rowOf(html, 'uk')).toContain(`https://uk.camelcamelcamel.com/product/${ASIN}`)
		expect(rowOf(html, 'de')).toContain('🐪')
	})

	it('leaves the stores camelcamelcamel does not cover without a history link', () => {
		const html = render([{ country: 'nl', price: 20 }, { country: 'pl', price: 100 }])
		expect(rowOf(html, 'nl')).not.toContain('camelcamelcamel')
		expect(rowOf(html, 'pl')).not.toContain('camelcamelcamel')
	})

	it('links to the Keepa price history of each covered store', () => {
		const html = render([{ country: 'de', price: 20 }, { country: 'us', price: 199 }])
		expect(rowOf(html, 'de')).toContain(`https://keepa.com/#!product/3-${ASIN}`)
		expect(rowOf(html, 'us')).toContain(`https://keepa.com/#!product/1-${ASIN}`)
		expect(rowOf(html, 'de')).toContain('>K</a>')
	})

	it('shows both history links on the stores both sites cover', () => {
		const row = rowOf(render([{ country: 'de', price: 20 }]), 'de')
		expect(row).toContain('🐪')
		expect(row).toContain('>K</a>')
	})

	it('shows no history link at all on a store neither site covers', () => {
		const row = rowOf(render([{ country: 'se', price: 100 }]), 'se')
		expect(row).not.toContain('camelcamelcamel')
		expect(row).not.toContain('keepa.com')
	})

	it('links amazon.com to the bare camelcamelcamel domain', () => {
		const row = rowOf(render([{ country: 'us', price: 199 }]), 'us')
		expect(row).toContain(`https://camelcamelcamel.com/product/${ASIN}`)
	})

	it('builds no history link outside a product page', () => {
		const html = render([{ country: 'de', price: 20 }], {}, { showRanks: false, enabledCountries: [] }, null)
		expect(html).not.toContain('camelcamelcamel')
	})

	it('adds the rank column only when the option is enabled', () => {
		const price = [{ country: 'de', price: 20 }]
		const withoutRanks = render(price, { de: '#1 in Electronics' }, { showRanks: false, enabledCountries: [] })
		const withRanks = render(price, { de: '#1 in Electronics' }, { showRanks: true, enabledCountries: [] })

		expect(withoutRanks).not.toContain('#1 in Electronics')
		expect(withRanks).toContain('#1 in Electronics')
	})
})
