import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './components/App'

const rootElement = document.getElementById('root')
if (!rootElement) {
	throw new Error('Missing #root element')
}

createRoot(rootElement).render(
	<Provider store={store}>
		<App />
	</Provider>
)
