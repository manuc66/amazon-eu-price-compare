import * as amzUtil from "../util/AmazonUtils"
import type { ThunkAction } from 'redux-thunk'
import type { Options } from '../types'
import type { RootState } from '../reducers'

export const RECEIVE_CURRENCY_RATE = 'RECEIVE_CURRENCY_RATE'
export const RECEIVE_CURRENT_PAGE_PRICE = 'RECEIVE_CURRENT_PAGE_PRICE'
export const RECEIVE_COUNTRY_PRICE = 'RECEIVE_COUNTRY_PRICE'
export const RECEIVE_COUNTRY_RANK = 'RECEIVE_COUNTRY_RANK'
export const RECEIVE_OPTIONS = 'RECEIVE_OPTIONS'

export interface ReceiveCurrencyRateAction {
	type: typeof RECEIVE_CURRENCY_RATE
	fromCurrency: string
	toCurrency: string
	rate: number
}

export interface ReceiveCurrentPagePriceAction {
	type: typeof RECEIVE_CURRENT_PAGE_PRICE
	country: string
	price: number
}

export interface ReceiveCountryPriceAction {
	type: typeof RECEIVE_COUNTRY_PRICE
	country: string
	price: number
	url: string
}

export interface ReceiveCountryRankAction {
	type: typeof RECEIVE_COUNTRY_RANK
	country: string
	rank: string | null
}

export interface ReceiveOptionsAction {
	type: typeof RECEIVE_OPTIONS
	items: Options
}

export type Action =
	| ReceiveCurrencyRateAction
	| ReceiveCurrentPagePriceAction
	| ReceiveCountryPriceAction
	| ReceiveCountryRankAction
	| ReceiveOptionsAction

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>

/** [price, rank] as sent back by the content script. */
type PageInfoResponse = [number | null, string | null]

export function receiveCurrencyRate(fromCurrency: string, toCurrency: string, rate: number): ReceiveCurrencyRateAction {
	return {
		type: RECEIVE_CURRENCY_RATE,
		fromCurrency,
		toCurrency,
		rate
	}
}

export function receiveCurrentPagePrice(country: string, price: number): ReceiveCurrentPagePriceAction {
	return {
		type: RECEIVE_CURRENT_PAGE_PRICE,
		country,
		price
	}
}

export function receiveCountryPrice(country: string, price: number, url: string): ReceiveCountryPriceAction {
	return {
		type: RECEIVE_COUNTRY_PRICE,
		country,
		price,
		url
	}
}

export function receiveCountryRank(country: string, rank: string | null): ReceiveCountryRankAction {
	return {
		type: RECEIVE_COUNTRY_RANK,
		country,
		rank
	}
}

export function receiveOptions(items: Options): ReceiveOptionsAction {
	return {
		type: RECEIVE_OPTIONS,
		items
	}
}

// async action
export function getCurrentPageUrl(): AppThunk {
	return (dispatch) => {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			var tab = tabs[0]
			if (tab === undefined || tab.id === undefined || typeof tab.url !== 'string') {
				return
			}

			const country = amzUtil.getCountryFromAmazonProductPageUrl(tab.url)
			const productID = amzUtil.getProductIDFromAmazonProductPageUrl(tab.url)
			if (productID === null || country === null) {
				return
			}

			chrome.tabs.sendMessage(tab.id, { "message": "get_current_page_info" }, function (response: PageInfoResponse | undefined) {
				// reading lastError keeps chrome from logging "Could not establish connection"
				void chrome.runtime.lastError

				if (response === undefined || response[0] === null) {
					return
				}
				dispatch(receiveCurrentPagePrice(country, response[0]))
				if (response.length > 1) {
					dispatch(receiveCountryRank(country, response[1]))
				}
			})
			var all_countries = ['uk', 'de', 'fr', 'es', 'it', 'nl', 'se', 'be']
			var currentCountry = [country]
			var countriesToSearch = all_countries.filter(x => currentCountry.indexOf(x) < 0)
			for (var i = 0; i < countriesToSearch.length; i++) {
				dispatch(getCountryPrice(productID, countriesToSearch[i]))
			}
		})
	}
}

// async action
export function getOptions(): AppThunk {
	return (dispatch) => {
		chrome.storage.sync.get({
			showRanks: false
		}, function (items) {
			dispatch(receiveOptions({ showRanks: items['showRanks'] === true }))
		})
	}
}

// async action
export function getCurrencyRate(): AppThunk {
	return (dispatch) => {
		dispatch(receiveCurrencyRate("GBP", "EUR", 1.17))
		dispatch(receiveCurrencyRate("EUR", "GBP", 0.85))
		dispatch(receiveCurrencyRate("GBP", "SEK", 13.32))
		dispatch(receiveCurrencyRate("SEK", "GBP", 0.075))
		dispatch(receiveCurrencyRate("EUR", "SEK", 11.34))
		dispatch(receiveCurrencyRate("SEK", "EUR", 0.088))
	}
}

export function getCountryPrice(productID: string, country: string): AppThunk {
	return (dispatch) => {
		var url = amzUtil.generateAmazonProductPageUrlForCountry(productID, country)
		fetch(
			url,
			{
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				}
			}
		)
			.then((response) => {
				if (!response.ok) {
					console.log(`Cannot find this item from amazon ${country}.`)
					return
				}
				return response.text().then(function (html) {
					var parser = new DOMParser()
					var doc = parser.parseFromString(html, "text/html")
					var price = amzUtil.getPriceFromAmazonProductDetailPage(doc)
					var rank = amzUtil.getRank(doc)
					if (price === null) {
						return
					}
					dispatch(receiveCountryPrice(country, price, url))
					dispatch(receiveCountryRank(country, rank))
				})
			})
			.catch(function (err: unknown) {
				var message = err instanceof Error ? err.message : String(err)
				console.log('There has been a problem with fetching price for other amazon markets: ' + message)
			})
	}
}
