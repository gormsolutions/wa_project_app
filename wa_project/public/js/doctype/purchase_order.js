
frappe.ui.form.on('Purchase Order', {
	refresh(frm) {
		// your code here
        // console.log('Purchase Order refreshing....')
	},
    
	supplier: function(frm){

        var supplier_name = frm.doc.supplier;

        console.log('Goods for supplier: '+supplier_name)

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

	},
    items_add : function(frm) {
        console.log('A row has been added to items table');
    }
    
});


frappe.ui.form.on('Purchase Order Item', {
    custom_profit_margin(frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);
        var margin = row.custom_profit_margin;
        let rate = cint(row.rate);
        var item = row.item_code;
        var item_uom = row.uom;

        var sp = 0;

        // Calculate sales price based on margin if margin is greater than or equal to 0
        if (margin >= 0) {
            sp = ((100 + margin) / 100) * rate;
        }

        frappe.model.set_value(cdt, cdn, "custom_sales_price", flt(sp));
        refresh_field("items");

        var sale_price = row.custom_sales_price;

        // Update the selling price based on the calculated sales price
        set_selling_price(frm, item, item_uom, sale_price);
    },

    custom_sales_price(frm, cdt, cdn) {
        let row = frappe.get_doc(cdt, cdn);
        var sale_price = row.custom_sales_price;
        let rate = cint(row.rate);
        var margin = 0;

        // Calculate profit margin based on custom_sales_price
        if (rate > 0) {
            margin = ((sale_price - rate) / rate) * 100;
        }

        frappe.model.set_value(cdt, cdn, "custom_profit_margin", flt(margin));
        refresh_field("items");

        var item = row.item_code;
        var item_uom = row.uom;

        // Update the selling price based on the sales price
        set_selling_price(frm, item, item_uom, sale_price);
    }
});

// Function to update the selling price
function set_selling_price(frm, item, item_uom, sale_price) {
    // Custom logic to update the selling price
    console.log(`Setting selling price for item: ${item} with UOM: ${item_uom} to ${sale_price}`);
    // You can write your logic to update the selling price here or make an API call if needed.
}


var check_po_quantity = function(frm) {
    // console.log('Update PO Item Qty......')

    cur_frm.doc.items.forEach(item => {
        const rowno = item.idx;
        var stock_qty = item.actual_qty;
        var warehouse = item.warehouse;
        var itemcode = item.item_code;   
        var boq_qty = item.boq_qty
        var item_qty = item.qty;
        var boq = item.boq_no;
        var item_bal = 0;

        if (parseInt(boq_qty) <  parseInt(item_qty) ) {
            // frappe.msgprint("Required Quantity Not Available");
            frappe.msgprint({
                title: __('Warning - Insufficient Stock'),
                indicator: 'red',
                message: __('Required Item Quantity Not Available')
            });

            frappe.validated = false;
        }     
        else {
            item_bal = boq_qty - item_qty;
            
            console.log('Update BOQ '+boq+' Item'+itemcode+' To '+item_bal)
            frappe.call({
                method: "wa_project.services.rest.update_boq_item",
                args: { 
                    "itemcode": itemcode,
                    "boq": boq,    
                    "item_qty": item_bal
                },
            })

        }   
    })
}
