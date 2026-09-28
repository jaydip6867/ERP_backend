import bcrypt from 'bcryptjs';
import { AuditLog } from '../models/auditLog.model.js';
import { Branch } from '../models/branch.model.js';
import { Company } from '../models/company.model.js';
import { LoginHistory } from '../models/loginHistory.model.js';
import { MasterData } from '../models/masterData.model.js';
import { NumberSeries } from '../models/numberSeries.model.js';
import { SystemSettings } from '../models/systemSettings.model.js';
import { User } from '../models/user.model.js';
import { Warehouse } from '../models/warehouse.model.js';
import { AppError } from '../utils/appError.js';
import { recordAuditLog } from '../utils/audit.util.js';
import { getNextNumber } from './numberSeries.service.js';

// ==========================================
// 1. User Management CRUD
// ==========================================

export const getUsers = async ({ page = 1, limit = 20, search, status, role_id, department }) => {
  const filter = {};
  if (status) filter.status = status;
  if (role_id) filter.role_id = role_id;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { full_name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { user_code: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('role_id', 'role_name role_code')
      .populate('branch_id', 'branch_name branch_code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit };
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate('role_id', 'role_name role_code')
    .populate('branch_id', 'branch_name branch_code')
    .populate('reporting_manager_id', 'full_name email user_code');

  if (!user) throw AppError.notFound('User record not found');
  return user;
};

export const createUser = async (data, actorUser, req = null) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw AppError.conflict(`A user with email '${data.email}' already exists.`);
  }

  const userCode = data.user_code || (await getNextNumber('USER'));
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password || 'Danza@123456', salt);

  const payload = {
    ...data,
    user_code: userCode,
    email: data.email.toLowerCase(),
    password_hash: passwordHash,
    status: data.status || 'active',
  };

  if (!payload.branch_id || payload.branch_id === '') {
    payload.branch_id = null;
  }
  if (!payload.role_id || payload.role_id === '') {
    payload.role_id = null;
  }
  if (!payload.reporting_manager_id || payload.reporting_manager_id === '') {
    payload.reporting_manager_id = null;
  }

  const newUser = await User.create(payload);

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'users',
    recordId: newUser._id,
    recordRef: newUser.user_code,
    description: `Created user ${newUser.full_name} (${newUser.email})`,
    after: newUser,
    req,
  });

  return getUserById(newUser._id);
};

export const updateUser = async (id, data, actorUser, req = null) => {
  const user = await User.findById(id);
  if (!user) throw AppError.notFound('User not found');

  const beforeSnapshot = user.toObject();

  if (data.status && data.status !== 'active') {
    if (user.email === 'admin@danzaerp.com') {
      throw AppError.badRequest('The primary system administrator account cannot be deactivated.');
    }
    if (actorUser && (actorUser._id?.toString() === user._id.toString() || actorUser.id?.toString() === user._id.toString())) {
      throw AppError.badRequest('You cannot deactivate your own active session account.');
    }
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: id } });
    if (existing) throw AppError.conflict('Email address already registered to another user.');
    user.email = data.email.toLowerCase();
  }

  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(data.password, salt);
    user.password_changed_at = new Date();
  }

  const updatable = [
    'full_name',
    'mobile',
    'role_id',
    'department',
    'designation',
    'branch_id',
    'reporting_manager_id',
    'employee_type',
    'status',
    'joining_date',
    'language',
    'timezone',
    'default_dashboard',
    'must_change_password',
  ];

  updatable.forEach((field) => {
    if (data[field] !== undefined) {
      if (['branch_id', 'role_id', 'reporting_manager_id'].includes(field) && (data[field] === '' || data[field] === null)) {
        user[field] = null;
      } else {
        user[field] = data[field];
      }
    }
  });

  await user.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'users',
    recordId: user._id,
    recordRef: user.user_code,
    description: `Updated profile details for ${user.full_name}`,
    before: beforeSnapshot,
    after: user,
    req,
  });

  return getUserById(user._id);
};

// ==========================================
// 2. Company Profile
// ==========================================

