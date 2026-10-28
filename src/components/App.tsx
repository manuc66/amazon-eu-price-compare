import { Component } from 'react'
import PriceListContainer from '../containers/PriceListContainer'
import OptionsPageLink from './OptionsPageLink'

export default class App extends Component {
	render() {
		return (
			<div>
			<PriceListContainer />
			<OptionsPageLink />
			</div>
		)
	}
}
