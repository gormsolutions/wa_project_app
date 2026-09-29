
import frappe
import requests

from frappe.utils import flt, nowdate


@frappe.whitelist(allow_guest=True)    
def supplier_goods(supplier):  
    
  #   supply_item = frappe.db.get_value(
	# 	"Supplier Good Item", {"parent": supplier}, ["item", "rate"], as_dict=1
	# )
    
  #   allocations = frappe.db.get_list(
	# 		"Supplier Good Item",
	# 		filters={"parent": supplier},
	# 	)
    
    
    response = []    
    # item_qty = []
    # supply_item = frappe.db.sql(f""" SELECT item FROM `tabSupplier Good Item` WHERE parent = '{supplier}'  """, as_dict=True)
    
    # if supply_item:
    #     item_qty = supply_item[0]
        
    # print(f'\nSupplier Items ...{item_qty}\n')
        
    # response = supply_item
    # response = dict(item_qty)
    # print(f'\nBOM Item Qty......{type(response)} >> {response}\n')
            
    # return response
  
    try:
        # fee_allocations = frappe.db.sql( fee_payments_query,  as_dict=True )
        
        supply_item = frappe.db.sql(f""" SELECT item, rate, uom, it.item_name, it.description FROM `tabSupplier Good Item` sgi INNER JOIN `tabItem` it ON it.name = sgi.item WHERE sgi.parent = '{supplier}'  """, as_dict=True)
            
        # print(f'\nSupply Items ...{supply_item}')
        if supply_item:
            for item in supply_item:
                # print(f'\nFee Item ...{feeitem.fee_item}, {feeitem}')
                response.append(
                    {
                        "item": item.item,
                        "rate": item.rate,
                        "uom": item.uom,
                        "item_name": item.item_name,
                        "description": item.description
                    }
                )
        else:
            status_code = 404
            body = "Sorry, No Payments found for this record!."
            response = dict(supply_item)
    except Exception as e:
        print(e)
        response = dict(
            status_code=400,
            body="Failed to fetch your details at this moment. Try again later",
        )
    
    # print(f'\nSupplier Items response ...{response}\n')
    
    return response

def get_company_total_stock(item_code, company):
    return frappe.db.sql(
        """SELECT sum(actual_qty) from
        (`tabBin` INNER JOIN `tabWarehouse` ON `tabBin`.warehouse = `tabWarehouse`.name)
        WHERE `tabWarehouse`.company = %s and `tabBin`.item_code = %s""",
        (company, item_code),
    )[0][0]