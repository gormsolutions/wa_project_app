frappe.ui.form.on('Material Request', {
	refresh(frm) {
		// your code here
        frm.events.make_custom_button(frm);
	},
	validate(frm){
        //Check Stock before Save
        check_boq_quantity_status(frm);
	},
    on_submit: function(frm) {	
        update_boq_quantity(frm);
	},
    material_request_type: function(frm) {
        frm.events.make_custom_button(frm);
    },
    custom_bill_of_quantity: function(frm){
        var boq = frm.doc.custom_bill_of_quantity;

        console.log('Custom BOQ...'+boq)

        if (boq) {
        frappe.call({
            method: "wa_project.services.rest.get_boq_item",
            args: { mt_boq: boq },
            })
            .done((r) => {
            frm.doc.items = [];

            $.each(r.message, function (_i, e) {
                let item = frm.add_child("items");
                item.item_code = e.item_code;
                item.item_name = e.item_name,
                item.rate = e.rate;
                item.uom = e.uom,       
                item.stock_uom = e.stock_uom,          
                item.description = e.description,
                item.qty = e.quantity;
                item.boq_no = frm.doc.custom_bill_of_quantity;
                item.custom_boq_qty = e.actual_qty;
                item.custom_subtask = e.subtask
            });
            refresh_field("items");
            })
            .fail((f) => {
            console.log(f);
            });
        }

	},
    custom_subtask: function(frm){
        let sub_task = frm.doc.custom_subtask;
        let boq = frm.doc.custom_bill_of_quantity;

        console.log('Doing Subtask Items...')

        if (sub_task) {
            get_subtask_item(frm, sub_task, boq)
        }
        else {
            get_boq_items(frm);
        }
    },    

    make_custom_button: function(frm) {
        var request_type = frm.doc.material_request_type;
        if (frm.doc.docstatus==0) {
            if (request_type == "Material Transfer" || request_type == "Material Issue" || request_type == "Purchase") {
			frm.add_custom_button(__("Bill of Quantity"),
				() => frm.events.get_items_from_boq(frm)
                );
            }
            else{
                setTimeout(() => {
                    frm.remove_custom_button("Bill Of Quantity")
                }, 100);
            }
		}
	},
    get_items_from_boq: function(frm) {
		var d = new frappe.ui.Dialog({
			title: __("Get Bill of Quantity Items"),
			fields: [
				{"fieldname":"boq", "fieldtype":"Link", "label":__("Bill of Quantity"),
					options:"Bill of Quantity", reqd: 1, get_query: function() {
						return {filters: { docstatus:1 }};
					}},
				{"fieldname":"warehouse", "fieldtype":"Link", "label":__("For Warehouse"),
					options:"Warehouse", reqd: 1}
			],
			primary_action_label: 'Get Items',
			primary_action(values) {

				if(!values) return;
				values["company"] = frm.doc.company;
				if(!frm.doc.company) frappe.throw(__("Company field is required"));

                if(values["boq"]){
                    frm.set_value("custom_bill_of_quantity", values["boq"]);
                    d.hide();
                    refresh_field("items");
                }
			}
		});

		d.show();
	},

    before_workflow_action: (frm) => {
        if (
            frm.doc.workflow_state === "Awaiting Managing Director's Approval" && 
            frm.selected_workflow_action === "Approve" &&
            frm.doc.docstatus == 0
        ) {
            frappe.msgprint({
                title: __('Approved - Material Request'),
                indicator: 'green',
                message: __('Update material request BOQ')
            });
            update_boq_quantity(frm);
            // frappe.validated = false;
        }
    },

});

frappe.ui.form.on('Material Request Item', {
	refresh(frm) {
		// your code here
	},
    item_code : function(frm, cdt, cdn){
        let row = locals[cdt][cdn];     
         let item_code = row.item_code;   
         let warehouse = row.warehouse;   
    },
    qty : function(frm, cdt, cdn){

        console.log('Field qty...')

        var child = locals[cdt][cdn];
        let item_code = child.item_code;  
        let boqno = child.boq_no;  
        var item_qty = child.qty;
        var boq_item = false;

        console.log('Field qty boqno...'+boqno)

        if (boqno){
            boq_item = true;
            if (child.doctype == 'Material Request Item') {                
                frappe.call({
                    method: "wa_project.services.rest.check_boq_quantity",
                    args: { 
                        "item_code": item_code,
                        "boq": boqno        
                    },
                  })
                  .done((r) => {
                    let message = r.message;
                    var boq_qty = message.actual_qty;
                   
                    if (item_qty > boq_qty) {    
                        frappe.msgprint({
                            title: __('Warning - Quantity Not Approved/Available'),
                            indicator: 'red',
                            message: __('Requested Quantity Exceeds Bill of Quantity')
                        });
        
                        frappe.validated = false;
                    }      
                    else {
                        var boq_bal = boq_qty - item_qty;
                    }
            
                });
            }  
        }	
        else{
            // Check Stock Quantities
            check_item_quantity(frm)
        }     
        
    }
})


