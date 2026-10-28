import { Component } from 'react'
import { CURRENCY_SYMBOLS, EUR_PER_UNIT, REFERENCE_CURRENCY, camelUrl, getMarket, keepaUrl } from '../markets'
import type { Currency } from '../markets'
import type { CountryPrice, CountryRanks, Options } from '../types'

export interface PriceListProps {
	price: CountryPrice[]
	rank: CountryRanks
	options: Options
	/** ASIN of the product being browsed */
	productID: string | null
	/** true while prices are still being fetched */
	loading: boolean
	getOptions: () => void
	getCurrentPageUrl: () => void
}

interface PriceRow {
	country: string
	url?: string
	currency: Currency
	nativePrice: string
	referencePrice: string
	note?: string
	/** camelcamelcamel price history, only for the stores it covers */
	camel: string | null
	/** Keepa price history, only for the stores it covers */
	keepa: string | null
	rank?: string | null
}

function formatPrice(value: number): string {
	return value.toFixed(2)
}

export default class PriceList extends Component<PriceListProps> {
	componentDidMount() {
		this.props.getOptions()
		chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
			if (changeInfo.status == "complete") {
				this.props.getCurrentPageUrl()
			}
		})
		this.props.getCurrentPageUrl()
	}

	render() {
		if (this.props.price.length === 0) {
			if (this.props.loading) {
				return (
					<div className="loading">
						<div className="spinner" />
						<p>Fetching prices…</p>
					</div>
					)
			}
			return (
				<p>Not amazon product detail page or can't parse price</p>
				)
		}

		var showRanks = this.props.options.showRanks
		var ranks = this.props.rank

		const productID = this.props.productID
		const prices = this.props.price.map(function(amz): PriceRow {
			var market = getMarket(amz.country)
			var currency = market === undefined ? REFERENCE_CURRENCY : market.currency
			return {
				country: amz.country,
				url: amz.url,
				currency: currency,
				nativePrice: formatPrice(amz.price),
				referencePrice: formatPrice(amz.price * EUR_PER_UNIT[currency]),
				note: market === undefined ? undefined : market.note,
				camel: camelUrl(productID, market),
				keepa: keepaUrl(productID, market),
				rank: showRanks ? ranks[amz.country] : undefined
			}
		})

		prices.sort(function(a, b) {
			return Number(a.referencePrice) - Number(b.referencePrice)
		})

		const price_list = prices.map(function(amz) {
			return (
				<tr key={amz.country}>
				<td className="amazon">Amazon</td>
				<td className="country">{amz.country.toUpperCase()}{amz.note !== undefined && <span className="market-note"> ({amz.note})</span>}</td>
				{amz.currency !== REFERENCE_CURRENCY &&
					<td className="price"><a href={amz.url} target="_blank">{CURRENCY_SYMBOLS[amz.currency]} {amz.nativePrice}</a></td>}
				<td className="price"><a href={amz.url} target="_blank">{CURRENCY_SYMBOLS[REFERENCE_CURRENCY]} {amz.referencePrice}</a></td>
				{showRanks === true &&
					<td className="rank">{amz.rank}</td>}
				<td className="history">
					{amz.camel !== null &&
						<a
							className="camel"
							href={amz.camel}
							target="_blank"
							title="Price history on camelcamelcamel"
							aria-label="Price history on camelcamelcamel"
						>🐪</a>}
					{amz.keepa !== null &&
						<a
							className="keepa"
							href={amz.keepa}
							target="_blank"
							title="Price history on Keepa"
							aria-label="Price history on Keepa"
						>K</a>}
				</td>
					</tr>
					)
		})

		return (
			<>
			{this.props.loading && <div className="progress"><div className="progress-bar" /></div>}
			<table className="pricelist">
			<tbody>
			{price_list}
			</tbody>
			</table>
			</>
			)
	}
}
