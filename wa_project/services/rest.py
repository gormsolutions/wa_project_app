
import frappe
import requests
from frappe.model.db_query import DatabaseQuery
from frappe.model.mapper import get_mapped_doc
from frappe.utils import cint, cstr, flt, today

from erpnext.stock.utils import get_stock_balance

from erpnext.stock.doctype.item.item import get_item_details
from erpnext.stock.get_item_details import get_conversion_factor, get_price_list_rate

@frappe.whitelist(allow_guest=True)    
def bom_item_qty(item_code, bom):      
    response = []    
    item_qty = []
    item_no = frappe.db.sql(f""" SELECT qty FROM `tabBOM Item` WHERE parent = '{bom}' and item_code = '{item_code}' """, as_dict=True)
    
    if item_no:
        item_qty = item_no[0]
        
    response = dict(item_qty)            
    return response

def get_item_det(item_code):
        item = get_item_details(item_code)

        if not item:
            frappe.throw(_("Item: {0} does not exist in the system").format(item_code))

        return item


@frappe.whitelist()
def get_boq_item(mt_boq):
    
    print(f'\nGet BOQ Item.......{mt_boq}\n')
    
    # boq_dict = frappe.db.get_value("BOQ Item", {"parent": mt_boq}, ['item_code', 'item_name', 'qty', 'uom', 'rate'], as_dict=1)	
    response = []
  
    try:
        boq_dict = frappe.db.sql(f""" SELECT item_code, item_name, qty, actual_qty, uom, rate, sub_task FROM `tabBOQ Item` WHERE parent = '{mt_boq}' """, as_dict=True)

        if boq_dict:
            for item in boq_dict:
                response.append(
                    {
                        "item_code": item.item_code,
                        "item_name": item.item_name,
                        "quantity":  item.qty,
                        "actual_qty":  item.actual_qty,
                        "rate": item.rate,
                        "uom": item.uom,
                        "stock_uom": item.uom,
                        "description": item.description,
                        "subtask": item.sub_task
                    }
                )
        else:
            status_code = 404
            body = "Sorry, No Payments found for this record!."
            response = dict(boq_dict)
    except Exception as e:
        print(e)
        response = dict(
            status_code=400,
            body="Failed to fetch your details at this moment. Try again later",
        )
        
    # print(f'\nGet BOQ Item resp....{response}\n')
    
    return response


@frappe.whitelist()
def get_boq_items(**args):    
    mtboq = args['boq']

    response = []
  
    try:
        boq_dict = frappe.db.sql(f""" SELECT item_code, item_name, qty, uom, rate FROM `tabBOQ Item` WHERE parent = '{mtboq}' """, as_dict=True)
        if boq_dict:
            for item in boq_dict:
                response.append(
                    {
                        "item_code": item.item_code,
                        "item_name": item.item_name,
                        "quantity":  item.qty,
                        "rate": item.rate,
                        "uom": item.uom,
                        "stock_uom": item.uom,
                        "description": item.description
                    }
                )
        else:
            status_code = 404
            body = "Sorry, No Payments found for this record!."
            response = dict(boq_dict)
    except Exception as e:
        # frappe.log_error(frappe.get_traceback(), f'{e}')
        response = dict(
            status_code=400,
            body="Failed to fetch your details at this moment. Try again later",
        )
    
    return response
    

@frappe.whitelist(allow_guest=True)    
def supplier_goods(supplier):  
    response = []    
    try:        
        supply_item = frappe.db.sql(f""" SELECT item, rate, uom, it.item_name, it.description FROM `tabSupplier Good Item` sgi INNER JOIN `tabItem` it ON it.name = sgi.item WHERE sgi.parent = '{supplier}'  """, as_dict=True)

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

    return response



