import { Component } from 'react'
import type { CountryPrice, CountryRanks, CurrencyRates, Options } from '../types'

export interface PriceListProps {
	price: CountryPrice[]
	rate: CurrencyRates
	rank: CountryRanks
	options: Options
	getOptions: () => void
	getCurrencyRate: () => void
	getCurrentPageUrl: () => void
}

interface PriceRow {
	country: string
	url?: string
	eurPrice: number | string
	gbpPrice: number | string
	sekPrice: number | string
	rank?: string | null
}

export default class PriceList extends Component<PriceListProps> {
	componentDidMount() {
		this.props.getOptions()
		chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
			if (changeInfo.status == "complete") {
				this.props.getCurrentPageUrl()
			}
		})
		this.props.getCurrencyRate()
		this.props.getCurrentPageUrl()
	}

	render() {
		if (this.props.price.length === 0) {
			return (
				<p>Not amazon product detail page or can't parse price</p>
				)
		}

		var currentCountry = ''
		this.props.price.forEach(function(amz) {
			if (amz.current == true) {
				currentCountry = amz.country
			}
		})

		var GBPEUR = this.props.rate.GBPEUR
		var EURGBP = this.props.rate.EURGBP
		var GBPSEK = this.props.rate.GBPSEK
		var SEKGBP = this.props.rate.SEKGBP
		var EURSEK = this.props.rate.EURSEK
		var SEKEUR = this.props.rate.SEKEUR

		var prices: PriceRow[] = this.props.price.map(function(amz) {
			if (amz.country == 'uk') {
				return {
					country: amz.country,
					url: amz.url,
					gbpPrice: amz.price,
					sekPrice: (amz.price * GBPSEK).toFixed(2),
					eurPrice: (amz.price * GBPEUR).toFixed(2)
				}
			} else if (amz.country == 'se') {
				return {
					country: amz.country,
					url: amz.url,
					sekPrice: amz.price,
					gbpPrice: (amz.price * SEKGBP).toFixed(2),
					eurPrice: (amz.price * SEKEUR).toFixed(2)
				}
			} else {
				return {
					country: amz.country,
					url: amz.url,
					eurPrice: amz.price,
					gbpPrice: (amz.price * EURGBP).toFixed(2),
					sekPrice: (amz.price * EURSEK).toFixed(2)
				}
			}
		})

		prices = prices.sort(function(a, b) {
			return Number(a.eurPrice) - Number(b.eurPrice)
		})

		var showRanks = this.props.options.showRanks
		if (showRanks) {
			var ranks = this.props.rank
			prices = prices.map(function(amz) {
				return { ...amz, rank: ranks[amz.country] }
			})
		}

		const price_list = prices.map(function(amz) {
			return (
				<tr key={amz.country}>
				<td className="amazon">Amazon</td>
				<td className="country">{amz.country.toUpperCase()}</td>
				{currentCountry == 'uk' && <td className="price"><a href={amz.url} target="_blank">&pound; {amz.gbpPrice}</a></td>}
				{currentCountry == 'se' && <td className="price"><a href={amz.url} target="_blank">kr {amz.sekPrice}</a></td>}
				<td className="price"><a href={amz.url} target="_blank">&euro; {amz.eurPrice}</a></td>
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
