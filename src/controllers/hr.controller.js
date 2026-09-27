import * as hrService from '../services/hr.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const checkCanViewSalary = (req) => {
  return (
    req.isSuperuser ||
    req.permission?.can_view_salary ||
    req.user?.role_id?.role_code === 'CHRO' ||
    req.user?.role_id?.role_code === 'HR_MANAGER'
  );
};

export const getHrDashboard = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await hrService.getHrDashboard(scopeFilter);
  return ApiResponse.success(res, data, 'HR dashboard metrics retrieved successfully');
});

export const getEmployees = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const canViewSalary = checkCanViewSalary(req);
  const employees = await hrService.getEmployees(req.query, scopeFilter, canViewSalary);
  return ApiResponse.success(res, { employees }, 'Employees retrieved successfully');
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const canViewSalary = checkCanViewSalary(req);
  const employee = await hrService.getEmployeeById(req.params.id, canViewSalary);
  return ApiResponse.success(res, { employee }, 'Employee details retrieved successfully');
});

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await hrService.createEmployee(req.body, req.user, req);
  return ApiResponse.created(res, { employee }, 'Employee registered successfully');
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await hrService.updateEmployee(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { employee }, 'Employee profile updated successfully');
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await hrService.deleteEmployee(req.params.id, req.user, req);
  return ApiResponse.success(res, result, 'Employee deleted successfully');
});

// Recruitment
export const getJobOpenings = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const jobOpenings = await hrService.getJobOpenings(req.query, scopeFilter);
  return ApiResponse.success(res, { jobOpenings });
});

export const createJobOpening = asyncHandler(async (req, res) => {
  const jobOpening = await hrService.createJobOpening(req.body, req.user, req);
  return ApiResponse.created(res, { jobOpening }, 'Job opening created successfully');
});

export const getCandidates = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const candidates = await hrService.getCandidates(req.query, scopeFilter);
  return ApiResponse.success(res, { candidates });
});

export const createCandidate = asyncHandler(async (req, res) => {
  const candidate = await hrService.createCandidate(req.body, req.user, req);
  return ApiResponse.created(res, { candidate }, 'Candidate profile created successfully');
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await hrService.updateCandidate(req.params.id, req.body, req.user, req);
  return ApiResponse.success(res, { candidate }, 'Candidate updated successfully');
});

export const getInterviews = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const interviews = await hrService.getInterviews(req.query, scopeFilter);
  return ApiResponse.success(res, { interviews });
});

export const createInterview = asyncHandler(async (req, res) => {
  const interview = await hrService.createInterview(req.body, req.user, req);
  return ApiResponse.created(res, { interview }, 'Interview scheduled successfully');
});

export const getOnboarding = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const onboarding = await hrService.getOnboarding(req.query, scopeFilter);
  return ApiResponse.success(res, { onboarding });
});

export const createOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await hrService.createOnboarding(req.body, req.user, req);
  return ApiResponse.created(res, { onboarding }, 'Onboarding record created successfully');
});

// Attendance & Leave
export const getAttendance = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const attendance = await hrService.getAttendance(req.query, scopeFilter);
  return ApiResponse.success(res, { attendance });
});

export const recordAttendance = asyncHandler(async (req, res) => {
  const attendance = await hrService.recordAttendance(req.body, req.user, req);
  return ApiResponse.success(res, { attendance }, 'Attendance recorded successfully');
});

export const getLeaveRequests = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const leaves = await hrService.getLeaveRequests(req.query, scopeFilter);
  return ApiResponse.success(res, { leaves });
});

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const leave = await hrService.createLeaveRequest(req.body, req.user, req);
  return ApiResponse.created(res, { leave }, 'Leave request submitted successfully');
});

export const approveLeaveRequest = asyncHandler(async (req, res) => {
  const leave = await hrService.approveLeaveRequest(req.params.id, req.user, req.body.remarks, req);
  return ApiResponse.success(res, { leave }, 'Leave request approved successfully');
});

export const rejectLeaveRequest = asyncHandler(async (req, res) => {
  const leave = await hrService.rejectLeaveRequest(req.params.id, req.user, req.body.reason, req);
  return ApiResponse.success(res, { leave }, 'Leave request rejected successfully');
});

// Payroll
export const getPayroll = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const canViewSalary = checkCanViewSalary(req);
  const payroll = await hrService.getPayrollRecords(req.query, scopeFilter, canViewSalary);
  return ApiResponse.success(res, { payroll });
});

export const runPayroll = asyncHandler(async (req, res) => {
  const canViewSalary = checkCanViewSalary(req);
  if (!canViewSalary) {
    return res.status(403).json({ success: false, message: 'Unauthorized to run payroll' });
  }
  const result = await hrService.runPayroll(req.body, req.user, req);
  return ApiResponse.success(res, result, 'Payroll run completed successfully');
});

// Training
export const getTraining = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const data = await hrService.getTraining(req.query, scopeFilter);
  return ApiResponse.success(res, data);
});

export const createTraining = asyncHandler(async (req, res) => {
  const program = await hrService.createTrainingProgram(req.body, req.user, req);
  return ApiResponse.created(res, { program }, 'Training program created successfully');
});

// Performance & Goals
export const getPerformance = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const reviews = await hrService.getPerformanceReviews(req.query, scopeFilter);
  return ApiResponse.success(res, { reviews });
});

export const createPerformance = asyncHandler(async (req, res) => {
  const review = await hrService.createPerformanceReview(req.body, req.user, req);
  return ApiResponse.created(res, { review }, 'Performance appraisal submitted successfully');
});

export const getGoals = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const goals = await hrService.getEmployeeGoals(req.query, scopeFilter);
  return ApiResponse.success(res, { goals });
});

export const createGoal = asyncHandler(async (req, res) => {
  const goal = await hrService.createEmployeeGoal(req.body, req.user, req);
  return ApiResponse.created(res, { goal }, 'Employee goal assigned successfully');
});

// Policies, Documents & Engagement
export const getPolicies = asyncHandler(async (req, res) => {
  const policies = await hrService.getPolicies(req.query);
  return ApiResponse.success(res, { policies });
});

export const createPolicy = asyncHandler(async (req, res) => {
  const policy = await hrService.createPolicy(req.body, req.user, req);
  return ApiResponse.created(res, { policy }, 'Policy published successfully');
});

export const getDocuments = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const documents = await hrService.getDocuments(req.query, scopeFilter);
  return ApiResponse.success(res, { documents });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const document = await hrService.uploadDocument(req.body, req.user, req);
  return ApiResponse.created(res, { document }, 'Employee document recorded successfully');
});

export const getEngagement = asyncHandler(async (req, res) => {
  const scopeFilter = req.buildScopeFilter ? await req.buildScopeFilter() : {};
  const engagement = await hrService.getEngagement(req.query, scopeFilter);
  return ApiResponse.success(res, { engagement });
});

export const createEngagement = asyncHandler(async (req, res) => {
  const item = await hrService.createEngagement(req.body, req.user, req);
  return ApiResponse.created(res, { item }, 'Engagement activity recorded successfully');
});
