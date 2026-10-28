import { thunk as thunkMiddleware } from 'redux-thunk'
import { createLogger } from 'redux-logger'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { legacy_createStore as createStore, applyMiddleware } from 'redux'
import amazonEUPriceCompareApp from './reducers'
import App from './components/App'

const loggerMiddleware = createLogger()

const store = createStore(
	amazonEUPriceCompareApp,
	applyMiddleware(
		thunkMiddleware,
		loggerMiddleware
	)
)

createRoot(document.getElementById('root')).render(
	<Provider store={store}>
		<App />
	</Provider>
)
