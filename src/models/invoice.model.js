import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const invoiceItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    item_name: {
      type: String,
      required: true,
    },
    description: String,
    hsn_code: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    uom: {
      type: String,
      default: 'NOS',
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    taxable_amount: {
      type: Number,
      required: true,
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
      required: true,
      default: 0,
    },
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    invoice_type: {
      type: String,
      enum: ['tax_invoice', 'bill_of_supply', 'export_invoice', 'non_gst_invoice'],
      default: 'tax_invoice',
      index: true,
    },
    invoice_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    due_date: {
      type: Date,
      default: null,
    },
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
      index: true,
    },
    dispatch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispatch',
      default: null,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    place_of_supply_state: {
      type: String,
      default: 'Gujarat',
    },
    is_interstate: {
      type: Boolean,
      default: false,
    },
    reverse_charge: {
      type: Boolean,
      default: false,
    },
    billing_address: {
      address_line1: String,
      city: String,
      state: String,
      pincode: String,
      gstin: String,
    },
    shipping_address: {
      address_line1: String,
      city: String,
      state: String,
      pincode: String,
      gstin: String,
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    discount_total: {
      type: Number,
      default: 0,
    },
    taxable_total: {
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
    cess_total: {
      type: Number,
      default: 0,
    },
    round_off: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      required: true,
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
    status: {
      type: String,
      enum: ['draft', 'issued', 'cancelled'],
      default: 'draft',
      index: true,
    },
    e_invoice: {
      irn: { type: String, default: '' },
      ack_no: { type: String, default: '' },
      ack_date: { type: Date, default: null },
      signed_qr_code: { type: String, default: '' },
      status: {
        type: String,
        enum: ['not_generated', 'generated', 'cancelled', 'failed'],
        default: 'not_generated',
      },
    },
    e_way_bill: {
      ewb_number: { type: String, default: '' },
      ewb_date: { type: Date, default: null },
      valid_upto: { type: Date, default: null },
      status: {
        type: String,
        enum: ['not_generated', 'generated', 'cancelled', 'expired'],
        default: 'not_generated',
      },
    },
    terms_and_conditions: {
      type: String,
      default: '1. Goods once sold will not be taken back without prior approval. 2. Subject to Surat jurisdiction.',
    },
    bank_details: {
      bank_name: { type: String, default: 'HDFC Bank Ltd.' },
      account_number: { type: String, default: '50200084920194' },
      ifsc_code: { type: String, default: 'HDFC0000256' },
      branch: { type: String, default: 'Ring Road, Surat' },
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
