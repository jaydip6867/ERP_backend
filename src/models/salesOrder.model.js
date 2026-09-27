import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const salesOrderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    description: {
      type: String,
      default: '',
    },
    ordered_qty: {
      type: Number,
      required: [true, 'Ordered quantity is required'],
      min: 0.001,
    },
    reserved_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    to_purchase_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    to_produce_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    ready_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    dispatched_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    delivered_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    invoiced_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending_qty: {
      type: Number,
      default: function () {
        return Math.max(0, this.ordered_qty - (this.dispatched_qty || 0));
      },
      min: 0,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    rate: {
      type: Number,
      required: [true, 'Unit rate is required'],
      min: 0,
    },
    discount_percent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxable_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    gst_rate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
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
    // References for procurement and production modules
    purchase_requisition_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseRequisition',
      },
    ],
    work_order_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkOrder',
      },
    ],
  },
  { _id: true }
);

const orderAuditTrailSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    status_from: {
      type: String,
      default: null,
    },
    status_to: {
      type: String,
      default: null,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    performed_at: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const salesOrderSchema = new mongoose.Schema(
  {
    order_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    order_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    quotation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    salesperson_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Salesperson is required'],
      index: true,
    },
    sales_segment: {
      type: String,
      default: 'B2B',
      trim: true,
      index: true,
    },
    key_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    account_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Fulfillment warehouse is required'],
      index: true,
    },
    customer_po_number: {
      type: String,
      default: '',
      trim: true,
    },
    customer_po_date: {
      type: Date,
      default: null,
    },
    payment_terms: {
      type: String,
      default: 'Net 30 Days',
    },
    delivery_terms: {
      type: String,
      default: 'Door Delivery / Ex-Works',
    },
    expected_delivery_date: {
      type: Date,
      default: null,
    },
    billing_address: {
      address_line1: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    shipping_address: {
      address_line1: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    items: [salesOrderItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    discount_total: {
      type: Number,
      default: 0,
    },
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
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'processing',
        'partially_dispatched',
        'dispatched',
        'completed',
        'cancelled',
        'on_hold',
      ],
      default: 'draft',
      index: true,
    },
    approval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_required'],
        default: 'not_required',
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
      remarks: {
        type: String,
        default: '',
      },
    },
    notes: {
      type: String,
      default: '',
    },
    audit_trail: [orderAuditTrailSchema],
  },
  {
    timestamps: true,
  }
);

salesOrderSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
export default SalesOrder;