// let check_item_quantity = function(frm, item_code, bom) {
    let check_item_quantity = function(frm) {

        cur_frm.doc.items.forEach(item => {
            const rowno = item.idx;
            var stock_qty = item.actual_qty;
            var required_qty = item.qty;
            var warehouse = item.warehouse;
            let itemcode = item.item_code;   

            if (parseInt(stock_qty) <  parseInt(required_qty) ) {
                // frappe.msgprint("Required Quantity Not Available");
                frappe.msgprint({
                    title: __('Warning - Insufficient Stock'),
                    indicator: 'red',
                    message: __('Required Item Quantity Not Available')
                });

                frappe.validated = false;
            }        
        })
    }

    var check_boq_quantity_status = function(frm) {
        var boq = frm.doc.custom_bill_of_quantity;
    
        cur_frm.doc.items.forEach(item => {
            const rowno = item.idx;
            var stock_qty = item.actual_qty;
            var warehouse = item.warehouse;
            var itemcode = item.item_code;   
            var boq_qty = item.custom_boq_qty;
            var item_qty = item.qty;
            var boq = item.boq_no;
            var item_bal = 0;

            if (parseInt(boq_qty) <  parseInt(item_qty) ) {
                frappe.msgprint({
                    title: __('Warning - Insufficient Stock'),
                    indicator: 'red',
                    message: __(itemcode+' - Requested Quantity Not Available in BOQ')
                });
    
                frappe.validated = false;
            }     
           
        })
    }

    var update_boq_quantity = function(frm) {

        let boqs = frm.doc.custom_bill_of_quantity;

        console.log('Update boq..'+boqs)

        cur_frm.doc.items.forEach(item => {
            const rowno = item.idx;
            var stock_qty = item.actual_qty;
            var warehouse = item.warehouse;
            var itemcode = item.item_code;   
            var boq_qty = item.custom_boq_qty;
            var item_qty = item.qty;
            var boq = boqs;
            var item_bal = 0;
            let sub_task = item.custom_subtask;

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
                
                frappe.call({
                    method: "wa_project.services.rest.update_boq_item",
                    args: { 
                        "itemcode": itemcode,
                        "boq": boq,    
                        "item_qty": item_bal,
                        "subtask": sub_task
                    },
                })
            }   
        })
    }


    frappe.ui.form.on('Material Request Item', {
        item_code: function(frm,dt,dn){
            let row = frappe.get_doc(dt, dn);
        }
    });

    function set_subtask_filter(frm, sub_task) {     
        let table = frm.doc.items;
        for (var i = 0; i < table.length; i++) {
            let is_complete = table[i].subtask;
            if (is_complete === sub_task) {
                $("[data-name='" + table[i].name + "']").show();
            } else {
                $("[data-name='" + table[i].name + "']").hide();
            }
        }            
    }

    function get_boq_items(frm) {
        var boq = frm.doc.custom_bill_of_quantity;

        console.log('BOQ...'+boq)

        if (boq) {
        frappe.call({
            method: "wa_project.services.rest.get_boq_item",
            args: { mt_boq: boq },
            })
            .done((r) => {
            frm.doc.items = [];

            $.each(r.message, function (_i, e) {
                let item = frm.add_child("items");
                item.item_code = e.item_code;
                item.item_name = e.item_name,
                item.rate = e.rate;
                item.uom = e.uom,       
                item.stock_uom = e.stock_uom,          
                item.description = e.description,
                item.qty = e.quantity;
                item.boq_no = frm.doc.custom_bill_of_quantity;
                item.custom_boq_qty = e.actual_qty;
                item.custom_subtask = e.subtask
            });
            refresh_field("items");
            })
            .fail((f) => {
            console.log(f);
            });
        }
    }

    function get_subtask_item(frm, sub_task, boq) {   
        if (boq) {
        frappe.call({
            method: "wa_project.services.rest.get_subtask_item",
            args: { boq: boq,
                    subtask: sub_task 
                 },
            })
            .done((r) => {
            frm.doc.items = [];

            $.each(r.message, function (_i, e) {
                let item = frm.add_child("items");
                item.item_code = e.item_code;
                item.item_name = e.item_name,
                item.rate = e.rate;
                item.uom = e.uom,       
                item.stock_uom = e.stock_uom,          
                item.description = e.description,
                item.qty = e.quantity;
                item.boq_no = frm.doc.custom_bill_of_quantity;
                item.custom_boq_qty = e.actual_qty;
                item.custom_subtask = e.subtask
            });
            refresh_field("items");
            })
            .fail((f) => {
            console.log(f);
            });
        }    
        
    }