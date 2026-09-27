import { Dispatch } from '../models/dispatch.model.js';
import { Transporter } from '../models/transporter.model.js';
import { SalesReturn } from '../models/salesReturn.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { StockTransactionService } from './stockTransaction.service.js';
import { AppError } from '../utils/appError.js';

export class DispatchService {
  /**
   * Transporters
   */
  static async getTransporters() {
    return Transporter.find({ status: 'active' }).sort({ transporter_name: 1 });
  }

  static async createTransporter(data, userId) {
    let code = data.transporter_code;
    if (!code) {
      const count = await Transporter.countDocuments();
      code = `TRP-${String(count + 1).padStart(4, '0')}`;
    }
    return Transporter.create({ ...data, transporter_code: code, created_by: userId });
  }

  /**
   * Dispatches List & Detail
   */
  static async getDispatches({ status, search, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { dispatch_number: { $regex: search, $options: 'i' } },
        { lr_number: { $regex: search, $options: 'i' } },
        { tracking_number: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [dispatches, total] = await Promise.all([
      Dispatch.find(filter)
        .populate('customer_id', 'display_name company_name')
        .populate('sales_order_id', 'order_number customer_po_number')
        .populate('transporter_id', 'transporter_name phone')
        .populate('warehouse_id', 'warehouse_name')
        .sort({ dispatch_date: -1 })
        .skip(skip)
        .limit(limit),
      Dispatch.countDocuments(filter),
    ]);

    return { dispatches, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getDispatchById(id) {
    const dispatch = await Dispatch.findById(id)
      .populate('customer_id')
      .populate('sales_order_id')
      .populate('transporter_id')
      .populate('warehouse_id')
      .populate('items.product_id');

    if (!dispatch) throw AppError.notFound('Dispatch not found');
    return dispatch;
  }

  /**
   * Create Dispatch Order against Sales Order items.
   */
  static async createDispatch(data, userId) {
    const salesOrder = await SalesOrder.findById(data.sales_order_id);
    if (!salesOrder) throw AppError.notFound('Sales order not found');

    let dispatchNumber = data.dispatch_number;
    if (!dispatchNumber) {
      const count = await Dispatch.countDocuments();
      dispatchNumber = `DSP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const dispatch = await Dispatch.create({
      ...data,
      dispatch_number: dispatchNumber,
      status: 'ready_to_ship',
      created_by: userId,
    });

    return dispatch;
  }

  /**
   * Ship order: Atomically deduct inventory & update sales order lifecycle.
   */
  static async shipDispatch(dispatchId, userId) {
    const dispatch = await Dispatch.findById(dispatchId);
    if (!dispatch) throw AppError.notFound('Dispatch not found');
    if (dispatch.stock_deducted) {
      throw AppError.badRequest('Dispatch has already deducted inventory stock');
    }

    const salesOrder = await SalesOrder.findById(dispatch.sales_order_id);

    for (const item of dispatch.items) {
      // 1. Deduct stock via StockTransactionService
      await StockTransactionService.recordTransaction({
        transaction_type: 'DISPATCH',
        product_id: item.product_id,
        warehouse_id: dispatch.warehouse_id,
        batch_id: item.batch_id,
        batch_number: item.batch_number,
        qty: item.dispatch_qty,
        reference_type: 'Dispatch',
        reference_id: dispatch._id,
        reference_no: dispatch.dispatch_number,
        remarks: `Dispatched against SO ${salesOrder?.order_number || ''}`,
        performed_by: userId,
      });

      // 2. Update line item progress in Sales Order
      if (salesOrder) {
        const soItem = salesOrder.items.find(
          (soIt) =>
            String(soIt._id) === String(item.sales_order_item_id) ||
            String(soIt.product_id) === String(item.product_id)
        );
        if (soItem) {
          soItem.dispatched_qty = (soItem.dispatched_qty || 0) + item.dispatch_qty;
          soItem.pending_qty = Math.max(0, soItem.ordered_qty - soItem.dispatched_qty);
        }
      }
    }

    dispatch.stock_deducted = true;
    dispatch.status = 'dispatched';
    dispatch.tracking_history.push({
      status: 'Dispatched from Warehouse',
      location: 'Central Distribution Center',
      timestamp: new Date(),
      notes: `LR #${dispatch.lr_number || 'N/A'}, Vehicle #${dispatch.vehicle_no || 'N/A'}`,
    });
    await dispatch.save();

    if (salesOrder) {
      const allDispatched = salesOrder.items.every((it) => (it.pending_qty || 0) === 0);
      salesOrder.status = allDispatched ? 'dispatched' : 'partially_dispatched';
      salesOrder.audit_trail.push({
        action: 'DISPATCH_CONFIRMED',
        status_from: salesOrder.status,
        status_to: salesOrder.status,
        performed_by: userId,
        performed_at: new Date(),
        remarks: `Dispatched shipment ${dispatch.dispatch_number}`,
      });
      await salesOrder.save();
    }

    return dispatch;
  }

  /**
   * Record Proof of Delivery (POD)
   */
  static async recordPod(dispatchId, podData, userId) {
    const dispatch = await Dispatch.findById(dispatchId);
    if (!dispatch) throw AppError.notFound('Dispatch not found');

    dispatch.proof_of_delivery = {
      ...podData,
      received_date: podData.received_date || new Date(),
      verified_by: userId,
    };
    dispatch.status = 'delivered';
    dispatch.tracking_history.push({
      status: 'Delivered',
      location: podData.received_by_name || 'Customer Premises',
      timestamp: new Date(),
      notes: `Signed and acknowledged by ${podData.received_by_name || 'recipient'}`,
    });

    await dispatch.save();

    // Update Sales Order delivered quantities
    const salesOrder = await SalesOrder.findById(dispatch.sales_order_id);
    if (salesOrder) {
      dispatch.items.forEach((item) => {
        const soItem = salesOrder.items.find(
          (soIt) =>
            String(soIt._id) === String(item.sales_order_item_id) ||
            String(soIt.product_id) === String(item.product_id)
        );
        if (soItem) {
          soItem.delivered_qty = (soItem.delivered_qty || 0) + item.dispatch_qty;
        }
      });
      await salesOrder.save();
    }

    return dispatch;
  }

  /**
   * Sales Returns & RTO
   */
  static async getReturns({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [returns, total] = await Promise.all([
      SalesReturn.find()
        .populate('customer_id', 'display_name company_name')
        .populate('dispatch_id', 'dispatch_number')
        .populate('sales_order_id', 'order_number')
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name product_code')
        .sort({ return_date: -1 })
        .skip(skip)
        .limit(limit),
      SalesReturn.countDocuments(),
    ]);

    return { returns, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createReturn(data, userId) {
    let returnNumber = data.return_number;
    if (!returnNumber) {
      const count = await SalesReturn.countDocuments();
      returnNumber = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    return SalesReturn.create({
      ...data,
      return_number: returnNumber,
      status: 'received',
      created_by: userId,
    });
  }

  static async restockReturn(returnId, userId) {
    const sReturn = await SalesReturn.findById(returnId);
    if (!sReturn) throw AppError.notFound('Sales return not found');
    if (sReturn.stock_restocked) {
      throw AppError.badRequest('Return already restocked');
    }

    for (const item of sReturn.items) {
      if (item.disposition === 'restock' && item.return_qty > 0) {
        await StockTransactionService.recordTransaction({
          transaction_type: 'RETURN',
          product_id: item.product_id,
          warehouse_id: sReturn.warehouse_id,
          batch_id: item.batch_id,
          qty: item.return_qty,
          reference_type: 'SalesReturn',
          reference_id: sReturn._id,
          reference_no: sReturn.return_number,
          remarks: `Restocked from customer return`,
          performed_by: userId,
        });
      }
    }

    sReturn.stock_restocked = true;
    sReturn.status = 'restocked';
    await sReturn.save();
    return sReturn;
  }
}

export default DispatchService;
