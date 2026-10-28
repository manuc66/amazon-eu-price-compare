import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MessageListener = (request: { message?: string }, sender: unknown, sendResponse: (response?: unknown) => void) => void

const PRICE_AND_RANK = `
	<div class="a-price aok-align-center">
		<span aria-hidden="true">
			<span class="a-price-whole">12</span>
			<span class="a-price-fraction">34</span>
		</span>
	</div>
	<div id="SalesRank"><span class="value">#1,234 in Electronics (<a href="#">See Top 100</a>)</span></div>`

async function loadContentScript(): Promise<MessageListener> {
	let listener: MessageListener | undefined
	vi.stubGlobal('chrome', {
		runtime: {
			onMessage: {
				addListener: (fn: MessageListener) => {
					listener = fn
				}
			}
		}
	})
	await import('../src/chrome/content')
	if (!listener) {
		throw new Error('the content script did not register a message listener')
	}
	return listener
}

describe('content script', () => {
	beforeEach(() => {
		vi.resetModules()
		document.body.innerHTML = ''
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('answers get_current_page_info with the price and the rank', async () => {
		document.body.innerHTML = PRICE_AND_RANK
		const listener = await loadContentScript()

		let response: unknown
		listener({ message: 'get_current_page_info' }, {}, (r) => {
			response = r
		})

		expect(response).toEqual([12.34, '#1,234 in Electronics'])
	})

	it('answers with nulls on a page without price', async () => {
		document.body.innerHTML = '<p>nothing to parse</p>'
		const listener = await loadContentScript()

		let response: unknown
		listener({ message: 'get_current_page_info' }, {}, (r) => {
			response = r
		})

		expect(response).toEqual([null, null])
	})

	it('ignores unrelated messages', async () => {
		const listener = await loadContentScript()
		const sendResponse = vi.fn()

		listener({ message: 'something_else' }, {}, sendResponse)

		expect(sendResponse).not.toHaveBeenCalled()
	})
})
