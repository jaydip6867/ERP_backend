import {
  PrintingJob,
  EmbroideryJob,
  PackingJob,
  LogisticsJob,
  SupplyChainPlan,
  OperationProject,
} from '../models/operationsExtensions.model.js';
import {
  MarketingAsset,
  ContentItem,
  CreativeRequest,
  PhysicalMarketingActivity,
} from '../models/marketingExtensions.model.js';
import { CostCenter, ManagementReport } from '../models/financeExtensions.model.js';
import { Customer } from '../models/customer.model.js';
import { Lead } from '../models/lead.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { Brand } from '../models/brand.model.js';
import { Product } from '../models/product.model.js';
import { Supplier } from '../models/supplier.model.js';

// ==========================================
// 1. Operations & Job Tracking
// ==========================================
export const getOperationsDashboard = async () => {
  const [printingCount, embroideryCount, packingCount, logisticsCount, supplyPlans, projects] =
    await Promise.all([
      PrintingJob.countDocuments({ status: { $ne: 'completed' } }),
      EmbroideryJob.countDocuments({ status: { $ne: 'completed' } }),
      PackingJob.countDocuments({ status: { $ne: 'ready_for_dispatch' } }),
      LogisticsJob.countDocuments({ status: { $in: ['in_transit', 'booked', 'picked_up'] } }),
      SupplyChainPlan.find().sort({ createdAt: -1 }).limit(5).lean(),
      OperationProject.find({ status: 'active' }).limit(5).lean(),
    ]);

  return {
    activeJobs: {
      printing: printingCount,
      embroidery: embroideryCount,
      packing: packingCount,
      logisticsInTransit: logisticsCount,
    },
    supplyPlans,
    projects,
  };
};

export const getPrintingJobs = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return PrintingJob.find(filter).sort({ createdAt: -1 });
};

export const createPrintingJob = async (data) => {
  const code = (data.job_code || `PRT-${Date.now().toString().slice(-4)}`).toUpperCase();
  const status = (data.status || 'queued').toLowerCase().replace('in_progress', 'in_progress');
  const print_technique = (data.print_technique || (data.print_type === 'SCREEN_PRINT' ? 'SCREEN_PRINTING' : 'SCREEN_PRINTING'));
  return PrintingJob.create({ ...data, job_code: code, status, print_technique });
};

export const getEmbroideryJobs = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return EmbroideryJob.find(filter).sort({ createdAt: -1 });
};

export const createEmbroideryJob = async (data) => {
  const code = (data.job_code || `EMB-${Date.now().toString().slice(-4)}`).toUpperCase();
  const status = (data.status || 'queued').toLowerCase();
  const stitches_count = data.stitches_count || data.stitch_count || 5000;
  return EmbroideryJob.create({ ...data, job_code: code, status, stitches_count });
};

export const getPackingJobs = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return PackingJob.find(filter).sort({ createdAt: -1 });
};

export const createPackingJob = async (data) => {
  const code = (data.job_code || `PCK-${Date.now().toString().slice(-4)}`).toUpperCase();
  let status = (data.status || 'pending').toLowerCase();
  if (status === 'ready_to_pack') status = 'pending';
  let packaging_type = data.packaging_type || 'CORRUGATED_CARTON';
  if (packaging_type === 'CARTON_EXPORT') packaging_type = 'CORRUGATED_CARTON';
  return PackingJob.create({ ...data, job_code: code, status, packaging_type });
};

export const getLogisticsJobs = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return LogisticsJob.find(filter).sort({ createdAt: -1 });
};

export const createLogisticsJob = async (data) => {
  const code = (data.consignment_number || data.tracking_number || `CN-${Date.now().toString().slice(-6)}`).toUpperCase();
  const origin_city = data.origin_city || 'Headquarters';
  const destination_city = data.destination_city || data.destination || 'Hub';
  const carrier_name = data.carrier_name || data.transporter_name || 'Standard Express';
  let status = (data.status || 'booked').toLowerCase();
  if (status === 'dispatched') status = 'in_transit';
  return LogisticsJob.create({ ...data, consignment_number: code, origin_city, destination_city, carrier_name, status });
};

export const getSupplyChainPlans = async () => {
  return SupplyChainPlan.find().sort({ month_year: -1 });
};

export const createSupplyChainPlan = async (data) => {
  const plan_name = data.plan_name || data.plan_code || data.material_name || `Plan ${new Date().toISOString().slice(0, 7)}`;
  const month_year = data.month_year || new Date().toISOString().slice(0, 7);
  return SupplyChainPlan.create({ ...data, plan_name, month_year });
};

export const getMerchandisingProducts = async (query = {}) => {
  const filter = {};
  if (query.merchandising_status) filter.merchandising_status = query.merchandising_status;
  return Product.find(filter).populate('brand_id', 'brand_name').sort({ product_name: 1 });
};

