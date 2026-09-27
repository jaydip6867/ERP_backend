import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const uomSchema = new mongoose.Schema(
  {
    uom_name: {
      type: String,
      required: [true, 'UOM name is required'],
      trim: true,
    },
    uom_code: {
      type: String,
      required: [true, 'UOM code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    uom_type: {
      type: String,
      enum: ['quantity', 'weight', 'length', 'volume', 'time'],
      default: 'quantity',
    },
    is_fractional: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

uomSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Uom = mongoose.model('Uom', uomSchema);
export default Uom;
