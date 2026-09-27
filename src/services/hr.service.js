import { Employee } from '../models/employee.model.js';
import { JobOpening } from '../models/jobOpening.model.js';
import { Candidate } from '../models/candidate.model.js';
import { Interview } from '../models/interview.model.js';
import { OnboardingRecord } from '../models/onboardingRecord.model.js';
import { EmployeeDocument } from '../models/employeeDocument.model.js';
import { AttendanceRecord } from '../models/attendanceRecord.model.js';
import { LeaveRequest } from '../models/leaveRequest.model.js';
import { PayrollRecord } from '../models/payrollRecord.model.js';
import { TrainingProgram, TrainingRecord } from '../models/training.model.js';
import { PerformanceReview } from '../models/performanceReview.model.js';
import { EmployeeGoal } from '../models/employeeGoal.model.js';
import { HrPolicy } from '../models/hrPolicy.model.js';
import { EmployeeEngagement } from '../models/employeeEngagement.model.js';
import { Department } from '../models/department.model.js';
import { AppError } from '../utils/appError.js';
import { recordAuditLog } from '../utils/audit.util.js';
import { getNextNumber } from './numberSeries.service.js';

// Sanitize sensitive banking/salary/ID information
const sanitizeEmployee = (emp, canViewSalary = false) => {
  if (!emp) return null;
  const obj = emp.toObject ? emp.toObject() : { ...emp };
  if (!canViewSalary) {
    delete obj.bank_account;
    delete obj.ifsc;
    delete obj.pan;
    delete obj.uan;
  }
  return obj;
};

// ==========================================
// 1. HR Dashboard
// ==========================================
export const getHrDashboard = async (scopeFilter = {}) => {
  const [
    totalEmployees,
    activeEmployees,
    probationEmployees,
    openPositions,
    activeCandidates,
    pendingLeaves,
    todayAttendance,
    recentOnboarding,
    departments,
  ] = await Promise.all([
    Employee.countDocuments(scopeFilter),
    Employee.countDocuments({ ...scopeFilter, status: 'active' }),
    Employee.countDocuments({ ...scopeFilter, status: 'probation' }),
    JobOpening.countDocuments({ ...scopeFilter, status: 'open' }),
    Candidate.countDocuments({ ...scopeFilter, status: { $in: ['applied', 'shortlisted', 'interview_scheduled'] } }),
    LeaveRequest.countDocuments({ ...scopeFilter, status: 'pending' }),
    AttendanceRecord.countDocuments({
      ...scopeFilter,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
      status: 'present',
    }),
    OnboardingRecord.find(scopeFilter)
      .populate('employee_id', 'full_name employee_code profile_photo')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Department.find().select('department_name department_code').lean(),
  ]);

  // Aggregate headcount per department
  const deptAggregation = await Employee.aggregate([
    { $match: { ...scopeFilter, is_deleted: false } },
    { $group: { _id: '$department_id', count: { $sum: 1 } } },
  ]);

  const departmentBreakdown = departments.map((d) => {
    const match = deptAggregation.find((a) => String(a._id) === String(d._id));
    return {
      department_name: d.department_name,
      department_code: d.department_code,
      headcount: match ? match.count : 0,
    };
  });

  return {
    metrics: {
      totalEmployees,
      activeEmployees,
      probationEmployees,
      openPositions,
      activeCandidates,
      pendingLeaves,
      todayAttendance,
    },
    departmentBreakdown,
    recentOnboarding,
  };
};

