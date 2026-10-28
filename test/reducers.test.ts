import { describe, expect, it } from 'vitest'
import rootReducer from '../src/reducers'
import {
	REQUEST_FINISHED,
	REQUEST_STARTED,
	RECEIVE_COUNTRY_PRICE,
	RECEIVE_COUNTRY_RANK,
	RECEIVE_CURRENT_PAGE_PRICE,
	RECEIVE_OPTIONS
} from '../src/actions'
import type { Action } from '../src/actions'
import { DEFAULT_ENABLED_COUNTRIES } from '../src/markets'

const UNKNOWN_ACTION = { type: '@@unknown' } as unknown as Action

describe('rootReducer', () => {
	it('starts empty, with ranks hidden', () => {
		expect(rootReducer(undefined, UNKNOWN_ACTION)).toEqual({
			price: [],
			rank: {},
			options: { showRanks: false, enabledCountries: DEFAULT_ENABLED_COUNTRIES },
			productID: null,
			pending: 0
		})
	})

	it('marks the price of the current page', () => {
		const state = rootReducer(undefined, {
			type: RECEIVE_CURRENT_PAGE_PRICE,
			country: 'de',
			price: 42.5,
			productID: 'B08N5WRWNW'
		})
		expect(state.price).toEqual([{ country: 'de', price: 42.5, current: true }])
		expect(state.productID).toBe('B08N5WRWNW')
	})

	it('replaces the previous price of the same store instead of duplicating it', () => {
		let state = rootReducer(undefined, { type: RECEIVE_CURRENT_PAGE_PRICE, country: 'de', price: 42.5, productID: 'B08N5WRWNW' })
		state = rootReducer(state, { type: RECEIVE_COUNTRY_PRICE, country: 'de', price: 40, url: 'https://www.amazon.de/dp/B08N5WRWNW/' })
		expect(state.price).toHaveLength(1)
		expect(state.price[0]).toEqual({ country: 'de', price: 40, url: 'https://www.amazon.de/dp/B08N5WRWNW/' })
	})

	it('accumulates one price per store', () => {
		let state = rootReducer(undefined, { type: RECEIVE_CURRENT_PAGE_PRICE, country: 'de', price: 42.5, productID: 'B08N5WRWNW' })
		state = rootReducer(state, { type: RECEIVE_COUNTRY_PRICE, country: 'fr', price: 39, url: 'https://www.amazon.fr/dp/B08N5WRWNW/' })
		state = rootReducer(state, { type: RECEIVE_COUNTRY_PRICE, country: 'pl', price: 180, url: 'https://www.amazon.pl/dp/B08N5WRWNW/' })
		expect(state.price.map((p) => p.country).sort()).toEqual(['de', 'fr', 'pl'])
	})

	it('stores the rank per country', () => {
		let state = rootReducer(undefined, { type: RECEIVE_COUNTRY_RANK, country: 'de', rank: '#1 in Electronics' })
		state = rootReducer(state, { type: RECEIVE_COUNTRY_RANK, country: 'fr', rank: null })
		expect(state.rank).toEqual({ de: '#1 in Electronics', fr: null })
	})

	it('replaces the options', () => {
		const state = rootReducer(undefined, { type: RECEIVE_OPTIONS, items: { showRanks: true, enabledCountries: ['de'] } })
		expect(state.options).toEqual({ showRanks: true, enabledCountries: ['de'] })
	})

	it('counts the in-flight requests', () => {
		let state = rootReducer(undefined, { type: REQUEST_STARTED })
		state = rootReducer(state, { type: REQUEST_STARTED })
		expect(state.pending).toBe(2)

		state = rootReducer(state, { type: REQUEST_FINISHED })
		expect(state.pending).toBe(1)
	})

	it('never counts below zero', () => {
		const state = rootReducer(undefined, { type: REQUEST_FINISHED })
		expect(state.pending).toBe(0)
	})

	it('returns the same state object for an unknown action', () => {
		const state = rootReducer(undefined, UNKNOWN_ACTION)
		expect(rootReducer(state, UNKNOWN_ACTION)).toBe(state)
	})
})
