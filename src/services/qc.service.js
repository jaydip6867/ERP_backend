import { QcParameter } from '../models/qcParameter.model.js';
import { QcTemplate } from '../models/qcTemplate.model.js';
import { QcInspection } from '../models/qcInspection.model.js';
import { ReworkRecord } from '../models/reworkRecord.model.js';
import { GoodsReceiptNote } from '../models/grn.model.js';
import { WorkOrder } from '../models/workOrder.model.js';
import { Dispatch } from '../models/dispatch.model.js';
import { AppError } from '../utils/appError.js';

export class QcService {
  /**
   * QC Dashboard Summary
   */
  static async getDashboardMetrics() {
    const [totalInspections, passedCount, failedCount, reworkCount, scrapCount, pendingCount] =
      await Promise.all([
        QcInspection.countDocuments(),
        QcInspection.countDocuments({ outcome: 'PASS' }),
        QcInspection.countDocuments({ outcome: 'FAIL' }),
        QcInspection.countDocuments({ outcome: 'REWORK' }),
        QcInspection.countDocuments({ outcome: 'SCRAP' }),
        QcInspection.countDocuments({ outcome: 'PENDING' }),
      ]);

    const passRate = totalInspections > 0 ? Math.round((passedCount / totalInspections) * 100) : 100;

    return {
      total_inspections: totalInspections,
      passed: passedCount,
      failed: failedCount,
      rework: reworkCount,
      scrap: scrapCount,
      pending: pendingCount,
      pass_rate_percent: passRate,
    };
  }

  /**
   * Parameters & Templates
   */
  static async getParameters({ search, category } = {}) {
    const filter = { status: 'active' };
    if (category) filter.category = category;
    if (search) filter.param_name = { $regex: search, $options: 'i' };
    return QcParameter.find(filter).sort({ param_name: 1 });
  }

  static async createParameter(data, userId) {
    let code = data.param_code;
    if (!code) {
      const count = await QcParameter.countDocuments();
      code = `QCP-${String(count + 1).padStart(4, '0')}`;
    }
    return QcParameter.create({ ...data, param_code: code, created_by: userId });
  }

  static async getTemplates({ inspection_type } = {}) {
    const filter = { status: 'active' };
    if (inspection_type) filter.inspection_type = inspection_type;
    return QcTemplate.find(filter)
      .populate('product_id', 'product_name product_code')
      .populate('parameters.parameter_id')
      .sort({ template_name: 1 });
  }

  static async createTemplate(data, userId) {
    let code = data.template_code;
    if (!code) {
      const count = await QcTemplate.countDocuments();
      code = `QCT-${String(count + 1).padStart(4, '0')}`;
    }
    return QcTemplate.create({ ...data, template_code: code, created_by: userId });
  }

  /**
   * QC Inspections
   */
  static async getInspections({ inspection_type, outcome, search, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (inspection_type) filter.inspection_type = inspection_type;
    if (outcome) filter.outcome = outcome;
    if (search) {
      filter.$or = [
        { inspection_number: { $regex: search, $options: 'i' } },
        { source_document_no: { $regex: search, $options: 'i' } },
        { batch_no: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [inspections, total] = await Promise.all([
      QcInspection.find(filter)
        .populate('product_id', 'product_name product_code')
        .populate('inspector_id', 'full_name')
        .sort({ inspection_date: -1 })
        .skip(skip)
        .limit(limit),
      QcInspection.countDocuments(filter),
    ]);

    return { inspections, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getInspectionById(id) {
    const inspection = await QcInspection.findById(id)
      .populate('product_id')
      .populate('inspector_id', 'full_name email')
      .populate('template_id');
    if (!inspection) throw AppError.notFound('Inspection not found');
    return inspection;
  }

  static async createInspection(data, userId) {
    let inspectionNumber = data.inspection_number;
    if (!inspectionNumber) {
      const count = await QcInspection.countDocuments();
      inspectionNumber = `QC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    const inspection = await QcInspection.create({
      ...data,
      inspection_number: inspectionNumber,
      inspector_id: userId,
      created_by: userId,
    });

    // Link back to source document
    if (data.source_document_type === 'GRN' && data.source_document_id) {
      await GoodsReceiptNote.findByIdAndUpdate(data.source_document_id, {
        qc_inspection_id: inspection._id,
        status: data.outcome === 'PASS' ? 'qc_completed' : 'qc_in_progress',
      });
    } else if (data.source_document_type === 'DISPATCH' && data.source_document_id) {
      await Dispatch.findByIdAndUpdate(data.source_document_id, {
        qc_inspection_id: inspection._id,
      });
    }

    // If outcome is REWORK, automatically create a Rework record
    if (data.outcome === 'REWORK' && data.rework_qty > 0) {
      const count = await ReworkRecord.countDocuments();
      const reworkNumber = `RWK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      await ReworkRecord.create({
        rework_number: reworkNumber,
        qc_inspection_id: inspection._id,
        work_order_id: data.source_document_type === 'WORK_ORDER' ? data.source_document_id : null,
        product_id: data.product_id,
        batch_no: data.batch_no || '',
        rework_qty: data.rework_qty,
        defect_description: data.remarks || 'Dimensional or aesthetic variance',
        corrective_action_plan: 'Standard rework procedure',
        status: 'pending',
        created_by: userId,
      });
    }

    return inspection;
  }

  /**
   * Rework Records
   */
  static async getReworkRecords({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      ReworkRecord.find(filter)
        .populate('product_id', 'product_name product_code')
        .populate('qc_inspection_id', 'inspection_number')
        .sort({ rework_date: -1 })
        .skip(skip)
        .limit(limit),
      ReworkRecord.countDocuments(filter),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export default QcService;
