# Copyright (c) 2024, Stephen Mutua and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class SupplierGood(Document):
    @frappe.whitelist()
    def get_item_price(self, item, uom):  
        print(f'\n\nGet Item Price Starting... {item} .. \n')   
        item_price = frappe.get_doc("Item Price", filters={"selling": "1", "uom": uom })   
        
        price_rate = frappe.db.get_value('Item Price', {'selling': '1', 'uom': uom}, ['price_list_rate'])
        
        print(f'\n\nItem Price for {item_price} .. \n')
        print(f'\nItem Price Rate {price_rate} .. \n')
        
        
        print(f'\n\nItem Price for {item} Not Found...\n\n')
        if item_price:
            try:
                item_price.update(
                    {
                        "price_list_rate": item
                    }
                )
                item_price.db_update()
            except Exception as e:
                frappe.log_error(frappe.get_traceback(), f'{e}')
            
        else:
            frappe.log_error("Item Price Not Found.", "Supplier Goods Error")
    
    
    def set_item_price(item, uom, sell_price):
     
        item_price = frappe.get_doc("Item Price", filters={"Selling": "1", "uom": uom })   
        print(f'\n\nItem Price for {item} Not Found...\n\n')
        if item_price:
            try:
                item_price.update(
                    {
                        "price_list_rate": sell_price
                    }
                )
                item_price.db_update()
            except Exception as e:
                frappe.log_error(frappe.get_traceback(), f'{e}')
            
        else:
            frappe.log_error("Item Price Not Found.", "Supplier Goods Error")
            
#     doc.save(
#     ignore_permissions=True, # ignore write permissions during insert
#     ignore_version=True # do not create a version record
# )

# def add_party_account(party_type, party, company, account):
# 	doc = frappe.get_doc(party_type, party)
# 	account_exists = False
# 	for d in doc.get("accounts"):
# 		if d.account == account:
# 			account_exists = True

# 	if not account_exists:
# 		accounts = {"company": company, "account": account}

# 		doc.append("accounts", accounts)

# 		doc.save()

