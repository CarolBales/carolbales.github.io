(function(){
const { createElement } = wp.element;
const { registerBlockType } = wp.blocks;
const { serverSideRender: ServerSideRender } = wp;
const { InspectorControls } = wp.blockEditor || wp.editor;
const { SelectControl, PanelBody } = wp.components;

registerBlockType( 'content-views/block', {
	title: ContentViewsBlock.texts.title,
	description: ContentViewsBlock.texts.description,
	icon: 'shortcode',
	category: 'widgets',
	keywords: ContentViewsBlock.texts.keywords,
	apiVersion: 3,

	attributes: {
		viewId: {
			type: 'string'
		}
	},
	supports: {
		// Removes support for an HTML mode.
		// html: false,
	},
	edit: function ( props ) {
		const attributes =  props.attributes;

		var elements = [], inspect_elements = [];
		
		var select_view = createElement(
			SelectControl,
			{
				key: 'cvblock_select',
				label: ContentViewsBlock.texts.title,
				value: attributes.viewId,
				onChange: function ( value ) {
					props.setAttributes( { viewId: value } );
				},
				options: ContentViewsBlock.views_list
			}
		);
		
		// Inspect Controls
		inspect_elements.push( select_view );
		
		if ( attributes.viewId ) {
			inspect_elements.push( createElement(
				'a',
				{
					key: 'cvblock_edit',
					href: ContentViewsBlock.edit_link.replace( 'VIEWID', attributes.viewId ),
					target: '_blank'
				},
				ContentViewsBlock.texts.edit
				) );
		}
		
		elements.push( createElement(
			InspectorControls,
			{ key: 'cvblock_controls' },
			createElement(
				PanelBody,
				{
					key: 'cvblock_controls_body'					
				},
				inspect_elements
			)
		) );

		// Editor		
		if ( attributes.viewId ) {
			elements.push( createElement(
				ServerSideRender,
				{
					key: 'cvblock_preview',
					block: 'content-views/block',
					attributes: attributes
				}
			) );
		} else {
			elements.push( select_view );
		}
		
		return createElement(
			'div', { className: 'content-views-block' }, elements
		);
	},
	save: function () {
		return null;
	}
} );
})();