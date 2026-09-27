import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'LOCKED', 'BLOCKED'],
      required: true,
      index: true,
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    failure_reason: {
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

loginHistorySchema.index({ email: 1, timestamp: -1 });

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;
