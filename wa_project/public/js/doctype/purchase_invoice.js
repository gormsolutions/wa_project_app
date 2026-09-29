
frappe.ui.form.on('Purchase Invoice', {
	refresh(frm) {
		// your code here
        console.log('Purchase Invoice refreshing....')
	},
    
	supplier: function(frm){

        var supplier_name = frm.doc.supplier;

        console.log('Check Supplier good for Suppplier: '+supplier_name)

        if (supplier_name) {
        frappe.call({
            method: "wa_project.services.api.supplier_goods",
            args: { supplier: frm.doc.supplier },
            })
            .done((r) => {
            frm.doc.items = [];

            $.each(r.message, function (_i, e) {
                let goods = frm.add_child("items");
                goods.item_code = e.item;
                goods.rate = e.rate;
                goods.uom = e.uom,
                goods.item_name = e.item_name,
                goods.description = e.description,
                goods.qty = 1;
            });
            refresh_field("items");
            })
            .fail((f) => {
            console.log(f);
            });
        }

	}
    
});