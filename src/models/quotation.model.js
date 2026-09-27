import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const quotationItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    description: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0.001,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Uom',
      default: null,
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: 0,
    },
    discount_percent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxable_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    gst_rate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
    cgst_amount: {
      type: Number,
      default: 0,
    },
    sgst_amount: {
      type: Number,
      default: 0,
    },
    igst_amount: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quotation_number: {
      type: String,
      required: [true, 'Quotation number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    base_number: {
      type: String,
      required: true,
      index: true,
    },
    revision_number: {
      type: String,
      default: 'R0',
    },
    parent_quotation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    lead_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    quotation_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    valid_until: {
      type: Date,
      required: [true, 'Validity date is required'],
    },
    sales_person_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sales person is required'],
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch is required'],
      index: true,
    },
    channel_partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChannelPartner',
      default: null,
    },
    price_list_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PriceList',
      default: null,
    },
    is_interstate: {
      type: Boolean,
      default: false,
    },
    items: [quotationItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    discount_total: {
      type: Number,
      default: 0,
    },
    taxable_total: {
      type: Number,
      default: 0,
    },
    cgst_total: {
      type: Number,
      default: 0,
    },
    sgst_total: {
      type: Number,
      default: 0,
    },
    igst_total: {
      type: Number,
      default: 0,
    },
    round_off: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired', 'converted_to_order'],
      default: 'draft',
      index: true,
    },
    discount_approval_status: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
    },
    discount_approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    discount_approval_remarks: {
      type: String,
      default: '',
    },
    terms_and_conditions: {
      type: String,
      default: '1. Prices are valid for 30 days.\n2. 50% advance along with purchase order.\n3. Delivery within 2-3 weeks from receipt of advance.',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: true,
  timestamps: true,
});

export const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
