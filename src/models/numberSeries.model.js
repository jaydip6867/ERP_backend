import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const numberSeriesSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: [true, 'Module code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: function () {
        return `${this.module || 'System'} Series`;
      },
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
    },
    suffix: {
      type: String,
      default: '',
      trim: true,
    },
    current_number: {
      type: Number,
      default: 0,
    },
    padding_digits: {
      type: Number,
      default: 4,
    },
    include_year: {
      type: Boolean,
      default: true,
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

numberSeriesSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const NumberSeries = mongoose.model('NumberSeries', numberSeriesSchema);
export default NumberSeries;
