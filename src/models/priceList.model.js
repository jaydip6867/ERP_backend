import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const priceListItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    min_quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    rate: {
      type: Number,
      required: [true, 'Price list rate is required'],
      min: 0,
    },
    discount_percent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: true, timestamps: true }
);

const priceListSchema = new mongoose.Schema(
  {
    price_list_name: {
      type: String,
      required: [true, 'Price list name is required'],
      trim: true,
      index: true,
    },
    price_list_code: {
      type: String,
      required: [true, 'Price list code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['selling', 'buying', 'distributor', 'dealer', 'retail'],
      default: 'selling',
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    valid_from: {
      type: Date,
      default: null,
    },
    valid_to: {
      type: Date,
      default: null,
    },
    items: [priceListItemSchema],
    description: {
      type: String,
      default: '',
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

priceListSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const PriceList = mongoose.model('PriceList', priceListSchema);
export default PriceList;
