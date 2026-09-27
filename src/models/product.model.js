import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    product_code: {
      type: String,
      required: [true, 'Product code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Stock Keeping Unit (SKU) is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Product category is required'],
      index: true,
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    hsn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hsn',
      default: null,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      required: [true, 'Unit of measure is required'],
    },
    gst_rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 18,
    },
    purchase_rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    selling_rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    product_type: {
      type: String,
      enum: ['finished_good', 'raw_material', 'semi_finished', 'service', 'consumable'],
      default: 'finished_good',
      index: true,
    },
    stock_settings: {
      track_inventory: { type: Boolean, default: true },
      min_order_qty: { type: Number, default: 1 },
      allow_negative_stock: { type: Boolean, default: false },
    },
    reorder_level: {
      type: Number,
      default: 10,
    },
    opening_stock: {
      type: Number,
      default: 0,
    },
    current_stock: {
      type: Number,
      default: 0,
    },
    batch_tracking: {
      type: Boolean,
      default: false,
    },
    expiry_tracking: {
      type: Boolean,
      default: false,
    },
    serial_tracking: {
      type: Boolean,
      default: false,
    },
    bom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bom',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    image_url: {
      type: String,
      default: null,
    },
    rd_project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductDevelopmentProject',
      default: null,
      index: true,
    },
    merchandising_status: {
      type: String,
      enum: ['development', 'sampling', 'catalogued', 'active_merchandise', 'discontinued'],
      default: 'catalogued',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Product = mongoose.model('Product', productSchema);
export default Product;
