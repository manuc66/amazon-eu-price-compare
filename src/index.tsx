import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './components/App'
import { persistPricesWhenIdle } from './cache'

// the popup is torn down when it closes: keep the last comparison so reopening
// it does not fetch every marketplace again
store.subscribe(function () {
	persistPricesWhenIdle(store.getState())
})

const rootElement = document.getElementById('root')
if (!rootElement) {
	throw new Error('Missing #root element')
}

createRoot(rootElement).render(
	<Provider store={store}>
		<App />
	</Provider>
)
