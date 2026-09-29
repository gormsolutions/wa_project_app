# Copyright (c) 2024, Stephen Mutua and contributors
# For license information, please see license.txt


from __future__ import unicode_literals
import frappe, erpnext
from frappe import _

def execute(filters=None):
    frappe.errprint(filters)
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
    
    message=''
    chart = None

    ext_data = get_salary()
    emp_data = get_emp_list()    
    data_to_be_printed = None
     
    return columns, data, None, chart


def get_columns():
    columns = [		
        {
        'label': _('Subscriber'),
        'fieldname': 'subscriber',
        'fieldtype': 'Data',
        'width': 250
        },
        {
        'label': _('CRM'),
        'fieldname': 'sales_person',
        'fieldtype': 'Data',
        'width': 150
        },  
        {
        'label': _('January'),
        'fieldname': 'January',
        'fieldtype': 'Float',
        'precision': 1,
        'width': 120
        },  
        {
        'label': _('February'),
        'fieldname': 'February',
        'fieldtype': 'Float',
        'precision': 1,
        'width': 120
        },  
        {
        'label': _('March'),
        'fieldname': 'March',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('April'),
        'fieldname': 'April',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('May'),
        'fieldname': 'May',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('June'),
        'fieldname': 'June',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('July'),
        'fieldname': 'July',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('August'),
        'fieldname': 'August',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('September'),
        'fieldname': 'September',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('October'),
        'fieldname': 'October',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('November'),
        'fieldname': 'November',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },  
        {
        'label': _('December'),
        'fieldname': 'December',
        'fieldtype': 'Float',
        'width': 120,
        'precision': 1,
        },
        {
        'label': _('Sales Order Grand Total'),
        'fieldname': 'grand_total',
        'fieldtype': 'Float',
        'width': 200,
        'precision': 2,
        },
        {
        'label': _('Amount Paid Todate'),
        'fieldname': 'advance_pay',
        'fieldtype': 'Float',
        'width': 200,
        'precision': 2,
        },
        {
        'label': _('Outstanding Balance'),
        'fieldname': 'outstanding',
        'fieldtype': 'Float',
        'width': 200,
        'precision': 2,
        }                 
    ]
        
    return columns

def get_data(filters,conditions=""):    
    conditions = get_conditions(filters) 
    
    data = frappe.db.sql("""
    SELECT 
        so.customer as subscriber, st.sales_person, 
        SUM(CASE WHEN MONTH(ps.due_date) = 1 THEN ps.outstanding ELSE 0 END) AS January,
        SUM(CASE WHEN MONTH(ps.due_date) = 2 THEN ps.outstanding ELSE 0 END) AS February,
        SUM(CASE WHEN MONTH(ps.due_date) = 3 THEN ps.outstanding ELSE 0 END) AS March,
        SUM(CASE WHEN MONTH(ps.due_date) = 4 THEN ps.outstanding ELSE 0 END) AS April,
        SUM(CASE WHEN MONTH(ps.due_date) = 5 THEN ps.outstanding ELSE 0 END) AS May,
        SUM(CASE WHEN MONTH(ps.due_date) = 6 THEN ps.outstanding ELSE 0 END) AS June,
        SUM(CASE WHEN MONTH(ps.due_date) = 7 THEN ps.outstanding ELSE 0 END) AS July,
        SUM(CASE WHEN MONTH(ps.due_date) = 8 THEN ps.outstanding ELSE 0 END) AS August,
        SUM(CASE WHEN MONTH(ps.due_date) = 9 THEN ps.outstanding ELSE 0 END) AS September,
        SUM(CASE WHEN MONTH(ps.due_date) = 10 THEN ps.outstanding ELSE 0 END) AS October,
        SUM(CASE WHEN MONTH(ps.due_date) = 11 THEN ps.outstanding ELSE 0 END) AS November,
        SUM(CASE WHEN MONTH(ps.due_date) = 12 THEN ps.outstanding ELSE 0 END) AS December,
        so.grand_total, so.advance_paid as advance_pay, so.grand_total - so.advance_paid AS outstanding
    FROM  
        `tabSales Order` so
    LEFT JOIN 
        `tabSales Team` st ON st.parent = so.name
    LEFT JOIN 
        `tabPayment Schedule` ps ON ps.parent = so.name
    WHERE 
        %s
    GROUP BY 
        so.customer, st.sales_person;
    """  % conditions, filters, as_dict=1)

    return data

def get_conditions(filters):
    conditions = ""

    # if filters.get("docstatus"):
    conditions += "so.docstatus = 1 AND ps.docstatus = 1"
  
    if filters.get("customer"): conditions += " and so.customer = %(customer)s"
    if filters.get("sales_order"): conditions += " and st.parent = %(sales_order)s"
    if filters.get("salesperson"): conditions += " and st.sales_person = %(salesperson)s"
    if filters.get("from_date"): conditions += " and ps.due_date >= %(from_date)s"
    if filters.get("to_date"): conditions += " and ps.due_date <= %(to_date)s"
    if filters.get("payment_term"): conditions += " and ps.payment_term <= %(payment_term)s"
    
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
    # print('employ data : ',data)
    return data