@frappe.whitelist()
def boq_item_detail(item_code):
    """Get Item details """
 
    try:
        item_detail = get_item_det(item_code)
        
        # Item buying price        
        item_price =  item_buying_price(item_code)
        
    
    # task_dict = frappe.db.get_value('Item', item, ['iten_name', 'description', 'stock_uom'], as_dict=1)
        ret_item = {
            "item_name": item_detail and item_detail["item_name"] or "",
            "description": item_detail and item_detail["description"] or "",
            "image": item_detail and item_detail["image"] or "",
            "stock_uom": item_detail and item_detail["stock_uom"] or "",
            "uom": item_detail and item_detail["stock_uom"] or "",
            "conversion_factor": 1,
            "rate": item_price or 0,
            "qty":  1,
            "stock_qty":  1,
            "actual_qty":  1,
            "base_rate": flt(item_detail["standard_rate"]) * 1,
            "include_item_in_manufacturing": 1,
            "sourced_by_supplier":  0,
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f'{e}')

    return ret_item

def matreq_insert(doc, event):
    print(f'\nMaterial request Insert.{doc}, {event}.\n')
    
    
def matreq_update(doc, event):
    print(f'\nMaterial request Update.......\n')
    
    

@frappe.whitelist()
def check_boq_quantity(boq, item_code):
    # print(f'\nCheck BOQ Qty....{boq}, ..{item_code}\n')
    
    # boq_dict = frappe.db.get_value("BOQ Item", {"parent": mt_boq}, ['item_code', 'item_name', 'qty', 'uom', 'rate'], as_dict=1)	
    response = []
  
    try:
        boq_qty = frappe.db.sql(f""" SELECT actual_qty FROM `tabBOQ Item` WHERE item_code = '{item_code}' and parent = '{boq}' """, as_dict=True)
        if boq_qty:
            for item in boq_qty:
                response.append(
                    {
                      "actual_qty":  item.actual_qty,
                    }
                )
        else:
            status_code = 404
            body = "Sorry, No Payments found for this record!."
            response = dict(boq_qty)
    except Exception as e:
        print(e)
        response = dict(
            status_code=400,
            body="Failed to fetch your details at this moment. Try again later",
        )
        
    response = dict(actual_qty=item.actual_qty)    
    return response


@frappe.whitelist()
def update_boq_item(boq, itemcode, item_qty, subtask ):  
    # print(f'\nUPDATE ITEM: SUBTASK: {subtask}  BOQ: {boq} ITEM: {itemcode} QTY: {item_qty}\n')
    try:
        # frappe.db.sql(f""" UPDATE `tabBOQ Item` SET actual_qty = '{item_qty}' WHERE item_code = '{itemcode}' and parent = '{boq}' """, as_dict=True)   
        if subtask:     
            frappe.db.sql(f""" UPDATE `tabBOQ Item` SET actual_qty = '{item_qty}' WHERE item_code = '{itemcode}' and parent = '{boq}' and sub_task = '{subtask}' """, as_dict=True)
        else:
            frappe.db.sql(f""" UPDATE `tabBOQ Item` SET actual_qty = '{item_qty}' WHERE item_code = '{itemcode}' and parent = '{boq}' """, as_dict=True)        
        # response = True
    except Exception as e:
        print(e)
        # response = False
        
@frappe.whitelist()
def get_item_price(item_code, uom):      
    price_rate = frappe.db.get_value('Item Price', {'selling': '1', 'uom': uom, 'item_code': item_code}, ['price_list_rate'])
    
    if price_rate:
        response = dict(rate=price_rate)
        
        return response
        
    else:
        response = 0
        return response
        frappe.log_error("Item Price Not Found.", "Supplier Goods Error")
        
@frappe.whitelist()
def get_buying_price(item_code, uom):   
    print(f'\nGet Item Buying Price for {item_code, uom}' )   
    buying_price = frappe.db.get_value('Item Price', {'item_code': item_code, 'uom': uom, 'buying': '1'}, ['price_list_rate'])
    
    if buying_price:
        response = dict(buying_price=buying_price)
    else:
        response = 0
        
        frappe.log_error("Buying Price Not Found.", "Supplier Goods Error")
        
    # print(f'\nBuying Price resp = {response}\n' ) 
    return response

