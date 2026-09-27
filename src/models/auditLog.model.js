import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    user_name: {
      type: String,
      default: 'System',
    },
    user_email: {
      type: String,
      default: 'system@danzaerp.com',
    },
    action: {
      type: String,
      required: true,
      index: true, // CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT
    },
    module: {
      type: String,
      required: true,
      index: true, // admin, users, roles, products, customers, leads, quotations
    },
    record_id: {
      type: String,
      required: true,
      index: true,
    },
    record_ref: {
      type: String,
      default: '', // Code / No (e.g. USR-001, QUO-2026-0001, LEAD-0001)
    },
    description: {
      type: String,
      default: '',
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    diff: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ module: 1, action: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
