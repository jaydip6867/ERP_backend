import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const dispatchItemSchema = new mongoose.Schema(
  {
    sales_order_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
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
    batch_number: {
      type: String,
      default: '',
    },
    dispatch_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    unit_rate: {
      type: Number,
      default: 0,
    },
    taxable_amount: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const trackingCheckpointSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const proofOfDeliverySchema = new mongoose.Schema(
  {
    received_by_name: {
      type: String,
      default: '',
    },
    received_by_phone: {
      type: String,
      default: '',
    },
    received_date: {
      type: Date,
      default: null,
    },
    pod_image_url: {
      type: String,
      default: null,
    },
    receiver_signature_url: {
      type: String,
      default: null,
    },
    pod_remarks: {
      type: String,
      default: '',
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const dispatchSchema = new mongoose.Schema(
  {
    dispatch_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    dispatch_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: [true, 'Sales order is required'],
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    transporter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transporter',
      default: null,
    },
    lr_number: {
      type: String,
      default: '',
      trim: true,
    },
    lr_date: {
      type: Date,
      default: null,
    },
    vehicle_no: {
      type: String,
      default: '',
      trim: true,
    },
    driver_name: {
      type: String,
      default: '',
    },
    driver_phone: {
      type: String,
      default: '',
    },
    tracking_number: {
      type: String,
      default: '',
      index: true,
    },
    e_way_bill_no: {
      type: String,
      default: '',
      trim: true,
    },
    e_way_bill_date: {
      type: Date,
      default: null,
    },
    total_packages: {
      type: Number,
      default: 1,
    },
    gross_weight_kg: {
      type: Number,
      default: 0,
    },
    shipping_address: {
      address_line1: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    items: [dispatchItemSchema],
    status: {
      type: String,
      enum: [
        'ready_to_ship',
        'dispatched',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'rto',
        'returned',
        'cancelled',
      ],
      default: 'ready_to_ship',
      index: true,
    },
    stock_deducted: {
      type: Boolean,
      default: false,
    },
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    qc_inspection_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcInspection',
      default: null,
    },
    tracking_history: [trackingCheckpointSchema],
    proof_of_delivery: {
      type: proofOfDeliverySchema,
      default: () => ({}),
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

dispatchSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Dispatch = mongoose.model('Dispatch', dispatchSchema);
export default Dispatch;
