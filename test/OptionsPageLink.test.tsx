import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import OptionsPageLink from '../src/components/OptionsPageLink'

describe('OptionsPageLink', () => {
	afterEach(() => {
		vi.useRealTimers()
		vi.unstubAllGlobals()
	})

	async function mount() {
		const openOptionsPage = vi.fn()
		vi.stubGlobal('chrome', { runtime: { openOptionsPage, getURL: (path: string) => path } })

		const container = document.createElement('div')
		document.body.appendChild(container)
		const root = createRoot(container)
		await act(async () => {
			root.render(<OptionsPageLink />)
		})

		return {
			link: container.querySelector('a') as HTMLAnchorElement,
			openOptionsPage,
			unmount: () => {
				act(() => root.unmount())
				container.remove()
			}
		}
	}

	it('opens the options page', async () => {
		const { link, openOptionsPage, unmount } = await mount()
		act(() => {
			link.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})
		expect(openOptionsPage).toHaveBeenCalled()
		unmount()
	})

	it('closes the popup afterwards', async () => {
		vi.useFakeTimers()
		const close = vi.spyOn(window, 'close').mockImplementation(() => {})
		const { link, unmount } = await mount()

		act(() => {
			link.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})
		act(() => {
			vi.runAllTimers()
		})

		expect(close).toHaveBeenCalled()
		unmount()
		close.mockRestore()
	})
})
