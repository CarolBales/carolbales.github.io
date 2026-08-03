( function ( $ ) {
	$( document ).on( 'contentviews_creatable_init', function ( event, obj ) {
		var ID = '#elementor-control-default-' + obj.data._cid;
		setTimeout( function () {
			var IDSelect2 = $( ID ).select2( {
				minimumInputLength: 2,
				allowClear: true,
				placeholder: '', /* require for allowClear */
				ajax: {
					type: 'POST',
					url: contentviews_creatable_localize.ajaxurl,
					dataType: 'json',
					data: function ( params ) {
						return {
							action: 'contentviews_elementor_search_post',
							post_type: get_post_type(),
							term: params.term,
							secure_nonce: contentviews_creatable_localize.el_nonce
						}
					},
				},
				initSelection: function ( element, callback ) {
					if ( !obj.multiple ) {
						callback( { id: '', text: '' } );
					} else {
						callback( { id: '', text: '' } );
					}
					var ids = [ ];
					if ( !Array.isArray( obj.currentID ) && obj.currentID != '' ) {
						ids = [ obj.currentID ];
					} else if ( Array.isArray( obj.currentID ) ) {
						ids = obj.currentID.filter( function ( el ) {
							return el != null;
						} )
					}

					if ( ids.length > 0 ) {
						var label = $( "label[for='elementor-control-default-" + obj.data._cid + "']" );
						label.after( '<span class="elementor-control-spinner">&nbsp;<i class="eicon-spinner eicon-animation-spin"></i>&nbsp;</span>' );
						$.ajax( {
							method: "POST",
							url: contentviews_creatable_localize.ajaxurl,
							data: {
								action: 'contentviews_elementor_get_title',
								post_type: get_post_type(),
								secure_nonce: contentviews_creatable_localize.el_nonce,
								id: ids
							}
						} ).done( function ( response ) {
							if ( response.success && typeof response.data.results != 'undefined' ) {
								let cvSelect2Options = '';
								ids.forEach( function ( item, index ) {
									if ( typeof response.data.results[item] != 'undefined' ) {
										const key = item;
										const value = response.data.results[item];
										cvSelect2Options += `<option selected="selected" value="${key}">${value}</option>`;
									}
								} )

								element.append( cvSelect2Options );
							}
							label.siblings( '.elementor-control-spinner' ).remove();
						} );
					}
				}
			} );

			//Manual Sorting : Select2 drag and drop : starts			
			setTimeout( function () {
				IDSelect2.next().children().children().children().sortable( {
					containment: 'parent',
					stop: function ( event, ui ) {
						ui.item.parent().children( '[title]' ).each( function () {
							var title = $( this ).attr( 'title' );
							var original = $( 'option:contains(' + title + ')', IDSelect2 ).first();
							original.detach();
							IDSelect2.append( original )
						} );
						IDSelect2.change();
					}
				} );

				$( ID ).on( "select2:select", function ( evt ) {
					var element = evt.params.data.element;
					var $element = $( element );

					$element.detach();
					$( this ).append( $element );
					$( this ).trigger( "change" );
				} );
			}, 200 );
			//Manual Sorting : Select2 drag and drop : ends

		}, 100 );

	} );


	var get_post_type = function () {
		var pType = $( '#elementor-controls .elementor-control-postType select' ).val();
		if ( pType === 'any' ) {
			var multi_type = $( '#elementor-controls .elementor-control-multipostType select' ).val();
			if ( Array.isArray( multi_type ) && multi_type.length ) {
				pType = multi_type.join( ',' );
			}
		}
		return pType;
	};
}( jQuery ) );