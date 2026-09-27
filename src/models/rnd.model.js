import mongoose from 'mongoose';
import { baseSchemaPlugin } from './plugins/baseSchema.plugin.js';

// 1. Market Research
const marketResearchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    target_market: { type: String, default: '' },
    industry: { type: String, default: 'Industrial & Consumer Goods' },
    trends: [String],
    findings: { type: String, default: '' },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
    attachments: [String],
  },
  { timestamps: true }
);
marketResearchSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 2. Competitor Record
const competitorRecordSchema = new mongoose.Schema(
  {
    competitor_name: { type: String, required: true, trim: true, index: true },
    products_offered: [String],
    price_positioning: { type: String, enum: ['Premium', 'Mid-market', 'Economy', 'Budget'], default: 'Mid-market' },
    market_share_estimate: { type: String, default: '5-10%' },
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
    strategies: { type: String, default: '' },
  },
  { timestamps: true }
);
competitorRecordSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 3. R&D Opportunities
const rdOpportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    problem_statement: { type: String, required: true },
    estimated_market_size: { type: Number, default: 0 },
    expected_roi: { type: Number, default: 0 },
    feasibility_score: { type: Number, min: 1, max: 10, default: 7 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['idea', 'under_review', 'approved', 'rejected'], default: 'idea', index: true },
  },
  { timestamps: true }
);
rdOpportunitySchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 4. Product Development Project
const productDevelopmentProjectSchema = new mongoose.Schema(
  {
    project_name: { type: String, required: true, trim: true, index: true },
    project_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    product_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
    project_lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    target_launch_date: { type: Date, default: null },
    budget: { type: Number, default: 0 },
    actual_cost: { type: Number, default: 0 },
    current_stage: {
      type: String,
      enum: ['ideation', 'design', 'prototyping', 'testing', 'commercialization', 'completed'],
      default: 'ideation',
      index: true,
    },
    status: { type: String, enum: ['active', 'on_hold', 'completed', 'cancelled'], default: 'active', index: true },
  },
  { timestamps: true }
);
productDevelopmentProjectSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 5. Product Sample
const productSampleSchema = new mongoose.Schema(
  {
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductDevelopmentProject', required: true, index: true },
    sample_code: { type: String, required: true, unique: true, uppercase: true },
    version: { type: String, default: 'v1.0' },
    materials_used: [{ item: String, quantity: String }],
    cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['requested', 'in_production', 'ready', 'evaluated', 'approved', 'rejected'],
      default: 'requested',
      index: true,
    },
  },
  { timestamps: true }
);
productSampleSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 6. Product Test
const productTestSchema = new mongoose.Schema(
  {
    sample_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSample', required: true, index: true },
    test_name: { type: String, required: true },
    test_type: { type: String, default: 'Physical & Durability' },
    expected_benchmark: { type: String, default: '' },
    actual_result: { type: String, default: '' },
    passed: { type: Boolean, default: true },
    tested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    test_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
productTestSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 7. Product Improvement
const productImprovementSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    feedback_reference: { type: String, default: '' },
    issue_description: { type: String, required: true },
    proposed_solution: { type: String, default: '' },
    impact_rating: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'in_design', 'implemented', 'closed'],
      default: 'reported',
      index: true,
    },
  },
  { timestamps: true }
);
productImprovementSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 8. Customer Research
const customerResearchSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
    research_topic: { type: String, required: true },
    pain_points: { type: String, default: '' },
    feature_requests: [String],
    willingness_to_pay: { type: String, default: '' },
    conducted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    interview_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
customerResearchSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 9. Research Feedback
const researchFeedbackSchema = new mongoose.Schema(
  {
    research_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerResearch', default: null },
    source: {
      type: String,
      enum: ['customer_interview', 'nps_survey', 'sales_feedback', 'support_ticket'],
      default: 'customer_interview',
    },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'positive' },
    summary: { type: String, required: true },
    action_items: [String],
  },
  { timestamps: true }
);
researchFeedbackSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

// 10. Problem Solving Project
const problemSolvingProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    methodology: { type: String, enum: ['8D', '5_WHY', 'FISHBONE', 'DMAIC', 'PDCA'], default: '8D' },
    root_cause: { type: String, default: '' },
    corrective_actions: [String],
    preventive_actions: [String],
    status: { type: String, enum: ['open', 'in_progress', 'verified', 'closed'], default: 'open', index: true },
  },
  { timestamps: true }
);
problemSolvingProjectSchema.plugin(baseSchemaPlugin, { softDelete: true, audit: true, timestamps: true });

export const MarketResearch = mongoose.model('MarketResearch', marketResearchSchema);
export const CompetitorRecord = mongoose.model('CompetitorRecord', competitorRecordSchema);
export const RdOpportunity = mongoose.model('RdOpportunity', rdOpportunitySchema);
export const ProductDevelopmentProject = mongoose.model('ProductDevelopmentProject', productDevelopmentProjectSchema);
export const ProductSample = mongoose.model('ProductSample', productSampleSchema);
export const ProductTest = mongoose.model('ProductTest', productTestSchema);
export const ProductImprovement = mongoose.model('ProductImprovement', productImprovementSchema);
export const CustomerResearch = mongoose.model('CustomerResearch', customerResearchSchema);
export const ResearchFeedback = mongoose.model('ResearchFeedback', researchFeedbackSchema);
export const ProblemSolvingProject = mongoose.model('ProblemSolvingProject', problemSolvingProjectSchema);

export default {
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
};