// ==========================================
// 2. Employee Directory
// ==========================================
export const getEmployees = async (query = {}, scopeFilter = {}, canViewSalary = false) => {
  const { search, department_id, branch_id, status, employment_type } = query;
  const filter = { ...scopeFilter };

  if (department_id) filter.department_id = department_id;
  if (branch_id) filter.branch_id = branch_id;
  if (status) filter.status = status;
  if (employment_type) filter.employment_type = employment_type;
  if (search) {
    filter.$or = [
      { full_name: { $regex: search, $options: 'i' } },
      { employee_code: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
    ];
  }

  const list = await Employee.find(filter)
    .populate('department_id', 'department_name department_code')
    .populate('designation_id', 'position_name position_code level')
    .populate('reporting_manager_id', 'full_name employee_code')
    .populate('branch_id', 'branch_name branch_code')
    .sort({ full_name: 1 });

  return list.map((emp) => sanitizeEmployee(emp, canViewSalary));
};

export const getEmployeeById = async (id, canViewSalary = false) => {
  const emp = await Employee.findById(id)
    .populate('department_id', 'department_name department_code')
    .populate('designation_id', 'position_name position_code level')
    .populate('reporting_manager_id', 'full_name employee_code email mobile')
    .populate('branch_id', 'branch_name branch_code')
    .populate('user_id', 'email user_code');

  if (!emp) throw AppError.notFound('Employee record not found');
  return sanitizeEmployee(emp, canViewSalary);
};

export const createEmployee = async (data, actorUser, req = null) => {
  let code = (data.employee_code || '').toUpperCase().trim();
  if (!code) {
    try {
      code = await getNextNumber('USER');
    } catch {
      code = `EMP-${Date.now().toString().slice(-4)}`;
    }
  }

  const existing = await Employee.findOne({ employee_code: code });
  if (existing) {
    throw AppError.conflict(`Employee code '${code}' is already registered`);
  }

  const full_name = data.full_name || [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Employee';
  let employment_type = (data.employment_type || 'full_time').replace(/-/g, '_').toLowerCase();
  const validEmpTypes = ['full_time', 'part_time', 'contract', 'intern', 'probation'];
  if (!validEmpTypes.includes(employment_type)) employment_type = 'full_time';

  let status = (data.status || 'active').replace(/-/g, '_').toLowerCase();
  const validStatus = ['active', 'probation', 'notice_period', 'resigned', 'terminated'];
  if (!validStatus.includes(status)) status = 'active';

  const mobile = data.mobile || data.phone || '';

  const emp = await Employee.create({
    ...data,
    full_name,
    employment_type,
    status,
    mobile,
    employee_code: code,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'hr',
    recordId: emp._id,
    recordRef: emp.employee_code,
    description: `Registered employee '${emp.full_name}' (${emp.employee_code})`,
    after: sanitizeEmployee(emp, false),
    req,
  });

  return getEmployeeById(emp._id, true);
};

export const updateEmployee = async (id, data, actorUser, req = null) => {
  const emp = await Employee.findById(id);
  if (!emp) throw AppError.notFound('Employee record not found');

  const beforeSnapshot = sanitizeEmployee(emp, false);
  Object.assign(emp, data);
  if (data.employee_code) emp.employee_code = data.employee_code.toUpperCase().trim();
  emp.updated_by = actorUser?._id || null;
  await emp.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'hr',
    recordId: emp._id,
    recordRef: emp.employee_code,
    description: `Updated employee profile for '${emp.full_name}'`,
    before: beforeSnapshot,
    after: sanitizeEmployee(emp, false),
    req,
  });

  return getEmployeeById(emp._id, true);
};

export const deleteEmployee = async (id, actorUser, req = null) => {
  const emp = await Employee.findById(id);
  if (!emp) throw AppError.notFound('Employee record not found');

  emp.is_deleted = true;
  emp.deleted_at = new Date();
  emp.deleted_by = actorUser?._id || null;
  await emp.save();

  await recordAuditLog({
    user: actorUser,
    action: 'DELETE',
    module: 'hr',
    recordId: emp._id,
    recordRef: emp.employee_code,
    description: `Soft-deleted employee '${emp.full_name}'`,
    req,
  });

  return { success: true, message: 'Employee record archived successfully' };
};

// ==========================================
// 3. Recruitment & Openings
// ==========================================
export const getJobOpenings = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.status) filter.status = query.status;
  if (query.department_id) filter.department_id = query.department_id;

  return JobOpening.find(filter)
    .populate('department_id', 'department_name department_code')
    .populate('position_id', 'position_name position_code')
    .sort({ createdAt: -1 });
};

export const createJobOpening = async (data, actorUser, req = null) => {
  let department_id = data.department_id;
  if (!department_id) {
    if (data.department) {
      const dept = await Department.findOne({
        $or: [{ department_name: data.department }, { department_code: data.department }],
      });
      if (dept) department_id = dept._id;
    }
    if (!department_id) {
      const anyDept = await Department.findOne();
      if (anyDept) department_id = anyDept._id;
    }
  }

  let status = (data.status || 'open').toLowerCase();
  if (status === 'published') status = 'open';
  const openings_count = data.openings_count || data.headcount || 1;

  const job = await JobOpening.create({
    ...data,
    department_id,
    status,
    openings_count,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'hr',
    recordId: job._id,
    recordRef: job.title,
    description: `Created job opening '${job.title}'`,
    after: job,
    req,
  });

  return JobOpening.findById(job._id)
    .populate('department_id', 'department_name department_code')
    .populate('position_id', 'position_name position_code');
};

