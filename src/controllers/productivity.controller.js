import { ProductivityService } from '../services/productivity.service.js';
import { Meeting } from '../models/meeting.model.js';
import { TodoTask } from '../models/todoTask.model.js';
import { CalendarEvent } from '../models/calendarEvent.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMeetings = asyncHandler(async (req, res) => {
  const meetings = await Meeting.find().populate('organizer_id attendees.user_id').sort({ meeting_date: -1 });
  return ApiResponse.success(res, meetings, 'Meetings fetched');
});

export const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await ProductivityService.createMeeting(req.body, req.user?._id);
  return ApiResponse.created(res, meeting, 'Meeting scheduled');
});

export const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id).populate('organizer_id attendees.user_id action_items.assigned_to');
  return ApiResponse.success(res, meeting, 'Meeting details fetched');
});

export const updateMeetingMinutes = asyncHandler(async (req, res) => {
  const updated = await ProductivityService.updateMeetingMinutes(req.params.id, req.body, req.user?._id);
  return ApiResponse.success(res, updated, 'Meeting minutes saved and tasks dispatched');
});

export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assigned_to = assignedTo;

  const tasks = await TodoTask.find(filter).populate('assigned_to').sort({ due_date: 1 });
  return ApiResponse.success(res, tasks, 'Todo tasks fetched');
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await ProductivityService.createTodoTask(req.body, req.user?._id);
  return ApiResponse.created(res, task, 'Todo task created');
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await ProductivityService.updateTodoStatus(req.params.id, req.body.status, req.user?._id);
  return ApiResponse.success(res, task, 'Task status updated');
});

export const getCalendarEvents = asyncHandler(async (req, res) => {
  const events = await ProductivityService.getCalendarEvents({ ...req.query, userId: req.user?._id });
  return ApiResponse.success(res, events, 'Calendar events fetched');
});

export const createCalendarEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.create({ ...req.body, user_id: req.user?._id, created_by: req.user?._id });
  return ApiResponse.created(res, event, 'Calendar event scheduled');
});
