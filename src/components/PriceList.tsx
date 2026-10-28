import { Component } from 'react'
import { CURRENCY_SYMBOLS, EUR_PER_UNIT, REFERENCE_CURRENCY, getMarket } from '../markets'
import type { Currency } from '../markets'
import type { CountryPrice, CountryRanks, Options } from '../types'

export interface PriceListProps {
	price: CountryPrice[]
	rank: CountryRanks
	options: Options
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
			return (
				<p>Not amazon product detail page or can't parse price</p>
				)
		}

		var showRanks = this.props.options.showRanks
		var ranks = this.props.rank

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
					</tr>
					)
		})

		return (
			<table className="pricelist">
			<tbody>
			{price_list}
			</tbody>
			</table>
			)
	}
}