@frappe.whitelist()
def item_buying_price(item_code):   
    print(f'\nGet Item Buying Price for {item_code}' )   
    buying_price = frappe.db.get_value('Item Price', {'item_code': item_code, 'buying': '1'}, ['price_list_rate'])
    
    if buying_price:
        response = buying_price
    else:
        response = 0
        
        frappe.log_error("Buying Price Not Found.", "Utem details Error")
        
    print(f'\nItem Buying Price response = {response}\n' ) 
    return response


@frappe.whitelist()
def set_item_price(item, sell_price, uom):    
    # item_price = frappe.get_doc("Item Price", filters={"Selling": "1", "uom": uom })   
    print(f'\nSet Item Price for {item} to {sell_price}\n' )
    # print(f'\n\nItem Price for {item_price} \n' )
    # if item_price:
    try:
        frappe.db.sql(f""" UPDATE `tabItem Price` SET price_list_rate = '{sell_price}' WHERE item_code = '{item}' and uom = '{uom}' and selling = 1 """, as_dict=True)    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f'{e}')
        
    # else:
    #     frappe.log_error("Item Price Not Found.", "Supplier Goods Error")
    


@frappe.whitelist()
def get_pow_item(pow):
    
    # boq_dict = frappe.db.get_value("BOQ Item", {"parent": mt_boq}, ['item_code', 'item_name', 'qty', 'uom', 'rate'], as_dict=1)	
    response = []
  
    try:
        pow_dict = frappe.db.sql(f""" SELECT ref, item, parent_group_task, parent_task, sub_task, qty, uom, labour_rate, material_rate, labour_amount, material_amount, total_amount FROM `tabPOW Item` WHERE parent = '{pow}' """, as_dict=True)

        if pow_dict:
            for item in pow_dict:
                response.append(
                    {
                        "ref": item.ref,
                        "item": item.item,
                        "qty":  item.qty,
                        "parent_group_task":  item.parent_group_task,
                        "parent_task": item.parent_task,
                        "sub_task": item.sub_task,
                        "uom": item.uom,
                        "labour_rate": item.labour_rate,
                        "material_rate": item.material_rate, 
                        "labour_amount": item.labour_amount, 
                        "material_amount": item.material_amount, 
                        "total_amount": item.total_amount                        
                    }
                )
        else:
            status_code = 404
            body = "Sorry, POW Item found for this record!."
            response = dict(pow_dict)
    except Exception as e:
        print(e)
        response = dict(
            status_code=400,
            body="Failed to fetch POW Items at this moment. Try again later",
        )

    return response

@frappe.whitelist()
def get_subtask_item(boq, subtask):
    
    print(f'\n\nSubtask..{boq}, {subtask}\n\n')
    
    
    # boq_dict = frappe.db.get_value("BOQ Item", {"parent": mt_boq}, ['item_code', 'item_name', 'qty', 'uom', 'rate'], as_dict=1)	
    response = []
  
    try:
        boq_task = frappe.db.sql(f""" SELECT item_code, item_name, qty, actual_qty, uom, rate, sub_task FROM `tabBOQ Item` WHERE parent = '{boq}' and sub_task = '{subtask}' """, as_dict=True)

        print(f'\n\n{boq_task}\n\n')
        
        if boq_task:
            for item in boq_task:
                response.append(
                    {
                        "item_code": item.item_code,
                        "item_name": item.item_name,
                        "quantity":  item.qty,
                        "actual_qty":  item.actual_qty,
                        "rate": item.rate,
                        "uom": item.uom,
                        "stock_uom": item.uom,
                        "description": item.description,
                        "subtask": item.sub_task
                    }
                )
        else:
            status_code = 404
            body = "Sorry, No Payments found for this record!."
            response = dict(boq_task)
    except Exception as e:
        print(e)
        response = dict(
            status_code=400,
            body="Failed to fetch your details at this moment. Try again later",
        )
        
    # print(f'\n\n{response}\n\n')
    
    return response