import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const purchaseReturnItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    batch_number: String,
    return_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    unit_rate: {
      type: Number,
      required: true,
      min: 0,
    },
    taxable_amount: {
      type: Number,
      default: 0,
    },
    gst_rate: {
      type: Number,
      default: 18,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    reason: String,
  },
  { _id: true }
);

const purchaseReturnSchema = new mongoose.Schema(
  {
    return_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    return_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    grn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceiptNote',
      default: null,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    items: [purchaseReturnItemSchema],
    total_taxable: {
      type: Number,
      default: 0,
    },
    total_tax: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      default: 0,
    },
    debit_note_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreditDebitNote',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'dispatched', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    stock_deducted: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

purchaseReturnSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
export default PurchaseReturn;
