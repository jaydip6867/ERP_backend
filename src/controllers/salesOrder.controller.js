import { SalesOrderService } from '../services/salesOrder.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listOrders = asyncHandler(async (req, res) => {
  const result = await SalesOrderService.getAllOrders(req.query);
  return ApiResponse.paginated(res, result.orders, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  }, 'Sales orders fetched successfully');
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await SalesOrderService.getOrderById(req.params.id);
  return ApiResponse.success(res, order, 'Sales order fetched successfully');
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrderService.createOrder(req.body, req.user?._id);
  return ApiResponse.created(res, order, 'Sales order created successfully');
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await SalesOrderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.body.remarks,
    req.user?._id
  );
  return ApiResponse.success(res, order, 'Sales order status updated successfully');
});

export const approveOrder = asyncHandler(async (req, res) => {
  const order = await SalesOrderService.approveOrder(
    req.params.id,
    { approve: req.body.approve, remarks: req.body.remarks },
    req.user?._id
  );
  return ApiResponse.success(res, order, 'Sales order approval status updated');
});

export const reserveStock = asyncHandler(async (req, res) => {
  const result = await SalesOrderService.reserveOrderStock(
    req.params.id,
    { reservations: req.body.reservations },
    req.user?._id
  );
  return ApiResponse.success(res, result, 'Stock reserved successfully for sales order');
});

export const getPendingOrders = asyncHandler(async (req, res) => {
  const orders = await SalesOrderService.getPendingOrders();
  return ApiResponse.success(res, orders, 'Pending sales orders fetched successfully');
});

export const getProcessingMetrics = asyncHandler(async (req, res) => {
  const metrics = await SalesOrderService.getOrderProcessingMetrics();
  return ApiResponse.success(res, metrics, 'Order processing metrics fetched successfully');
});