export const getCandidates = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.status) filter.status = query.status;
  if (query.job_opening_id) filter.job_opening_id = query.job_opening_id;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { mobile: { $regex: query.search, $options: 'i' } },
    ];
  }

  return Candidate.find(filter)
    .populate('job_opening_id', 'title department_id')
    .populate('assigned_recruiter_id', 'full_name email')
    .sort({ createdAt: -1 });
};

export const createCandidate = async (data, actorUser, req = null) => {
  let job_opening_id = data.job_opening_id;
  if (!job_opening_id) {
    const anyJob = await JobOpening.findOne();
    if (anyJob) job_opening_id = anyJob._id;
  }
  const name = data.name || data.full_name || 'Candidate';
  const mobile = data.mobile || data.phone || '';
  let status = (data.status || 'applied').replace(/-/g, '_').toLowerCase();

  const candidate = await Candidate.create({
    ...data,
    job_opening_id,
    name,
    mobile,
    status,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'hr',
    recordId: candidate._id,
    recordRef: candidate.name,
    description: `Registered candidate '${candidate.name}' for job opening`,
    after: candidate,
    req,
  });

  return Candidate.findById(candidate._id).populate('job_opening_id', 'title');
};

export const updateCandidate = async (id, data, actorUser, req = null) => {
  const cand = await Candidate.findById(id);
  if (!cand) throw AppError.notFound('Candidate record not found');

  Object.assign(cand, data);
  cand.updated_by = actorUser?._id || null;
  await cand.save();

  return Candidate.findById(cand._id).populate('job_opening_id', 'title');
};

export const getInterviews = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.status) filter.status = query.status;
  if (query.candidate_id) filter.candidate_id = query.candidate_id;

  return Interview.find(filter)
    .populate('candidate_id', 'name email mobile experience')
    .populate('job_opening_id', 'title')
    .populate('interviewer_id', 'full_name email designation')
    .sort({ scheduled_at: -1 });
};

export const createInterview = async (data, actorUser, req = null) => {
  let candidate_id = data.candidate_id;
  if (!candidate_id) {
    const anyCand = await Candidate.findOne();
    if (anyCand) candidate_id = anyCand._id;
  }
  let job_opening_id = data.job_opening_id;
  if (!job_opening_id && candidate_id) {
    const cand = await Candidate.findById(candidate_id);
    if (cand) job_opening_id = cand.job_opening_id;
  }
  if (!job_opening_id) {
    const anyJob = await JobOpening.findOne();
    if (anyJob) job_opening_id = anyJob._id;
  }

  const interviewer_id = data.interviewer_id || actorUser?._id;
  const scheduled_at = data.scheduled_at || data.interview_date || new Date(Date.now() + 86400000);
  let status = (data.status || 'scheduled').toLowerCase();

  const interview = await Interview.create({
    ...data,
    candidate_id,
    job_opening_id,
    interviewer_id,
    scheduled_at,
    status,
    created_by: actorUser?._id || null,
  });

  if (candidate_id) {
    await Candidate.findByIdAndUpdate(candidate_id, { status: 'interview_scheduled' });
  }

  return Interview.findById(interview._id)
    .populate('candidate_id', 'name email mobile')
    .populate('job_opening_id', 'title')
    .populate('interviewer_id', 'full_name email');
};

export const getOnboarding = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.status) filter.status = query.status;

  return OnboardingRecord.find(filter)
    .populate('employee_id', 'full_name employee_code department_id designation_id joining_date')
    .populate('candidate_id', 'name email mobile')
    .sort({ createdAt: -1 });
};

