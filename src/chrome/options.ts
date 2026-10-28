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

export function saveOptions(): void {
	chrome.storage.sync.set({
		showRanks: isChecked('show-ranks'),
		showUsMarket: isChecked('show-us-market')
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
		showUsMarket: false
	}, function(items) {
		console.log(items)
		setChecked('show-ranks', items['showRanks'] === true)
		setChecked('show-us-market', items['showUsMarket'] === true)
	})
}

document.addEventListener('DOMContentLoaded', restoreOptions)
var saveButton = document.getElementById('save')
if (saveButton !== null) {
	saveButton.addEventListener('click', saveOptions)
}
