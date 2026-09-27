import { Department } from '../models/department.model.js';
import { Position } from '../models/position.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/appError.js';
import { recordAuditLog } from '../utils/audit.util.js';

export const getOrganizationTree = async (scopeFilter = {}) => {
  const departments = await Department.find(scopeFilter)
    .populate('head_user_id', 'full_name email user_code designation profile_photo')
    .populate('parent_department_id', 'department_name department_code')
    .sort({ department_name: 1 })
    .lean();

  const positions = await Position.find(scopeFilter)
    .populate('reports_to_position_id', 'position_name position_code')
    .sort({ level: 1, position_name: 1 })
    .lean();

  // Attach positions to their departments
  const deptsWithPositions = departments.map((dept) => ({
    ...dept,
    positions: positions.filter(
      (pos) => String(pos.department_id) === String(dept._id || dept.id)
    ),
  }));

  // Build recursive departmental tree
  const deptMap = {};
  deptsWithPositions.forEach((d) => {
    deptMap[String(d._id)] = { ...d, children: [] };
  });

  const rootDepartments = [];
  deptsWithPositions.forEach((d) => {
    const parentId = d.parent_department_id?._id || d.parent_department_id;
    if (parentId && deptMap[String(parentId)]) {
      deptMap[String(parentId)].children.push(deptMap[String(d._id)]);
    } else {
      rootDepartments.push(deptMap[String(d._id)]);
    }
  });

  return {
    tree: rootDepartments,
    totalDepartments: departments.length,
    totalPositions: positions.length,
  };
};

export const getDepartments = async (query = {}, scopeFilter = {}) => {
  const { search, status, branch_id } = query;
  const filter = { ...scopeFilter };

  if (status) filter.status = status;
  if (branch_id) filter.branch_id = branch_id;
  if (search) {
    filter.$or = [
      { department_name: { $regex: search, $options: 'i' } },
      { department_code: { $regex: search, $options: 'i' } },
    ];
  }

  return Department.find(filter)
    .populate('head_user_id', 'full_name email user_code designation')
    .populate('parent_department_id', 'department_name department_code')
    .populate('branch_id', 'branch_name branch_code')
    .sort({ department_name: 1 });
};

export const createDepartment = async (data, actorUser, req = null) => {
  const code = (data.department_code || '').toUpperCase().trim();
  const existing = await Department.findOne({ department_code: code });
  if (existing) {
    throw AppError.conflict(`Department code '${code}' already exists`);
  }

  const dept = await Department.create({
    ...data,
    department_code: code,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'organization',
    recordId: dept._id,
    recordRef: dept.department_code,
    description: `Created department '${dept.department_name}' (${dept.department_code})`,
    after: dept,
    req,
  });

  return Department.findById(dept._id)
    .populate('head_user_id', 'full_name email user_code designation')
    .populate('parent_department_id', 'department_name department_code');
};

export const updateDepartment = async (id, data, actorUser, req = null) => {
  const dept = await Department.findById(id);
  if (!dept) throw AppError.notFound('Department not found');

  const beforeSnapshot = dept.toObject();
  if (data.department_code) {
    const code = data.department_code.toUpperCase().trim();
    if (code !== dept.department_code) {
      const existing = await Department.findOne({ department_code: code });
      if (existing) {
        throw AppError.conflict(`Department code '${code}' already exists`);
      }
      dept.department_code = code;
    }
  }

  if (data.department_name) dept.department_name = data.department_name.trim();
  if (data.head_user_id !== undefined) dept.head_user_id = data.head_user_id || null;
  if (data.parent_department_id !== undefined) {
    if (String(data.parent_department_id) === String(id)) {
      throw AppError.badRequest('Department cannot be its own parent');
    }
    dept.parent_department_id = data.parent_department_id || null;
  }
  if (data.branch_id !== undefined) dept.branch_id = data.branch_id || null;
  if (data.description !== undefined) dept.description = data.description;
  if (data.status) dept.status = data.status;

  dept.updated_by = actorUser?._id || null;
  await dept.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'organization',
    recordId: dept._id,
    recordRef: dept.department_code,
    description: `Updated department '${dept.department_name}'`,
    before: beforeSnapshot,
    after: dept,
    req,
  });

  return Department.findById(dept._id)
    .populate('head_user_id', 'full_name email user_code designation')
    .populate('parent_department_id', 'department_name department_code');
};

export const getPositions = async (query = {}, scopeFilter = {}) => {
  const { search, department_id, level, status } = query;
  const filter = { ...scopeFilter };

  if (status) filter.status = status;
  if (department_id) filter.department_id = department_id;
  if (level) filter.level = Number(level);
  if (search) {
    filter.$or = [
      { position_name: { $regex: search, $options: 'i' } },
      { position_code: { $regex: search, $options: 'i' } },
    ];
  }

  return Position.find(filter)
    .populate('department_id', 'department_name department_code')
    .populate('reports_to_position_id', 'position_name position_code')
    .sort({ level: 1, position_name: 1 });
};

export const createPosition = async (data, actorUser, req = null) => {
  const code = (data.position_code || '').toUpperCase().trim();
  const existing = await Position.findOne({ position_code: code });
  if (existing) {
    throw AppError.conflict(`Position code '${code}' already exists`);
  }

  const pos = await Position.create({
    ...data,
    position_code: code,
    created_by: actorUser?._id || null,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'organization',
    recordId: pos._id,
    recordRef: pos.position_code,
    description: `Created position '${pos.position_name}' (${pos.position_code})`,
    after: pos,
    req,
  });

  return Position.findById(pos._id)
    .populate('department_id', 'department_name department_code')
    .populate('reports_to_position_id', 'position_name position_code');
};

export const updatePosition = async (id, data, actorUser, req = null) => {
  const pos = await Position.findById(id);
  if (!pos) throw AppError.notFound('Position not found');

  const beforeSnapshot = pos.toObject();
  if (data.position_code) {
    const code = data.position_code.toUpperCase().trim();
    if (code !== pos.position_code) {
      const existing = await Position.findOne({ position_code: code });
      if (existing) {
        throw AppError.conflict(`Position code '${code}' already exists`);
      }
      pos.position_code = code;
    }
  }

  if (data.position_name) pos.position_name = data.position_name.trim();
  if (data.department_id) pos.department_id = data.department_id;
  if (data.reports_to_position_id !== undefined) {
    if (String(data.reports_to_position_id) === String(id)) {
      throw AppError.badRequest('Position cannot report to itself');
    }
    pos.reports_to_position_id = data.reports_to_position_id || null;
  }
  if (data.level !== undefined) pos.level = Number(data.level);
  if (data.responsibilities) pos.responsibilities = data.responsibilities;
  if (data.status) pos.status = data.status;

  pos.updated_by = actorUser?._id || null;
  await pos.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'organization',
    recordId: pos._id,
    recordRef: pos.position_code,
    description: `Updated position '${pos.position_name}'`,
    before: beforeSnapshot,
    after: pos,
    req,
  });

  return Position.findById(pos._id)
    .populate('department_id', 'department_name department_code')
    .populate('reports_to_position_id', 'position_name position_code');
};
