jQuery(function($) {

    // Force the use of the latest bulk deactivation dialog if there are multiple classes with different versions (e.g. Updraft_Deinstall_Dialog_v1, Updraft_Deinstall_Dialog_v2)
    if (!$('body.updraft-deinstall-dialog-v1').length) return;

    var data = window.updraft_bulk_deinstall_data_v1;

    $(document).on('change', '#updraft-bulk-deinstall-dialog input[name="updraft_remove_data[]"]', function() {
        var any_checked = $('#updraft-bulk-deinstall-dialog input[name="updraft_remove_data[]"]:checked').length > 0;
        $('#updraft-bulk-deinstall-dialog-deactivate-button').text(
            any_checked ? data.deactivate_and_remove_label : data.deactivate_label
        );
    });

    $('#doaction, #doaction2').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (true === $('#updraft-bulk-deinstall-dialog').dialog('isOpen') || true === $('#updraft-bulk-deinstall-dialog').parents('.ui-dialog').is(':visible') || $('#updraft-bulk-deinstall-dialog').length) return;
        var $form = $(this).closest('form');
        var bulk_deactivation_cancelled, button_clicked = false, bulk_deactivation_deferred;

        var plugins_deactivated = $('input[name="checked[]"]:checked', $form)
            .filter(function() {
                return $(this).closest('tr.active').length > 0;
            })
            .map(function () {
                return $(this).val();
            })
            .get();

        var selected_action = '';
        if ($(e.target).is('#doaction2')) {
            selected_action = $('select[name="action2"]', $form).val();
        } else {
            selected_action = $('select[name="action"]', $form).val();
        }

        var target_plugins = plugins_deactivated.filter(function (slug) {
            return window.updraft_bulk_deinstall_plugins_data.some(function (p) {
                return p.slug === slug;
            });
        });

        if (selected_action === 'deactivate-selected' && target_plugins.length > 0) {
            bulk_deactivation_deferred = $.Deferred();

            var plugins = target_plugins
                .map(function(slug) {
                    return window.updraft_bulk_deinstall_plugins_data.find(function(p) {
                        return p.slug === slug;
                    });
                })
                .filter(Boolean);

            var other_count = plugins_deactivated.length - target_plugins.length;
            var total_count = other_count + plugins.length;
            var other_message = "object" === typeof wp.i18n ? wp.i18n.sprintf(data.other_message, other_count) : data.other_message.replace('%d', other_count);

            var names = plugins.map(function(p) { return p.name; });
            var name_list = names.length <= 2 ? names.join(' and ') : names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
            var cancel_label = data.cancel_label;
            if (other_count > 0) {
                cancel_label = "object" === typeof wp.i18n ? wp.i18n.sprintf(data.deactivate_non_teamupdraft_label, other_count) : data.deactivate_non_teamupdraft_label.replace('%d', other_count);
            }

            data.deactivate_and_remove_label = data.deactivate_label =  "object" === typeof wp.i18n ? wp.i18n.sprintf(data.deactivate_label, total_count) : data.deactivate_label.replace('%d', total_count);

            data.intro = "object" === typeof wp.i18n ? wp.i18n.sprintf(data.intro, target_plugins.length) : data.intro.replace('%d', target_plugins.length);

            var dialog_html = wp.template('updraft-bulk-deinstall-dialog-'+data.dialog_version)({
                plugins: plugins,
                intro: data.intro,
                other_count: other_count,
                other_message: other_message,
                label_remove: data.remove_label
            });

            $('<div id="updraft-bulk-deinstall-dialog" />').html(dialog_html).dialog({
                title: data.dialog_title,
                modal: true,
                closeOnEscape: false,
                draggable: false,
                width: 500,
                height: 300,
                min_height: 400,
                max_height: 650,
                classes: {
                    "ui-dialog": "updraft-bulk-dialog-"+data.dialog_version
                },
                dialogClass: "updraft-bulk-dialog-"+data.dialog_version,
                buttons: [
                    {
                        text: data.deactivate_label,
                        id: 'updraft-bulk-deinstall-dialog-deactivate-button',
                        click: function() {
                            var $btn = $('#updraft-bulk-deinstall-dialog-deactivate-button');
                            if ($btn.hasClass('udp-loading')) return;
                            $btn.addClass('udp-loading').html('<span class="udp-spinner" aria-hidden="true"></span>' + $btn.text());
                            button_clicked = true;
                            var $dialog = $('#updraft-bulk-deinstall-dialog');
                            $dialog.dialog('option', 'beforeClose', function() { return false; });
                            var checked_slugs = $('#updraft-deinstall-dialog-bulk-deactivate-form input[name="updraft_remove_data[]"]:checked')
                                .map(function() { return $(this).val(); })
                                .get();

                            var plugin_handlers = [];
                            var checked_handlers = [];

                            target_plugins.forEach(function(slug) {
                                var plugin = window.updraft_bulk_deinstall_plugins_data.find(function(p) {
                                    return p.slug === slug;
                                });
                                if (!plugin) return;
                                plugin_handlers.push(plugin.handler);
                                if (checked_slugs.indexOf(slug) !== -1) {
                                    checked_handlers.push(plugin.handler);
                                }
                            });

                            if (checked_handlers.length > 0) {
                                var form_data = [
                                    { name: '_nonce', value: data.nonce },
                                    { name: 'action', value: 'bulk_deinstall_confirm_'+data.dialog_version },
                                ];
                                checked_handlers.forEach(function(handler) {
                                    form_data.push({ name: 'plugins[]', value: handler });
                                    form_data.push({ name: handler + '_deinstall_option', value: 'yes' });
                                });

                                $.post(ajaxurl, form_data).always(function() {
                                    $dialog.dialog('option', 'beforeClose', null);
                                    $dialog.dialog('close');
                                });
                            } else {
                                setTimeout(function() {
                                    $dialog.dialog('option', 'beforeClose', null);
                                    $dialog.dialog('close');
                                }, 400);
                            }
                        }
                    },
                    {
                        text: cancel_label,
                        id: 'updraft-bulk-deinstall-dialog-cancel-button',
                        click: function() {
                            button_clicked = true;
                            bulk_deactivation_cancelled = true;
                            $(this).dialog('close');
                        }
                    }
                ],
                open: function() {
                    $('.ui-widget-overlay').on('mousedown', function() {
                        $('#updraft-bulk-deinstall-dialog').dialog('close');
                    });
                },
                close: function() {
                    if (bulk_deactivation_deferred) bulk_deactivation_deferred.resolve();
                }
            }).parent().find('.ui-dialog-titlebar-close').hide();

            jQuery.when(bulk_deactivation_deferred).done(function() {
                bulk_deactivation_deferred = undefined;
                if (bulk_deactivation_cancelled) {
                    target_plugins.forEach(function(slug) {
                        $('input[value="' + slug + '"]', $form).prop('checked', false);
                    });
                }
                if ($('input[name="checked[]"]:checked', $form).length && button_clicked && (other_count || target_plugins)) {
                    $form.trigger('submit');
                    // $form[0].submit();
                }
                $('#updraft-bulk-deinstall-dialog').dialog('close').remove();
            });
        }
    });
});
