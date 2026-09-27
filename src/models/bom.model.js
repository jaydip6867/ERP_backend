import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const bomItemSchema = new mongoose.Schema(
  {
    item_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Raw material / item product is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0.0001,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      required: [true, 'UOM is required'],
    },
    unit_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    wastage_percent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const bomSchema = new mongoose.Schema(
  {
    bom_number: {
      type: String,
      required: [true, 'BOM number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Finished product is required'],
      index: true,
    },
    bom_name: {
      type: String,
      required: [true, 'BOM name is required'],
      trim: true,
    },
    revision: {
      type: String,
      default: 'Rev-01',
    },
    batch_size: {
      type: Number,
      default: 1,
      min: 0.001,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    items: [bomItemSchema],
    total_estimated_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    overhead_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    labor_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
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

bomSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Bom = mongoose.model('Bom', bomSchema);
export default Bom;
