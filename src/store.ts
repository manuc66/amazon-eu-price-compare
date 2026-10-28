import { applyMiddleware, legacy_createStore as createStore } from 'redux'
import { thunk as thunkMiddleware } from 'redux-thunk'
import { createLogger } from 'redux-logger'
import rootReducer from './reducers'

const loggerMiddleware = createLogger()

export const store = createStore(
	rootReducer,
	applyMiddleware(
		thunkMiddleware,
		loggerMiddleware
	)
)

export type AppDispatch = typeof store.dispatch
