import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const transporterSchema = new mongoose.Schema(
  {
    transporter_name: {
      type: String,
      required: [true, 'Transporter name is required'],
      trim: true,
      index: true,
    },
    transporter_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    transporter_id_gst: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    contact_person: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    address: {
      address_line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    vehicle_types: [
      {
        type: String,
      },
    ],
    tracking_portal_url: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
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

transporterSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Transporter = mongoose.model('Transporter', transporterSchema);
export default Transporter;
