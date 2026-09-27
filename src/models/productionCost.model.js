import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const productionCostSchema = new mongoose.Schema(
  {
    work_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkOrder',
      required: true,
      unique: true,
      index: true,
    },
    raw_material_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    direct_labor_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    machine_overhead_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    consumables_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    other_costs: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    units_produced: {
      type: Number,
      default: 0,
      min: 0,
    },
    cost_per_unit: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
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

productionCostSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const ProductionCost = mongoose.model('ProductionCost', productionCostSchema);
export default ProductionCost;
