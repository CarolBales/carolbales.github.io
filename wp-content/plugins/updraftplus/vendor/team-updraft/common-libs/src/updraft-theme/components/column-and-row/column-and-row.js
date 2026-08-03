import { TUHTMLElement } from "../../helpers/tu-html-element";

/**
 * TUColumn web-component.
 */
class TUColumn extends TUHTMLElement {
	static observedAttributes = ["width", "grow"];

	/**
	 * Constructor.
	 */
	constructor() {
		super();
	}

	/**
	 * Render function.
	 */
	render() {
		// Initially set the width.
		this.setWidth();
	}

	/**
	 * Set the column width.
	 */
	setWidth() {
		const width = this.getAttribute("width");
		const grow = this.getAttribute("grow");

		const widthCheckRegex = /^\d+(\.\d+)?(px|%|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc)$/;

		if (width && widthCheckRegex.test(width)) {
			this.style.flex = `0 0 ${width}`;
		} else if (grow) {
			this.style.flex = grow;
		}
	}

	/**
	 * Attribute changed callback.
	 *
	 * @param {string} name Name of the attribute.
	 * @param {string} oldValue Old value.
	 * @param {string} newValue New value.
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if (["width", "grow"].includes(name) && oldValue !== newValue) {
			this.setWidth();
		}
	}

	/**
	 * Connected callback.
	 */
	connectedCallback() {
		super.connectedCallback();
	}
}

customElements.define("tu-column", TUColumn);
