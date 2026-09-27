import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const stockLedgerSchema = new mongoose.Schema(
  {
    transaction_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    transaction_type: {
      type: String,
      enum: [
        'GRN',
        'MATERIAL_ISSUE',
        'PRODUCTION_RECEIPT',
        'DISPATCH',
        'RETURN',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'TRANSFER_IN',
        'TRANSFER_OUT',
        'OPENING_STOCK',
      ],
      required: [true, 'Transaction type is required'],
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse is required'],
      index: true,
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
      index: true,
    },
    batch_number: {
      type: String,
      default: null,
    },
    qty_in: {
      type: Number,
      default: 0,
      min: 0,
    },
    qty_out: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance_qty: {
      type: Number,
      required: true,
    },
    unit_cost: {
      type: Number,
      default: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
    },
    reference_type: {
      type: String,
      enum: [
        'GoodsReceiptNote',
        'MaterialIssue',
        'ProductionLog',
        'Dispatch',
        'SalesReturn',
        'PurchaseReturn',
        'StockTransfer',
        'StockAdjustment',
        'PhysicalCount',
        'Opening',
      ],
      required: true,
      index: true,
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    reference_no: {
      type: String,
      required: true,
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

stockLedgerSchema.index({ product_id: 1, warehouse_id: 1, createdAt: -1 });

stockLedgerSchema.plugin(baseSchemaPlugin, {
  softDelete: false, // Stock ledger is immutable
  audit: true,
  timestamps: true,
});

export const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);
export default StockLedger;
