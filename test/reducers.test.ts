import { describe, expect, it } from 'vitest'
import rootReducer from '../src/reducers'
import {
	RECEIVE_COUNTRY_PRICE,
	RECEIVE_COUNTRY_RANK,
	RECEIVE_CURRENT_PAGE_PRICE,
	RECEIVE_OPTIONS
} from '../src/actions'
import type { Action } from '../src/actions'

const UNKNOWN_ACTION = { type: '@@unknown' } as unknown as Action

describe('rootReducer', () => {
	it('starts empty, with ranks hidden', () => {
		expect(rootReducer(undefined, UNKNOWN_ACTION)).toEqual({
			price: [],
			rank: {},
			options: { showRanks: false, showUsMarket: false }
		})
	})

	it('marks the price of the current page', () => {
		const state = rootReducer(undefined, {
			type: RECEIVE_CURRENT_PAGE_PRICE,
			country: 'de',
			price: 42.5
		})
		expect(state.price).toEqual([{ country: 'de', price: 42.5, current: true }])
	})

	it('replaces the previous price of the same store instead of duplicating it', () => {
		let state = rootReducer(undefined, { type: RECEIVE_CURRENT_PAGE_PRICE, country: 'de', price: 42.5 })
		state = rootReducer(state, { type: RECEIVE_COUNTRY_PRICE, country: 'de', price: 40, url: 'https://www.amazon.de/dp/B08N5WRWNW/' })
		expect(state.price).toHaveLength(1)
		expect(state.price[0]).toEqual({ country: 'de', price: 40, url: 'https://www.amazon.de/dp/B08N5WRWNW/' })
	})

	it('accumulates one price per store', () => {
		let state = rootReducer(undefined, { type: RECEIVE_CURRENT_PAGE_PRICE, country: 'de', price: 42.5 })
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
		const state = rootReducer(undefined, { type: RECEIVE_OPTIONS, items: { showRanks: true, showUsMarket: true } })
		expect(state.options).toEqual({ showRanks: true, showUsMarket: true })
	})

	it('returns the same state object for an unknown action', () => {
		const state = rootReducer(undefined, UNKNOWN_ACTION)
		expect(rootReducer(state, UNKNOWN_ACTION)).toBe(state)
	})
})
