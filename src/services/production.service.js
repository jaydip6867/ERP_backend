import { WorkOrder } from '../models/workOrder.model.js';
import { MaterialIssue } from '../models/materialIssue.model.js';
import { ProductionLog } from '../models/productionLog.model.js';
import { ProductionCost } from '../models/productionCost.model.js';
import { ScrapRecord } from '../models/scrapRecord.model.js';
import { Bom } from '../models/bom.model.js';
import { Product } from '../models/product.model.js';
import { Batch } from '../models/batch.model.js';
import { StockTransactionService } from './stockTransaction.service.js';
import { AppError } from '../utils/appError.js';

export class ProductionService {
  /**
   * Production Dashboard metrics
   */
  static async getDashboardMetrics() {
    const [totalWorkOrders, inProgressWO, completedWO, todayLogs, totalScrap] = await Promise.all([
      WorkOrder.countDocuments(),
      WorkOrder.countDocuments({ status: { $in: ['materials_issued', 'in_production'] } }),
      WorkOrder.countDocuments({ status: 'completed' }),
      ProductionLog.countDocuments({
        log_date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      ScrapRecord.aggregate([
        { $group: { _id: null, totalQty: { $sum: '$quantity' }, totalValue: { $sum: '$estimated_scrap_value' } } },
      ]),
    ]);

    return {
      total_work_orders: totalWorkOrders,
      in_progress_wo: inProgressWO,
      completed_wo: completedWO,
      today_logs_count: todayLogs,
      total_scrap_qty: totalScrap[0]?.totalQty || 0,
      total_scrap_value: totalScrap[0]?.totalValue || 0,
    };
  }

  /**
   * Work Orders CRUD & Status
   */
  static async getWorkOrders({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      WorkOrder.find(filter)
        .populate('product_id', 'product_name product_code sku')
        .populate('bom_id', 'bom_number version')
        .populate('sales_order_id', 'order_number customer_po_number')
        .populate('warehouse_id', 'warehouse_name')
        .populate('assigned_supervisor_id', 'full_name')
        .sort({ wo_date: -1 })
        .skip(skip)
        .limit(limit),
      WorkOrder.countDocuments(filter),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getWorkOrderById(id) {
    const wo = await WorkOrder.findById(id)
      .populate('product_id')
      .populate({
        path: 'bom_id',
        populate: { path: 'items.product_id' },
      })
      .populate('sales_order_id')
      .populate('warehouse_id')
      .populate('raw_material_warehouse_id')
      .populate('assigned_supervisor_id', 'full_name email');

    if (!wo) throw AppError.notFound('Work order not found');
    return wo;
  }

  static async createWorkOrder(data, userId) {
    let woNumber = data.wo_number;
    if (!woNumber) {
      const count = await WorkOrder.countDocuments();
      woNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const wo = await WorkOrder.create({
      ...data,
      wo_number: woNumber,
      status: 'planned',
      created_by: userId,
    });
    return wo;
  }

  /**
   * Check Material Availability for a Work Order against BOM & Warehouse Stock
   */
  static async checkMaterialAvailability(bomId, plannedQty, warehouseId) {
    const bom = await Bom.findById(bomId).populate('items.product_id');
    if (!bom) throw AppError.notFound('BOM not found');

    const checkResults = [];
    let isFullyAvailable = true;

    for (const item of bom.items) {
      const requiredQty = (item.quantity / (bom.batch_size || 1)) * plannedQty;
      const rawProduct = item.product_id;

      const currentStock = rawProduct.current_stock || 0;
      const shortage = Math.max(0, requiredQty - currentStock);
      if (shortage > 0) isFullyAvailable = false;

      checkResults.push({
        product_id: rawProduct._id,
        product_name: rawProduct.product_name,
        product_code: rawProduct.product_code,
        uom: rawProduct.uom_id,
        required_qty: Math.round(requiredQty * 1000) / 1000,
        current_stock: currentStock,
        shortage: Math.round(shortage * 1000) / 1000,
        is_sufficient: shortage === 0,
      });
    }

    return { isFullyAvailable, materials: checkResults };
  }

  /**
   * Material Issues (Deduct raw materials from warehouse to shop floor)
   */
  static async getMaterialIssues({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [issues, total] = await Promise.all([
      MaterialIssue.find()
        .populate('work_order_id', 'wo_number status')
        .populate('warehouse_id', 'warehouse_name')
        .populate('items.product_id', 'product_name product_code')
        .populate('issued_by', 'full_name')
        .sort({ issue_date: -1 })
        .skip(skip)
        .limit(limit),
      MaterialIssue.countDocuments(),
    ]);

    return { issues, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async issueMaterials(data, userId) {
    let issueNumber = data.issue_number;
    if (!issueNumber) {
      const count = await MaterialIssue.countDocuments();
      issueNumber = `MI-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const workOrder = await WorkOrder.findById(data.work_order_id);
    if (!workOrder) throw AppError.notFound('Work order not found');

    const issue = await MaterialIssue.create({
      ...data,
      issue_number: issueNumber,
      issued_by: userId,
      status: 'issued',
      created_by: userId,
    });

    // Deduct each raw material item via StockTransactionService
    for (const item of data.items || []) {
      await StockTransactionService.recordTransaction({
        transaction_type: 'MATERIAL_ISSUE',
        product_id: item.product_id,
        warehouse_id: data.warehouse_id,
        batch_id: item.batch_id,
        qty: item.issued_qty,
        reference_type: 'MaterialIssue',
        reference_id: issue._id,
        reference_no: issue.issue_number,
        remarks: `Issued for Work Order ${workOrder.wo_number}`,
        performed_by: userId,
      });
    }

    issue.stock_deducted = true;
    await issue.save();

    workOrder.status = 'materials_issued';
    await workOrder.save();

    return issue;
  }

  /**
   * Production Logs (Shifts, produced quantities, scrap, downtime)
   */
  static async getProductionLogs({ work_order_id, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (work_order_id) filter.work_order_id = work_order_id;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ProductionLog.find(filter)
        .populate('work_order_id', 'wo_number product_id')
        .sort({ log_date: -1 })
        .skip(skip)
        .limit(limit),
      ProductionLog.countDocuments(filter),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createProductionLog(data, userId) {
    let logNumber = data.log_number;
    if (!logNumber) {
      const count = await ProductionLog.countDocuments();
      logNumber = `PLOG-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const workOrder = await WorkOrder.findById(data.work_order_id);
    if (!workOrder) throw AppError.notFound('Work order not found');

    const log = await ProductionLog.create({
      ...data,
      log_number: logNumber,
      created_by: userId,
    });

    // Update work order produced & rejected quantities
    workOrder.produced_qty = (workOrder.produced_qty || 0) + (data.quantity_produced || 0);
    workOrder.rejected_qty = (workOrder.rejected_qty || 0) + (data.scrap_quantity || 0);

    if (workOrder.produced_qty >= workOrder.planned_qty) {
      workOrder.status = 'in_production';
    }
    await workOrder.save();

    return log;
  }

  /**
   * Finalize Finished Goods into Inventory upon QC completion.
   */
  static async receiveFinishedGoods(workOrderId, { qty, batch_number, mfg_date, expiry_date }, userId) {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw AppError.notFound('Work order not found');

    const finalBatchNo = batch_number || `FG-${workOrder.wo_number.slice(-4)}-${Date.now().toString().slice(-4)}`;

    // Create batch for finished good
    let batch = await Batch.create({
      batch_number: finalBatchNo,
      product_id: workOrder.product_id,
      warehouse_id: workOrder.warehouse_id,
      mfg_date: mfg_date || new Date(),
      expiry_date: expiry_date || null,
      initial_qty: qty,
      current_qty: qty,
      status: 'active',
      created_by: userId,
    });

    // Post PRODUCTION_RECEIPT via StockTransactionService
    await StockTransactionService.recordTransaction({
      transaction_type: 'PRODUCTION_RECEIPT',
      product_id: workOrder.product_id,
      warehouse_id: workOrder.warehouse_id,
      batch_id: batch._id,
      batch_number: batch.batch_number,
      qty,
      reference_type: 'ProductionLog',
      reference_id: workOrder._id,
      reference_no: workOrder.wo_number,
      remarks: `Finished goods manufactured from Work Order ${workOrder.wo_number}`,
      performed_by: userId,
    });

    workOrder.status = 'completed';
    workOrder.actual_end_date = new Date();
    workOrder.finished_batch_id = batch._id;
    await workOrder.save();

    return { workOrder, batch };
  }

  /**
   * Scrap Records
   */
  static async getScrapRecords({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      ScrapRecord.find()
        .populate('product_id', 'product_name product_code')
        .populate('work_order_id', 'wo_number')
        .sort({ scrap_date: -1 })
        .skip(skip)
        .limit(limit),
      ScrapRecord.countDocuments(),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createScrapRecord(data, userId) {
    let scrapNumber = data.scrap_number;
    if (!scrapNumber) {
      const count = await ScrapRecord.countDocuments();
      scrapNumber = `SCRAP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    return ScrapRecord.create({
      ...data,
      scrap_number: scrapNumber,
      created_by: userId,
    });
  }

  /**
   * Production Costing
   */
  static async getCosting(workOrderId) {
    let cost = await ProductionCost.findOne({ work_order_id: workOrderId });
    if (!cost) {
      // Estimate baseline from materials issued
      const issues = await MaterialIssue.find({ work_order_id: workOrderId });
      const rawCost = issues.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);
      cost = await ProductionCost.create({
        work_order_id: workOrderId,
        raw_material_cost: rawCost,
        direct_labor_cost: rawCost * 0.15,
        machine_overhead_cost: rawCost * 0.1,
        total_cost: rawCost * 1.25,
      });
    }
    return cost;
  }
}

export default ProductionService;