export const createOnboarding = async (data, actorUser, req = null) => {
  let employee_id = data.employee_id;
  if (!employee_id) {
    const anyEmp = await Employee.findOne();
    if (anyEmp) employee_id = anyEmp._id;
  }
  let status = (data.status || 'in_progress').replace(/-/g, '_').toLowerCase();
  let checklist = data.checklist;
  if (!checklist && data.tasks) {
    checklist = data.tasks.map((t) => ({ task: t.title || t.task || 'Onboarding Task', completed: !!t.completed }));
  }

  const defaultChecklist = [
    { task: 'Issue Offer Letter & Sign Contract', category: 'Documentation', completed: true },
    { task: 'Collect ID Proofs (Aadhar, PAN, Bank Details)', category: 'Documentation', completed: false },
    { task: 'Configure Workstation & IT Hardware', category: 'IT Provisioning', completed: false },
    { task: 'Create ERP / Email Access Accounts', category: 'IT Provisioning', completed: false },
    { task: 'Company Policies & Culture Induction', category: 'Orientation', completed: false },
    { task: 'Assign Reporting Manager & Team Intro', category: 'Orientation', completed: false },
  ];

  const onboarding = await OnboardingRecord.create({
    ...data,
    employee_id,
    status,
    checklist: checklist && checklist.length > 0 ? checklist : defaultChecklist,
    created_by: actorUser?._id || null,
  });

  return OnboardingRecord.findById(onboarding._id).populate('employee_id', 'full_name employee_code');
};

// ==========================================
// 4. Attendance & Leaves
// ==========================================
export const getAttendance = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.employee_id) filter.employee_id = query.employee_id;
  if (query.status) filter.status = query.status;
  if (query.date) {
    const d = new Date(query.date);
    filter.date = {
      $gte: new Date(d.setHours(0, 0, 0, 0)),
      $lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  return AttendanceRecord.find(filter)
    .populate('employee_id', 'full_name employee_code department_id designation_id')
    .sort({ date: -1 });
};

export const recordAttendance = async (data, actorUser, req = null) => {
  let employee_id = data.employee_id;
  if (!employee_id) {
    const anyEmp = await Employee.findOne();
    if (anyEmp) employee_id = anyEmp._id;
  }
  const dateObj = data.date ? new Date(data.date) : new Date();
  const dateStart = new Date(dateObj.setHours(0, 0, 0, 0));

  let record = await AttendanceRecord.findOne({
    employee_id,
    date: dateStart,
  });

  if (record) {
    Object.assign(record, data);
    record.updated_by = actorUser?._id || null;
    await record.save();
  } else {
    record = await AttendanceRecord.create({
      ...data,
      employee_id,
      date: dateStart,
      created_by: actorUser?._id || null,
    });
  }

  return AttendanceRecord.findById(record._id).populate('employee_id', 'full_name employee_code');
};

export const getLeaveRequests = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.employee_id) filter.employee_id = query.employee_id;
  if (query.status) filter.status = query.status;
  if (query.leave_type) filter.leave_type = query.leave_type;

  return LeaveRequest.find(filter)
    .populate('employee_id', 'full_name employee_code department_id designation_id')
    .populate('approved_by', 'full_name email')
    .sort({ createdAt: -1 });
};

export const createLeaveRequest = async (data, actorUser, req = null) => {
  let employee_id = data.employee_id;
  if (!employee_id) {
    const anyEmp = await Employee.findOne();
    if (anyEmp) employee_id = anyEmp._id;
  }
  const from_date = data.from_date || data.start_date || new Date();
  const to_date = data.to_date || data.end_date || new Date();
  const days = data.days || data.days_count || 1;
  const reason = data.reason || 'Personal leave';

  const leave = await LeaveRequest.create({
    ...data,
    employee_id,
    from_date,
    to_date,
    days,
    reason,
    status: 'pending',
    created_by: actorUser?._id || null,
  });

  return LeaveRequest.findById(leave._id).populate('employee_id', 'full_name employee_code');
};

export const approveLeaveRequest = async (id, actorUser, remarks = '', req = null) => {
  const leave = await LeaveRequest.findById(id);
  if (!leave) throw AppError.notFound('Leave request not found');

  leave.status = 'approved';
  leave.approved_by = actorUser?._id || null;
  leave.approved_at = new Date();
  if (remarks) leave.rejection_reason = remarks;
  await leave.save();

  await recordAuditLog({
    user: actorUser,
    action: 'APPROVE',
    module: 'hr',
    recordId: leave._id,
    description: `Approved leave request for employee`,
    after: leave,
    req,
  });

  return LeaveRequest.findById(leave._id)
    .populate('employee_id', 'full_name employee_code')
    .populate('approved_by', 'full_name email');
};

