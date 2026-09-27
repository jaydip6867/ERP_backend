import { CustomerServiceEngine } from '../services/customerService.service.js';
import { Ticket } from '../models/ticket.model.js';
import { RootCause } from '../models/rootCause.model.js';
import { CustomerFeedback } from '../models/customerFeedback.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, customerId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (customerId) filter.customer_id = customerId;

  const tickets = await Ticket.find(filter)
    .populate('customer_id', 'company_name customer_code mobile')
    .populate('assigned_to', 'full_name user_code')
    .populate('product_id', 'product_name product_code')
    .populate('order_id', 'order_number')
    .populate('invoice_id', 'invoice_number')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, tickets, 'Tickets fetched');
});

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await CustomerServiceEngine.createTicket(req.body, req.user?._id);
  return ApiResponse.created(res, ticket, 'Ticket logged with SLA tracking');
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('customer_id')
    .populate('assigned_to', 'full_name')
    .populate('order_id')
    .populate('invoice_id')
    .populate('dispatch_id')
    .populate('product_id')
    .populate('batch_id')
    .populate('activities.author_id', 'full_name');

  return ApiResponse.success(res, ticket, 'Ticket details fetched');
});

export const addActivity = asyncHandler(async (req, res) => {
  const ticket = await CustomerServiceEngine.addActivity(req.params.id, req.body, req.user?._id);
  return ApiResponse.success(res, ticket, 'Conversation activity recorded');
});

export const escalateTicket = asyncHandler(async (req, res) => {
  const ticket = await CustomerServiceEngine.escalateTicket(req.params.id, req.body.reason, req.user?._id);
  return ApiResponse.success(res, ticket, 'Ticket escalated successfully');
});

export const resolveTicket = asyncHandler(async (req, res) => {
  const ticket = await CustomerServiceEngine.resolveTicket(req.params.id, req.body.resolution_notes, req.user?._id);
  return ApiResponse.success(res, ticket, 'Ticket resolved');
});

export const getSupportDashboard = asyncHandler(async (req, res) => {
  const dash = await CustomerServiceEngine.getSupportDashboard();
  return ApiResponse.success(res, dash, 'Support SLA dashboard fetched');
});

export const getRootCauses = asyncHandler(async (req, res) => {
  const list = await RootCause.find().populate('ticket_id responsible_person_id');
  return ApiResponse.success(res, list, 'CAPA investigations fetched');
});

export const createRootCause = asyncHandler(async (req, res) => {
  const capa = await RootCause.create({ ...req.body, created_by: req.user?._id });
  return ApiResponse.created(res, capa, 'CAPA recorded');
});

export const getCustomerFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await CustomerFeedback.find().populate('customer_id ticket_id order_id');
  return ApiResponse.success(res, feedbacks, 'Feedbacks & NPS ratings fetched');
});

export const createCustomerFeedback = asyncHandler(async (req, res) => {
  const score = req.body.nps_score || 10;
  const rating_category = score >= 9 ? 'PROMOTER' : score >= 7 ? 'PASSIVE' : 'DETRACTOR';
  const fb = await CustomerFeedback.create({
    ...req.body,
    rating_category,
    created_by: req.user?._id,
  });
  return ApiResponse.created(res, fb, 'Customer feedback recorded');
});
