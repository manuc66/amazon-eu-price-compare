// jsdom does not implement innerText. The price spans have no hidden children,
// so aliasing it to textContent is equivalent for this markup.
if (!('innerText' in HTMLElement.prototype)) {
	Object.defineProperty(HTMLElement.prototype, 'innerText', {
		configurable: true,
		get() {
			return this.textContent
		},
		set(value: string) {
			this.textContent = value
		}
	})
}
