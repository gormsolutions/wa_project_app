// Copyright (c) 2024, Stephen Mutua and contributors
// For license information, please see license.txt

frappe.ui.form.on('Supplier Good', {
	// refresh: function(frm) {

	// }
	
});

frappe.ui.form.on('Supplier Good Item', {
	refresh(frm) {
		// your code here
	},

    item : function(frm, cdt, cdn){
        console.log('Supplier Good Item...')

        var child = locals[cdt][cdn];
        let item = child.item;  
		let item_uom = child.uom;

		//Get Item Price
		frappe.call({
			method: "wa_project.services.rest.get_buying_price",			
			args: {
				"item_code": item,
				"uom": item_uom
			},
			callback: function(r) {
				if (r.message) {
					console.log('Buying rate....'+r.message.buying_price)
					frappe.model.set_value(cdt, cdn, "rate", r.message.buying_price );
					refresh_field("items");  	
				}
			}
		});


		// item_price = frappe.


        // if (boqno){
        //     boq_item = true;
        //     if (child.doctype == 'Material Request Item') {                
        //         frappe.call({
        //             method: "mr_boq.services.rest.check_boq_quantity",
        //             args: { 
        //                 "item_code": item_code,
        //                 "boq": boqno        
        //             },
        //           })
        //           .done((r) => {
        //             let message = r.message;
        //             var boq_qty = message.actual_qty;
                    
        //             console.log('Check BOQ return.. qty: '+boq_qty);
                   
        //         });
        //     }  
        // }	
        // else{
        //     // Check Stock Quantities
        //     console.log('NO BOM::Get Item Quantity..Item: '+item_code);
        //     check_item_quantity(frm)
        // }     
        
    }
});

