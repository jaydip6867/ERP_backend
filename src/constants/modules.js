/**
 * Standard ERP Modules list for Permission Matrix.
 */
export const ERP_MODULES = [
  { code: 'dashboard', name: 'Executive Dashboard', category: 'Core' },
  { code: 'users', name: 'User Management', category: 'Administration' },
  { code: 'roles', name: 'Roles & Permissions', category: 'Administration' },
  { code: 'inventory', name: 'Inventory & Stock', category: 'Supply Chain' },
  { code: 'warehouse', name: 'Warehouse Logistics', category: 'Supply Chain' },
  { code: 'procurement', name: 'Procurement & Purchasing', category: 'Supply Chain' },
  { code: 'production', name: 'Production & Manufacturing', category: 'Operations' },
  { code: 'quality', name: 'Quality Control (QC)', category: 'Operations' },
  { code: 'sales', name: 'Sales & Invoicing', category: 'Commercial' },
  { code: 'marketing', name: 'Marketing & CRM', category: 'Commercial' },
  { code: 'finance', name: 'Finance & General Ledger', category: 'Finance' },
  { code: 'support', name: 'Customer Support', category: 'Services' },
  { code: 'reports', name: 'Reports & Analytics', category: 'Analytics' },
  { code: 'settings', name: 'System Settings', category: 'Administration' },
  { code: 'organization', name: 'Organization & Hierarchy', category: 'Organization' },
  { code: 'hr', name: 'Human Resources & Payroll', category: 'HR' },
  { code: 'technology', name: 'Technology & Automation', category: 'Technology' },
  { code: 'rnd', name: 'R&D & Product Innovation', category: 'R&D' },
  { code: 'operations', name: 'Operations & Jobs', category: 'Operations' },
  { code: 'dashboards', name: 'Executive Dashboards', category: 'Executive' },
];

export const MODULE_CODES = ERP_MODULES.map((m) => m.code);

export const DATA_SCOPES = {
  OWN: 'OWN',
  TEAM: 'TEAM',
  BRANCH: 'BRANCH',
  ALL: 'ALL',
};

export const PERMISSION_ACTIONS = [
  'can_view',
  'can_create',
  'can_edit',
  'can_delete',
  'can_approve',
  'can_export',
  'can_print',
  'can_view_cost',
  'can_view_salary',
  'can_run_automation',
  'can_manage_integrations',
];
