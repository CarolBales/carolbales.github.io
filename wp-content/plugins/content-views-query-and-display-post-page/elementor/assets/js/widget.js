( function () {


	document.addEventListener( "click", function ( e ) {
		var widgets = document.querySelectorAll( ".elementor-element--promotion" );
		if ( widgets.length > 0 ) {
			for ( var i = 0; i < widgets.length; i++ ) {
				if ( widgets[i].contains( e.target ) ) {
					var dialog = document.querySelector( "#elementor-element--promotion__dialog" );
					var icon = widgets[i].querySelector( ".icon > i" );
					if ( icon.classList.toString().indexOf( "contentviews" ) >= 0 ) {
						dialog ? dialog.querySelectorAll( ".elementor-button:not(.contentviews-dialog-button)" ).forEach(function(el) { el.style.display = 'none'; }) : null;
						e.stopImmediatePropagation();
						var button = dialog ? dialog.querySelector( ".contentviews-dialog-button" ) : null;
						if ( button === null ) {
							button = document.createElement( "a" );
							button.style.backgroundColor = '#ff5a5f';
							button.setAttribute( "target", "_blank" );
							button.classList.add( "dialog-button", "dialog-action", "elementor-button", "contentviews-dialog-button" );
							button.appendChild( document.createTextNode( "Upgrade Content Views Pro" ) );
							dialog ? dialog.querySelector( ".dialog-buttons-action" ).insertAdjacentHTML( "afterend", button.outerHTML ) : null;
						} else {
							button.style.display = "";
						}
						
						var url = "https://www.contentviewspro.com/pricing", param = '/?utm_source=elementorWidget&utm_medium=proWidget';
						if ( icon.classList[1] ) {
							param += '&utm_campaign=' + encodeURIComponent( icon.classList[1] );
							url = "https://contentviewspro.com/demo/blocks/" + encodeURIComponent( icon.classList[1] ) + param;
						} else {
							url += param;
						}
						button.setAttribute( "href", url );

						// new code set url
						setTimeout( function ( newurl ) {
							const links = document.querySelectorAll( "a[href*='go-pro-contentviews_widget']" );
							links.forEach( link => { link.href = newurl; } );
						}, 500, url );
					} else {
						if (dialog) {
						dialog.querySelector( ".dialog-buttons-action" ).style.display = "";
						if ( dialog.querySelector( ".contentviews-dialog-button" ) !== null ) {
							dialog.querySelector( ".contentviews-dialog-button" ).style.display = "none";
						}
						}
					}
					break;
				}
			}
		}
		// disable Pro select fields
		if ( e.target.matches( '.elementor-control-type-select.contentviews-control-premium select' ) ) {
			document.querySelectorAll( ".elementor-control-type-select.contentviews-control-premium option" ).forEach( opt => {
				opt.disabled = true;
			} );
		}
	} );


} )();