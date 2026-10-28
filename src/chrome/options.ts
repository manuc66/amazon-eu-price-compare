function save_options() {
	var showRanksElement = document.getElementById('show-ranks')
	if (!(showRanksElement instanceof HTMLInputElement)) {
		return
	}
	var showRanks = showRanksElement.checked
	chrome.storage.sync.set({
		showRanks: showRanks
	}, function() {
		var status = document.getElementById('status')
		if (status !== null) {
			var statusElement = status
			statusElement.textContent = 'Options saved.'
			setTimeout(() => {statusElement.textContent = ''}, 1000)
		}
	})
}

function restore_options() {
	chrome.storage.sync.get({
		showRanks: false
	}, function(items) {
		console.log(items)
		var showRanksElement = document.getElementById('show-ranks')
		if (showRanksElement instanceof HTMLInputElement) {
			showRanksElement.checked = items['showRanks'] === true
		}
	})
}

document.addEventListener('DOMContentLoaded', restore_options)
var saveButton = document.getElementById('save')
if (saveButton !== null) {
	saveButton.addEventListener('click', save_options)
}
