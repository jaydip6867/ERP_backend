import {
  MarketResearch,
  CompetitorRecord,
  RdOpportunity,
  ProductDevelopmentProject,
  ProductSample,
  ProductTest,
  ProductImprovement,
  CustomerResearch,
  ResearchFeedback,
  ProblemSolvingProject,
} from '../models/rnd.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/appError.js';
import { recordAuditLog } from '../utils/audit.util.js';

// ==========================================
// 1. R&D Dashboard
// ==========================================
export const getRndDashboard = async () => {
  const [
    activeProjects,
    totalProjects,
    opportunities,
    samplesInTesting,
    improvementsCount,
    solvedProblemsCount,
    recentProjects,
    recentTests,
  ] = await Promise.all([
    ProductDevelopmentProject.countDocuments({ status: 'active' }),
    ProductDevelopmentProject.countDocuments(),
    RdOpportunity.countDocuments({ status: { $in: ['idea', 'under_review', 'approved'] } }),
    ProductSample.countDocuments({ status: { $in: ['in_production', 'ready', 'requested'] } }),
    ProductImprovement.countDocuments({ status: { $in: ['reported', 'investigating', 'in_design'] } }),
    ProblemSolvingProject.countDocuments({ status: 'closed' }),
    ProductDevelopmentProject.find({ status: 'active' })
      .populate('project_lead_id', 'full_name email')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    ProductTest.find()
      .populate('sample_id', 'sample_code version')
      .sort({ test_date: -1 })
      .limit(6)
      .lean(),
  ]);

  return {
    metrics: {
      activeProjects,
      totalProjects,
      opportunities,
      samplesInTesting,
      improvementsCount,
      solvedProblemsCount,
    },
    recentProjects,
    recentTests,
  };
};

// ==========================================
// 2. Market Research & Competitors
// ==========================================
export const getMarketResearch = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { target_market: { $regex: query.search, $options: 'i' } },
    ];
  }
  return MarketResearch.find(filter).populate('author_id', 'full_name email').sort({ createdAt: -1 });
};

export const createMarketResearch = async (data, actorUser, req = null) => {
  let status = (data.status || 'published').toLowerCase();
  if (['completed', 'active'].includes(status)) status = 'published';

  const res = await MarketResearch.create({
    ...data,
    status,
    author_id: actorUser?._id || null,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'rnd',
    recordId: res._id,
    recordRef: res.title,
    description: `Published market research study '${res.title}'`,
    req,
  });

  return res;
};

export const updateMarketResearch = async (id, data, actorUser, req = null) => {
  const res = await MarketResearch.findById(id);
  if (!res) throw AppError.notFound('Market research not found');

  Object.assign(res, data);
  res.updated_by = actorUser?._id || null;
  await res.save();

  return res;
};

export const getCompetitors = async (query = {}) => {
  const filter = {};
  if (query.search) {
    filter.competitor_name = { $regex: query.search, $options: 'i' };
  }
  return CompetitorRecord.find(filter).sort({ competitor_name: 1 });
};

export const createCompetitor = async (data, actorUser, req = null) => {
  const item = await CompetitorRecord.create({
    ...data,
    created_by: actorUser?._id || null,
  });
  return item;
};

// ==========================================
// 3. Opportunities & Product Development
// ==========================================
export const getOpportunities = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  return RdOpportunity.find(filter).sort({ feasibility_score: -1, expected_roi: -1 });
};

export const createOpportunity = async (data, actorUser, req = null) => {
  const title = data.title || data.opportunity_title || 'New Product Opportunity';
  const problem_statement = data.problem_statement || data.description || data.summary || 'Market gap analysis';
  let priority = (data.priority || 'medium').toLowerCase();
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (!validPriorities.includes(priority)) priority = 'medium';
  let status = (data.status || 'idea').toLowerCase();

  const opp = await RdOpportunity.create({
    ...data,
    title,
    problem_statement,
    priority,
    status,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'rnd',
    recordId: opp._id,
    recordRef: opp.title,
    description: `Added R&D opportunity '${opp.title}'`,
    req,
  });

  return opp;
};

export const getProductDevelopment = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.current_stage) filter.current_stage = query.current_stage;

  return ProductDevelopmentProject.find(filter)
    .populate('project_lead_id', 'full_name email')
    .populate('product_category_id', 'category_name')
    .sort({ target_launch_date: 1 });
};

export const createProductDevelopment = async (data, actorUser, req = null) => {
  const code = (data.project_code || `NPD-${Date.now().toString().slice(-4)}`).toUpperCase().trim();
  let current_stage = (data.current_stage || data.stage || 'ideation').toLowerCase();
  const validStages = ['ideation', 'design', 'prototyping', 'testing', 'commercialization', 'completed'];
  if (!validStages.includes(current_stage)) current_stage = 'prototyping';
  let status = (data.status || 'active').toLowerCase();

  const proj = await ProductDevelopmentProject.create({
    ...data,
    project_code: code,
    current_stage,
    status,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'rnd',
    recordId: proj._id,
    recordRef: proj.project_code,
    description: `Created NPD project '${proj.project_name}' (${proj.project_code})`,
    req,
  });

  return ProductDevelopmentProject.findById(proj._id).populate('project_lead_id', 'full_name email');
};

// ==========================================
// 4. Samples, Tests & Improvements
// ==========================================
export const getSamples = async (query = {}) => {
  const filter = {};
  if (query.project_id) filter.project_id = query.project_id;
  if (query.status) filter.status = query.status;

  return ProductSample.find(filter)
    .populate('project_id', 'project_name project_code')
    .sort({ createdAt: -1 });
};

