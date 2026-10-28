import PriceList from '../components/PriceList'
import { connect } from 'react-redux'
import { getCurrentPageUrl, getOptions } from '../actions'
import type { RootState } from '../reducers'
import type { AppDispatch } from '../store'

const mapStateToProps = (state: RootState) => {
	return {
		price: state.price,
		rank: state.rank,
		options: state.options
	}
}

const mapDispatchToProps = (dispatch: AppDispatch) => {
	return {
		getCurrentPageUrl: () => {
			dispatch(getCurrentPageUrl())
		},
		getOptions: () => {
			dispatch(getOptions())
		}
	}
}

const PriceListContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(PriceList)

export default PriceListContainer
