import { applyMiddleware, legacy_createStore as createStore } from 'redux'
import type { Dispatch, Middleware } from 'redux'
import type { ThunkDispatch } from 'redux-thunk'
import type { RootState } from './reducers'
import type { Action } from './actions'
import { thunk as thunkMiddleware } from 'redux-thunk'
import { createLogger } from 'redux-logger'
import rootReducer from './reducers'

const middlewares: Middleware[] = [thunkMiddleware]

// redux-logger is a development tool: the build replaces NODE_ENV, so the whole
// branch disappears from the shipped popup
if (process.env.NODE_ENV !== 'production') {
	middlewares.push(createLogger())
}

export const store = createStore(
	rootReducer,
	applyMiddleware(...middlewares)
)

/** applyMiddleware() is typed loosely here (dev-only middleware), so spell it out. */
export type AppDispatch = ThunkDispatch<RootState, undefined, Action> & Dispatch<Action>
