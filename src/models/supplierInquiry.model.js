import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const inquiryItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    item_name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0.001,
    },
    uom: {
      type: String,
      default: 'Nos',
      trim: true,
    },
    target_price: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const inquirySupplierSchema = new mongoose.Schema(
  {
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplier_name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_person: {
      type: String,
      default: '',
    },
    mobile: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    sent_via: {
      type: String,
      enum: ['whatsapp', 'email', 'system', 'manual'],
      default: 'whatsapp',
    },
    sent_at: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'quoted', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    quoted_price: {
      type: Number,
      default: null,
    },
    quoted_delivery_date: {
      type: Date,
      default: null,
    },
    quoted_remarks: {
      type: String,
      default: '',
    },
    accept_reason: {
      type: String,
      default: '',
    },
    accepted_at: {
      type: Date,
      default: null,
    },
    reject_reason: {
      type: String,
      default: '',
    },
    rejected_at: {
      type: Date,
      default: null,
    },
    converted_to_po_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      default: null,
    },
  },
  { _id: true }
);

const supplierInquirySchema = new mongoose.Schema(
  {
    inquiry_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    inquiry_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Inquiry title or subject is required'],
      trim: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierCategory',
      default: null,
      index: true,
    },
    category_name: {
      type: String,
      default: '',
      trim: true,
    },
    expected_delivery_date: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    items: [inquiryItemSchema],
    suppliers: [inquirySupplierSchema],
    status: {
      type: String,
      enum: ['draft', 'sent', 'in_review', 'partially_accepted', 'closed', 'cancelled'],
      default: 'sent',
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supplierInquirySchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const SupplierInquiry = mongoose.model('SupplierInquiry', supplierInquirySchema);
export default SupplierInquiry;
