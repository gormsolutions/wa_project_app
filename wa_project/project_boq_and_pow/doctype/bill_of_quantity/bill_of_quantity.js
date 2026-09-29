// Copyright (c) 2024, Stephen Mutua and contributors
// For license information, please see license.txt

frappe.provide("erpnext.bom");

frappe.ui.form.on("Bill of Quantity", {
	setup: function(frm) {

		frm.set_query("source_warehouse", "items", function() {
			return {
				filters: {
					'company': frm.doc.company
				}
			};
		});

		frm.set_query("project", function() {
			return{
				filters:[
					['Project', 'status', 'not in', 'Completed, Cancelled']
				]
			};
		});

		frm.set_query("item_code", "items", function(doc) {
			return {
				query: "erpnext.manufacturing.doctype.bom.bom.item_query",
				filters: {
					"is_fixed_asset": 0
				}
			};
		});
	},

	onload: function(frm) {
		frm.set_query('parent_project', function() {
			return {
				'filters':{
					'custom_is_group': 1
				}
			};
		});

		frm.set_query('project', function() {
			return {
				'filters':{
					'parent_project': frm.doc.parent_project					
				}
			};
		});
		

		if (frm.doc.program_of_work) {

			var work_program = frm.doc.program_of_work;

			if(frm.is_new() && work_program) {
				get_pow_items(frm, work_program)
				refresh_field("items");
				
			}
		}		
	},

	refresh: function(frm) {
		frm.toggle_enable("item", frm.doc.__islocal);

		frm.set_indicator_formatter('item_code',
			function(doc) {
				if (doc.original_item){
					return (doc.item_code != doc.original_item) ? "orange" : ""
				}
				return ""
			}
		)

		if(frm.doc.items && frm.doc.allow_alternative_item) {
			const has_alternative = frm.doc.items.find(i => i.allow_alternative_item === 1);
			if (frm.doc.docstatus == 0 && has_alternative) {
				frm.add_custom_button(__('Alternate Item'), () => {
					erpnext.utils.select_alternate_items({
						frm: frm,
						child_docname: "items",
						warehouse_field: "source_warehouse",
						child_doctype: "BOQ Item",
						original_item_field: "original_item",
						condition: (d) => {
							if (d.allow_alternative_item) {return true;}
						}
					})
				});
			}
		}

		if (frm.doc.has_variants) {
			frm.set_intro(__('BOQ Template will be used to make the work order for {0} of the item {1}',
				[
					`<a class="variants-intro">variants</a>`,
					`<a href="/app/item/${frm.doc.item}">${frm.doc.item}</a>`,
				]), true);

			frm.$wrapper.find(".variants-intro").on("click", () => {
				frappe.set_route("List", "Item", {"variant_of": frm.doc.item});
			});
		}
	},

    parent_task: function(frm) {
		if ( frm.doc.parent_task) {
			frappe.call({
				method: "frappe.client.get",
			  args: {
				doctype: "Task",
				name: frm.doc.parent_task,
			  },
				callback: function (r) {
					if (r.message) {		
						var doc_task = r.message;
						cur_frm.set_value("project", doc_task.subproject);
						cur_frm.set_value("subproject", doc_task.subproject);
						cur_frm.set_value("parent_project", doc_task.project);
						cur_frm.refresh_field("subproject");
						cur_frm.refresh_field("parent_project");					
					}
				},
			});
		}
	},

	program_of_work: function(frm) {
		var work_program = frm.doc.program_of_work;		
		if (work_program) {
	 			get_pow_items(frm, work_program)
			}
	},

	update_cost: function(frm, save_doc=false) {
		return frappe.call({
			doc: frm.doc,
			method: "update_cost",
			freeze: true,
			args: {
				update_parent: true,
				save: save_doc,
				from_child_bom: false
			},
			callback: function(r) {
				refresh_field("items");
				if(!r.exc) frm.refresh_fields();
			}
		});
	},

	rm_cost_as_per: function(frm) {
		if (in_list(["Valuation Rate", "Last Purchase Rate"], frm.doc.rm_cost_as_per)) {
			frm.set_value("plc_conversion_rate", 1.0);
		}
	},

	routing: function(frm) {
		if (frm.doc.routing) {
			frappe.call({
				doc: frm.doc,
				method: "get_routing",
				freeze: true,
				callback: function(r) {
					if (!r.exc) {
						frm.refresh_fields();
						erpnext.bom.calculate_op_cost(frm.doc);
						erpnext.bom.calculate_total(frm.doc);
					}
				}
			});
		}
	}
});


