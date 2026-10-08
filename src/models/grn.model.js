import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const grnItemSchema = new mongoose.Schema(
  {
    po_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    received_qty: {
      type: Number,
      required: true,
      min: 0.001,
    },
    accepted_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejected_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    unit_rate: {
      type: Number,
      required: true,
      default: 0,
    },
    batch_number: {
      type: String,
      default: '',
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
    mfg_date: {
      type: Date,
      default: null,
    },
    expiry_date: {
      type: Date,
      default: null,
    },
    qc_status: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'rework', 'not_applicable'],
      default: 'pending',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const grnSchema = new mongoose.Schema(
  {
    grn_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    grn_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    po_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase order reference is required'],
      index: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    warehouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    vendor_challan_no: {
      type: String,
      default: '',
      trim: true,
    },
    vendor_challan_date: {
      type: Date,
      default: null,
    },
    vehicle_number: {
      type: String,
      default: '',
    },
    driver_name: {
      type: String,
      default: '',
    },
    items: [grnItemSchema],
    qc_inspection_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QcInspection',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'received', 'qc_in_progress', 'qc_completed', 'stocked', 'cancelled'],
      default: 'received',
      index: true,
    },
    stock_posted: {
      type: Boolean,
      default: false,
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
    attachment_url: {
      type: String,
      default: '',
    },
    attachment_name: {
      type: String,
      default: '',
    },
    attachment_type: {
      type: String,
      default: '',
    },
    documents: [
      {
        file_url: {
          type: String,
          required: true,
        },
        file_name: {
          type: String,
          default: '',
        },
        file_type: {
          type: String,
          default: '',
        },
        uploaded_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

grnSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const GoodsReceiptNote = mongoose.model('GoodsReceiptNote', grnSchema);
export default GoodsReceiptNote;
