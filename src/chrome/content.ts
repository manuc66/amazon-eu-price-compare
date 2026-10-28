import * as amzUtil from "../util/AmazonUtils"

interface ContentRequest {
	message?: string
}

chrome.runtime.onMessage.addListener(
	function(request: ContentRequest, _sender, sendResponse) {
		if( request.message === "get_current_page_info" ) {
			sendResponse([
				amzUtil.getPriceFromAmazonProductDetailPage(document),
				amzUtil.getRank(document)
			])
		}
	}
)