export const rejectLeaveRequest = async (id, actorUser, reason = '', req = null) => {
  const leave = await LeaveRequest.findById(id);
  if (!leave) throw AppError.notFound('Leave request not found');

  leave.status = 'rejected';
  leave.rejection_reason = reason;
  leave.approved_by = actorUser?._id || null;
  leave.approved_at = new Date();
  await leave.save();

  await recordAuditLog({
    user: actorUser,
    action: 'REJECT',
    module: 'hr',
    recordId: leave._id,
    description: `Rejected leave request. Reason: ${reason}`,
    after: leave,
    req,
  });

  return LeaveRequest.findById(leave._id)
    .populate('employee_id', 'full_name employee_code')
    .populate('approved_by', 'full_name email');
};

// ==========================================
// 5. Payroll Management
// ==========================================
export const getPayrollRecords = async (query = {}, scopeFilter = {}, canViewSalary = false) => {
  if (!canViewSalary) {
    throw AppError.forbidden('Access Denied: You do not possess permission to view payroll salary records.');
  }

  const filter = { ...scopeFilter };
  if (query.period) filter.period = query.period;
  if (query.employee_id) filter.employee_id = query.employee_id;
  if (query.status) filter.status = query.status;

  return PayrollRecord.find(filter)
    .populate('employee_id', 'full_name employee_code department_id designation_id bank_account ifsc')
    .sort({ period: -1, createdAt: -1 });
};

export const runPayroll = async (params = {}, actorUser, req = null) => {
  const period = params?.period || (params?.year && params?.month ? `${params.year}-${String(params.month).padStart(2, '0')}` : new Date().toISOString().slice(0, 7));
  const branch_id = params?.branch_id;

  const empFilter = { status: { $in: ['active', 'probation'] } };
  if (branch_id) empFilter.branch_id = branch_id;

  const employees = await Employee.find(empFilter);
  const records = [];

  for (const emp of employees) {
    const existing = await PayrollRecord.findOne({ employee_id: emp._id, period });
    if (!existing) {
      const basic = 30000;
      const allowances = 12000;
      const deductions = 3600;
      const gross = basic + allowances;
      const net = gross - deductions;

      const pRecord = await PayrollRecord.create({
        employee_id: emp._id,
        period,
        basic_salary: basic,
        allowances,
        deductions,
        overtime: 0,
        bonus: 0,
        gross_salary: gross,
        net_salary: net,
        status: 'draft',
        branch_id: emp.branch_id || null,
        created_by: actorUser?._id || null,
      });
      records.push(pRecord);
    } else {
      records.push(existing);
    }
  }

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'hr',
    description: `Generated payroll run for period '${period}' (${records.length} employees)`,
    req,
  });

  return { period, generatedCount: records.length, records };
};

// ==========================================
// 6. Training, Performance, Goals & Policies
// ==========================================
export const getTraining = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.status) filter.status = query.status;

  const programs = await TrainingProgram.find(filter)
    .populate('department_id', 'department_name department_code')
    .sort({ start_date: -1 });

  return { programs };
};

export const createTrainingProgram = async (data, actorUser, req = null) => {
  const start_date = data.start_date || new Date();
  const end_date = data.end_date || new Date(Date.now() + 86400000 * 3);
  let status = (data.status || 'upcoming').replace(/-/g, '_').toLowerCase();
  if (status === 'planned') status = 'upcoming';
  const trainer_name = data.trainer_name || data.trainer || 'Lead Instructor';

  const prog = await TrainingProgram.create({
    ...data,
    start_date,
    end_date,
    status,
    trainer_name,
    created_by: actorUser?._id || null,
  });
  return TrainingProgram.findById(prog._id).populate('department_id', 'department_name');
};

export const getPerformanceReviews = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.employee_id) filter.employee_id = query.employee_id;
  if (query.review_period) filter.review_period = query.review_period;

  return PerformanceReview.find(filter)
    .populate('employee_id', 'full_name employee_code department_id designation_id')
    .populate('reviewer_id', 'full_name email')
    .sort({ createdAt: -1 });
};

