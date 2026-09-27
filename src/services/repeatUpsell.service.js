import { RepeatOrder } from '../models/repeatOrder.model.js';
import { UpsellOpportunity } from '../models/upsellOpportunity.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/appError.js';

export class RepeatUpsellEngine {
  /**
   * Scan completed orders and generate repeat order replenishment schedules
   */
  static async scheduleRepeatOrderFromDelivered(orderId, userId) {
    const order = await SalesOrder.findById(orderId);
    if (!order) throw AppError.notFound('Sales order not found');

    const schedules = [];
    const count = await RepeatOrder.countDocuments();

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      // Default reorder frequency: 45 days
      const days = 45;
      const expectedDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const scheduleNum = `REP-${new Date().getFullYear()}-${String(count + i + 1).padStart(4, '0')}`;

      const rec = await RepeatOrder.create({
        schedule_number: scheduleNum,
        customer_id: order.customer_id,
        previous_order_id: order._id,
        product_id: item.product_id,
        estimated_quantity: item.ordered_qty,
        average_consumption_days: days,
        expected_reorder_date: expectedDate,
        status: 'upcoming',
        assigned_salesperson_id: order.salesperson_id || userId,
        created_by: userId,
      });
      schedules.push(rec);
    }

    return schedules;
  }

  /**
   * Get Due & Upcoming Repeat Orders
   */
  static async getRepeatOrdersDashboard() {
    const now = new Date();
    const [upcoming, due, converted] = await Promise.all([
      RepeatOrder.find({ status: 'upcoming', expected_reorder_date: { $gt: now } })
        .populate('customer_id', 'company_name customer_code')
        .populate('product_id', 'product_name product_code current_stock selling_price')
        .sort({ expected_reorder_date: 1 }),
      RepeatOrder.find({ status: { $in: ['upcoming', 'due'] }, expected_reorder_date: { $lte: now } })
        .populate('customer_id', 'company_name customer_code')
        .populate('product_id', 'product_name product_code current_stock selling_price')
        .sort({ expected_reorder_date: 1 }),
      RepeatOrder.find({ status: 'ordered' }),
    ]);

    return {
      upcoming_count: upcoming.length,
      due_count: due.length,
      converted_count: converted.length,
      upcoming_orders: upcoming,
      due_orders: due,
    };
  }

  /**
   * Generate Algorithmic Upsell / Cross-Sell Opportunities
   */
  static async generateUpsellOpportunities(customerId, userId) {
    const products = await Product.find({ status: 'active' }).limit(5);
    if (products.length < 2) return [];

    const triggerProduct = products[0];
    const suggestedProduct = products[1];

    const count = await UpsellOpportunity.countDocuments();
    const oppNumber = `UPS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const opp = await UpsellOpportunity.create({
      opportunity_number: oppNumber,
      customer_id: customerId,
      opportunity_type: 'CROSS_SELL',
      trigger_product_id: triggerProduct._id,
      suggested_product_id: suggestedProduct._id,
      confidence_score: 85,
      estimated_revenue: (suggestedProduct.selling_price || 5000) * 10,
      status: 'suggested',
      assigned_salesperson_id: userId,
      created_by: userId,
    });

    return opp;
  }

  /**
   * Get Upsell Pipeline & Reports
   */
  static async getUpsellDashboard() {
    const [suggested, contacted, converted, all] = await Promise.all([
      UpsellOpportunity.find({ status: 'suggested' }).populate('customer_id trigger_product_id suggested_product_id'),
      UpsellOpportunity.find({ status: 'contacted' }).populate('customer_id trigger_product_id suggested_product_id'),
      UpsellOpportunity.find({ status: 'converted_to_order' }).populate('customer_id trigger_product_id suggested_product_id'),
      UpsellOpportunity.find().populate('customer_id trigger_product_id suggested_product_id'),
    ]);

    let totalPotential = 0;
    let realizedRevenue = 0;

    all.forEach((o) => {
      totalPotential += o.estimated_revenue || 0;
      if (o.status === 'converted_to_order') {
        realizedRevenue += o.estimated_revenue || 0;
      }
    });

    return {
      total_opportunities: all.length,
      suggested_count: suggested.length,
      contacted_count: contacted.length,
      converted_count: converted.length,
      total_pipeline_value: totalPotential,
      realized_revenue: realizedRevenue,
      conversion_rate: all.length > 0 ? Math.round((converted.length / all.length) * 100) : 0,
      opportunities: all,
    };
  }
}

export default RepeatUpsellEngine;
