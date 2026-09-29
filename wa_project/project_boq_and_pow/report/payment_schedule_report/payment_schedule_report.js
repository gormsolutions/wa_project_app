// Copyright (c) 2024, Stephen Mutua and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Payment Schedule Report"] = {
	"filters": [
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"reqd": 0,
			"width": "200px"
		},
		{
			"fieldname":"salesperson",
			"label": __("CRM"),
			"fieldtype": "Link",
			"options": "Sales Person",
			"width": "200px"
		},
		{
			"fieldname":"customer",
			"label": __("Customer"),
			"fieldtype": "Link",
			"options": "Customer",
			"get_query": function () {
				return {
					filters: [
						["Customer", "customer_type", "=", "Subscriber"]
					]
				};
			},
			"width": "200px"		},
		{
			"fieldname":"sales_order",
			"label": __("Sales Order"),
			"fieldtype": "Link",
			"options": "Sales Order",
			"width": "350px"
		},
		{
			"fieldname":"from_date",
			"label": __("Start Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_start(),	
		},
		,
		{
			"fieldname":"to_date",
			"label": __("EndDate"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today()			
		},
		{
			"fieldname":"payment_term",
			"label": __("Payment Term"),
			"fieldtype": "Select",
			options: get_options()
		}
	]
};


function get_options() {
	let values = [];

	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Payment Schedule",
			filters: [],
			fields: ["payment_term"],
			parent: "Sales Order"
		},
		callback: function(r) {
			if (r.message) {
				r.message.forEach(row => values.push(row.payment_term));
			}
		}
	});

	return values;
};