// Copyright (c) 2024, Stephen Mutua and contributors
// For license information, please see license.txt

frappe.ui.form.on('Program Of Work', {
	// refresh: function(frm) {

	// }
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
	},
	
	parent_project: function(frm) {
		cur_frm.set_value("project", "");
		cur_frm.refresh_field("project");

	}

});
