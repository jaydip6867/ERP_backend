import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

const userSchema = new mongoose.Schema(
  {
    user_code: {
      type: String,
      required: [true, 'User code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    profile_photo: {
      type: String,
      default: null,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    department: {
      type: String,
      trim: true,
      default: 'General',
    },
    designation: {
      type: String,
      trim: true,
      default: 'Staff',
    },
    reporting_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    joining_date: {
      type: Date,
      default: Date.now,
    },
    employee_type: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern'],
      default: 'full_time',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'locked'],
      default: 'active',
      index: true,
    },
    two_factor_enabled: {
      type: Boolean,
      default: false,
    },
    two_factor_secret: {
      type: String,
      select: false,
      default: null,
    },
    failed_login_count: {
      type: Number,
      default: 0,
    },
    lock_until: {
      type: Date,
      default: null,
    },
    last_login_at: {
      type: Date,
      default: null,
    },
    last_login_ip: {
      type: String,
      default: null,
    },
    password_changed_at: {
      type: Date,
      default: null,
    },
    must_change_password: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    default_dashboard: {
      type: String,
      default: 'standard',
    },
    password_reset_token: {
      type: String,
      select: false,
      default: null,
    },
    password_reset_expires: {
      type: Date,
      select: false,
      default: null,
    },
    refresh_tokens: {
      type: [
        {
          token_hash: { type: String, required: true },
          expires_at: { type: Date, required: true },
          created_at: { type: Date, default: Date.now },
          user_agent: { type: String, default: null },
          ip: { type: String, default: null },
        },
      ],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Apply base schema plugin (soft-delete, audit, serialization)
userSchema.plugin(baseSchemaPlugin, {
  softDelete: true,
  audit: false, // Avoid circular dependency with User model itself
  timestamps: true,
});

// Extra safety in JSON transform: never leak security fields
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    delete ret.password_hash;
    delete ret.two_factor_secret;
    delete ret.password_reset_token;
    delete ret.password_reset_expires;
    delete ret.refresh_tokens;
    return ret;
  },
});

/**
 * Compare candidate password with stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password_hash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password_hash);
};

/**
 * Check if the account is currently locked out.
 * @returns {boolean}
 */
userSchema.methods.isLocked = function () {
  return Boolean(this.lock_until && this.lock_until.getTime() > Date.now());
};

/**
 * Handle failed login attempt tracking and auto-lock threshold.
 * @param {number} maxAttempts
 * @param {number} lockMinutes
 */
userSchema.methods.handleFailedLogin = async function (maxAttempts = 5, lockMinutes = 30) {
  this.failed_login_count += 1;

  if (this.failed_login_count >= maxAttempts) {
    this.lock_until = new Date(Date.now() + lockMinutes * 60 * 1000);
    this.status = 'locked';
  }

  return this.save({ validateBeforeSave: false });
};

/**
 * Reset failed attempts on successful login.
 * @param {string} ip
 */
userSchema.methods.handleSuccessfulLogin = async function (ip = null) {
  this.failed_login_count = 0;
  this.lock_until = null;
  if (this.status === 'locked') {
    this.status = 'active';
  }
  this.last_login_at = new Date();
  this.last_login_ip = ip;

  return this.save({ validateBeforeSave: false });
};

/**
 * Check if password was changed after a JWT token was issued.
 * @param {number} JWTTimestamp - Unix timestamp (in seconds)
 * @returns {boolean}
 */
userSchema.methods.isPasswordChangedAfter = function (JWTTimestamp) {
  if (this.password_changed_at) {
    const changedTimestamp = parseInt(this.password_changed_at.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Generate password reset token, store SHA-256 hash in DB, and return raw token.
 * @param {number} expireMinutes
 * @returns {string} Plain text reset token
 */
userSchema.methods.createPasswordResetToken = function (expireMinutes = 60) {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.password_reset_token = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.password_reset_expires = new Date(Date.now() + expireMinutes * 60 * 1000);

  return resetToken;
};

export const User = mongoose.model('User', userSchema);
export default User;
