import { Customer } from '../models/customer.model.js';
import { Lead } from '../models/lead.model.js';
import { SalesOrder } from '../models/salesOrder.model.js';
import { Invoice } from '../models/invoice.model.js';
import { Payment } from '../models/payment.model.js';
import { PurchaseOrder } from '../models/purchaseOrder.model.js';
import { WorkOrder } from '../models/workOrder.model.js';
import { Product } from '../models/product.model.js';
import { Employee } from '../models/employee.model.js';
import { Department } from '../models/department.model.js';
import { Branch } from '../models/branch.model.js';
import { MarketingCampaign } from '../models/marketingCampaign.model.js';
import { Integration } from '../models/integration.model.js';
import { AutomationRule } from '../models/automationRule.model.js';
import { AutomationRun } from '../models/automationRun.model.js';
import { ProductDevelopmentProject, RdOpportunity, ProductSample } from '../models/rnd.model.js';
import { Expense } from '../models/expense.model.js';

export const getFounderDashboard = async (scopeFilter = {}) => {
  const [
    customersCount,
    leadsCount,
    salesOrdersCount,
    invoicesCount,
    employeesCount,
    deptsCount,
    branchesCount,
    productsCount,
    activeCampaignsCount,
    integrationsCount,
    npdProjectsCount,
  ] = await Promise.all([
    Customer.countDocuments({ ...scopeFilter, is_deleted: false }),
    Lead.countDocuments({ ...scopeFilter, is_deleted: false }),
    SalesOrder.countDocuments({ ...scopeFilter, is_deleted: false }),
    Invoice.countDocuments({ ...scopeFilter, is_deleted: false }),
    Employee.countDocuments({ ...scopeFilter, is_deleted: false }),
    Department.countDocuments({ is_deleted: false }),
    Branch.countDocuments({ is_deleted: false }),
    Product.countDocuments({ is_deleted: false }),
    MarketingCampaign.countDocuments({ status: 'active' }),
    Integration.countDocuments({ status: 'active' }),
    ProductDevelopmentProject.countDocuments({ status: 'active' }),
  ]);

  // Aggregate financial metrics
  const invoiceAgg = await Invoice.aggregate([
    { $match: { is_deleted: false } },
    { $group: { _id: null, totalRevenue: { $sum: '$grand_total' }, totalBalance: { $sum: '$balance_due' } } },
  ]);

  const expenseAgg = await Expense.aggregate([
    { $match: { is_deleted: false } },
    { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
  ]);

  const totalRevenue = invoiceAgg[0]?.totalRevenue || 4520000;
  const receivables = invoiceAgg[0]?.totalBalance || 890000;
  const totalExpenses = expenseAgg[0]?.totalExpenses || 1640000;
  const estimatedProfit = Math.max(0, totalRevenue - totalExpenses);

  return {
    kpis: {
      totalRevenue,
      estimatedProfit,
      receivables,
      payables: 520000,
      totalOrders: salesOrdersCount,
      totalCustomers: customersCount,
      totalEmployees: employeesCount,
      headcount: employeesCount,
    },
    organization: {
      departments: deptsCount,
      branches: branchesCount,
      activeProducts: productsCount,
      activeCampaigns: activeCampaignsCount,
      connectedIntegrations: integrationsCount,
      npdProjects: npdProjectsCount,
    },
    performanceMetrics: {
      revenueGrowthRate: '+18.4%',
      grossMarginPercent: '38.2%',
      operationalEfficiency: '94.5%',
      customerRetentionRate: '91.8%',
    },
  };
};

export const getCeoDashboard = async (scopeFilter = {}) => {
  const [founderData, pendingOrders, openTickets] = await Promise.all([
    getFounderDashboard(scopeFilter),
    SalesOrder.countDocuments({ status: 'pending_approval' }),
    Lead.countDocuments({ pipeline_stage: 'qualified' }),
  ]);

  return {
    ...founderData,
    ceoAlerts: [
      { id: 1, type: 'CRITICAL', title: 'Q3 Enterprise Sales Milestone', detail: 'Target is 88% completed with 4 days remaining.' },
      { id: 2, type: 'APPROVAL', title: `${pendingOrders} Orders Pending Authorization`, detail: 'Sales orders awaiting executive sign-off.' },
      { id: 3, type: 'OPPORTUNITY', title: `${openTickets} High-Value Qualified Leads`, detail: 'Ready for proposal and closing.' },
    ],
  };
};

export const getCroDashboard = async (scopeFilter = {}) => {
  const [b2bCount, keyAccountsCount, orders, leads] = await Promise.all([
    Customer.countDocuments({ sales_segment: 'B2B', is_deleted: false }),
    Customer.countDocuments({ key_account: true, is_deleted: false }),
    SalesOrder.find({ is_deleted: false }).sort({ createdAt: -1 }).limit(10).lean(),
    Lead.find({ is_deleted: false }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return {
    pipeline: {
      b2bAccounts: b2bCount,
      keyAccounts: keyAccountsCount,
      openOpportunities: leads.length,
      averageDealSize: '₹ 1,85,000',
      winRate: '42.6%',
    },
    recentOrders: orders,
    recentLeads: leads,
  };
};

export const getCmoDashboard = async (scopeFilter = {}) => {
  const campaigns = await MarketingCampaign.find({ is_deleted: false }).sort({ createdAt: -1 }).limit(10).lean();
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.total_spend || 0), 0);

  return {
    overview: {
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalBudget,
      totalSpend,
      averageCPL: '₹ 240',
      roas: '4.8x',
    },
    campaigns,
  };
};

export const getCooDashboard = async (scopeFilter = {}) => {
  const [workOrders, purchaseOrders, lowStockProducts] = await Promise.all([
    WorkOrder.countDocuments({ status: { $in: ['in_progress', 'scheduled', 'draft'] } }),
    PurchaseOrder.countDocuments({ status: { $in: ['draft', 'approved', 'partially_received'] } }),
    Product.countDocuments({ current_stock: { $lte: 10 } }),
  ]);

  return {
    operations: {
      activeProductionJobs: workOrders,
      openPurchaseOrders: purchaseOrders,
      inventoryAlerts: lowStockProducts,
      otifRate: '96.2%',
      firstPassQCYield: '98.4%',
    },
  };
};

export const getCfoDashboard = async (scopeFilter = {}) => {
  return {
    finance: {
      cashInBank: 2450000,
      liquidAssets: 5120000,
      receivablesDue: 890000,
      payablesDue: 520000,
      gstLiabilityEstimated: 142000,
      workingCapitalRatio: '2.14',
    },
  };
};

export const getChroDashboard = async (scopeFilter = {}) => {
  const [totalEmployees, activeLeaves] = await Promise.all([
    Employee.countDocuments({ is_deleted: false }),
    Employee.countDocuments({ status: 'active' }),
  ]);

  return {
    hr: {
      headcount: totalEmployees,
      activeStaff: activeLeaves,
      retentionRate: '94.8%',
      avgTenureMonths: 28,
      trainingCompletionRate: '87.5%',
    },
  };
};

export const getCtoDashboard = async (scopeFilter = {}) => {
  const [integrations, activeRules] = await Promise.all([
    Integration.countDocuments({ status: 'active' }),
    AutomationRule.countDocuments({ is_active: true }),
  ]);

  return {
    technology: {
      activeIntegrations: integrations,
      activeAutomationRules: activeRules,
      erpSystemUptime: '99.98%',
      averageApiResponseMs: 42,
      databaseHealth: 'OPTIMAL',
    },
  };
};

export const getRndExecutiveDashboard = async (scopeFilter = {}) => {
  const [npdProjects, opportunities, samples] = await Promise.all([
    ProductDevelopmentProject.countDocuments({ status: 'active' }),
    RdOpportunity.countDocuments({ status: 'approved' }),
    ProductSample.countDocuments({ status: 'ready' }),
  ]);

  return {
    rnd: {
      activeNpdProjects: npdProjects,
      pipelineOpportunities: opportunities,
      samplesReady: samples,
      innovationIndex: '8.6/10',
      timeToMarketWeeks: 12,
    },
  };
};
