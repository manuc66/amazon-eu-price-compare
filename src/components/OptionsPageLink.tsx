import { Component } from 'react'

export default class OptionsPageLink extends Component {
	constructor(props: Record<string, never>) {
		super(props)
		this.handleClick = this.handleClick.bind(this)
	}

	handleClick() {
		if (typeof chrome.runtime.openOptionsPage === 'function') {
			chrome.runtime.openOptionsPage()
		} else {
			window.open(chrome.runtime.getURL('options.html'))
		}
		// the options tab is open, the popup has no reason to stay
		setTimeout(function () {
			window.close()
		}, 0)
	}

	render() {
		return (
			<div className="optionslink">
				<a id="go-to-options" onClick={this.handleClick}>Go to Options</a>
			</div>
		)
	}
}
