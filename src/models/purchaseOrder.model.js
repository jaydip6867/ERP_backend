import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const poItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    ordered_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    received_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    pending_qty: {
      type: Number,
      default: function () {
        return Math.max(0, this.ordered_qty - (this.received_qty || 0));
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
      required: true,
      min: 0,
    },
    discount_percent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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

const purchaseOrderSchema = new mongoose.Schema(
  {
    po_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    po_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
      index: true,
    },
    pr_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequisition',
      default: null,
      index: true,
    },
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    expected_delivery_date: {
      type: Date,
      default: null,
    },
    payment_terms: {
      type: String,
      default: 'Net 30 Days',
    },
    delivery_terms: {
      type: String,
      default: 'FOB Destination',
    },
    items: [poItemSchema],
    subtotal: {
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
      enum: ['draft', 'approved', 'sent', 'partially_received', 'completed', 'cancelled'],
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

purchaseOrderSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
