import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const warehouseSchema = new mongoose.Schema(
  {
    warehouse_name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    warehouse_code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch association is required'],
      index: true,
    },
    warehouse_type: {
      type: String,
      enum: ['central', 'regional', 'retail', 'transit', 'quarantine'],
      default: 'central',
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    capacity_sqft: {
      type: Number,
      default: 0,
    },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

warehouseSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
