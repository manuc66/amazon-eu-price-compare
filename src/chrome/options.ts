import { DEFAULT_ENABLED_COUNTRIES, MARKETS } from '../markets'

function isChecked(id: string): boolean {
	var element = document.getElementById(id)
	return element instanceof HTMLInputElement && element.checked
}

function setChecked(id: string, checked: boolean): void {
	var element = document.getElementById(id)
	if (element instanceof HTMLInputElement) {
		element.checked = checked
	}
}

/** One checkbox per marketplace, built from the market table. */
function buildMarketCheckboxes(): void {
	var container = document.getElementById('markets')
	if (container === null) {
		return
	}

	for (const market of MARKETS) {
		var label = document.createElement('label')

		var input = document.createElement('input')
		input.type = 'checkbox'
		input.id = 'market-' + market.country
		input.value = market.country
		label.appendChild(input)

		var name = document.createElement('span')
		name.textContent = ' ' + market.country.toUpperCase() + ' '
		label.appendChild(name)

		var domain = document.createElement('span')
		domain.className = 'market-domain'
		domain.textContent = market.domain
		label.appendChild(domain)

		if (market.note !== undefined) {
			var note = document.createElement('span')
			note.className = 'market-note'
			note.textContent = ' (' + market.note + ')'
			label.appendChild(note)
		}

		container.appendChild(label)
	}
}

function selectedCountries(): string[] {
	return MARKETS
		.map((market) => market.country)
		.filter((country) => isChecked('market-' + country))
}

export function saveOptions(): void {
	chrome.storage.sync.set({
		showRanks: isChecked('show-ranks'),
		enabledCountries: selectedCountries()
	}, function() {
		var status = document.getElementById('status')
		if (status !== null) {
			var statusElement = status
			statusElement.textContent = 'Options saved.'
			setTimeout(() => {statusElement.textContent = ''}, 1000)
		}
	})
}

export function restoreOptions(): void {
	chrome.storage.sync.get({
		showRanks: false,
		enabledCountries: DEFAULT_ENABLED_COUNTRIES
	}, function(items) {
		console.log(items)
		setChecked('show-ranks', items['showRanks'] === true)

		var enabled: unknown = items['enabledCountries']
		var countries = Array.isArray(enabled) ? enabled : DEFAULT_ENABLED_COUNTRIES
		for (const market of MARKETS) {
			setChecked('market-' + market.country, countries.includes(market.country))
		}
	})
}

document.addEventListener('DOMContentLoaded', function() {
	buildMarketCheckboxes()
	restoreOptions()
})
var saveButton = document.getElementById('save')
if (saveButton !== null) {
	saveButton.addEventListener('click', saveOptions)
}
