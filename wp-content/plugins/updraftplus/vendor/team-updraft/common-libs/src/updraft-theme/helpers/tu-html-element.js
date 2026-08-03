export class TUHTMLElement extends HTMLElement {
	tuRenderObserver = new MutationObserver(() => {
		this.tuRenderObserver.disconnect();

		// If the component has render function then render it.
		if (this.render) {
			this.render();
		}
	});

	/**
	 * Disconnected callback.
	 */
	disconnectedCallback() {
		if (super.disconnectedCallback) {
			super.disconnectedCallback();
		}

		this.tuRenderObserver.disconnect();
	}

	/**
	 * Connected callback.
	 */
	connectedCallback() {
		if (super.connectedCallback) {
			super.connectedCallback();
		}

		// Try to render the component.
		if (this.render) {
			this.render();
		}

		// If no child nodes present, then observe for changes in the child nodes and run the renderer when they are rendered.
		if (!this.hasChildNodes()) {
			this.tuRenderObserver.observe(this, { subtree: true, childList: true, characterData: true });
		}
	}
}
