import { DispatchService } from '../services/dispatch.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Transporters
export const listTransporters = asyncHandler(async (req, res) => {
  const transporters = await DispatchService.getTransporters();
  return ApiResponse.success(res, transporters, 'Transporters fetched successfully');
});

export const createTransporter = asyncHandler(async (req, res) => {
  const transporter = await DispatchService.createTransporter(req.body, req.user?._id);
  return ApiResponse.created(res, transporter, 'Transporter created successfully');
});

// Dispatches
export const listDispatches = asyncHandler(async (req, res) => {
  const result = await DispatchService.getDispatches(req.query);
  return ApiResponse.paginated(res, result.dispatches, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Dispatches fetched successfully');
});

export const getDispatchById = asyncHandler(async (req, res) => {
  const dispatch = await DispatchService.getDispatchById(req.params.id);
  return ApiResponse.success(res, dispatch, 'Dispatch details fetched successfully');
});

export const createDispatch = asyncHandler(async (req, res) => {
  const dispatch = await DispatchService.createDispatch(req.body, req.user?._id);
  return ApiResponse.created(res, dispatch, 'Dispatch created successfully');
});

export const shipDispatch = asyncHandler(async (req, res) => {
  const dispatch = await DispatchService.shipDispatch(req.params.id, req.user?._id);
  return ApiResponse.success(res, dispatch, 'Shipment dispatched and inventory deducted');
});

export const recordPod = asyncHandler(async (req, res) => {
  const dispatch = await DispatchService.recordPod(req.params.id, req.body, req.user?._id);
  return ApiResponse.success(res, dispatch, 'Proof of delivery recorded successfully');
});

// Returns
export const listReturns = asyncHandler(async (req, res) => {
  const result = await DispatchService.getReturns(req.query);
  return ApiResponse.paginated(res, result.returns, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Sales returns fetched successfully');
});

export const createReturn = asyncHandler(async (req, res) => {
  const sReturn = await DispatchService.createReturn(req.body, req.user?._id);
  return ApiResponse.created(res, sReturn, 'Sales return recorded successfully');
});

export const restockReturn = asyncHandler(async (req, res) => {
  const sReturn = await DispatchService.restockReturn(req.params.id, req.user?._id);
  return ApiResponse.success(res, sReturn, 'Return items restocked to inventory');
});