// erpnext.bom.BomController = erpnext.TransactionController.extend({
// 	item_code: function(doc, cdt, cdn){
// 		var scrap_items = false;
// 		var child = locals[cdt][cdn];
// 		scrap_items = false;

// 		get_bom_material_detail(doc, cdt, cdn, false);
// 	},

// 	buying_price_list: function(doc) {
// 		this.apply_price_list();
// 	},

// 	plc_conversion_rate: function(doc) {
// 		if (!this.in_apply_price_list) {
// 			this.apply_price_list(null, true);
// 		}
// 	},

// 	conversion_factor: function(doc, cdt, cdn) {
// 		if (frappe.meta.get_docfield(cdt, "stock_qty", cdn)) {
// 			var item = frappe.get_doc(cdt, cdn);
// 			frappe.model.round_floats_in(item, ["qty", "conversion_factor"]);
// 			item.stock_qty = flt(item.qty * item.conversion_factor, precision("stock_qty", item));
// 			refresh_field("stock_qty", item.name, item.parentfield);
// 			this.toggle_conversion_factor(item);
// 			// this.frm.events.update_cost(this.frm);
// 		}
// 	},
// });


// $.extend(cur_frm.cscript, new erpnext.bom.BomController({frm: cur_frm}));

// extend_cscript(cur_frm.cscript, new erpnext.bom.BomController({frm: cur_frm}));

// $.extend_cscript(cur_frm.cscript, new erpnext.bom.BomController({frm: cur_frm}));


cur_frm.cscript.bom_no = function(doc, cdt, cdn) {
	get_bom_material_detail(doc, cdt, cdn, false);
};

cur_frm.cscript.is_default = function(doc) {
	if (doc.is_default) cur_frm.set_value("is_active", 1);
};

var get_bom_material_detail = function(doc, cdt, cdn, scrap) {
	// if (!doc.company) {
	// 	frappe.throw({message: __("Please select a Company first."), title: __("Mandatory")});
	// }

	var d = locals[cdt][cdn];
	if (d.item_code) {
		return frappe.call({
			method: "wa_project.services.rest.boq_item_detail",
			args: {
				"item_code": d.item_code,
			},
			callback: function(r) {
				d = locals[cdt][cdn];

				$.extend(d, r.message);
				refresh_field("items");
				refresh_field("scrap_items");

				doc = locals[doc.doctype][doc.name];
				erpnext.bom.calculate_rm_cost(doc);
			},
			freeze: true
		});
	}
};

cur_frm.cscript.qty = function(doc, cdt, cdn) {
	if (doc.docstatus == 0) {
		var d = locals[cdt][cdn];
		var rm = doc.items || [];

		for(var i=0;i<rm.length;i++) {
			frappe.model.set_value('BOQ Item', rm[i].name, 'actual_qty', rm[i].qty);
		}
	}
		
	erpnext.bom.calculate_rm_cost(doc);
};

cur_frm.cscript.rate = function(doc, cdt, cdn) {
	var d = locals[cdt][cdn];

	if (d.bom_no) {
		frappe.msgprint(__("You cannot change the rate if BOQ is mentioned against any Item."));
		get_bom_material_detail(doc, cdt, cdn, false);
	} else {
		erpnext.bom.calculate_rm_cost(doc);
	}
};

