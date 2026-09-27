import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const prItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    requested_qty: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: 0.001,
    },
    approved_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    po_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    estimated_rate: {
      type: Number,
      default: 0,
    },
    required_by_date: {
      type: Date,
      default: null,
    },
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const purchaseRequisitionSchema = new mongoose.Schema(
  {
    pr_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    pr_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    department: {
      type: String,
      default: 'Production',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    reason_for_request: {
      type: String,
      enum: ['sales_order_shortage', 'min_reorder_level', 'production_plan', 'general_consumption'],
      default: 'sales_order_shortage',
    },
    items: [prItemSchema],
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'po_created', 'closed'],
      default: 'draft',
      index: true,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approved_at: {
      type: Date,
      default: null,
    },
    approval_remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

purchaseRequisitionSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PurchaseRequisition = mongoose.model('PurchaseRequisition', purchaseRequisitionSchema);
export default PurchaseRequisition;
