import { buildDataScopeFilter, checkAuthorization } from '../services/permission.service.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Reusable RBAC Permission Middleware Factory.
 * Verifies that the authenticated user possesses the required granular action on the module.
 *
 * @param {string} moduleCode - Target module (e.g. 'roles', 'inventory', 'sales')
 * @param {string} [action='can_view'] - Action ('can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve', 'can_export', 'can_print', 'can_view_cost')
 * @returns {import('express').RequestHandler}
 */
export const requirePermission = (moduleCode, action = 'can_view') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    const authResult = await checkAuthorization(req.user, moduleCode, action);

    if (!authResult.granted) {
      return next(
        AppError.forbidden(
          authResult.reason ||
            `Access Denied: You do not have permission '${action}' on module '${moduleCode}'.`
        )
      );
    }

    // Attach permission context and data-scope to request
    req.permission = authResult.permission || null;
    req.dataScope = authResult.dataScope || 'OWN';
    req.isSuperuser = Boolean(authResult.isSuperuser);

    /**
     * Helper to construct MongoDB filter based on user's granted data-scope
     * @param {object} [options] - Field name overrides (ownerField, branchField, teamField)
     * @returns {Promise<object>}
     */
    req.buildScopeFilter = async (options = {}) => {
      return buildDataScopeFilter(req.user, req.dataScope, options);
    };

    next();
  });
};
