import { Invoice } from '../models/invoice.model.js';
import { CreditDebitNote } from '../models/creditDebitNote.model.js';
import { Dispatch } from '../models/dispatch.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { Customer } from '../models/customer.model.js';
import { Supplier } from '../models/supplier.model.js';
import { Branch } from '../models/branch.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { GstCalculationService } from './gstCalculation.service.js';
import { AppError } from '../utils/appError.js';

export class InvoiceService {
  /**
   * Invoice Dashboard Summary
   */
  static async getDashboardMetrics() {
    const [totalInvoices, unpaidInvoices, paidInvoices, creditNotesCount] = await Promise.all([
      Invoice.countDocuments({ status: { $ne: 'cancelled' } }),
      Invoice.countDocuments({ payment_status: { $in: ['unpaid', 'partially_paid', 'overdue'] } }),
      Invoice.countDocuments({ payment_status: 'paid' }),
      CreditDebitNote.countDocuments({ note_type: 'credit_note' }),
    ]);

    const aggregates = await Invoice.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$grand_total' },
          totalCollected: { $sum: '$paid_amount' },
          totalOutstanding: { $sum: '$balance_amount' },
          totalTax: { $sum: { $add: ['$cgst_total', '$sgst_total', '$igst_total'] } },
        },
      },
    ]);

    return {
      total_invoices: totalInvoices,
      unpaid_invoices: unpaidInvoices,
      paid_invoices: paidInvoices,
      credit_notes_count: creditNotesCount,
      total_billed: aggregates[0]?.totalBilled || 0,
      total_collected: aggregates[0]?.totalCollected || 0,
      total_outstanding: aggregates[0]?.totalOutstanding || 0,
      total_tax: aggregates[0]?.totalTax || 0,
    };
  }

  /**
   * List invoices with filters & pagination
   */
  static async getInvoices({
    invoice_type,
    payment_status,
    customer_id,
    search,
    page = 1,
    limit = 20,
  } = {}) {
    const filter = { status: { $ne: 'cancelled' } };
    if (invoice_type) filter.invoice_type = invoice_type;
    if (payment_status) filter.payment_status = payment_status;
    if (customer_id) filter.customer_id = customer_id;

    if (search) {
      filter.$or = [
        { invoice_number: { $regex: search, $options: 'i' } },
        { 'billing_address.city': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customer_id', 'display_name company_name gstin email mobile')
        .populate('sales_order_id', 'order_number customer_po_number')
        .sort({ invoice_date: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(filter),
    ]);

    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getInvoiceById(id) {
    const invoice = await Invoice.findById(id)
      .populate('customer_id')
      .populate('sales_order_id')
      .populate('dispatch_id')
      .populate('branch_id');

    if (!invoice) throw AppError.notFound('Invoice not found');
    return invoice;
  }

  /**
   * Create an invoice from Dispatch or Sales Order.
   */
  static async createInvoice(data, userId) {
    let invoiceNumber = data.invoice_number;
    if (!invoiceNumber) {
      const count = await Invoice.countDocuments();
      const prefix = data.invoice_type === 'non_gst_invoice' ? 'BOS' : 'INV';
      invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const customer = await Customer.findById(data.customer_id);
    if (!customer) throw AppError.notFound('Customer not found');

    // Auto-resolve branch_id if missing
    if (!data.branch_id && userId) {
      const u = await User.findById(userId);
      if (u?.branch_id) data.branch_id = u.branch_id;
    }
    if (!data.branch_id && customer?.branch_id) {
      data.branch_id = customer.branch_id;
    }
    if (!data.branch_id) {
      const defBranch = await Branch.findOne();
      if (defBranch) data.branch_id = defBranch._id;
    }

    // Auto-resolve billing/shipping address if missing
    if (!data.billing_address || !data.billing_address.address_line1) {
      data.billing_address = {
        address_line1: customer.billing_address?.address_line1 || 'Main Office',
        city: customer.billing_address?.city || 'Surat',
        state: customer.billing_address?.state || 'Gujarat',
        pincode: customer.billing_address?.pincode || '395002',
        gstin: customer.gstin || '',
      };
    }
    if (!data.shipping_address || !data.shipping_address.address_line1) {
      data.shipping_address = data.billing_address;
    }

    // Tax computation
    const isInterstate = Boolean(data.is_interstate);
    const rawItems = data.items || [];
    const taxCalc = GstCalculationService.calculateItemTaxes(rawItems, isInterstate);

    const processedItems = await Promise.all(
      taxCalc.items.map(async (item) => {
        let itemName = item.item_name;
        if (!itemName && item.product_id) {
          const p = await Product.findById(item.product_id);
          if (p) itemName = p.product_name;
        }
        return {
          ...item,
          item_name: itemName || 'Standard Product',
          quantity: Number(item.quantity || 1),
          rate: Number(item.rate || 0),
        };
      })
    );

    const invoice = await Invoice.create({
      ...data,
      invoice_number: invoiceNumber,
      items: processedItems,
      subtotal: taxCalc.subtotal,
      discount_total: taxCalc.discount_total,
      taxable_total: taxCalc.taxable_total,
      cgst_total: taxCalc.cgst_total,
      sgst_total: taxCalc.sgst_total,
      igst_total: taxCalc.igst_total,
      cess_total: taxCalc.cess_total,
      round_off: taxCalc.round_off,
      grand_total: taxCalc.grand_total,
      balance_amount: taxCalc.grand_total,
      paid_amount: 0,
      payment_status: 'unpaid',
      status: 'issued',
      created_by: userId,
    });

    // Update dispatch if referenced
    if (data.dispatch_id) {
      await Dispatch.findByIdAndUpdate(data.dispatch_id, { invoice_id: invoice._id });
    }

    // Update Sales Order invoiced quantities
    if (data.sales_order_id) {
      const so = await SalesOrder.findById(data.sales_order_id);
      if (so) {
        data.items.forEach((invIt) => {
          const soIt = so.items.find((i) => String(i.product_id) === String(invIt.product_id));
          if (soIt) {
            soIt.invoiced_qty = (soIt.invoiced_qty || 0) + (invIt.quantity || 0);
          }
        });
        await so.save();
      }
    }

    return invoice;
  }

  /**
   * Mock/Sandbox E-Invoice generation (IRN & QR code).
   */
  static async generateEInvoice(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw AppError.notFound('Invoice not found');

    const fakeIrn = `IRN-${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    invoice.e_invoice = {
      irn: fakeIrn,
      ack_no: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      ack_date: new Date(),
      signed_qr_code: `NIC_EINV_SANDBOX_VERIFIED_${fakeIrn}`,
      status: 'generated',
    };

    await invoice.save();
    return invoice;
  }

  /**
   * Mock/Sandbox E-Way Bill generation.
   */
  static async generateEWayBill(invoiceId, { transporter_id, vehicle_no }) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw AppError.notFound('Invoice not found');

    const ewbNumber = `EWB-${String(Math.floor(100000000000 + Math.random() * 900000000000))}`;
    const validUpto = new Date();
    validUpto.setDate(validUpto.getDate() + 3);

    invoice.e_way_bill = {
      ewb_number: ewbNumber,
      ewb_date: new Date(),
      valid_upto: validUpto,
      status: 'generated',
    };

    await invoice.save();
    return invoice;
  }

  /**
   * Record Customer Payment against Invoice.
   */
  static async recordPayment(invoiceId, { amount, payment_mode, reference_no }) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw AppError.notFound('Invoice not found');

    const newPaid = (invoice.paid_amount || 0) + Number(amount);
    const newBalance = Math.max(0, invoice.grand_total - newPaid);

    invoice.paid_amount = newPaid;
    invoice.balance_amount = newBalance;
    invoice.payment_status = newBalance === 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : 'unpaid';

    await invoice.save();
    return invoice;
  }

  /**
   * Credit and Debit Notes
   */
  static async getCreditDebitNotes({ note_type, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (note_type) filter.note_type = note_type;

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      CreditDebitNote.find(filter)
        .populate('customer_id', 'display_name company_name')
        .populate('supplier_id', 'supplier_name')
        .populate('original_invoice_id', 'invoice_number grand_total')
        .sort({ note_date: -1 })
        .skip(skip)
        .limit(limit),
      CreditDebitNote.countDocuments(filter),
    ]);

    return { notes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createCreditDebitNote(data, userId) {
    let noteNumber = data.note_number;
    if (!noteNumber) {
      const count = await CreditDebitNote.countDocuments();
      const prefix = data.note_type === 'credit_note' ? 'CN' : 'DN';
      noteNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    if (!data.party_type) {
      data.party_type = data.supplier_id ? 'supplier' : 'customer';
    }

    if (data.original_invoice_id && !data.original_invoice_number) {
      const origInv = await Invoice.findById(data.original_invoice_id);
      if (origInv) {
        data.original_invoice_number = origInv.invoice_number;
        if (!data.customer_id && origInv.customer_id) {
          data.customer_id = origInv.customer_id;
        }
      }
    }

    const taxable = Number(data.taxable_amount || 0);
    const gstRate = Number(data.gst_rate || 18);
    let cgst = Number(data.cgst_total || 0);
    let sgst = Number(data.sgst_total || 0);
    let igst = Number(data.igst_total || 0);

    if (!cgst && !sgst && !igst && taxable > 0) {
      if (data.is_interstate) {
        igst = Math.round((taxable * gstRate) / 100 * 100) / 100;
      } else {
        cgst = Math.round((taxable * (gstRate / 2)) / 100 * 100) / 100;
        sgst = Math.round((taxable * (gstRate / 2)) / 100 * 100) / 100;
      }
    }

    const grandTotal = Number(data.grand_total || (taxable + cgst + sgst + igst));

    const note = await CreditDebitNote.create({
      ...data,
      note_number: noteNumber,
      taxable_amount: taxable,
      cgst_total: cgst,
      sgst_total: sgst,
      igst_total: igst,
      grand_total: grandTotal,
      status: 'issued',
      created_by: userId,
    });

    // If credit note against customer invoice, adjust invoice balance
    if (data.note_type === 'credit_note' && data.original_invoice_id) {
      await Invoice.findByIdAndUpdate(data.original_invoice_id, {
        $inc: { balance_amount: -note.grand_total },
      });
    }

    return note;
  }

  /**
   * Invoice Ageing Analysis (0-30, 31-60, 61-90, 90+ days)
   */
  static async getInvoiceAgeing() {
    const unpaidInvoices = await Invoice.find({
      payment_status: { $in: ['unpaid', 'partially_paid', 'overdue'] },
      status: { $ne: 'cancelled' },
    }).populate('customer_id', 'display_name company_name mobile');

    const now = new Date();
    const buckets = {
      under_30: { count: 0, amount: 0, invoices: [] },
      days_31_60: { count: 0, amount: 0, invoices: [] },
      days_61_90: { count: 0, amount: 0, invoices: [] },
      above_90: { count: 0, amount: 0, invoices: [] },
    };

    unpaidInvoices.forEach((inv) => {
      const diffTime = Math.abs(now - new Date(inv.invoice_date));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const bal = inv.balance_amount || inv.grand_total;

      if (diffDays <= 30) {
        buckets.under_30.count += 1;
        buckets.under_30.amount += bal;
        buckets.under_30.invoices.push(inv);
      } else if (diffDays <= 60) {
        buckets.days_31_60.count += 1;
        buckets.days_31_60.amount += bal;
        buckets.days_31_60.invoices.push(inv);
      } else if (diffDays <= 90) {
        buckets.days_61_90.count += 1;
        buckets.days_61_90.amount += bal;
        buckets.days_61_90.invoices.push(inv);
      } else {
        buckets.above_90.count += 1;
        buckets.above_90.amount += bal;
        buckets.above_90.invoices.push(inv);
      }
    });

    return buckets;
  }
}

export default InvoiceService;
