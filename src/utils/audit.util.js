import { AuditLog } from '../models/auditLog.model.js';
import { logger } from './logger.js';

/**
 * Record an audit log entry.
 *
 * @param {object} params
 * @param {object} [params.user] - User performing the action (req.user)
 * @param {string} params.action - Action verb ('CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT' | 'CONVERT')
 * @param {string} params.module - Module name ('users', 'roles', 'products', 'customers', 'leads', 'quotations', etc.)
 * @param {string|object} params.recordId - Record identifier
 * @param {string} [params.recordRef=''] - Human readable reference code (e.g. 'QUO-2026-0001')
 * @param {string} [params.description=''] - Brief summary of mutation
 * @param {object} [params.before=null] - State before change
 * @param {object} [params.after=null] - State after change
 * @param {import('express').Request} [params.req=null] - Express request for IP / user-agent extraction
 */
export const recordAuditLog = async ({
  user = null,
  action,
  module,
  recordId,
  recordRef = '',
  description = '',
  before = null,
  after = null,
  req = null,
}) => {
  try {
    const ip = req ? req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    // Filter out sensitive fields from snapshots
    const sanitize = (data) => {
      if (!data || typeof data !== 'object') return data;
      const copy = { ...(data.toObject ? data.toObject() : data) };
      delete copy.password_hash;
      delete copy.refresh_tokens;
      delete copy.two_factor_secret;
      delete copy.password_reset_token;
      return copy;
    };

    await AuditLog.create({
      user_id: user ? user._id || user.id : null,
      user_name: user ? user.full_name || user.email : 'System',
      user_email: user ? user.email : 'system@danzaerp.com',
      action: action.toUpperCase(),
      module: module.toLowerCase(),
      record_id: String(recordId),
      record_ref: recordRef,
      description,
      before: sanitize(before),
      after: sanitize(after),
      ip_address: ip,
      user_agent: userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to create audit log entry:', { error: error.message });
  }
};

export const logAudit = recordAuditLog;
