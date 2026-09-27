import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const productCategorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    category_code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    parent_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      default: null,
    },
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

productCategorySchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);
export default ProductCategory;
