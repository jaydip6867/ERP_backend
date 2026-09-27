import { Quotation } from '../models/quotation.model.js';
import { ChannelPartner } from '../models/channelPartner.model.js';
import { RetailPos } from '../models/retailPos.model.js';
import { Customer } from '../models/customer.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/appError.js';
import { getNextNumber } from './numberSeries.service.js';
import { logAudit } from '../utils/audit.util.js';

class SalesService {
  // --- CALCULATION ENGINE ---
  calculateQuotationTotals(items = [], isInterstate = false) {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const calculatedItems = items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const discountPercent = Number(item.discount_percent) || 0;
      const gstRate = Number(item.gst_rate) || 0;

      const itemGross = quantity * rate;
      const discountAmount = Number(((itemGross * discountPercent) / 100).toFixed(2));
      const taxableAmount = Number((itemGross - discountAmount).toFixed(2));

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (isInterstate) {
        igstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
      } else {
        cgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
        sgstAmount = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
      }

      const totalAmount = Number((taxableAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));

      subtotal += itemGross;
      discountTotal += discountAmount;
      taxableTotal += taxableAmount;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;

      return {
        ...item,
        quantity,
        rate,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        taxable_amount: taxableAmount,
        gst_rate: gstRate,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        total_amount: totalAmount,
      };
    });

    const exactGrandTotal = taxableTotal + cgstTotal + sgstTotal + igstTotal;
    const roundedTotal = Math.round(exactGrandTotal);
    const roundOff = Number((roundedTotal - exactGrandTotal).toFixed(2));

    return {
      items: calculatedItems,
      subtotal: Number(subtotal.toFixed(2)),
      discount_total: Number(discountTotal.toFixed(2)),
      taxable_total: Number(taxableTotal.toFixed(2)),
      cgst_total: Number(cgstTotal.toFixed(2)),
      sgst_total: Number(sgstTotal.toFixed(2)),
      igst_total: Number(igstTotal.toFixed(2)),
      round_off: roundOff,
      grand_total: roundedTotal,
    };
  }

  // --- QUOTATIONS ---
  async listQuotations(query = {}, scopeFilter = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      customer_id,
      sales_person_id,
      branch_id,
      sort = '-createdAt',
    } = query;

    const filter = { ...scopeFilter };

    if (search) {
      filter.$or = [
        { quotation_number: { $regex: search, $options: 'i' } },
        { base_number: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (customer_id) filter.customer_id = customer_id;
    if (sales_person_id) filter.sales_person_id = sales_person_id;
    if (branch_id) filter.branch_id = branch_id;

    const skip = (Number(page) - 1) * Number(limit);
    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('customer_id', 'company_name customer_code email phone')
        .populate('sales_person_id', 'full_name user_code')
        .populate('branch_id', 'branch_name branch_code')
        .populate('items.product_id', 'product_name product_code sku')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Quotation.countDocuments(filter),
    ]);

    return {
      items: quotations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getQuotationById(id) {
    const quotation = await Quotation.findById(id)
      .populate('customer_id')
      .populate('sales_person_id', 'full_name email mobile user_code designation')
      .populate('branch_id')
      .populate('channel_partner_id')
      .populate('items.product_id')
      .populate('items.uom_id')
      .populate('discount_approved_by', 'full_name');

    if (!quotation) throw new AppError('Quotation not found', 404);
    return quotation;
  }

  async createQuotation(payload, currentUser, req) {
    const isInterstate = Boolean(payload.is_interstate);
    const calculated = this.calculateQuotationTotals(payload.items || [], isInterstate);

    const baseNumber = await getNextNumber('QUOTATION', { prefix: 'QUO-' });
    const quotationNumber = `${baseNumber}-R0`;

    // Check discount threshold (>15% discount triggers approval requirement)
    let discountApprovalStatus = 'not_required';
    const highDiscount = calculated.items.some((i) => i.discount_percent > 15);
    if (highDiscount) {
      discountApprovalStatus = 'pending';
    }

    const quotation = await Quotation.create({
      ...payload,
      ...calculated,
      base_number: baseNumber,
      revision_number: 'R0',
      quotation_number: quotationNumber,
      discount_approval_status: discountApprovalStatus,
      sales_person_id: payload.sales_person_id || currentUser?._id,
      branch_id: payload.branch_id || currentUser?.branch_id,
      created_by: currentUser?._id,
    });

    await logAudit({
      user: currentUser,
      action: 'CREATE',
      module: 'Quotation',
      record_id: quotation._id,
      after: quotation.toObject(),
      req,
    });

    return quotation;
  }

  async updateQuotation(id, payload, currentUser, req) {
    const quotation = await Quotation.findById(id);
    if (!quotation) throw new AppError('Quotation not found', 404);

    if (['converted_to_order', 'accepted'].includes(quotation.status)) {
      throw new AppError('Cannot edit quotation in converted or accepted status. Create a revision instead.', 400);
    }

    const isInterstate = payload.is_interstate !== undefined ? Boolean(payload.is_interstate) : quotation.is_interstate;
    const items = payload.items || quotation.items;
    const calculated = this.calculateQuotationTotals(items, isInterstate);

    const before = quotation.toObject();

    let discountApprovalStatus = quotation.discount_approval_status;
    const highDiscount = calculated.items.some((i) => i.discount_percent > 15);
    if (highDiscount && discountApprovalStatus !== 'approved') {
      discountApprovalStatus = 'pending';
    }

    Object.assign(quotation, payload, calculated, {
      discount_approval_status: discountApprovalStatus,
      updated_by: currentUser?._id,
    });

    await quotation.save();

    await logAudit({
      user: currentUser,
      action: 'UPDATE',
      module: 'Quotation',
      record_id: quotation._id,
      before,
      after: quotation.toObject(),
      req,
    });

    return quotation;
  }

  async createRevision(id, payload = {}, currentUser, req) {
    const parentQuotation = await Quotation.findById(id);
    if (!parentQuotation) throw new AppError('Original quotation not found', 404);

    // Determine next revision number
    const countRevisions = await Quotation.countDocuments({ base_number: parentQuotation.base_number });
    const revisionNumber = `R${countRevisions}`;
    const quotationNumber = `${parentQuotation.base_number}-${revisionNumber}`;

    const items = payload.items || parentQuotation.items.map((i) => i.toObject());
    const isInterstate = payload.is_interstate !== undefined ? Boolean(payload.is_interstate) : parentQuotation.is_interstate;
    const calculated = this.calculateQuotationTotals(items, isInterstate);

    const highDiscount = calculated.items.some((i) => i.discount_percent > 15);

    const revision = await Quotation.create({
      ...parentQuotation.toObject(),
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      ...payload,
      ...calculated,
      base_number: parentQuotation.base_number,
      revision_number: revisionNumber,
      quotation_number: quotationNumber,
      parent_quotation_id: parentQuotation._id,
      status: 'draft',
      discount_approval_status: highDiscount ? 'pending' : 'not_required',
      created_by: currentUser?._id,
    });

    await logAudit({
      user: currentUser,
      action: 'CREATE_REVISION',
      module: 'Quotation',
      record_id: revision._id,
      before: { parent_id: parentQuotation._id, revision: parentQuotation.revision_number },
      after: { new_id: revision._id, revision: revisionNumber },
      req,
    });

    return revision;
  }

  async approveDiscount(id, { action, remarks }, currentUser, req) {
    const quotation = await Quotation.findById(id);
    if (!quotation) throw new AppError('Quotation not found', 404);

    const before = quotation.toObject();
    quotation.discount_approval_status = action === 'approve' ? 'approved' : 'rejected';
    quotation.discount_approved_by = currentUser?._id;
    quotation.discount_approval_remarks = remarks || '';
    if (action === 'approve') {
      quotation.status = 'approved';
    }
    await quotation.save();

    await logAudit({
      user: currentUser,
      action: 'APPROVE_DISCOUNT',
      module: 'Quotation',
      record_id: quotation._id,
      before,
      after: quotation.toObject(),
      req,
    });

    return quotation;
  }

  async convertToOrder(id, currentUser, req) {
    const quotation = await Quotation.findById(id);
    if (!quotation) throw new AppError('Quotation not found', 404);

    if (quotation.discount_approval_status === 'pending') {
      throw new AppError('Cannot convert to order: Special discount is pending approval', 400);
    }

    quotation.status = 'converted_to_order';
    await quotation.save();

    // Increment customer total orders count
    await Customer.findByIdAndUpdate(quotation.customer_id, {
      $inc: { total_orders_count: 1 },
      last_order_date: new Date(),
    });

    await logAudit({
      user: currentUser,
      action: 'CONVERT_TO_ORDER',
      module: 'Quotation',
      record_id: quotation._id,
      after: { quotation_id: quotation._id, status: quotation.status },
      req,
    });

    return { message: 'Quotation marked as converted to Sales Order', quotation };
  }

  // --- CHANNEL PARTNERS ---
  async listChannelPartners() {
    return ChannelPartner.find().sort({ partner_name: 1 });
  }

  async createChannelPartner(payload) {
    if (!payload.partner_code) {
      payload.partner_code = await getNextNumber('PARTNER', { prefix: 'CP-' });
    }
    return ChannelPartner.create(payload);
  }

  async updateChannelPartner(id, payload) {
    const cp = await ChannelPartner.findByIdAndUpdate(id, payload, { new: true });
    if (!cp) throw new AppError('Channel partner not found', 404);
    return cp;
  }

  // --- RETAIL POS ---
  async createPosSale(payload, currentUser) {
    const billNumber = await getNextNumber('POS_BILL', { prefix: 'POS-' });

    let subtotal = 0;
    let taxTotal = 0;
    const items = (payload.items || []).map((item) => {
      const quantity = Number(item.quantity) || 1;
      const rate = Number(item.rate) || 0;
      const discount = Number(item.discount_amount) || 0;
      const gstRate = Number(item.gst_rate) || 18;
      const itemTaxable = quantity * rate - discount;
      const tax = (itemTaxable * gstRate) / 100;
      const total = itemTaxable + tax;

      subtotal += itemTaxable;
      taxTotal += tax;

      return {
        ...item,
        tax_amount: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    });

    const grandTotal = Math.round(subtotal + taxTotal);
    const amountPaid = Number(payload.amount_paid) || grandTotal;
    const changeReturned = Math.max(0, amountPaid - grandTotal);

    const sale = await RetailPos.create({
      ...payload,
      bill_number: billNumber,
      branch_id: payload.branch_id || currentUser?.branch_id,
      cashier_id: currentUser?._id,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      tax_total: Number(taxTotal.toFixed(2)),
      grand_total: grandTotal,
      amount_paid: amountPaid,
      change_returned: changeReturned,
    });

    // Automatically decrement product stock for POS items
    for (const item of items) {
      if (item.product_id) {
        await Product.findByIdAndUpdate(item.product_id, {
          $inc: { current_stock: -item.quantity },
        });
      }
    }

    return sale;
  }

  async getDailyRetailSummary(dateStr, branchId) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const filter = {
      bill_date: { $gte: start, $lte: end },
      status: 'completed',
    };
    if (branchId) filter.branch_id = branchId;

    const [sales, paymentBreakdown] = await Promise.all([
      RetailPos.find(filter).populate('cashier_id', 'full_name').sort('-createdAt'),
      RetailPos.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$payment_mode',
            total_amount: { $sum: '$grand_total' },
            bills_count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalSales = sales.reduce((sum, s) => sum + s.grand_total, 0);

    return {
      date: date.toISOString().split('T')[0],
      totalBills: sales.length,
      totalSalesAmount: totalSales,
      paymentBreakdown,
      recentBills: sales.slice(0, 20),
    };
  }
}

export const salesService = new SalesService();
export default salesService;
