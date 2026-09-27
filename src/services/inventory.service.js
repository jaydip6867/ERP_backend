import { StockLedger } from '../models/stockLedger.model.js';
import { StockTransfer } from '../models/stockTransfer.model.js';
import { StockAdjustment } from '../models/stockAdjustment.model.js';
import { PhysicalCount } from '../models/physicalCount.model.js';
import { Batch } from '../models/batch.model.js';
import { StockReservation } from '../models/stockReservation.model.js';
import { Product } from '../models/product.model.js';
import { Warehouse } from '../models/warehouse.model.js';
import { StockTransactionService } from './stockTransaction.service.js';
import { AppError } from '../utils/appError.js';

export class InventoryService {
  /**
   * Executive inventory dashboard metrics.
   */
  static async getDashboardMetrics() {
    const [totalProducts, lowStockProducts, totalBatches, quarantineBatches, activeReservations, pendingTransfers] =
      await Promise.all([
        Product.countDocuments({ status: 'active' }),
        Product.countDocuments({
          status: 'active',
          $expr: { $lte: ['$current_stock', '$reorder_level'] },
        }),
        Batch.countDocuments({ status: 'active' }),
        Batch.countDocuments({ status: 'quarantine' }),
        StockReservation.countDocuments({ status: 'active' }),
        StockTransfer.countDocuments({ status: { $in: ['draft', 'dispatched', 'in_transit'] } }),
      ]);

    // Calculate total stock valuation
    const stockValuation = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalValuation: { $sum: { $multiply: ['$current_stock', '$purchase_rate'] } },
          totalUnits: { $sum: '$current_stock' },
        },
      },
    ]);

    return {
      total_products: totalProducts,
      low_stock_products: lowStockProducts,
      total_batches: totalBatches,
      quarantine_batches: quarantineBatches,
      active_reservations: activeReservations,
      pending_transfers: pendingTransfers,
      total_valuation: stockValuation[0]?.totalValuation || 0,
      total_units: stockValuation[0]?.totalUnits || 0,
    };
  }

  /**
   * Stock Summary across products and warehouses.
   */
  static async getStockSummary({ warehouse_id, product_id, search, low_stock, page = 1, limit = 20 } = {}) {
    const filter = { status: 'active' };
    if (product_id) filter._id = product_id;
    if (search) {
      filter.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { product_code: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (low_stock === 'true' || low_stock === true) {
      filter.$expr = { $lte: ['$current_stock', '$reorder_level'] };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category_id', 'category_name')
        .populate('uom_id', 'uom_name abbreviation')
        .sort({ product_name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    // Enrich with active reservations and latest warehouse breakdowns
    const enriched = await Promise.all(
      products.map(async (prod) => {
        const reservations = await StockReservation.aggregate([
          { $match: { product_id: prod._id, status: 'active' } },
          { $group: { _id: null, total: { $sum: '$reserved_qty' } } },
        ]);
        const reservedQty = reservations[0]?.total || 0;
        const availableQty = Math.max(0, prod.current_stock - reservedQty);

        return {
          ...prod.toObject(),
          reserved_stock: reservedQty,
          available_stock: availableQty,
          is_low_stock: prod.current_stock <= (prod.reorder_level || 0),
        };
      })
    );

    return { items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Stock Ledger historical transactions.
   */
  static async getStockLedger({ warehouse_id, product_id, transaction_type, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (warehouse_id) filter.warehouse_id = warehouse_id;
    if (product_id) filter.product_id = product_id;
    if (transaction_type) filter.transaction_type = transaction_type;

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      StockLedger.find(filter)
        .populate('product_id', 'product_name product_code sku')
        .populate('warehouse_id', 'warehouse_name warehouse_code')
        .populate('performed_by', 'full_name')
        .sort({ transaction_date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockLedger.countDocuments(filter),
    ]);

    return { entries, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Inter-warehouse Stock Transfers.
   */
  static async getTransfers({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [transfers, total] = await Promise.all([
      StockTransfer.find(filter)
        .populate('from_warehouse_id', 'warehouse_name warehouse_code')
        .populate('to_warehouse_id', 'warehouse_name warehouse_code')
        .populate('items.product_id', 'product_name product_code')
        .sort({ transfer_date: -1 })
        .skip(skip)
        .limit(limit),
      StockTransfer.countDocuments(filter),
    ]);

    return { transfers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createTransfer(data, userId) {
    let transferNumber = data.transfer_number;
    if (!transferNumber) {
      const count = await StockTransfer.countDocuments();
      transferNumber = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    const transfer = await StockTransfer.create({
      ...data,
      transfer_number: transferNumber,
      status: 'draft',
      created_by: userId,
    });
    return transfer;
  }

  static async completeTransfer(transferId, userId) {
    const transfer = await StockTransfer.findById(transferId);
    if (!transfer) throw AppError.notFound('Transfer not found');
    if (transfer.status === 'completed') {
      throw AppError.badRequest('Transfer already completed');
    }

    for (const item of transfer.items) {
      // 1. Deduct from source warehouse
      await StockTransactionService.recordTransaction({
        transaction_type: 'TRANSFER_OUT',
        product_id: item.product_id,
        warehouse_id: transfer.from_warehouse_id,
        batch_id: item.batch_id,
        batch_number: item.batch_number,
        qty: item.transfer_qty,
        reference_type: 'StockTransfer',
        reference_id: transfer._id,
        reference_no: transfer.transfer_number,
        remarks: `Transferred to warehouse`,
        performed_by: userId,
      });

      // 2. Add into destination warehouse
      await StockTransactionService.recordTransaction({
        transaction_type: 'TRANSFER_IN',
        product_id: item.product_id,
        warehouse_id: transfer.to_warehouse_id,
        batch_number: item.batch_number,
        qty: item.transfer_qty,
        reference_type: 'StockTransfer',
        reference_id: transfer._id,
        reference_no: transfer.transfer_number,
        remarks: `Received from source warehouse`,
        performed_by: userId,
      });
    }

    transfer.status = 'completed';
    transfer.received_at = new Date();
    await transfer.save();
    return transfer;
  }

  /**
   * Stock Adjustments.
   */
  static async getAdjustments({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [adjustments, total] = await Promise.all([
      StockAdjustment.find(filter)
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name product_code')
        .populate('approved_by', 'full_name')
        .sort({ adjustment_date: -1 })
        .skip(skip)
        .limit(limit),
      StockAdjustment.countDocuments(filter),
    ]);

    return { adjustments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createAdjustment(data, userId) {
    let adjustmentNumber = data.adjustment_number;
    if (!adjustmentNumber) {
      const count = await StockAdjustment.countDocuments();
      adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    const adjustment = await StockAdjustment.create({
      ...data,
      adjustment_number: adjustmentNumber,
      status: 'draft',
      created_by: userId,
    });
    return adjustment;
  }

  static async approveAdjustment(adjustmentId, userId) {
    const adjustment = await StockAdjustment.findById(adjustmentId);
    if (!adjustment) throw AppError.notFound('Adjustment not found');
    if (adjustment.status === 'approved') {
      throw AppError.badRequest('Adjustment already approved and posted');
    }

    // Apply adjustments through atomic StockTransactionService
    for (const item of adjustment.items) {
      if (item.adjusted_qty === 0) continue;

      const isPositive = item.adjusted_qty > 0;
      await StockTransactionService.recordTransaction({
        transaction_type: isPositive ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        product_id: item.product_id,
        warehouse_id: adjustment.warehouse_id,
        batch_id: item.batch_id,
        qty: Math.abs(item.adjusted_qty),
        unit_cost: item.cost_rate || 0,
        reference_type: 'StockAdjustment',
        reference_id: adjustment._id,
        reference_no: adjustment.adjustment_number,
        remarks: item.reason || adjustment.remarks || 'Stock reconciliation',
        performed_by: userId,
      });
    }

    adjustment.status = 'approved';
    adjustment.approved_by = userId;
    adjustment.approved_at = new Date();
    await adjustment.save();
    return adjustment;
  }

  /**
   * Batches & Quarantine.
   */
  static async getBatches({ status, warehouse_id, product_id, page = 1, limit = 30 } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (warehouse_id) filter.warehouse_id = warehouse_id;
    if (product_id) filter.product_id = product_id;

    const skip = (page - 1) * limit;
    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate('product_id', 'product_name product_code')
        .populate('warehouse_id', 'warehouse_name')
        .sort({ expiry_date: 1 })
        .skip(skip)
        .limit(limit),
      Batch.countDocuments(filter),
    ]);

    return { batches, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateBatchStatus(batchId, status, remarks = '') {
    const batch = await Batch.findById(batchId);
    if (!batch) throw AppError.notFound('Batch not found');
    batch.status = status;
    await batch.save();
    return batch;
  }

  /**
   * Reservations list.
   */
  static async getReservations({ status = 'active', page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [reservations, total] = await Promise.all([
      StockReservation.find(filter)
        .populate('sales_order_id', 'order_number customer_po_number')
        .populate('product_id', 'product_name product_code')
        .populate('warehouse_id', 'warehouse_name')
        .sort({ reserved_at: -1 })
        .skip(skip)
        .limit(limit),
      StockReservation.countDocuments(filter),
    ]);

    return { reservations, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Physical Counts.
   */
  static async getPhysicalCounts({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [counts, total] = await Promise.all([
      PhysicalCount.find()
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name product_code')
        .sort({ count_date: -1 })
        .skip(skip)
        .limit(limit),
      PhysicalCount.countDocuments(),
    ]);

    return { counts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default InventoryService;
