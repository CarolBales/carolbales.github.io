! function() {
    const {
        createElement: s
    } = wp.element, {
        registerBlockType: e
    } = wp.blocks;
    var {
        serverSideRender: c
    } = wp, {
        InspectorControls: l
    } = wp.blockEditor || wp.editor, {
        SelectControl: r,
        PanelBody: w
    } = wp.components;
    e("content-views/block", {
        title: ContentViewsBlock.texts.title,
        description: ContentViewsBlock.texts.description,
        icon: "shortcode",
        category: "widgets",
        keywords: ContentViewsBlock.texts.keywords,

        supports: {},
        edit: function(t) {
            var e = t.attributes,
                o = [],
                n = [],
                i = s(r, {
                    key: "cvblock_select",
                    label: ContentViewsBlock.texts.title,
                    value: e.viewId,
                    onChange: function(e) {
                        t.setAttributes({
                            viewId: e
                        })
                    },
                    options: ContentViewsBlock.views_list
                });
                console.log(e);
            return n.push(i), e.viewId && n.push(s("a", {
                key: "cvblock_edit",
                href: ContentViewsBlock.edit_link.replace("VIEWID", e.viewId),
                target: "_blank"
            }, ContentViewsBlock.texts.edit)), o.push(s(l, {
                key: "cvblock_controls"
            }, s(w, {
                key: "cvblock_controls_body"
            }, n))), e.viewId ? o.push(s(c, {
                key: "cvblock_preview",
                block: "content-views/block",
                attributes: e
            })) : o.push(i), s("div", {
                className: "content-views-block"
            }, o)
        },
        save: function() {
            return null
        }
    })
}();