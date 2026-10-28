import type { Reducer } from 'redux'
import {
	RECEIVE_CURRENT_PAGE_PRICE,
	RECEIVE_COUNTRY_PRICE,
	RECEIVE_COUNTRY_RANK,
	RECEIVE_OPTIONS
} from '../actions'
import type { Action } from '../actions'
import type { CountryPrice, CountryRanks, Options } from '../types'

const price: Reducer<CountryPrice[], Action> = (state = [], action) => {
	switch (action.type) {
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
		case RECEIVE_COUNTRY_RANK:
			return Object.assign({}, state, { [action.country]: action.rank })
		default:
			return state
	}
}

const options: Reducer<Options, Action> = (state = { showRanks: false, showUsMarket: false }, action) => {
	switch (action.type) {
		case RECEIVE_OPTIONS:
			return action.items
		default:
			return state
	}
}

/** Shape of the redux store. */
export interface AppState {
	price: CountryPrice[]
	rank: CountryRanks
	options: Options
}

const initialState: AppState = {
	price: [],
	rank: {},
	options: { showRanks: false, showUsMarket: false }
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

	if (nextPrice === state.price && nextRank === state.rank && nextOptions === state.options) {
		return state
	}

	return {
		price: nextPrice,
		rank: nextRank,
		options: nextOptions
	}
}

export type RootState = AppState

export default rootReducer
