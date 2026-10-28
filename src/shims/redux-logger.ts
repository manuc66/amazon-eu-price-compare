import type { Middleware } from 'redux'

/**
 * Production stand-in for redux-logger.
 *
 * The real package is a UMD bundle that references `global`, which makes
 * webpack emit a `new Function('return this')` helper; the Firefox linter flags
 * that as eval. Logging every action in a shipped extension is not useful
 * anyway, so the production build aliases the import to this no-op.
 */
export function createLogger(): Middleware {
	return function () {
		return function (next) {
			return function (action) {
				return next(action)
			}
		}
	}
}