erpnext.bom.update_cost = function(doc) {
	erpnext.bom.calculate_rm_cost(doc);
};

erpnext.bom.calculate_rm_cost = function(doc) {
	var rm = doc.items || [];
	var total_rm_cost = 0;
	var base_total_rm_cost = 0;
	var total_all_cost = 0;
	var total_labour_cost = 0;
	var total_material_cost = 0;

	for(var i=0;i<rm.length;i++) {

		var amount = flt(rm[i].rate) * flt(rm[i].qty);
		var material_amt = flt(rm[i].rate) * flt(rm[i].qty);
		var labour_amt = flt(rm[i].labour_rate) * flt(rm[i].qty);
		var all_amount = flt(material_amt) + flt(labour_amt);
		var base_amount = amount * flt(doc.conversion_rate);

		frappe.model.set_value('BOQ Item', rm[i].name, 'base_rate',
			flt(rm[i].rate) * flt(doc.conversion_rate));
		frappe.model.set_value('BOQ Item', rm[i].name, 'amount', amount);
		frappe.model.set_value('BOQ Item', rm[i].name, 'amounts', amount);
		frappe.model.set_value('BOQ Item', rm[i].name, 'material_amount', material_amt);
		frappe.model.set_value('BOQ Item', rm[i].name, 'labour_amount', labour_amt);
		frappe.model.set_value('BOQ Item', rm[i].name, 'total_amount', all_amount);
		frappe.model.set_value('BOQ Item', rm[i].name, 'base_amount', base_amount);
		frappe.model.set_value('BOQ Item', rm[i].name,
			'qty_consumed_per_unit', flt(rm[i].stock_qty)/flt(doc.quantity));

		total_rm_cost += all_amount;
		total_labour_cost += labour_amt;
		total_material_cost += material_amt;
		total_all_cost += all_amount;
		base_total_rm_cost += base_amount;
	}

	cur_frm.set_value("labour_cost", total_labour_cost);
	cur_frm.set_value("material_cost", total_material_cost);
	cur_frm.set_value("total_amount", total_rm_cost);

};

// // sm : scrap material
erpnext.bom.calculate_scrap_materials_cost = function(doc) {
	var sm = doc.scrap_items || [];
	var total_sm_cost = 0;
	var base_total_sm_cost = 0;

	for(var i=0;i<sm.length;i++) {
		var base_rate = flt(sm[i].rate) * flt(doc.conversion_rate);
		var amount = flt(sm[i].rate) * flt(sm[i].stock_qty);
		var base_amount = amount * flt(doc.conversion_rate);

		frappe.model.set_value('BOM Scrap Item',sm[i].name, 'base_rate', base_rate);
		frappe.model.set_value('BOM Scrap Item',sm[i].name, 'amount', amount);
		frappe.model.set_value('BOM Scrap Item',sm[i].name, 'base_amount', base_amount);

		total_sm_cost += amount;
		base_total_sm_cost += base_amount;
	}

};

cur_frm.cscript.validate = function(doc) {
	// erpnext.bom.update_cost(doc);
};

frappe.ui.form.on("BOQ Item", {
	do_not_explode: function(frm, cdt, cdn) {
	get_bom_material_detail(frm.doc, cdt, cdn, false);
	}
})


frappe.ui.form.on("BOQ Item", "qty", function(frm, cdt, cdn) {
	var d = locals[cdt][cdn];
	d.stock_qty = d.qty * d.conversion_factor;
	refresh_field("stock_qty", d.name, d.parentfield);
});

frappe.ui.form.on("BOQ Item", "item_ref", function(frm, cdt, cdn) {
	erpnext.bom.calculate_rm_cost(frm.doc);
});

frappe.ui.form.on("BOQ Item", "item_code", function(frm, cdt, cdn) {
	var d = locals[cdt][cdn];
	frappe.db.get_value('Item', {name: d.item_code}, 'allow_alternative_item', (r) => {
		d.allow_alternative_item = r.allow_alternative_item
	})
	refresh_field("allow_alternative_item", d.name, d.parentfield);
});

