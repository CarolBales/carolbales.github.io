import { tu_theme_get_template } from "../../helpers/tu-get-template";
import { TUHTMLElement } from "../../helpers/tu-html-element";

/**
 * TUButton web-component.
 */
class TUButton extends TUHTMLElement {
	static observedAttributes = ["disabled", "icon-left", "icon-right", "type", "theme", "size"];
	typeAndThemeCompatibility = {
		'cta': ['primary', 'error', 'info', 'success', 'premium'],
		'secondary': ['primary', 'error', 'info', 'success', 'premium'],
		'tertiary': ['primary', 'error', 'info', 'success', 'white', 'grey'],
		'icon': ['primary', 'error', 'info', 'success', 'warning', 'white'],
		'icon-basic': [],
	}

	/**
	 * Constructor.
	 */
	constructor() {
		super();
	}

	/**
	 * Attribute changed callback.
	 *
	 * @param {string} name Name of the attribute.
	 * @param {string} oldValue Old value.
	 * @param {string} newValue New value.
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		const innerButton = this.querySelector('button');

		if (innerButton) {
			innerButton.setAttribute(name, newValue);
		}
	}

	render() {
		const attributes = {
			innerContent: this.innerText.trim(),
			iconLeft: this.getAttribute("icon-left"),
			iconRight: this.getAttribute("icon-right"),
		};

		const buttonType = this.getAttribute("type");
		const buttonTheme = this.getAttribute("theme");

		// If the type of the button is not compatible with them then return early.
		if (buttonType && buttonTheme && this.typeAndThemeCompatibility[buttonType] && !this.typeAndThemeCompatibility[buttonType].includes(buttonTheme)) {
			console.error(`"${buttonType}" type button is not compatible with "${buttonTheme}" theme.`);
			return;
		}

		this.innerHTML = tu_theme_get_template(
			"button-templates-template",
			attributes
		);

		// Propagate all the attributes from this element to the inner button element.
		const innerButton = this.querySelector("button");

		if (innerButton) {
			for (const attr of this.attributes) {
				innerButton.setAttribute(attr.name, attr.value);
			}
		}
	}

	/**
	 * Connected callback.
	 */
	connectedCallback() {
		super.connectedCallback();
	}
}

customElements.define("tu-button", TUButton);
