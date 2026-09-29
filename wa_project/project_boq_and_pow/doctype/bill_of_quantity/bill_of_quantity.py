# Copyright (c) 2024, Stephen Mutua and contributors
# For license information, please see license.txt

import frappe
import requests

from frappe.model.document import Document
from frappe.model.db_query import DatabaseQuery
from frappe.model.mapper import get_mapped_doc
from frappe.utils import cint, cstr, flt, today

from erpnext.stock.utils import get_stock_balance

from erpnext.stock.doctype.item.item import get_item_details
from erpnext.stock.get_item_details import get_conversion_factor, get_price_list_rate

class BillofQuantity(Document):	
    @staticmethod
    def get_item_det(self, item_code):
            item = get_item_details(item_code)

            if not item:
                frappe.throw(_("Item: {0} does not exist in the system").format(item_code))

            return item
        
    # def boq_item_detail(item_code):
    #     print(f'\nItem Detail Start...{item_code}\n')

    #     """Get Item details """

    #     item_detail = self.get_item_det(item_code)
        
    #     # task_dict = frappe.db.get_value('Item', item, ['iten_name', 'description', 'stock_uom'], as_dict=1)
    #     ret_item = {
    #         "item_name": item_detail and item_detail["item_name"] or "",
    #         "description": item_detail and item_detail["description"] or "",
    #         "image": item_detail and item_detail["image"] or "",
    #         "stock_uom": item_detail and item_detail["stock_uom"] or "",
    #         "uom": item_detail and item_detail["stock_uom"] or "",
    #         "conversion_factor": 1,
    #         # "bom_no": item_detail["bom_no"],
    #         "rate": item_detail["standard_rate"],
    #         "qty":  1,
    #         "stock_qty":  1,
    #         "actual_qty":  1,
    #         "base_rate": flt(item_detail["standard_rate"]) * 1,
    #         "include_item_in_manufacturing": 1,
    #         "sourced_by_supplier":  0,
    #     }

    #     return ret_item


