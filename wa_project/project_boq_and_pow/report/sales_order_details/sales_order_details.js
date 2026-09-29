// Copyright (c) 2024, Stephen Mutua and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Sales Order Details"] = {
	"filters": [
		{
			"fieldname":"customer",
			"label": __("Customer"),
			"fieldtype": "Link",
			"options": "Customer",
			"width": 500,
			"reqd": 1,
			on_change: function() {
					frappe.query_report.set_filter_value('sales_order', 'customer');
					frappe.query_report.refresh();
			},
		},
		{
			"fieldname":"sales_order",
			"label": __("Sales Order"),
			"fieldtype": "Link",
			"options": "Sales Order",
			"reqd": 1,
			"width": 250,
			get_query: function(){
				return {
					filters: [
					['Sales Order','customer', '=', frappe.query_report.get_filter_value('customer')]
					]
				}
			},
		},
	]
};


function get_options() {
	let values = [];

	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Sales Order",
			filters: [
				["customer", "=", "<so_name>"]
			],
			fields: ["name"],
		},
		callback: function(r) {
			if (r.message) {
				r.message.forEach(row => values.push(row.sales_order));
			}
		}
	});

	return values;
};
