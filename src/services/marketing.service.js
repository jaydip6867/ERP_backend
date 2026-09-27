import { MarketingCampaign } from '../models/marketingCampaign.model.js';
import { Lead } from '../models/lead.model.js';
import { Customer } from '../models/customer.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { AppError } from '../utils/appError.js';

export class MarketingService {
  /**
   * Calculate Campaign Performance & End-to-End Attribution
   * Campaign -> Leads -> Customers -> Orders -> Revenue -> CPL -> ROI
   */
  static async getCampaignPerformance(campaignId) {
    const campaign = await MarketingCampaign.findById(campaignId);
    if (!campaign) throw AppError.notFound('Campaign not found');

    const totalSpend = campaign.spends.reduce((acc, s) => acc + s.amount, 0) || campaign.total_spend || 1;

    // Leads attributed to this campaign (via source or campaign code)
    const leads = await Lead.find({
      $or: [
        { campaign_code: campaign.campaign_code },
        { source_details: campaign.campaign_name },
      ],
    });

    const leadCount = leads.length;
    const cpl = leadCount > 0 ? Math.round(totalSpend / leadCount) : totalSpend;

    // Customers converted from these leads
    const customerIds = leads.filter((l) => l.converted_to_customer_id).map((l) => l.converted_to_customer_id);
    const convertedCustomers = await Customer.find({ _id: { $in: customerIds } });

    // Orders generated from these customers
    const orders = await SalesOrder.find({
      customer_id: { $in: customerIds },
      status: { $ne: 'cancelled' },
    });

    let totalRevenue = 0;
    orders.forEach((o) => (totalRevenue += o.grand_total || 0));

    const netGain = totalRevenue - totalSpend;
    const roiPercentage = totalSpend > 0 ? Math.round((netGain / totalSpend) * 10000) / 100 : 0;

    return {
      campaign_id: campaign._id,
      campaign_name: campaign.campaign_name,
      campaign_code: campaign.campaign_code,
      status: campaign.status,
      total_spend: totalSpend,
      leads_generated: leadCount,
      customers_acquired: convertedCustomers.length,
      orders_count: orders.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      cost_per_lead: cpl,
      net_profit_gain: Math.round(netGain * 100) / 100,
      roi_percentage: roiPercentage,
    };
  }

  /**
   * Marketing Executive Dashboard
   */
  static async getMarketingDashboard() {
    const campaigns = await MarketingCampaign.find().sort({ createdAt: -1 });

    let totalSpend = 0;
    let totalBudget = 0;

    const campaignMetrics = [];
    for (const c of campaigns) {
      totalBudget += c.budget || 0;
      const perf = await this.getCampaignPerformance(c._id);
      totalSpend += perf.total_spend;
      campaignMetrics.push(perf);
    }

    const totalLeads = campaignMetrics.reduce((acc, m) => acc + m.leads_generated, 0);
    const totalRevenue = campaignMetrics.reduce((acc, m) => acc + m.total_revenue, 0);
    const overallCpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
    const overallRoi = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;

    return {
      total_campaigns: campaigns.length,
      total_budget: totalBudget,
      total_spend: totalSpend,
      total_leads_attributed: totalLeads,
      total_revenue_attributed: totalRevenue,
      overall_cpl: overallCpl,
      overall_roi_percentage: overallRoi,
      campaigns: campaignMetrics,
    };
  }
}

export default MarketingService;
