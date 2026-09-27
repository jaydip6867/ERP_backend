import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const purchaseInvoiceItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    description: String,
    hsn_code: String,
    quantity: {
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
    cgst_amount: {
      type: Number,
      default: 0,
    },
    sgst_amount: {
      type: Number,
      default: 0,
    },
    igst_amount: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    vendor_bill_number: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bill_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    due_date: {
      type: Date,
      default: null,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    po_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      default: null,
    },
    grn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceiptNote',
      default: null,
    },
    items: [purchaseInvoiceItemSchema],
    taxable_amount: {
      type: Number,
      default: 0,
    },
    cgst_total: {
      type: Number,
      default: 0,
    },
    sgst_total: {
      type: Number,
      default: 0,
    },
    igst_total: {
      type: Number,
      default: 0,
    },
    round_off: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      default: 0,
    },
    paid_amount: {
      type: Number,
      default: 0,
    },
    balance_amount: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'overdue'],
      default: 'unpaid',
      index: true,
    },
    tds_applicable: {
      type: Boolean,
      default: false,
    },
    tds_rate: {
      type: Number,
      default: 0,
    },
    tds_amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'posted', 'cancelled'],
      default: 'draft',
      index: true,
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

purchaseInvoiceSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
export default PurchaseInvoice;
