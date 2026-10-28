import * as amzUtil from "../util/AmazonUtils"
import type { ThunkAction } from 'redux-thunk'
import { marketsToCompare } from '../markets'
import type { Market } from '../markets'
import type { Options } from '../types'
import type { RootState } from '../reducers'

export const REQUEST_STARTED = 'REQUEST_STARTED'
export const REQUEST_FINISHED = 'REQUEST_FINISHED'
export const RECEIVE_CURRENT_PAGE_PRICE = 'RECEIVE_CURRENT_PAGE_PRICE'
export const RECEIVE_COUNTRY_PRICE = 'RECEIVE_COUNTRY_PRICE'
export const RECEIVE_COUNTRY_RANK = 'RECEIVE_COUNTRY_RANK'
export const RECEIVE_OPTIONS = 'RECEIVE_OPTIONS'

export interface RequestStartedAction {
	type: typeof REQUEST_STARTED
}

export interface RequestFinishedAction {
	type: typeof REQUEST_FINISHED
}

export interface ReceiveCurrentPagePriceAction {
	type: typeof RECEIVE_CURRENT_PAGE_PRICE
	country: string
	price: number
	/** ASIN of the product being browsed, shared by every store */
	productID: string
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
	| RequestStartedAction
	| RequestFinishedAction
	| ReceiveCurrentPagePriceAction
	| ReceiveCountryPriceAction
	| ReceiveCountryRankAction
	| ReceiveOptionsAction

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>

/** [price, rank] as sent back by the content script. */
type PageInfoResponse = [number | null, string | null]

/** One in-flight request: the popup shows a loader while the count is above 0. */
export function requestStarted(): RequestStartedAction {
	return { type: REQUEST_STARTED }
}

export function requestFinished(): RequestFinishedAction {
	return { type: REQUEST_FINISHED }
}

export function receiveCurrentPagePrice(country: string, price: number, productID: string): ReceiveCurrentPagePriceAction {
	return {
		type: RECEIVE_CURRENT_PAGE_PRICE,
		country,
		price,
		productID
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
	return (dispatch, getState) => {
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

			dispatch(requestStarted())
			chrome.tabs.sendMessage(tab.id, { "message": "get_current_page_info" }, function (response: PageInfoResponse | undefined) {
				// reading lastError keeps chrome from logging "Could not establish connection"
				void chrome.runtime.lastError
				dispatch(requestFinished())

				if (response === undefined || response[0] === null) {
					return
				}
				dispatch(receiveCurrentPagePrice(country, response[0], productID))
				if (response.length > 1) {
					dispatch(receiveCountryRank(country, response[1]))
				}
			})

			const markets = marketsToCompare(country, getState().options.showUsMarket)
			for (const market of markets) {
				dispatch(getCountryPrice(productID, market))
			}
		})
	}
}

// async action
export function getOptions(): AppThunk {
	return (dispatch) => {
		chrome.storage.sync.get({
			showRanks: false,
			showUsMarket: false
		}, function (items) {
			dispatch(receiveOptions({
				showRanks: items['showRanks'] === true,
				showUsMarket: items['showUsMarket'] === true
			}))
		})
	}
}

export function getCountryPrice(productID: string, market: Market): AppThunk {
	return (dispatch) => {
		var url = amzUtil.generateAmazonProductPageUrl(productID, market)
		dispatch(requestStarted())
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
					console.log(`Cannot find this item from amazon ${market.country}.`)
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
					dispatch(receiveCountryPrice(market.country, price, url))
					dispatch(receiveCountryRank(market.country, rank))
				})
			})
			.catch(function (err: unknown) {
				var message = err instanceof Error ? err.message : String(err)
				console.log('There has been a problem with fetching price for other amazon markets: ' + message)
			})
			.finally(function () {
				dispatch(requestFinished())
			})
	}
}
