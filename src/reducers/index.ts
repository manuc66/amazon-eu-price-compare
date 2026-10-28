import type { Reducer } from 'redux'
import {
	COUNTRY_UNAVAILABLE,
	REQUEST_STARTED,
	REQUEST_FINISHED,
	RESTORE_CACHED_PRICES,
	RECEIVE_CURRENT_PAGE_PRICE,
	RECEIVE_COUNTRY_PRICE,
	RECEIVE_COUNTRY_RANK,
	RECEIVE_OPTIONS
} from '../actions'
import type { Action } from '../actions'
import { DEFAULT_ENABLED_COUNTRIES } from '../markets'
import type { CountryPrice, CountryRanks, FailedPrices, Options } from '../types'

const price: Reducer<CountryPrice[], Action> = (state = [], action) => {
	switch (action.type) {
		case RESTORE_CACHED_PRICES:
			return action.price
		case RECEIVE_CURRENT_PAGE_PRICE:
			return [...state.filter(obj => obj.country !== action.country), { country: action.country, price: action.price, current: true }]
		case RECEIVE_COUNTRY_PRICE:
			return [...state.filter(obj => obj.country !== action.country), { country: action.country, price: action.price, url: action.url }]
		default:
			return state
	}
}

const rank: Reducer<CountryRanks, Action> = (state = {}, action) => {
	switch (action.type) {
		case RESTORE_CACHED_PRICES:
			return action.rank
		case RECEIVE_COUNTRY_RANK:
			return Object.assign({}, state, { [action.country]: action.rank })
		default:
			return state
	}
}

const options: Reducer<Options, Action> = (state = { showRanks: false, enabledCountries: DEFAULT_ENABLED_COUNTRIES }, action) => {
	switch (action.type) {
		case RECEIVE_OPTIONS:
			return action.items
		default:
			return state
	}
}

const pending: Reducer<number, Action> = (state = 0, action) => {
	switch (action.type) {
		case REQUEST_STARTED:
			return state + 1
		case REQUEST_FINISHED:
			return Math.max(0, state - 1)
		default:
			return state
	}
}

const productID: Reducer<string | null, Action> = (state = null, action) => {
	switch (action.type) {
		case RESTORE_CACHED_PRICES:
		case RECEIVE_CURRENT_PAGE_PRICE:
			return action.productID
		default:
			return state
	}
}

const failed: Reducer<FailedPrices, Action> = (state = { productID: null, outcomes: {} }, action) => {
	switch (action.type) {
		case RESTORE_CACHED_PRICES:
			return { productID: action.productID, outcomes: action.outcomes }
		case RECEIVE_CURRENT_PAGE_PRICE:
			// another product: the list of failed stores starts over
			return state.productID === action.productID ? state : { productID: action.productID, outcomes: {} }
		case COUNTRY_UNAVAILABLE:
			if (state.outcomes[action.country] === action.reason) {
				return state
			}
			return { productID: state.productID, outcomes: { ...state.outcomes, [action.country]: action.reason } }
		default:
			return state
	}
}

/** Shape of the redux store. */
export interface AppState {
	price: CountryPrice[]
	rank: CountryRanks
	options: Options
	/** ASIN of the product being browsed, null outside a product page */
	productID: string | null
	/** number of in-flight requests */
	pending: number
	/** stores that could not be compared, with the reason */
	failed: FailedPrices
}

const initialState: AppState = {
	price: [],
	rank: {},
	options: { showRanks: false, enabledCountries: DEFAULT_ENABLED_COUNTRIES },
	productID: null,
	pending: 0,
	failed: { productID: null, outcomes: {} }
}

// written out instead of combineReducers(): with the redux 5 typings the inferred
// preloaded state of combineReducers() is `Partial<{ ...: never }>`, which does not
// typecheck when passed to createStore(). Like combineReducers(), it returns the
// previous state object when no slice changed, so unrelated actions do not look
// like a state update to react-redux.
const rootReducer: Reducer<AppState, Action> = (state = initialState, action) => {
	const nextPrice = price(state.price, action)
	const nextRank = rank(state.rank, action)
	const nextOptions = options(state.options, action)
	const nextProductID = productID(state.productID, action)
	const nextPending = pending(state.pending, action)
	const nextFailed = failed(state.failed, action)

	if (
		nextPrice === state.price &&
		nextRank === state.rank &&
		nextOptions === state.options &&
		nextProductID === state.productID &&
		nextPending === state.pending &&
		nextFailed === state.failed
	) {
		return state
	}

	return {
		price: nextPrice,
		rank: nextRank,
		options: nextOptions,
		productID: nextProductID,
		pending: nextPending,
		failed: nextFailed
	}
}

export type RootState = AppState

export default rootReducer
