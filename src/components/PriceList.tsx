import { Component } from 'react'
import { CURRENCY_SYMBOLS, EUR_PER_UNIT, REFERENCE_CURRENCY, camelUrl, getMarket, keepaUrl } from '../markets'
import type { Currency, Market } from '../markets'
import type { CountryPrice, CountryRanks, Options, StoreOutcome } from '../types'

export interface PriceListProps {
	price: CountryPrice[]
	rank: CountryRanks
	options: Options
	/** ASIN of the product being browsed */
	productID: string | null
	/** true while prices are still being fetched */
	loading: boolean
	/** stores that could not be compared, with the reason */
	failed: Record<string, StoreOutcome>
	getOptions: () => void
	getCurrentPageUrl: () => void
	/** ignores the cache and fetches every store again */
	refresh: () => void
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

/** The popup is not a page: once a link has opened its tab, it should go away. */
function closePopup(): void {
	// let the browser handle the click (and open the tab) before closing
	setTimeout(function () {
		window.close()
	}, 0)
}

interface HistoryLinksProps {
	productID: string | null
	market: Market | undefined
}

function HistoryLinks(props: HistoryLinksProps) {
	var camel = camelUrl(props.productID, props.market)
	var keepa = keepaUrl(props.productID, props.market)
	return (
		<>
		{camel !== null &&
			<a
				className="camel"
				href={camel}
				target="_blank"
				rel="noreferrer"
				onClick={closePopup}
				title="Price history on camelcamelcamel"
				aria-label="Price history on camelcamelcamel"
			>🐪</a>}
		{keepa !== null &&
			<a
				className="keepa"
				href={keepa}
				target="_blank"
				rel="noreferrer"
				onClick={closePopup}
				title="Price history on Keepa"
				aria-label="Price history on Keepa"
			>K</a>}
		</>
	)
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
		const toolbar = (
			<div className="toolbar">
				<button
					className="refresh"
					type="button"
					title="Refresh prices"
					aria-label="Refresh prices"
					onClick={() => this.props.refresh()}
				>⟳</button>
			</div>
			)

		if (this.props.price.length === 0) {
			if (this.props.loading) {
				return (
					<>
					<div className="loading">
						<div className="spinner" />
						<p>Fetching prices…</p>
					</div>
					{toolbar}
					</>
					)
			}
			return (
				<>
				<p>Not amazon product detail page or can't parse price</p>
				{toolbar}
				</>
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
				<td className="price">
					{amz.currency !== REFERENCE_CURRENCY &&
						<a href={amz.url} target="_blank" rel="noreferrer" onClick={closePopup}>{CURRENCY_SYMBOLS[amz.currency]} {amz.nativePrice}</a>}
				</td>
				<td className="price"><a href={amz.url} target="_blank" rel="noreferrer" onClick={closePopup}>{CURRENCY_SYMBOLS[REFERENCE_CURRENCY]} {amz.referencePrice}</a></td>
				{showRanks === true &&
					<td className="rank">{amz.rank}</td>}
				<td className="history"><HistoryLinks productID={productID} market={getMarket(amz.country)} /></td>
					</tr>
					)
		})

		const failed = this.props.failed
		const failed_list = Object.keys(failed).sort().map(function(country) {
			var reason = failed[country]
			return (
				<tr key={'failed-' + country} className="failed">
				<td className="amazon">Amazon</td>
				<td className="country">{country.toUpperCase()}</td>
				<td className="price" />
				<td className={'price ' + (reason === 'error' ? 'load-error' : 'not-found')}>
					{reason === 'error' ? 'loading failed' : 'not found'}
				</td>
				{showRanks === true && <td className="rank" />}
				<td className="history"><HistoryLinks productID={productID} market={getMarket(country)} /></td>
					</tr>
					)
		})

		return (
			<>
			{this.props.loading && <div className="progress"><div className="progress-bar" /></div>}
			<table className="pricelist">
			<tbody>
			{price_list}
			{failed_list}
			</tbody>
			</table>
			{toolbar}
			</>
			)
	}
}
