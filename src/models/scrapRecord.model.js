import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const scrapRecordSchema = new mongoose.Schema(
  {
    scrap_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    work_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      default: null,
      index: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batch_number: {
      type: String,
      default: '',
    },
    scrap_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    reason: {
      type: String,
      enum: ['setup_rejection', 'machine_fault', 'material_defect', 'dimension_error', 'handling_damage', 'other'],
      default: 'dimension_error',
    },
    disposition: {
      type: String,
      enum: ['recycle', 'sell_as_scrap', 'dispose', 'quarantine'],
      default: 'sell_as_scrap',
    },
    estimated_scrap_value: {
      type: Number,
      default: 0,
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

scrapRecordSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const ScrapRecord = mongoose.model('ScrapRecord', scrapRecordSchema);
export default ScrapRecord;
