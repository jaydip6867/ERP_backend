import { Ticket } from '../models/ticket.model.js';
import { RootCause } from '../models/rootCause.model.js';
import { CustomerFeedback } from '../models/customerFeedback.model.js';
import { AppError } from '../utils/appError.js';

export class CustomerServiceEngine {
  /**
   * Create Support Ticket with SLA Calculation
   */
  static async createTicket(data, userId) {
    const {
      customer_id,
      subject,
      description,
      category,
      priority = 'medium',
      order_id,
      invoice_id,
      dispatch_id,
      product_id,
      batch_id,
      assigned_to,
    } = data;

    const count = await Ticket.countDocuments();
    const ticketNumber = `TCK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // SLA Rules:
    // urgent: response in 2h, resolution in 12h
    // high: response in 4h, resolution in 24h
    // medium: response in 8h, resolution in 48h
    // low: response in 24h, resolution in 96h
    const now = new Date();
    const slaHours = {
      urgent: { resp: 2, res: 12 },
      high: { resp: 4, res: 24 },
      medium: { resp: 8, res: 48 },
      low: { resp: 24, res: 96 },
    };

    const target = slaHours[priority] || slaHours.medium;
    const responseDue = new Date(now.getTime() + target.resp * 60 * 60 * 1000);
    const resolutionDue = new Date(now.getTime() + target.res * 60 * 60 * 1000);

    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      customer_id,
      subject,
      description,
      category,
      priority,
      status: 'open',
      assigned_to: assigned_to || userId,
      order_id: order_id || null,
      invoice_id: invoice_id || null,
      dispatch_id: dispatch_id || null,
      product_id: product_id || null,
      batch_id: batch_id || null,
      response_due_at: responseDue,
      resolution_due_at: resolutionDue,
      activities: [
        {
          author_id: userId,
          message: `Ticket initialized: ${description}`,
          activity_type: 'INTERNAL_NOTE',
        },
      ],
      created_by: userId,
    });

    return ticket;
  }

  /**
   * Add Conversation Activity / Reply
   */
  static async addActivity(ticketId, data, userId) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw AppError.notFound('Ticket not found');

    const { message, activity_type = 'REPLY' } = data;

    if (!ticket.first_responded_at && activity_type === 'REPLY') {
      ticket.first_responded_at = new Date();
      if (ticket.response_due_at && ticket.first_responded_at > ticket.response_due_at) {
        ticket.is_sla_breached = true;
      }
    }

    ticket.activities.push({
      author_id: userId,
      message,
      activity_type,
    });

    await ticket.save();
    return ticket;
  }

  /**
   * Escalate Ticket
   */
  static async escalateTicket(ticketId, reason, userId) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw AppError.notFound('Ticket not found');

    ticket.status = 'escalated';
    ticket.escalation_level = (ticket.escalation_level || 0) + 1;
    ticket.activities.push({
      author_id: userId,
      message: `Escalated to Level ${ticket.escalation_level}. Reason: ${reason}`,
      activity_type: 'ESCALATION',
    });

    await ticket.save();
    return ticket;
  }

  /**
   * Resolve Ticket
   */
  static async resolveTicket(ticketId, resolution_notes, userId) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw AppError.notFound('Ticket not found');

    const now = new Date();
    ticket.status = 'resolved';
    ticket.resolved_at = now;
    ticket.resolution_notes = resolution_notes;

    if (ticket.resolution_due_at && now > ticket.resolution_due_at) {
      ticket.is_sla_breached = true;
    }

    ticket.activities.push({
      author_id: userId,
      message: `Ticket Resolved: ${resolution_notes}`,
      activity_type: 'STATUS_CHANGE',
    });

    await ticket.save();
    return ticket;
  }

  /**
   * Customer Support SLA & Health Dashboard
   */
  static async getSupportDashboard() {
    const [openCount, escalatedCount, resolvedCount, totalCount, breachedCount] = await Promise.all([
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Ticket.countDocuments({ status: 'escalated' }),
      Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ is_sla_breached: true }),
    ]);

    const slaComplianceRate = totalCount > 0 ? Math.round(((totalCount - breachedCount) / totalCount) * 100) : 100;

    const npsAggregate = await CustomerFeedback.aggregate([
      {
        $group: {
          _id: null,
          avgNps: { $sum: '$nps_score' },
          count: { $sum: 1 },
          promoters: { $sum: { $cond: [{ $eq: ['$rating_category', 'PROMOTER'] }, 1, 0] } },
          detractors: { $sum: { $cond: [{ $eq: ['$rating_category', 'DETRACTOR'] }, 1, 0] } },
        },
      },
    ]);

    const npsData = npsAggregate[0] || { avgNps: 0, count: 0, promoters: 0, detractors: 0 };
    const npsScore = npsData.count > 0 ? Math.round(((npsData.promoters - npsData.detractors) / npsData.count) * 100) : 75;

    return {
      total_tickets: totalCount,
      open_tickets: openCount,
      escalated_tickets: escalatedCount,
      resolved_tickets: resolvedCount,
      breached_sla_count: breachedCount,
      sla_compliance_rate: slaComplianceRate,
      nps_score: npsScore,
      total_feedbacks: npsData.count,
    };
  }
}

export default CustomerServiceEngine;
