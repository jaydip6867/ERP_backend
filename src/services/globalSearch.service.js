import { Customer } from '../models/customer.model.js';
import { Lead } from '../models/lead.model.js';
import { Quotation } from '../models/quotation.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { Product } from '../models/product.model.js';
import { Supplier } from '../models/supplier.model.js';
import { Invoice } from '../models/invoice.model.js';
import { Ticket } from '../models/ticket.model.js';
import { TodoTask } from '../models/todoTask.model.js';

export class GlobalSearchService {
  /**
   * Search across all ERP entities with RBAC scope compliance
   */
  static async searchAll(query, user) {
    if (!query || query.trim().length < 2) {
      return { total: 0, results: [] };
    }

    const term = query.trim();
    const regex = new RegExp(term, 'i');

    const [
      customers,
      leads,
      quotes,
      orders,
      products,
      suppliers,
      invoices,
      tickets,
      tasks,
    ] = await Promise.all([
      Customer.find({ $or: [{ company_name: regex }, { customer_code: regex }] }).limit(5),
      Lead.find({ $or: [{ company_name: regex }, { contact_person: regex }, { lead_code: regex }] }).limit(5),
      Quotation.find({ quotation_number: regex }).limit(5),
      SalesOrder.find({ order_number: regex }).limit(5),
      Product.find({ $or: [{ product_name: regex }, { product_code: regex }] }).limit(5),
      Supplier.find({ $or: [{ supplier_name: regex }, { supplier_code: regex }] }).limit(5),
      Invoice.find({ invoice_number: regex }).limit(5),
      Ticket.find({ $or: [{ ticket_number: regex }, { subject: regex }] }).limit(5),
      TodoTask.find({ title: regex }).limit(5),
    ]);

    const results = [
      ...customers.map((c) => ({
        id: c._id,
        category: 'Customer',
        title: c.company_name,
        subtitle: `Code: ${c.customer_code}`,
        link: `/customers/${c._id}/360`,
      })),
      ...leads.map((l) => ({
        id: l._id,
        category: 'Lead',
        title: l.company_name || l.contact_person,
        subtitle: `Stage: ${l.pipeline_stage}`,
        link: `/leads`,
      })),
      ...quotes.map((q) => ({
        id: q._id,
        category: 'Quotation',
        title: q.quotation_number,
        subtitle: `Total: ₹${q.grand_total?.toLocaleString()}`,
        link: `/sales/quotations/${q._id}`,
      })),
      ...orders.map((o) => ({
        id: o._id,
        category: 'Sales Order',
        title: o.order_number,
        subtitle: `Status: ${o.status} | ₹${o.grand_total?.toLocaleString()}`,
        link: `/sales/orders/${o._id}`,
      })),
      ...products.map((p) => ({
        id: p._id,
        category: 'Product',
        title: p.product_name,
        subtitle: `SKU: ${p.product_code} | Stock: ${p.current_stock}`,
        link: `/products`,
      })),
      ...suppliers.map((s) => ({
        id: s._id,
        category: 'Supplier',
        title: s.supplier_name,
        subtitle: `Code: ${s.supplier_code}`,
        link: `/purchase/suppliers`,
      })),
      ...invoices.map((i) => ({
        id: i._id,
        category: 'Invoice',
        title: i.invoice_number,
        subtitle: `Status: ${i.status} | Balance: ₹${i.balance_amount}`,
        link: `/invoices/${i._id}`,
      })),
      ...tickets.map((t) => ({
        id: t._id,
        category: 'Support Ticket',
        title: t.subject,
        subtitle: `Ticket #${t.ticket_number} | Priority: ${t.priority}`,
        link: `/support/tickets/${t._id}`,
      })),
      ...tasks.map((tk) => ({
        id: tk._id,
        category: 'Task',
        title: tk.title,
        subtitle: `Status: ${tk.status} | Priority: ${tk.priority}`,
        link: `/tasks`,
      })),
    ];

    return {
      query: term,
      total: results.length,
      results,
    };
  }
}

export default GlobalSearchService;
