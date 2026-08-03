jQuery(function($) {
	window.updraft_deinstall_jqueryui_v1 = window.updraft_deinstall_jqueryui_v1 || function(e, plugin) {
		e.preventDefault();

		var data = window['updraft_deinstall_data_' + plugin];

		if ($('#'+plugin+'-deinstall-dialog').length) {
			$('#'+plugin+'-deinstall-dialog').dialog("open");
		} else {
			// Instantiate a new dialog object with the specified title and buttons
			var dialog_params = {
				title: data.dialog_title,
				modal: true,
				draggable: false,
				buttons: [
					{
						text: data.deactivate_label,
						id: plugin+'-deinstall-dialog-deactivate-button',
						click: function() {
							var $form = $('#' + plugin + '-deactivate-form');
							var form_data = $form.serializeArray();
							form_data.push(
								{
									name: '_nonce',
									value: data.nonce
								},
								{
									name: 'action',
									value: plugin + '_deinstall_confirm'
								}
							);

							$.post(ajaxurl, form_data).always(function() {
								window.location.href = e.target.href;
							});

							$(this).dialog('close');
						}
					},
					{
						text: data.cancel_label,
						id: plugin+'-deinstall-dialog-cancel-button',
						click: function() {
							$(this).dialog('close');
						}
					}
				]
			};

			if (data.custom_css) {
				dialog_params['classes'] = {};
				dialog_params.classes["ui-dialog"] = plugin + "-ui-deinstall-dialog";// in jQuery UI versions prior to 1.14, the "ui-dialog" class or the "classes" property is unavailable
				dialog_params.dialogClass = plugin + "-ui-deinstall-dialog";// deprecated in jQuery UI version 1.12 and removed in version 1.14
			}

			$('<div id="'+plugin+'-deinstall-dialog" />').html(data.dialog_html).dialog(dialog_params);
		}
	};
});
