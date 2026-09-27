import { SalesOrder } from '../models/salesOrder.model.js';
import { Customer } from '../models/customer.model.js';
import { Product } from '../models/product.model.js';
import { StockTransactionService } from './stockTransaction.service.js';
import { GstCalculationService } from './gstCalculation.service.js';
import { AppError } from '../utils/appError.js';

export class SalesOrderService {
  /**
   * List sales orders with filters & pagination.
   */
  static async getAllOrders({
    status,
    customer_id,
    branch_id,
    warehouse_id,
    search,
    page = 1,
    limit = 20,
  } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (customer_id) filter.customer_id = customer_id;
    if (branch_id) filter.branch_id = branch_id;
    if (warehouse_id) filter.warehouse_id = warehouse_id;

    if (search) {
      filter.$or = [
        { order_number: { $regex: search, $options: 'i' } },
        { customer_po_number: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      SalesOrder.find(filter)
        .populate('customer_id', 'display_name company_name gstin email mobile')
        .populate('salesperson_id', 'full_name email')
        .populate('warehouse_id', 'warehouse_name warehouse_code')
        .populate('branch_id', 'branch_name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SalesOrder.countDocuments(filter),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single order by ID.
   */
  static async getOrderById(id) {
    const order = await SalesOrder.findById(id)
      .populate('customer_id')
      .populate('salesperson_id', 'full_name email mobile designation')
      .populate('warehouse_id')
      .populate('branch_id')
      .populate('items.product_id')
      .populate('items.uom_id')
      .populate('items.purchase_requisition_ids')
      .populate('items.work_order_ids');

    if (!order) {
      throw AppError.notFound('Sales order not found');
    }
    return order;
  }

  /**
   * Create a new Sales Order.
   */
  static async createOrder(data, userId) {
    const customer = await Customer.findById(data.customer_id);
    if (!customer) {
      throw AppError.notFound('Customer not found');
    }

    // Auto-generate order number if not supplied
    let orderNumber = data.order_number;
    if (!orderNumber) {
      const count = await SalesOrder.countDocuments();
      const year = new Date().getFullYear();
      orderNumber = `SO-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    // Determine state & tax rates
    const isInterstate = Boolean(data.is_interstate);
    const taxCalc = GstCalculationService.calculateItemTaxes(data.items || [], isInterstate);

    const items = taxCalc.items.map((item) => ({
      ...item,
      ordered_qty: Number(item.ordered_qty || item.quantity || 1),
      reserved_qty: 0,
      to_purchase_qty: 0,
      to_produce_qty: 0,
      ready_qty: 0,
      dispatched_qty: 0,
      delivered_qty: 0,
      invoiced_qty: 0,
      pending_qty: Number(item.ordered_qty || item.quantity || 1),
    }));

    const order = await SalesOrder.create({
      ...data,
      order_number: orderNumber,
      items,
      subtotal: taxCalc.subtotal,
      discount_total: taxCalc.discount_total,
      taxable_amount: taxCalc.taxable_total,
      cgst_total: taxCalc.cgst_total,
      sgst_total: taxCalc.sgst_total,
      igst_total: taxCalc.igst_total,
      round_off: taxCalc.round_off,
      grand_total: taxCalc.grand_total,
      status: data.status || 'draft',
      approval: {
        status: data.require_approval ? 'pending' : 'not_required',
      },
      audit_trail: [
        {
          action: 'ORDER_CREATED',
          status_from: null,
          status_to: data.status || 'draft',
          performed_by: userId,
          performed_at: new Date(),
          remarks: 'Sales Order drafted',
        },
      ],
      created_by: userId,
    });

    return order;
  }

  /**
   * Update order status with audit trail.
   */
  static async updateOrderStatus(id, newStatus, remarks = '', userId = null) {
    const order = await SalesOrder.findById(id);
    if (!order) {
      throw AppError.notFound('Sales order not found');
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.audit_trail.push({
      action: 'STATUS_CHANGE',
      status_from: previousStatus,
      status_to: newStatus,
      performed_by: userId,
      performed_at: new Date(),
      remarks,
    });

    await order.save();
    return order;
  }

  /**
   * Approve or reject a Sales Order.
   */
  static async approveOrder(id, { approve, remarks }, userId) {
    const order = await SalesOrder.findById(id);
    if (!order) {
      throw AppError.notFound('Sales order not found');
    }

    const previousStatus = order.status;
    order.approval.status = approve ? 'approved' : 'rejected';
    order.approval.approved_by = userId;
    order.approval.approved_at = new Date();
    order.approval.remarks = remarks || '';

    if (approve) {
      order.status = 'approved';
    } else {
      order.status = 'cancelled';
    }

    order.audit_trail.push({
      action: approve ? 'ORDER_APPROVED' : 'ORDER_REJECTED',
      status_from: previousStatus,
      status_to: order.status,
      performed_by: userId,
      performed_at: new Date(),
      remarks,
    });

    await order.save();
    return order;
  }

  /**
   * Reserve inventory stock against order lines.
   */
  static async reserveOrderStock(id, { reservations }, userId) {
    const order = await SalesOrder.findById(id);
    if (!order) {
      throw AppError.notFound('Sales order not found');
    }

    const results = [];
    for (const res of reservations) {
      const item = order.items.id(res.item_id);
      if (!item) continue;

      const reservation = await StockTransactionService.reserveStock({
        sales_order_id: order._id,
        sales_order_item_id: item._id,
        product_id: item.product_id,
        warehouse_id: res.warehouse_id || order.warehouse_id,
        batch_id: res.batch_id || null,
        reserved_qty: res.qty,
        notes: `Reserved for ${order.order_number}`,
        userId,
      });

      item.reserved_qty = (item.reserved_qty || 0) + res.qty;
      item.ready_qty = (item.ready_qty || 0) + res.qty;
      results.push(reservation);
    }

    order.status = 'processing';
    order.audit_trail.push({
      action: 'STOCK_RESERVED',
      status_from: order.status,
      status_to: 'processing',
      performed_by: userId,
      performed_at: new Date(),
      remarks: `Reserved stock for ${reservations.length} line items`,
    });

    await order.save();
    return { order, reservations: results };
  }

  /**
   * Pending orders overview and processing pipeline.
   */
  static async getPendingOrders() {
    return SalesOrder.find({
      status: { $in: ['approved', 'processing', 'partially_dispatched'] },
    })
      .populate('customer_id', 'display_name company_name')
      .populate('warehouse_id', 'warehouse_name')
      .sort({ expected_delivery_date: 1 });
  }

  /**
   * Order processing metrics.
   */
  static async getOrderProcessingMetrics() {
    const [draftCount, pendingApprovalCount, approvedCount, processingCount, dispatchedCount] =
      await Promise.all([
        SalesOrder.countDocuments({ status: 'draft' }),
        SalesOrder.countDocuments({ status: 'pending_approval' }),
        SalesOrder.countDocuments({ status: 'approved' }),
        SalesOrder.countDocuments({ status: 'processing' }),
        SalesOrder.countDocuments({ status: { $in: ['partially_dispatched', 'dispatched'] } }),
      ]);

    return {
      draft: draftCount,
      pending_approval: pendingApprovalCount,
      approved: approvedCount,
      processing: processingCount,
      dispatched: dispatchedCount,
    };
  }
}

export default SalesOrderService;