export const getCompanyProfile = async () => {
  let company = await Company.findOne({ status: 'active' });
  if (!company) {
    company = await Company.create({
      company_name: 'Danza Enterprise Group',
      legal_name: 'Danza Enterprise Solutions Private Limited',
      cin: 'U72200MH2026PTC123456',
      pan: 'AAACD1234E',
      gstin: '27AAACD1234E1Z5',
      email: 'corporate@danzaerp.com',
      phone: '+91-22-67890123',
      website: 'https://danzaerp.com',
      currency: 'INR',
      currency_symbol: '₹',
      financial_year_start: '04-01',
      address: {
        line1: 'Floor 12, Enterprise Heights',
        line2: 'BKC Financial District',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400051',
        country: 'India',
      },
    });
  }
  return company;
};

export const updateCompanyProfile = async (data, actorUser, req = null) => {
  let company = await Company.findOne();
  const beforeSnapshot = company ? company.toObject() : null;

  if (!company) {
    company = await Company.create(data);
  } else {
    Object.assign(company, data);
    await company.save();
  }

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'company',
    recordId: company._id,
    recordRef: company.company_name,
    description: 'Updated corporate company settings and GST credentials',
    before: beforeSnapshot,
    after: company,
    req,
  });

  return company;
};

// ==========================================
// 3. Branches & Warehouses
// ==========================================

export const getBranches = async ({ status, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { branch_name: { $regex: search, $options: 'i' } },
      { branch_code: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
    ];
  }
  return Branch.find(filter).sort({ is_head_office: -1, branch_name: 1 });
};

export const createBranch = async (data, actorUser, req = null) => {
  const branchCode = data.branch_code.toUpperCase().trim();
  const existing = await Branch.findOne({ branch_code: branchCode });
  if (existing) throw AppError.conflict(`Branch code '${branchCode}' already exists.`);

  const branch = await Branch.create({ ...data, branch_code: branchCode });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'branches',
    recordId: branch._id,
    recordRef: branch.branch_code,
    description: `Created branch ${branch.branch_name}`,
    after: branch,
    req,
  });

  return branch;
};

export const updateBranch = async (id, data, actorUser, req = null) => {
  const branch = await Branch.findById(id);
  if (!branch) throw AppError.notFound('Branch not found');

  const beforeSnapshot = branch.toObject();
  Object.assign(branch, data);
  if (data.branch_code) branch.branch_code = data.branch_code.toUpperCase().trim();
  await branch.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'branches',
    recordId: branch._id,
    recordRef: branch.branch_code,
    description: `Updated branch ${branch.branch_name}`,
    before: beforeSnapshot,
    after: branch,
    req,
  });

  return branch;
};

export const getWarehouses = async ({ branch_id, status }) => {
  const filter = {};
  if (branch_id) filter.branch_id = branch_id;
  if (status) filter.status = status;
  return Warehouse.find(filter)
    .populate('branch_id', 'branch_name branch_code')
    .populate('manager_id', 'full_name email')
    .sort({ warehouse_name: 1 });
};

export const createWarehouse = async (data, actorUser, req = null) => {
  const warehouseCode = data.warehouse_code.toUpperCase().trim();
  const existing = await Warehouse.findOne({ warehouse_code: warehouseCode });
  if (existing) throw AppError.conflict(`Warehouse code '${warehouseCode}' already exists.`);

  const warehouse = await Warehouse.create({ ...data, warehouse_code: warehouseCode });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'warehouses',
    recordId: warehouse._id,
    recordRef: warehouse.warehouse_code,
    description: `Created warehouse ${warehouse.warehouse_name}`,
    after: warehouse,
    req,
  });

  return Warehouse.findById(warehouse._id).populate('branch_id', 'branch_name branch_code');
};

export const updateWarehouse = async (id, data, actorUser, req = null) => {
  const warehouse = await Warehouse.findById(id);
  if (!warehouse) throw AppError.notFound('Warehouse not found');

  const beforeSnapshot = warehouse.toObject();
  Object.assign(warehouse, data);
  if (data.warehouse_code) warehouse.warehouse_code = data.warehouse_code.toUpperCase().trim();
  await warehouse.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'warehouses',
    recordId: warehouse._id,
    recordRef: warehouse.warehouse_code,
    description: `Updated warehouse ${warehouse.warehouse_name}`,
    before: beforeSnapshot,
    after: warehouse,
    req,
  });

  return Warehouse.findById(warehouse._id).populate('branch_id', 'branch_name branch_code');
};

// ==========================================
// 4. Number Series Management
// ==========================================

export const getAllNumberSeries = async () => {
  return NumberSeries.find().sort({ module: 1 });
};

