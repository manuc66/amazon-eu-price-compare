export function getProductIDFromAmazonProductPageUrl(url: string): string | null {
	var re = /amazon.*\/([A-Z0-9]{10})(\/|\?|$)/
	var match = re.exec(url)
	if (url.match(re)) {
		return match ? match[1] : null
	}
	else {
		return null
	}
}

export function getCountryFromAmazonProductPageUrl(url: string): string | null {
	var re = /amazon(\.co|\.com)*\.(uk|fr|de|it|es|nl|se|be)/
	var match = re.exec(url)
	if (url.match(re)) {
		return match ? match[2] : null
	}
	else {
		return null
	}
}

export function generateAmazonProductPageUrlForCountry(productID: string, country: string): string {
	var searchUrlPrefix = 'https://www.amazon.'
	var countryDomain = country.toLowerCase();
	if (countryDomain === 'uk') {
		countryDomain = 'co.uk'
	}
	if (countryDomain === 'be') {
		countryDomain = 'com.be'
	}
	var searchUrlSuffix = '/dp/'
	return searchUrlPrefix + countryDomain + searchUrlSuffix + productID + '/'
}

function damnYouEuropeanNumbers(price: string): string {
	// DAMN IT. THIS IS WHY EUROPE SHOULD BE A COUNTRY INSTEAD OF A UNION.
	return price.replace(/[^0-9.,]+/, '').replace(/,/, '').replace(/\./, '')
}

/**
 * Turns a price as displayed by Amazon ("12,34 €", "1.234,56 €", "£1,234.56")
 * into a string parseFloat() understands: "12.34", "1234.56", "1234.56".
 * The last separator is a decimal separator when 1 or 2 digits follow it,
 * every other separator is a thousands separator.
 */
function normalizePrice(text: string): string | null {
	var digitsAndSeparators = text.replace(/[^0-9.,]/g, '')
	if (digitsAndSeparators === '') {
		return null
	}

	var match = /^([0-9.,]*?)[.,]([0-9]{1,2})$/.exec(digitsAndSeparators)
	if (match !== null) {
		var integerPart = match[1].replace(/[.,]/g, '')
		return (integerPart === '' ? '0' : integerPart) + '.' + match[2]
	}

	return digitsAndSeparators.replace(/[.,]/g, '')
}

function getWholePrice(doc: Document): string | null {
	// handle price before the point
	var priceWhole = doc.getElementsByClassName("a-price aok-align-center")
	if (priceWhole.length === 0) {
		return null
	}

	var priceWholeElement = priceWhole[0].querySelector("[aria-hidden='true']")?.getElementsByClassName("a-price-whole")[0]
	if (!(priceWholeElement instanceof HTMLElement)) {
		return null
	}

	return damnYouEuropeanNumbers(priceWholeElement.innerText.replace(/(\r\n|\n|\r)/gm, ""))
}

function getFractionPrice(doc: Document): string | null {
	// handle price after the point
	var priceFraction = doc.getElementsByClassName("a-price aok-align-center")
	if (priceFraction.length === 0) {
		return null
	}

	var priceFractionElement = priceFraction[0].querySelector("[aria-hidden='true']")?.getElementsByClassName("a-price-fraction")[0]
	if (!(priceFractionElement instanceof HTMLElement)) {
		return null
	}

	return damnYouEuropeanNumbers(priceFractionElement.innerText.replace(/(\r\n|\n|\r)/gm, ""))
}

function getOldPrice(price: HTMLCollectionOf<Element>): string | null {
	var priceElement = price[0].querySelector("[aria-hidden='true']")
	if (!(priceElement instanceof HTMLElement)) {
		return null
	}
	return normalizePrice(priceElement.innerText)
}

function getNewPrice(doc: Document): string | null {
	var priceWhole = getWholePrice(doc)
	if (priceWhole === null || priceWhole === '') {
		return null
	}

	var priceFraction = getFractionPrice(doc)
	if (priceFraction === null) {
		return null
	}

	return priceWhole + '.' + priceFraction
}

export function getPriceFromAmazonProductDetailPage(doc: Document): number | null {
	// old version
	var oldPrice = doc.getElementsByClassName("a-price a-text-price a-size-medium apexPriceToPay")
	var price: string | null

	if (oldPrice.length != 0) {
		// old version
		price = getOldPrice(oldPrice)
	} else {
		// new version after Feb 2022 but old version still exists
		// dammit Amazon!
		price = getNewPrice(doc)
	}

	if (price === null) {
		return null
	}

	return parseFloat(price)
}

export function getRank(doc: Document): string | null {
	var salesRankElement = doc.getElementById("SalesRank")
	if (salesRankElement === null) {
		return null
	}
	var rankElement = salesRankElement.getElementsByClassName("value")[0]
	var rankText = ""
	if (rankElement !== undefined) {
		var firstChild = rankElement.childNodes[0]
		if (firstChild === undefined) {
			return null
		}
		rankText = firstChild.textContent ?? ""
	} else {
		var fallbackChild = salesRankElement.childNodes[2]
		if (fallbackChild === undefined) {
			return null
		}
		rankText = fallbackChild.textContent ?? ""
	}
	return rankText.trim().split('(')[0].trim().replace('&amp;', '&')
}
