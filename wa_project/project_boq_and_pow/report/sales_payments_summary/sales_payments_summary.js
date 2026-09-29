// Copyright (c) 2024, Stephen Mutua and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Sales Payments Summary"] = {
	"filters": [
		{
			"fieldname":"from_time",
			"label": __("From Time"),
			"fieldtype": "Datetime",
			"reqd": 1,
			"width": "40"
		},
		{
			"fieldname":"to_time",
			"label": __("To Time"),
			"fieldtype": "Datetime",
			"default": frappe.datetime.now_datetime(),
			"reqd": 1,
			"width": "40"
		},
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company")
		},
		{
			"fieldname":"owner",
			"label": __("Owner"),
			"fieldtype": "Link",
			"options": "User",
			"defaults": user
		},
		{
			"fieldname":"is_pos",
			"label": __("Show only POS"),
			"fieldtype": "Check"
		},
		{
			"fieldname":"payment_detail",
			"label": __("Show Payment Details"),
			"fieldtype": "Check"
		}

	]
};
