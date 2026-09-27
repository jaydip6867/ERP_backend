import * as rndService from '../services/rnd.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getRndDashboard = asyncHandler(async (req, res) => {
  const data = await rndService.getRndDashboard();
  return ApiResponse.success(res, data, 'R&D dashboard retrieved successfully');
});

export const getMarketResearch = asyncHandler(async (req, res) => {
  const research = await rndService.getMarketResearch(req.query);
  return ApiResponse.success(res, { research });
});

export const createMarketResearch = asyncHandler(async (req, res) => {
  const research = await rndService.createMarketResearch(req.body, req.user, req);
  return ApiResponse.created(res, { research }, 'Market research study published');
});

export const updateMarketResearch = asyncHandler(async (req, res) => {
  const research = await rndService.updateMarketResearch(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { research }, 'Market research updated');
});

export const getCompetitors = asyncHandler(async (req, res) => {
  const competitors = await rndService.getCompetitors(req.query);
  return ApiResponse.success(res, { competitors });
});

export const createCompetitor = asyncHandler(async (req, res) => {
  const competitor = await rndService.createCompetitor(req.body, req.user, req);
  return ApiResponse.created(res, { competitor }, 'Competitor benchmark added');
});

export const getOpportunities = asyncHandler(async (req, res) => {
  const opportunities = await rndService.getOpportunities(req.query);
  return ApiResponse.success(res, { opportunities });
});

export const createOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await rndService.createOpportunity(req.body, req.user, req);
  return ApiResponse.created(res, { opportunity }, 'Opportunity recorded');
});

export const getProductDevelopment = asyncHandler(async (req, res) => {
  const projects = await rndService.getProductDevelopment(req.query);
  return ApiResponse.success(res, { projects });
});

export const createProductDevelopment = asyncHandler(async (req, res) => {
  const project = await rndService.createProductDevelopment(req.body, req.user, req);
  return ApiResponse.created(res, { project }, 'Product development project started');
});

export const getSamples = asyncHandler(async (req, res) => {
  const samples = await rndService.getSamples(req.query);
  return ApiResponse.success(res, { samples });
});

export const createSample = asyncHandler(async (req, res) => {
  const sample = await rndService.createSample(req.body, req.user, req);
  return ApiResponse.created(res, { sample }, 'Product sample logged');
});

export const getTests = asyncHandler(async (req, res) => {
  const tests = await rndService.getTests(req.query);
  return ApiResponse.success(res, { tests });
});

export const createTest = asyncHandler(async (req, res) => {
  const test = await rndService.createTest(req.body, req.user, req);
  return ApiResponse.created(res, { test }, 'Test benchmark result recorded');
});

export const getImprovements = asyncHandler(async (req, res) => {
  const improvements = await rndService.getImprovements(req.query);
  return ApiResponse.success(res, { improvements });
});

export const createImprovement = asyncHandler(async (req, res) => {
  const improvement = await rndService.createImprovement(req.body, req.user, req);
  return ApiResponse.created(res, { improvement }, 'Product improvement item registered');
});

export const getCustomerResearch = asyncHandler(async (req, res) => {
  const research = await rndService.getCustomerResearch(req.query);
  return ApiResponse.success(res, { research });
});

export const createCustomerResearch = asyncHandler(async (req, res) => {
  const research = await rndService.createCustomerResearch(req.body, req.user, req);
  return ApiResponse.created(res, { research }, 'Customer research interview logged');
});

export const getFeedback = asyncHandler(async (req, res) => {
  const feedback = await rndService.getFeedback(req.query);
  return ApiResponse.success(res, { feedback });
});

export const createFeedback = asyncHandler(async (req, res) => {
  const feedback = await rndService.createFeedback(req.body, req.user, req);
  return ApiResponse.created(res, { feedback }, 'Research feedback item captured');
});

export const getProblemSolving = asyncHandler(async (req, res) => {
  const projects = await rndService.getProblemSolving(req.query);
  return ApiResponse.success(res, { projects });
});

export const createProblemSolving = asyncHandler(async (req, res) => {
  const project = await rndService.createProblemSolving(req.body, req.user, req);
  return ApiResponse.created(res, { project }, 'Problem solving project initialized');
});