frappe.ui.form.on("BOQ Item", "uom", function(frm, cdt, cdn) {
	erpnext.bom.calculate_rm_cost(frm.doc);
});

frappe.ui.form.on("BOQ Item", "sourced_by_supplier", function(frm, cdt, cdn) {
	var d = locals[cdt][cdn];
	if (d.sourced_by_supplier) {
		d.rate = 0;
		refresh_field("rate", d.name, d.parentfield);
	}
});

frappe.ui.form.on("BOQ Item", "rate", function(frm, cdt, cdn) {
	var d = locals[cdt][cdn];
	if (d.sourced_by_supplier) {
		d.rate = 0;
		refresh_field("rate", d.name, d.parentfield);
	}
});


frappe.ui.form.on("BOQ Item", "items_remove", function(frm) {
	erpnext.bom.calculate_rm_cost(frm.doc);
});

frappe.ui.form.on("BOQ Item", "items_add", function(frm) {
	erpnext.bom.calculate_rm_cost(frm.doc);
});



let get_pow_items = function(frm, work_program){
	if (work_program) {
	frappe.call({
		method: "wa_project.services.rest.get_pow_item",
		args: { pow: work_program },
		})
		.done((r) => {
		frm.doc.items = [];

		$.each(r.message, function (_i, e) {
			let goods = frm.add_child("items");
			goods.item_code = e.item;
			goods.item_ref = e.ref;
			goods.rate = e.rate;
			goods.uom = e.uom,
			goods.item_name = e.item,
			goods.qty = e.qty;
			goods.actual_qty = e.qty;
			goods.parent_group_task = e.parent_group_task;
			goods.parent_task = e.parent_task;
			goods.sub_task = e.sub_task;
			goods.labour_rate = e.labour_rate;
			goods.rate = e.material_rate;
			goods.labour_amount = e.labour_amount;
			goods.material_amount = e.material_amount;
			goods.total_amount = e.total_amount;
			goods.amount = e.total_amount;
		});

		erpnext.bom.calculate_rm_cost(frm.doc);

		refresh_field("items");
		})
		.fail((f) => {
		console.log(f);
		});
	}
}

let get_totals = function(frm) {
	var rm = frm.items;

	for(var i=0;i<rm.length;i++) {
		var amount = flt(rm[i].rate) * flt(rm[i].qty);
		var material_amt = flt(rm[i].rate) * flt(rm[i].qty);
		var labour_amt = flt(rm[i].labour_rate) * flt(rm[i].qty);
		var all_amount = flt(material_amt) + flt(labour_amt);
		var base_amount = amount * flt(doc.conversion_rate);
		
		frappe.model.set_value('BOQ Item', rm[i].name, 'base_rate',
			flt(rm[i].rate) * flt(doc.conversion_rate));
		frappe.model.set_value('BOQ Item', rm[i].name, 'amount', amount);
		frappe.model.set_value('BOQ Item', rm[i].name, 'amounts', amount);
		frappe.model.set_value('BOQ Item', rm[i].name, 'material_amount', material_amt);
		frappe.model.set_value('BOQ Item', rm[i].name, 'labour_amount', labour_amt);
		frappe.model.set_value('BOQ Item', rm[i].name, 'total_amount', all_amount);
		frappe.model.set_value('BOQ Item', rm[i].name, 'base_amount', base_amount);
		frappe.model.set_value('BOQ Item', rm[i].name,
			'qty_consumed_per_unit', flt(rm[i].stock_qty)/flt(doc.quantity));

		total_rm_cost += all_amount;
		total_labour_cost += labour_amt;
		total_material_cost += material_amt;
		total_all_cost += all_amount;
		base_total_rm_cost += base_amount;
	}

	cur_frm.set_value("labour_cost", total_labour_cost);
	cur_frm.set_value("material_cost", total_material_cost);
	cur_frm.set_value("total_amount", total_rm_cost);
}

