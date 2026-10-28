import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import PriceList from '../src/components/PriceList'
import type { CountryPrice, CountryRanks, Options } from '../src/types'

function render(price: CountryPrice[], rank: CountryRanks = {}, options: Options = { showRanks: false }): string {
	return renderToStaticMarkup(
		<PriceList
			price={price}
			rank={rank}
			options={options}
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
	it('shows the message when there is no price yet', () => {
		expect(render([])).toContain('Not amazon product detail page')
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

	it('adds the rank column only when the option is enabled', () => {
		const price = [{ country: 'de', price: 20 }]
		const withoutRanks = render(price, { de: '#1 in Electronics' }, { showRanks: false })
		const withRanks = render(price, { de: '#1 in Electronics' }, { showRanks: true })

		expect(withoutRanks).not.toContain('#1 in Electronics')
		expect(withRanks).toContain('#1 in Electronics')
	})
})