export const getVendorManagementData = async () => {
  return Supplier.find({ is_deleted: false }).sort({ supplier_name: 1 });
};

// ==========================================
// 2. Marketing Extensions
// ==========================================
export const getMarketingAssets = async (query = {}) => {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.asset_type) filter.asset_type = query.asset_type;
  return MarketingAsset.find(filter).populate('brand_id', 'brand_name logo').sort({ createdAt: -1 });
};

export const createMarketingAsset = async (data) => {
  const title = data.title || data.asset_name || 'Marketing Asset';
  const file_url = data.file_url || 'https://example.com/asset.png';
  return MarketingAsset.create({ ...data, title, file_url });
};

export const getContentItems = async (query = {}) => {
  const filter = {};
  if (query.channel) filter.channel = query.channel;
  if (query.status) filter.status = query.status;
  return ContentItem.find(filter).populate('author_id', 'full_name').sort({ createdAt: -1 });
};

export const createContentItem = async (data) => {
  const title = data.title || 'Untitled Content';
  const content_text = data.content_text || data.description || title;
  const status = (data.status || 'draft').toLowerCase();
  return ContentItem.create({ ...data, title, content_text, status });
};

export const getCreativeRequests = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return CreativeRequest.find(filter).populate('requested_by assigned_to', 'full_name email').sort({ dueDate: 1 });
};

export const createCreativeRequest = async (data) => {
  const title = data.title || data.request_title || 'Creative Request';
  const brief = data.brief || data.dimensions || data.description || 'Design brief';
  let status = (data.status || 'submitted').toLowerCase();
  if (status === 'in_design') status = 'in_progress';
  return CreativeRequest.create({ ...data, title, brief, status });
};

export const getPhysicalMarketing = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return PhysicalMarketingActivity.find(filter).sort({ start_date: -1 });
};

export const createPhysicalMarketing = async (data) => {
  const activity_name = data.activity_name || data.title || 'Marketing Activity';
  const start_date = data.start_date || data.event_date || new Date();
  const end_date = data.end_date || data.event_date || new Date(Date.now() + 86400000);
  const location = data.location || 'Headquarters Event Grounds';
  let status = (data.status || 'planning').toLowerCase();
  return PhysicalMarketingActivity.create({ ...data, activity_name, start_date, end_date, location, status });
};

export const getBrands = async () => {
  return Brand.find({ is_deleted: false }).sort({ brand_name: 1 });
};

// ==========================================
// 3. Sales Extensions (B2B, Channel, Retail, Inside, Key Accounts)
// ==========================================
export const getSalesSegmentData = async (segmentType) => {
  let filter = { is_deleted: false };
  if (segmentType === 'b2b') {
    filter.sales_segment = 'B2B';
  } else if (segmentType === 'channel') {
    filter.$or = [{ customer_type: { $in: ['dealer', 'distributor'] } }, { account_type: 'channel_partner' }];
  } else if (segmentType === 'retail') {
    filter.customer_type = 'retail';
  } else if (segmentType === 'key-accounts') {
    filter.key_account = true;
  }

  const customers = await Customer.find(filter).populate('sales_person_id', 'full_name email').sort({ total_orders_count: -1 });
  const recentOrders = await SalesOrder.find({ customer_id: { $in: customers.map((c) => c._id) } })
    .sort({ order_date: -1 })
    .limit(10)
    .lean();

  return { customers, recentOrders, totalCount: customers.length };
};

// ==========================================
// 4. Finance Extensions (Costing, Budgeting, Cash Flow, MIS)
// ==========================================
export const getCostCenters = async () => {
  return CostCenter.find({ is_deleted: false }).populate('department_id manager_id', 'department_name full_name');
};

export const createCostCenter = async (data) => {
  const code = (data.code || data.cost_center_code || `CC-${Date.now().toString().slice(-4)}`).toUpperCase();
  const name = data.name || data.cost_center_name || 'Cost Center';
  const status = (data.status || 'active').toLowerCase();
  return CostCenter.create({ ...data, code, name, status });
};

export const getManagementReports = async (query = {}) => {
  const filter = {};
  if (query.report_type) filter.report_type = query.report_type;
  return ManagementReport.find(filter).populate('prepared_by', 'full_name email').sort({ period: -1 });
};

export const createManagementReport = async (data) => {
  const title = data.title || data.report_title || 'Management Report';
  const period = data.period || data.fiscal_year || new Date().toISOString().slice(0, 7);
  let report_type = data.report_type || 'MONTHLY_MIS';
  if (report_type === 'MIS_SUMMARY') report_type = 'MONTHLY_MIS';
  const status = (data.status || 'published').toLowerCase();
  return ManagementReport.create({ ...data, title, period, report_type, status });
};