export const updateNumberSeries = async (id, data, actorUser, req = null) => {
  const series = await NumberSeries.findById(id);
  if (!series) throw AppError.notFound('Number series configuration not found');

  const beforeSnapshot = series.toObject();
  if (data.name) series.name = data.name.trim();
  if (!series.name) series.name = `${series.module} Series`;
  if (data.prefix) series.prefix = data.prefix.toUpperCase().trim();
  if (data.suffix !== undefined) series.suffix = typeof data.suffix === 'string' ? data.suffix.trim() : '';
  if (data.padding_digits !== undefined) series.padding_digits = Number(data.padding_digits);
  if (data.include_year !== undefined) series.include_year = Boolean(data.include_year);
  if (data.current_number !== undefined) series.current_number = Number(data.current_number);
  if (data.status) series.status = data.status;

  await series.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'number_series',
    recordId: series._id,
    recordRef: series.module,
    description: `Updated numbering pattern for ${series.module}`,
    before: beforeSnapshot,
    after: series,
    req,
  });

  return series;
};

// ==========================================
// 5. Master Data Management
// ==========================================

export const getMasterData = async ({ category, is_active }) => {
  const filter = {};
  if (category) filter.category = category.toUpperCase();
  if (is_active !== undefined) filter.is_active = is_active;
  return MasterData.find(filter).sort({ category: 1, sort_order: 1, name: 1 });
};

export const createMasterData = async (data, actorUser, req = null) => {
  const code = data.code.toUpperCase().trim();
  const category = data.category.toUpperCase().trim();

  const existing = await MasterData.findOne({ category, code });
  if (existing) {
    throw AppError.conflict(`Option '${code}' already exists under category '${category}'.`);
  }

  const master = await MasterData.create({
    ...data,
    code,
    category,
  });

  await recordAuditLog({
    user: actorUser,
    action: 'CREATE',
    module: 'master_data',
    recordId: master._id,
    recordRef: `${category}:${code}`,
    description: `Created dropdown option '${master.name}' for ${category}`,
    after: master,
    req,
  });

  return master;
};

export const updateMasterData = async (id, data, actorUser, req = null) => {
  const master = await MasterData.findById(id);
  if (!master) throw AppError.notFound('Master data option not found');

  const beforeSnapshot = master.toObject();
  Object.assign(master, data);
  if (data.code) master.code = data.code.toUpperCase().trim();
  await master.save();

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'master_data',
    recordId: master._id,
    recordRef: `${master.category}:${master.code}`,
    description: `Updated option '${master.name}'`,
    before: beforeSnapshot,
    after: master,
    req,
  });

  return master;
};

// ==========================================
// 6. System Settings
// ==========================================

export const getSystemSettings = async (group = null) => {
  const filter = {};
  if (group) filter.group = group;
  const list = await SystemSettings.find(filter);
  const settingsMap = {};
  list.forEach((item) => {
    settingsMap[item.key] = item.value;
  });
  return { settings: settingsMap, items: list };
};

export const updateSystemSettings = async (settingsMap, actorUser, req = null) => {
  const operations = Object.entries(settingsMap).map(([key, value]) => {
    return {
      updateOne: {
        filter: { key },
        update: { $set: { key, value } },
        upsert: true,
      },
    };
  });

  if (operations.length > 0) {
    await SystemSettings.bulkWrite(operations);
  }

  await recordAuditLog({
    user: actorUser,
    action: 'UPDATE',
    module: 'system_settings',
    recordId: 'GLOBAL_SETTINGS',
    recordRef: 'SETTINGS',
    description: `Updated ${operations.length} system setting parameters`,
    after: settingsMap,
    req,
  });

  return getSystemSettings();
};

// ==========================================
// 7. Audit Logs & Login History
// ==========================================

export const getAuditLogs = async ({ module, action, userId, page = 1, limit = 50, startDate, endDate }) => {
  const filter = {};
  if (module) filter.module = module.toLowerCase();
  if (action) filter.action = action.toUpperCase();
  if (userId) filter.user_id = userId;
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total, page, limit };
};

export const getLoginHistory = async ({ email, status, page = 1, limit = 50 }) => {
  const filter = {};
  if (email) filter.email = { $regex: email, $options: 'i' };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [history, total] = await Promise.all([
    LoginHistory.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    LoginHistory.countDocuments(filter),
  ]);

  return { history, total, page, limit };
};