export const createSample = async (data, actorUser, req = null) => {
  let project_id = data.project_id || data.npd_project_id;
  if (!project_id) {
    const anyProj = await ProductDevelopmentProject.findOne();
    if (anyProj) project_id = anyProj._id;
  }
  const code = (data.sample_code || `SMP-${Date.now().toString().slice(-4)}`).toUpperCase().trim();
  let status = (data.status || 'requested').toLowerCase();
  const validStatus = ['requested', 'in_production', 'ready', 'evaluated', 'approved', 'rejected'];
  if (!validStatus.includes(status)) status = 'ready';

  const sample = await ProductSample.create({
    ...data,
    project_id,
    sample_code: code,
    status,
    created_by: actorUser?._id || null,
  });
  return ProductSample.findById(sample._id).populate('project_id', 'project_name');
};

export const getTests = async (query = {}) => {
  const filter = {};
  if (query.sample_id) filter.sample_id = query.sample_id;
  if (query.passed !== undefined) filter.passed = query.passed === 'true';

  return ProductTest.find(filter)
    .populate('sample_id', 'sample_code version')
    .populate('tested_by', 'full_name email')
    .sort({ test_date: -1 });
};

export const createTest = async (data, actorUser, req = null) => {
  let sample_id = data.sample_id;
  if (!sample_id) {
    const anySample = await ProductSample.findOne();
    if (anySample) sample_id = anySample._id;
  }
  const test_name = data.test_name || data.test_type || 'Standard Material Durability Test';

  const test = await ProductTest.create({
    ...data,
    sample_id,
    test_name,
    tested_by: actorUser?._id || data.tested_by,
    created_by: actorUser?._id || null,
  });
  return ProductTest.findById(test._id).populate('sample_id', 'sample_code version');
};

export const getImprovements = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;

  return ProductImprovement.find(filter)
    .populate('product_id', 'product_name product_code')
    .sort({ createdAt: -1 });
};

export const createImprovement = async (data, actorUser, req = null) => {
  let product_id = data.product_id;
  if (!product_id) {
    const anyProd = await Product.findOne();
    if (anyProd) product_id = anyProd._id;
  }
  const issue_description = data.issue_description || data.title || 'Product optimization request';
  let status = (data.status || 'reported').replace(/-/g, '_').toLowerCase();
  const validStatus = ['reported', 'investigating', 'in_design', 'implemented', 'closed'];
  if (!validStatus.includes(status)) status = 'investigating';

  const imp = await ProductImprovement.create({
    ...data,
    product_id,
    issue_description,
    status,
    created_by: actorUser?._id || null,
  });
  return ProductImprovement.findById(imp._id).populate('product_id', 'product_name product_code');
};

// ==========================================
// 5. Customer Research, Feedback & Problem Solving
// ==========================================
export const getCustomerResearch = async (query = {}) => {
  const filter = {};
  if (query.customer_id) filter.customer_id = query.customer_id;

  return CustomerResearch.find(filter)
    .populate('customer_id', 'company_name customer_code')
    .populate('conducted_by', 'full_name email')
    .sort({ interview_date: -1 });
};

export const createCustomerResearch = async (data, actorUser, req = null) => {
  const research_topic = data.research_topic || data.study_title || 'Customer Experience Survey';

  const cr = await CustomerResearch.create({
    ...data,
    research_topic,
    conducted_by: actorUser?._id || data.conducted_by,
    created_by: actorUser?._id || null,
  });
  return CustomerResearch.findById(cr._id).populate('customer_id', 'company_name');
};

export const getFeedback = async (query = {}) => {
  const filter = {};
  if (query.sentiment) filter.sentiment = query.sentiment;
  if (query.source) filter.source = query.source;

  return ResearchFeedback.find(filter).sort({ createdAt: -1 });
};

export const createFeedback = async (data, actorUser, req = null) => {
  const summary = data.summary || data.feedback_text || 'Customer Feedback Summary';
  let source = (data.source || 'customer_interview').toLowerCase();
  const validSources = ['customer_interview', 'nps_survey', 'sales_feedback', 'support_ticket'];
  if (!validSources.includes(source)) source = 'sales_feedback';
  let sentiment = (data.sentiment || 'positive').toLowerCase();
  const validSentiments = ['positive', 'neutral', 'negative'];
  if (!validSentiments.includes(sentiment)) sentiment = 'positive';

  return ResearchFeedback.create({
    ...data,
    summary,
    source,
    sentiment,
    created_by: actorUser?._id || null,
  });
};

export const getProblemSolving = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.methodology) filter.methodology = query.methodology;

  return ProblemSolvingProject.find(filter).sort({ createdAt: -1 });
};

export const createProblemSolving = async (data, actorUser, req = null) => {
  const title = data.title || data.issue_title || '8D Problem Investigation';
  let status = (data.status || 'open').toLowerCase();
  const validStatus = ['open', 'in_progress', 'verified', 'closed'];
  if (!validStatus.includes(status)) status = 'closed';

  const ps = await ProblemSolvingProject.create({
    ...data,
    title,
    status,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'rnd',
    recordId: ps._id,
    recordRef: ps.title,
    description: `Initiated root cause problem solving project '${ps.title}' (${ps.methodology})`,
    req,
  });

  return ps;
};
