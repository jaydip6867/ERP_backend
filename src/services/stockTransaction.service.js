import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { Batch } from '../models/batch.model.js';
import { StockLedger } from '../models/stockLedger.model.js';
import { StockReservation } from '../models/stockReservation.model.js';
import { AppError } from '../utils/appError.js';

/**
 * StockTransactionService: The single, atomic source of truth for all inventory movements.
 * Enforces business rule: Current stock must NOT be manually updated without a ledger transaction.
 */
export class StockTransactionService {
  /**
   * Post an atomic inventory transaction.
   *
   * @param {object} params
   * @param {'GRN'|'MATERIAL_ISSUE'|'PRODUCTION_RECEIPT'|'DISPATCH'|'RETURN'|'ADJUSTMENT_IN'|'ADJUSTMENT_OUT'|'TRANSFER_IN'|'TRANSFER_OUT'|'OPENING_STOCK'} params.transaction_type
   * @param {string} params.product_id
   * @param {string} params.warehouse_id
   * @param {string} [params.batch_id]
   * @param {string} [params.batch_number]
   * @param {number} params.qty - Absolute quantity
   * @param {number} [params.unit_cost=0]
   * @param {string} params.reference_type - Document model name
   * @param {string} [params.reference_id]
   * @param {string} params.reference_no
   * @param {string} [params.remarks='']
   * @param {string} [params.performed_by]
   */
  static async recordTransaction({
    transaction_type,
    product_id,
    warehouse_id,
    batch_id = null,
    batch_number = null,
    qty,
    unit_cost = 0,
    reference_type,
    reference_id = null,
    reference_no,
    remarks = '',
    performed_by = null,
  }) {
    if (!qty || qty <= 0) {
      throw AppError.badRequest('Transaction quantity must be greater than zero');
    }

    const product = await Product.findById(product_id);
    if (!product) {
      throw AppError.notFound('Product not found');
    }

    // Determine direction (+ or -)
    const isAddition = [
      'GRN',
      'PRODUCTION_RECEIPT',
      'RETURN',
      'ADJUSTMENT_IN',
      'TRANSFER_IN',
      'OPENING_STOCK',
    ].includes(transaction_type);

    const qtyIn = isAddition ? qty : 0;
    const qtyOut = isAddition ? 0 : qty;

    // Get current warehouse balance from latest ledger entry
    const lastEntry = await StockLedger.findOne({
      product_id,
      warehouse_id,
    }).sort({ createdAt: -1 });

    const currentWarehouseBalance = lastEntry ? lastEntry.balance_qty : 0;
    const newWarehouseBalance = isAddition
      ? currentWarehouseBalance + qty
      : currentWarehouseBalance - qty;

    // Validate negative stock constraint
    if (!isAddition && newWarehouseBalance < 0 && !product.stock_settings?.allow_negative_stock) {
      throw AppError.badRequest(
        `Insufficient stock for '${product.product_name}'. Available: ${currentWarehouseBalance}, Requested: ${qty}`
      );
    }

    // Handle batch deduction/addition
    let resolvedBatch = null;
    if (batch_id) {
      resolvedBatch = await Batch.findById(batch_id);
    } else if (batch_number) {
      resolvedBatch = await Batch.findOne({ batch_number, product_id, warehouse_id });
    }

    if (resolvedBatch) {
      if (isAddition) {
        resolvedBatch.current_qty += qty;
        if (resolvedBatch.status === 'depleted') {
          resolvedBatch.status = 'active';
        }
      } else {
        if (resolvedBatch.current_qty < qty && !product.stock_settings?.allow_negative_stock) {
          throw AppError.badRequest(
            `Insufficient batch stock for Batch '${resolvedBatch.batch_number}'. Available: ${resolvedBatch.current_qty}, Requested: ${qty}`
          );
        }
        resolvedBatch.current_qty -= qty;
        if (resolvedBatch.current_qty === 0) {
          resolvedBatch.status = 'depleted';
        }
      }
      await resolvedBatch.save();
    }

    // Create immutable Stock Ledger entry
    const ledgerEntry = await StockLedger.create({
      transaction_date: new Date(),
      transaction_type,
      product_id,
      warehouse_id,
      batch_id: resolvedBatch ? resolvedBatch._id : null,
      batch_number: resolvedBatch ? resolvedBatch.batch_number : batch_number,
      qty_in: qtyIn,
      qty_out: qtyOut,
      balance_qty: newWarehouseBalance,
      unit_cost: unit_cost || product.purchase_rate || 0,
      total_cost: (unit_cost || product.purchase_rate || 0) * qty,
      reference_type,
      reference_id,
      reference_no,
      remarks,
      performed_by,
    });

    // Update Product overall current stock
    if (isAddition) {
      product.current_stock = (product.current_stock || 0) + qty;
    } else {
      product.current_stock = Math.max(0, (product.current_stock || 0) - qty);
    }
    await product.save();

    return ledgerEntry;
  }

  /**
   * Reserve stock for a Sales Order item.
   */
  static async reserveStock({
    sales_order_id,
    sales_order_item_id,
    product_id,
    warehouse_id,
    batch_id = null,
    reserved_qty,
    expiry_date = null,
    notes = '',
    userId = null,
  }) {
    if (reserved_qty <= 0) {
      throw AppError.badRequest('Reserved quantity must be greater than zero');
    }

    // Check available unreserved stock
    const lastEntry = await StockLedger.findOne({ product_id, warehouse_id }).sort({ createdAt: -1 });
    const currentStock = lastEntry ? lastEntry.balance_qty : 0;

    const activeReservations = await StockReservation.aggregate([
      { $match: { product_id: new mongoose.Types.ObjectId(product_id), warehouse_id: new mongoose.Types.ObjectId(warehouse_id), status: 'active' } },
      { $group: { _id: null, total: { $sum: '$reserved_qty' } } },
    ]);
    const totalReserved = activeReservations[0]?.total || 0;
    const availableToReserve = currentStock - totalReserved;

    if (reserved_qty > availableToReserve) {
      throw AppError.badRequest(
        `Cannot reserve ${reserved_qty} units. Only ${availableToReserve} units are unreserved in selected warehouse.`
      );
    }

    const reservation = await StockReservation.create({
      sales_order_id,
      sales_order_item_id,
      product_id,
      warehouse_id,
      batch_id,
      reserved_qty,
      expiry_date,
      notes,
      created_by: userId,
    });

    if (batch_id) {
      await Batch.findByIdAndUpdate(batch_id, { $inc: { reserved_qty } });
    }

    return reservation;
  }

  /**
   * Release reserved stock back to general pool.
   */
  static async releaseReservation(reservationId, userId = null) {
    const reservation = await StockReservation.findById(reservationId);
    if (!reservation || reservation.status !== 'active') {
      throw AppError.badRequest('Reservation not found or already fulfilled/released');
    }

    reservation.status = 'released';
    reservation.released_at = new Date();
    reservation.updated_by = userId;
    await reservation.save();

    if (reservation.batch_id) {
      await Batch.findByIdAndUpdate(reservation.batch_id, {
        $inc: { reserved_qty: -reservation.reserved_qty },
      });
    }

    return reservation;
  }
}

export default StockTransactionService;
