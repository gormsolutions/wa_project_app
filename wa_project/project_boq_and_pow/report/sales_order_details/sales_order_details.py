# Copyright (c) 2024, Stephen Mutua and contributors
# For license information, please see license.txt


from __future__ import unicode_literals
import frappe, erpnext
from frappe import _

def execute(filters=None):
    if not filters:
        filters = {}
    grand_total = 0
    advance_paid = 0
    order_qty = 0
    balance = 0
    last_pay = 0
    
    currency = None
    if filters.get("currency"):
        currency = filters.get("currency")
    company_currency = erpnext.get_company_currency(filters.get("company"))
    
    sale_order = filters.get('sales_order')
    sale_customer = filters.get('customer')
    
    columns = get_columns()
    data = get_data(filters)
    message = "Report by Steve Mutua"
    
    rep_summary = get_data_summary(sale_order, sale_customer)
    if rep_summary:    
        grand_total = rep_summary.get('grand_total')
        advance_paid = rep_summary.get('advance_paid')
        order_qty = rep_summary.get('total_qty')
        balance = grand_total - advance_paid    
        
        payment = frappe.get_last_doc('Payment Entry Reference', filters={"reference_name": sale_order})     
        if payment:   
            last_pay = payment.get('allocated_amount')
        
        repsummary = [
            {
                "value": grand_total, 
                "label": _("Grand Total"), 
                "datatype": "Currency",
                "indicator": "Blue" ,
            },
            {
                "value": advance_paid,
                "label": _("Amount Paid Todate"), 
                "datatype": "Currency",
                "indicator": "Green" ,

            },
            {
                "value": balance, 
                "label": _("Outstanding Balance"), 
                "datatype": "Currency",
                "indicator": "red" ,

            },
            {
                "value": last_pay, 
                "label": _("Last Payment"), 
                "datatype": "Currency",
            },
            {
                "value": order_qty, 
                "label": _("Total Quantity"), 
                "datatype": "Int",
            },
        ]
    else:
        repsummary = []
    
    message=''
    chart = None

    ext_data = get_salary()
    emp_data = get_emp_list()
    
    data_to_be_printed = None

    # data_to_be_printed={"ext_data":ext_data,"condition_text":'XXXXXXXXX  This is an extra-data for by Steve .n',"emp_data":emp_data}
     
    return columns, data, None, chart, repsummary


def get_columns():
    columns = [		
        {
        'label': _('Item'),
        'fieldname': 'item_name',
        'fieldtype': 'Data',
        'width': 300
        },
        {
        'label': _('Quantity'),
        'fieldname': 'qty',
        'fieldtype': 'Data',
        'width': 100
        },  
        {
        'label': _('Rate'),
        'fieldname': 'rate',
        'fieldtype': 'Currency',
        'width': 200
        },
        {
        'label': _('Amount'),
        'fieldname': 'amount',
        'fieldtype': 'Currency',
        'width': 250
        },
            
    ]
        
    return columns

def get_data(filters,conditions=""):    
    conditions = get_conditions(filters) 

    data = frappe.db.sql("""
    SELECT so.customer, so.name, so.customer, si.item_code, si.item_name, si.qty, so.total_qty, si.rate, si.amount 
    FROM `tabSales Order` so, `tabSales Order Item` si 
    WHERE %s
        and so.name = si.parent
    """  % conditions, filters, as_dict=1)

    return data

def get_conditions(filters):
    conditions = ""

    conditions += "so.docstatus = 1"
  
    if filters.get("customer"): conditions += " and so.customer = %(customer)s"
    if filters.get("sales_order"): conditions += " and si.parent = %(sales_order)s"
    
    return conditions

def get_data_summary(filter, customer):
    sales_order = frappe.db.get_value('Sales Order', {'name':filter, 'customer': customer}, ['grand_total', 'advance_paid', 'total_qty'], as_dict=1)
    
    return sales_order

def get_salary():
    emp_local_data=[]
    basic = 1000
    loop_range=20
    for i in range(loop_range):
        name = 'Emp '+str(i)
        month='April'
        salary = basic+i
        dict_value = {
            "name":name,
            "month":month,
            "salary":salary
        }
        emp_local_data.append(dict_value)
    return emp_local_data

def get_emp_list():
    data = frappe.db.sql("""select
                         emp.first_name as "first_name",emp.date_of_birth as "dob",emp.date_of_joining as "date_of_join" from `tabEmployee` emp
                         """,as_dict=True)
    # print('data of empl : ',data)
    return data