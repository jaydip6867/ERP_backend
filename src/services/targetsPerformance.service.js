import { TargetGoal } from '../models/targetGoal.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { Lead } from '../models/lead.model.js';
import { Receipt } from '../models/receipt.model.js';
import { User } from '../models/user.model.js';

export class TargetsPerformanceEngine {
  /**
   * Evaluate Target vs Real ERP Actuals
   */
  static async evaluateTarget(targetId) {
    const target = await TargetGoal.findById(targetId)
      .populate('assigned_user_id', 'full_name user_code')
      .populate('assigned_branch_id', 'branch_name')
      .populate('assigned_product_id', 'product_name product_code');

    if (!target) return null;

    let actualValue = 0;
    const dateQuery = {
      createdAt: { $gte: target.start_date, $lte: target.end_date },
    };

    if (target.assigned_user_id) {
      dateQuery.created_by = target.assigned_user_id._id;
    }
    if (target.assigned_branch_id) {
      dateQuery.branch_id = target.assigned_branch_id._id;
    }

    if (target.target_metric === 'SALES_REVENUE') {
      const orders = await SalesOrder.find({
        ...dateQuery,
        status: { $nin: ['draft', 'cancelled'] },
      });
      orders.forEach((o) => (actualValue += o.grand_total || 0));
    } else if (target.target_metric === 'LEAD_COUNT') {
      actualValue = await Lead.countDocuments(dateQuery);
    } else if (target.target_metric === 'CONVERTED_ORDERS') {
      actualValue = await SalesOrder.countDocuments({
        ...dateQuery,
        status: { $nin: ['draft', 'cancelled'] },
      });
    } else if (target.target_metric === 'PAYMENT_COLLECTION') {
      const receipts = await Receipt.find({
        ...dateQuery,
        status: 'cleared',
      });
      receipts.forEach((r) => (actualValue += r.amount || 0));
    }

    const achievementPercentage = target.target_value > 0 ? Math.round((actualValue / target.target_value) * 10000) / 100 : 0;

    return {
      target_id: target._id,
      target_name: target.target_name,
      target_type: target.target_type,
      target_metric: target.target_metric,
      period_label: target.period_label,
      assigned_to: target.assigned_user_id?.full_name || target.assigned_branch_id?.branch_name || 'Organization',
      target_value: target.target_value,
      actual_value: Math.round(actualValue * 100) / 100,
      achievement_percentage: achievementPercentage,
      status: achievementPercentage >= 100 ? 'achieved' : 'in_progress',
    };
  }

  /**
   * Team & Employee Performance Leaderboard
   */
  static async getTeamPerformanceLeaderboard() {
    const users = await User.find({ status: 'active' }).populate('role_id', 'role_name role_code');

    const leaderboard = [];
    for (const u of users) {
      const [orderCount, revenueAggregate, leadsCount] = await Promise.all([
        SalesOrder.countDocuments({ salesperson_id: u._id, status: { $ne: 'cancelled' } }),
        SalesOrder.aggregate([
          { $match: { salesperson_id: u._id, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$grand_total' } } },
        ]),
        Lead.countDocuments({ assigned_to: u._id }),
      ]);

      const revenue = revenueAggregate[0]?.total || 0;

      leaderboard.push({
        user_id: u._id,
        name: u.full_name,
        role: u.role_id?.role_name || 'Staff',
        department: u.department || 'Sales',
        leads_handled: leadsCount,
        orders_closed: orderCount,
        revenue_generated: revenue,
        performance_score: Math.min(100, Math.round((revenue / 100000) * 10) + orderCount * 5),
      });
    }

    return leaderboard.sort((a, b) => b.revenue_generated - a.revenue_generated);
  }
}

export default TargetsPerformanceEngine;
