import { Lead } from '../models/lead.model.js';
import { LeadFollowup } from '../models/leadFollowup.model.js';
import { Customer } from '../models/customer.model.js';
import { CustomerContact } from '../models/customerContact.model.js';
import { CustomerAddress } from '../models/customerAddress.model.js';
import { AppError } from '../utils/appError.js';
import { getNextNumber } from './numberSeries.service.js';
import { logAudit } from '../utils/audit.util.js';

class LeadService {
  async getDashboard(scopeFilter = {}) {
    const filter = { ...scopeFilter };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      wonLeads,
      lostLeads,
      stageCounts,
      sourceCounts,
      todayFollowupsCount,
      overdueFollowupsCount,
    ] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.countDocuments({ ...filter, pipeline_stage: 'won' }),
      Lead.countDocuments({ ...filter, pipeline_stage: 'lost' }),
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: '$pipeline_stage', count: { $sum: 1 }, total_value: { $sum: '$estimated_value' } } },
      ]),
      Lead.aggregate([
        { $match: filter },
        { $group: { _id: '$lead_source', count: { $sum: 1 } } },
      ]),
      LeadFollowup.countDocuments({
        status: 'pending',
        followup_date: { $gte: todayStart, $lte: todayEnd },
      }),
      LeadFollowup.countDocuments({
        status: 'pending',
        followup_date: { $lt: todayStart },
      }),
    ]);

    const activePipeline = stageCounts
      .filter((s) => !['won', 'lost'].includes(s._id))
      .reduce((sum, s) => sum + s.total_value, 0);

    return {
      metrics: {
        totalLeads,
        wonLeads,
        lostLeads,
        conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0,
        activePipelineValue: activePipeline,
        todayFollowupsCount,
        overdueFollowupsCount,
      },
      stageCounts,
      sourceCounts,
    };
  }

  async listLeads(query = {}, scopeFilter = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      pipeline_stage,
      lead_status,
      rating,
      lead_source,
      assigned_to,
      branch_id,
      sort = '-createdAt',
    } = query;

    const filter = { ...scopeFilter };

    if (search) {
      filter.$or = [
        { contact_name: { $regex: search, $options: 'i' } },
        { company_name: { $regex: search, $options: 'i' } },
        { lead_code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (pipeline_stage) filter.pipeline_stage = pipeline_stage;
    if (lead_status) filter.lead_status = lead_status;
    if (rating) filter.rating = rating;
    if (lead_source) filter.lead_source = lead_source;
    if (assigned_to) filter.assigned_to = assigned_to;
    if (branch_id) filter.branch_id = branch_id;

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assigned_to', 'full_name email user_code')
        .populate('branch_id', 'branch_name')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);

    return {
      items: leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getKanban(scopeFilter = {}) {
    const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const leads = await Lead.find({ ...scopeFilter })
      .populate('assigned_to', 'full_name user_code')
      .populate('branch_id', 'branch_name')
      .sort('-updatedAt');

    const kanban = {};
    stages.forEach((st) => {
      kanban[st] = [];
    });

    leads.forEach((l) => {
      const stage = l.pipeline_stage || 'new';
      if (!kanban[stage]) kanban[stage] = [];
      kanban[stage].push(l);
    });

    return kanban;
  }

  async getLeadById(id) {
    const lead = await Lead.findById(id)
      .populate('assigned_to', 'full_name email mobile user_code')
      .populate('branch_id', 'branch_name branch_code')
      .populate('converted_to_customer_id', 'company_name customer_code');

    if (!lead) throw new AppError('Lead not found', 404);

    const followups = await LeadFollowup.find({ lead_id: id })
      .populate('assigned_to', 'full_name')
      .sort({ followup_date: -1 });

    return { lead, followups };
  }

  async createLead(payload, currentUser, req) {
    if (!payload.lead_code) {
      payload.lead_code = await getNextNumber('LEAD', { prefix: 'LD-' });
    }

    if (!payload.contact_name) {
      payload.contact_name = [payload.first_name, payload.last_name].filter(Boolean).join(' ') || payload.name || 'Lead Contact';
    }

    if (!payload.assigned_to && currentUser) {
      payload.assigned_to = currentUser._id;
    }
    if (!payload.branch_id && currentUser?.branch_id) {
      payload.branch_id = currentUser.branch_id;
    }

    const lead = await Lead.create({
      ...payload,
      created_by: currentUser?._id,
    });

    await logAudit({
      user: currentUser,
      action: 'CREATE',
      module: 'Lead',
      record_id: lead._id,
      after: lead.toObject(),
      req,
    });

    return lead;
  }

  async updateLead(id, payload, currentUser, req) {
    const lead = await Lead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    const before = lead.toObject();
    Object.assign(lead, payload);
    lead.updated_by = currentUser?._id;
    await lead.save();

    await logAudit({
      user: currentUser,
      action: 'UPDATE',
      module: 'Lead',
      record_id: lead._id,
      before,
      after: lead.toObject(),
      req,
    });

    return lead;
  }

  async updateStage(id, { pipeline_stage, lost_reason, lost_remarks }, currentUser, req) {
    const lead = await Lead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    const before = lead.toObject();
    lead.pipeline_stage = pipeline_stage;
    lead.lead_status = pipeline_stage === 'won' ? 'won' : pipeline_stage === 'lost' ? 'lost' : lead.lead_status;

    if (pipeline_stage === 'lost') {
      lead.lost_reason = lost_reason || 'other';
      lead.lost_remarks = lost_remarks || '';
    }

    lead.updated_by = currentUser?._id;
    await lead.save();

    await logAudit({
      user: currentUser,
      action: 'STAGE_CHANGE',
      module: 'Lead',
      record_id: lead._id,
      before,
      after: lead.toObject(),
      req,
    });

    return lead;
  }

  async convertToCustomer(id, payload = {}, currentUser, req) {
    const lead = await Lead.findById(id);
    if (!lead) throw new AppError('Lead not found', 404);

    if (lead.converted_to_customer_id) {
      throw new AppError('This lead is already converted to a customer', 400);
    }

    // 1. Create Customer
    const customerCode = await getNextNumber('CUSTOMER', { prefix: 'CUST-' });
    const customer = await Customer.create({
      customer_code: customerCode,
      company_name: payload.company_name || lead.company_name || lead.contact_name,
      customer_type: payload.customer_type || 'corporate',
      email: payload.email || lead.email,
      phone: payload.phone || lead.mobile || lead.phone,
      gstin: payload.gstin || '',
      pan: payload.pan || '',
      sales_person_id: lead.assigned_to || currentUser?._id,
      branch_id: lead.branch_id || currentUser?.branch_id,
      notes: `Converted from Lead #${lead.lead_code}. ${lead.notes || ''}`,
      created_by: currentUser?._id,
    });

    // 2. Create primary contact
    await CustomerContact.create({
      customer_id: customer._id,
      contact_name: lead.contact_name,
      email: lead.email,
      phone: lead.mobile || lead.phone,
      is_primary: true,
      created_by: currentUser?._id,
    });

    // 3. Create Address if city/state present
    if (lead.city || lead.state) {
      await CustomerAddress.create({
        customer_id: customer._id,
        address_type: 'billing',
        address_title: 'Registered Office',
        address_line1: payload.address_line1 || 'Main Office',
        city: lead.city || 'City',
        state: lead.state || 'State',
        pincode: payload.pincode || '000000',
        is_primary: true,
        created_by: currentUser?._id,
      });
    }

    // 4. Update Lead to won and converted
    lead.pipeline_stage = 'won';
    lead.lead_status = 'won';
    lead.converted_to_customer_id = customer._id;
    lead.converted_at = new Date();
    lead.updated_by = currentUser?._id;
    await lead.save();

    await logAudit({
      user: currentUser,
      action: 'CONVERT_LEAD',
      module: 'Lead',
      record_id: lead._id,
      after: { customer_id: customer._id, customer_code: customer.customer_code },
      req,
    });

    return { customer, lead };
  }

  // --- FOLLOW-UPS ---
  async listFollowups(query = {}, scopeFilter = {}) {
    const { filter_type = 'all', status = 'pending', page = 1, limit = 20 } = query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (filter_type === 'today') {
      filter.followup_date = { $gte: todayStart, $lte: todayEnd };
    } else if (filter_type === 'overdue') {
      filter.followup_date = { $lt: todayStart };
      filter.status = 'pending';
    } else if (filter_type === 'upcoming') {
      filter.followup_date = { $gt: todayEnd };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [followups, total] = await Promise.all([
      LeadFollowup.find(filter)
        .populate('lead_id', 'contact_name company_name lead_code mobile email pipeline_stage')
        .populate('assigned_to', 'full_name')
        .sort({ followup_date: 1 })
        .skip(skip)
        .limit(Number(limit)),
      LeadFollowup.countDocuments(filter),
    ]);

    return {
      items: followups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async createFollowup(payload, currentUser) {
    if (!payload.assigned_to && currentUser) {
      payload.assigned_to = currentUser._id;
    }
    return LeadFollowup.create({
      ...payload,
      created_by: currentUser?._id,
    });
  }

  async completeFollowup(id, { outcome, next_followup_date, next_agenda, next_type }, currentUser) {
    const followup = await LeadFollowup.findById(id);
    if (!followup) throw new AppError('Followup not found', 404);

    followup.status = 'completed';
    followup.outcome = outcome || 'Completed successfully';
    followup.completed_at = new Date();
    await followup.save();

    // Optionally schedule next followup if requested
    let nextFollowup = null;
    if (next_followup_date) {
      nextFollowup = await LeadFollowup.create({
        lead_id: followup.lead_id,
        followup_date: next_followup_date,
        followup_type: next_type || followup.followup_type,
        agenda: next_agenda || 'Follow up on discussion',
        assigned_to: followup.assigned_to,
        created_by: currentUser?._id,
      });
    }

    return { completed: followup, next: nextFollowup };
  }
}

export const leadService = new LeadService();
export default leadService;
