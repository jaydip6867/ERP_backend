import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const noteItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    description: String,
    hsn_code: String,
    quantity: {
      type: Number,
      default: 0,
    },
    rate: {
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

const creditDebitNoteSchema = new mongoose.Schema(
  {
    note_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    note_type: {
      type: String,
      enum: ['credit_note', 'debit_note'],
      required: true,
      index: true,
    },
    note_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    original_invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    original_invoice_number: {
      type: String,
      default: '',
    },
    party_type: {
      type: String,
      enum: ['customer', 'supplier'],
      required: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    reason: {
      type: String,
      enum: [
        'sales_return',
        'purchase_return',
        'rate_difference',
        'discount_adjustment',
        'defective_goods',
        'correction_in_invoice',
        'other',
      ],
      required: true,
    },
    items: [noteItemSchema],
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
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'adjusted', 'cancelled'],
      default: 'issued',
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

creditDebitNoteSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const CreditDebitNote = mongoose.model('CreditDebitNote', creditDebitNoteSchema);
export default CreditDebitNote;
