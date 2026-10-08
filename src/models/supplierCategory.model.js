import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const supplierCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supplierCategorySchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const SupplierCategory = mongoose.model('SupplierCategory', supplierCategorySchema);
export default SupplierCategory;
