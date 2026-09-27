import { NotificationService } from '../services/notification.service.js';
import { GlobalSearchService } from '../services/globalSearch.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await NotificationService.getUserNotifications(req.user?._id);
  return ApiResponse.success(res, result, 'Notifications fetched');
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const updated = await NotificationService.markAsRead(req.params.id);
  return ApiResponse.success(res, updated, 'Notification marked as read');
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead(req.user?._id);
  return ApiResponse.success(res, null, 'All notifications marked as read');
});

export const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const result = await GlobalSearchService.searchAll(q, req.user);
  return ApiResponse.success(res, result, 'Global search results returned');
});
