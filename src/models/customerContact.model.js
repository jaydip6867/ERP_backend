import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const customerContactSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    contact_name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    designation: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
    is_decision_maker: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

customerContactSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const CustomerContact = mongoose.model('CustomerContact', customerContactSchema);
export default CustomerContact;
