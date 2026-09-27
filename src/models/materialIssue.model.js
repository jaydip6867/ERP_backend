import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const materialIssueItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    required_qty: {
      type: Number,
      required: true,
      min: 0,
    },
    issued_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    unit_cost: {
      type: Number,
      default: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const materialIssueSchema = new mongoose.Schema(
  {
    issue_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    issue_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    work_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      required: [true, 'Work order is required'],
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    items: [materialIssueItemSchema],
    total_cost: {
      type: Number,
      default: 0,
    },
    issued_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    received_by: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'returned', 'cancelled'],
      default: 'issued',
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

materialIssueSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const MaterialIssue = mongoose.model('MaterialIssue', materialIssueSchema);
export default MaterialIssue;
