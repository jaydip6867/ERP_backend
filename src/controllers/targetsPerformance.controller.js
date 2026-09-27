import { TargetsPerformanceEngine } from '../services/targetsPerformance.service.js';
import { TargetGoal } from '../models/targetGoal.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTargets = asyncHandler(async (req, res) => {
  const targets = await TargetGoal.find().sort({ createdAt: -1 });
  const evaluations = [];
  for (const t of targets) {
    const evalData = await TargetsPerformanceEngine.evaluateTarget(t._id);
    if (evalData) evaluations.push(evalData);
  }
  return ApiResponse.success(res, evaluations, 'Goals & targets evaluated against actuals');
});

export const createTarget = asyncHandler(async (req, res) => {
  const target = await TargetGoal.create({ ...req.body, created_by: req.user?._id });
  return ApiResponse.created(res, target, 'Target goal registered');
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const board = await TargetsPerformanceEngine.getTeamPerformanceLeaderboard();
  return ApiResponse.success(res, board, 'Team performance leaderboard fetched');
});
