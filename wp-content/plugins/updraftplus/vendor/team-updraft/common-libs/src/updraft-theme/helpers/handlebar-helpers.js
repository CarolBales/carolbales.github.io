/**
 * A Handlebarsjs helper function that is used to compare
 * two values if they are equal. Please refer to the example below.
 * Assuming "comment_status" contains the value of "spam".
 *
 * @param {mixed} a The first value to compare
 * @param {mixed} b The second value to compare
 *
 * @example
 * // returns "<span>I am spam!</span>", otherwise "<span>I am not a spam!</span>"
 * {{#ifeq "spam" comment_status}}
 *      <span>I am spam!</span>
 * {{else}}
 *      <span>I am not a spam!</span>
 * {{/ifeq}}
 *
 * @return {string}
*/
Handlebars.registerHelper('ifeq', function (a, b, opts) {
	if ('string' !== typeof a && 'undefined' !== typeof a && null !== a) a = a.toString();
	if ('string' !== typeof b && 'undefined' !== typeof b && null !== b) b = b.toString();
	if (a === b) {
		return opts.fn(this);
	} else {
		return opts.inverse(this);
	}
});

/**
 * A Handlebarsjs helper function that is used to compare
 * two values if they are not equal. Please refer to the example below.
 * Assuming "user_id" contains the value of "123".
 *
 * @param {mixed} a The first value to compare
 * @param {mixed} b The second value to compare
 *
 * @example returns "<span>Valid user!</span>", otherwise "<span>Invalid user!</span>" {{#ifneq user_id 0}} <span>Valid user!</span> {{else}} <span>Invalid user!</span> {{/ifneq}}
 *
 * @return {string}
 */
Handlebars.registerHelper('ifneq', function (a, b, opts) {
	if (typeof a !== 'string') a = a.toString();
	if (typeof b !== 'string') b = b.toString();
	if (a !== b) {
		return opts.fn(this);
	} else {
		return opts.inverse(this);
	}
});