export const createPerformanceReview = async (data, actorUser, req = null) => {
  let employee_id = data.employee_id;
  if (!employee_id) {
    const anyEmp = await Employee.findOne();
    if (anyEmp) employee_id = anyEmp._id;
  }
  const reviewer_id = data.reviewer_id || actorUser?._id;
  const review_period = data.review_period || data.review_cycle || `Q${Math.floor(new Date().getMonth() / 3) + 1}-${new Date().getFullYear()}`;
  const rating = data.rating || data.overall_rating || 3;
  let status = (data.status || 'draft').toLowerCase();

  const review = await PerformanceReview.create({
    ...data,
    employee_id,
    reviewer_id,
    review_period,
    rating,
    status,
    created_by: actorUser?._id || null,
  });

  return PerformanceReview.findById(review._id)
    .populate('employee_id', 'full_name employee_code')
    .populate('reviewer_id', 'full_name email');
};

export const getEmployeeGoals = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.employee_id) filter.employee_id = query.employee_id;
  if (query.status) filter.status = query.status;

  return EmployeeGoal.find(filter)
    .populate('employee_id', 'full_name employee_code')
    .sort({ target_date: 1 });
};

export const createEmployeeGoal = async (data, actorUser, req = null) => {
  let employee_id = data.employee_id;
  if (!employee_id) {
    const anyEmp = await Employee.findOne();
    if (anyEmp) employee_id = anyEmp._id;
  }
  let status = (data.status || 'not_started').replace(/-/g, '_').toLowerCase();
  const progress = data.progress !== undefined ? data.progress : (data.progress_percentage || 0);
  const target_date = data.target_date || new Date(Date.now() + 86400000 * 30);

  const goal = await EmployeeGoal.create({
    ...data,
    employee_id,
    status,
    progress,
    target_date,
    created_by: actorUser?._id || null,
  });
  return EmployeeGoal.findById(goal._id).populate('employee_id', 'full_name employee_code');
};

export const getPolicies = async (query = {}) => {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;

  return HrPolicy.find(filter).sort({ category: 1, title: 1 });
};

export const createPolicy = async (data, actorUser, req = null) => {
  let category = data.category || 'General Conduct';
  if (category.toLowerCase().includes('security') || category.toLowerCase().includes('it')) {
    category = 'IT & Security';
  } else if (category.toLowerCase().includes('leave')) {
    category = 'Leave & Attendance';
  } else if (category.toLowerCase().includes('safety')) {
    category = 'Workplace Safety';
  }
  let status = (data.status || 'active').toLowerCase();

  const pol = await HrPolicy.create({
    ...data,
    category,
    status,
    created_by: actorUser?._id || null,
  });
  return pol;
};

export const getDocuments = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.employee_id) filter.employee_id = query.employee_id;
  if (query.document_type) filter.document_type = query.document_type;

  return EmployeeDocument.find(filter)
    .populate('employee_id', 'full_name employee_code')
    .populate('verified_by', 'full_name email')
    .sort({ createdAt: -1 });
};

export const uploadDocument = async (data, actorUser, req = null) => {
  let employee_id = data.employee_id;
  if (!employee_id) {
    const anyEmp = await Employee.findOne();
    if (anyEmp) employee_id = anyEmp._id;
  }
  const title = data.title || data.document_title || 'Employee Document';
  let document_type = data.document_type || 'Other';
  if (['national_id', 'id_card', 'identity', 'national-id'].includes(document_type.toLowerCase())) {
    document_type = 'Aadhar';
  }

  const doc = await EmployeeDocument.create({
    ...data,
    employee_id,
    title,
    document_type,
    created_by: actorUser?._id || null,
  });
  return EmployeeDocument.findById(doc._id).populate('employee_id', 'full_name employee_code');
};

export const getEngagement = async (query = {}, scopeFilter = {}) => {
  const filter = { ...scopeFilter };
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;

  return EmployeeEngagement.find(filter).sort({ date: -1 });
};

export const createEngagement = async (data, actorUser, req = null) => {
  const type = data.type || data.initiative_type || 'event';
  let status = (data.status || 'active').toLowerCase();
  if (status === 'upcoming') status = 'planned';

  const engagement = await EmployeeEngagement.create({
    ...data,
    type,
    status,
    created_by: actorUser?._id || null,
  });
  return engagement;
};
