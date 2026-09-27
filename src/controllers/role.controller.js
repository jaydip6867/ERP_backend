import * as permissionService from '../services/permission.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/roles
 */
export const getRoles = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;
  const result = await permissionService.getAllRoles({
    status,
    search,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.paginated(
    res,
    result.roles,
    { page: result.page, limit: result.limit, total: result.total },
    'Roles retrieved successfully'
  );
});

/**
 * POST /api/v1/roles
 */
export const createRole = asyncHandler(async (req, res) => {
  const role = await permissionService.createRole(req.body);
  return ApiResponse.created(res, { role }, 'Role created successfully');
});

/**
 * PUT /api/v1/roles/:id
 */
export const updateRole = asyncHandler(async (req, res) => {
  const role = await permissionService.updateRole(req.params.id, req.body);
  return ApiResponse.success(res, { role }, 'Role updated successfully', 200);
});

/**
 * GET /api/v1/roles/:id/permissions
 */
export const getRolePermissions = asyncHandler(async (req, res) => {
  const result = await permissionService.getRolePermissions(req.params.id);
  return ApiResponse.success(res, result, 'Role permissions matrix retrieved', 200);
});

/**
 * PUT /api/v1/roles/:id/permissions
 */
export const updateRolePermissions = asyncHandler(async (req, res) => {
  const result = await permissionService.updateRolePermissions(
    req.params.id,
    req.body.permissions
  );
  return ApiResponse.success(res, result, 'Role permissions matrix updated successfully', 200);
});
