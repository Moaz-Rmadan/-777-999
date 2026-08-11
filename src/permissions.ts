import { User, UserRole, ModuleName, PermissionAction, RolePermissionMatrix, RolePermissionSet } from './types';

// Helper to create all-true permissions
const allPermissions = (val = true): RolePermissionSet => ({
  view: val,
  create: val,
  edit: val,
  delete: val,
  approve: val,
  cancel: val,
  print: val,
  export: val,
});

// Helper to create specific permissions
const customPermissions = (allowed: Partial<RolePermissionSet>): RolePermissionSet => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  cancel: false,
  print: false,
  export: false,
  ...allowed,
});

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
    super_admin: {
    dashboard: allPermissions(true),
    pos: allPermissions(true),
    inventory: allPermissions(true),
    purchases: allPermissions(true),
    suppliers: allPermissions(true),
    customers: allPermissions(true),
    expenses: allPermissions(true),
    reports: allPermissions(true),
    users: allPermissions(true),
    shifts: allPermissions(true),
    audit_log: allPermissions(true),
    inventory_reports: allPermissions(true),
    stock_audit: allPermissions(true),
    accounting: allPermissions(true),
    hr: allPermissions(true),
    requirements: allPermissions(true),
    settings: allPermissions(true),
  },
  admin: { // Compatibility with existing admin
    dashboard: allPermissions(true),
    pos: allPermissions(true),
    inventory: allPermissions(true),
    purchases: allPermissions(true),
    suppliers: allPermissions(true),
    customers: allPermissions(true),
    expenses: allPermissions(true),
    reports: allPermissions(true),
    users: allPermissions(true),
    shifts: allPermissions(true),
    audit_log: allPermissions(true),
    inventory_reports: allPermissions(true),
    stock_audit: allPermissions(true),
    accounting: allPermissions(true),
    hr: allPermissions(true),
    requirements: allPermissions(true),
    settings: allPermissions(true),
  },
  manager: {
    dashboard: customPermissions({ view: true, print: true, export: true }),
    pos: customPermissions({ view: true, create: true, edit: true, cancel: true, print: true }),
    inventory: customPermissions({ view: true, create: true, edit: true, delete: true, print: true, export: true }),
    purchases: customPermissions({ view: true, create: true, edit: true, cancel: true, print: true, export: true }),
    suppliers: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    customers: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    expenses: customPermissions({ view: true, create: true, edit: true, cancel: true, print: true, export: true }),
    reports: customPermissions({ view: true, print: true, export: true }),
    users: customPermissions({ view: true }), // Manager can view users but maybe not manage
    shifts: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    audit_log: customPermissions({ view: true, print: true }),
    inventory_reports: customPermissions({ view: true, print: true, export: true }),
    stock_audit: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    accounting: customPermissions({ view: true, print: true }),
    hr: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    requirements: customPermissions({ view: true }),
    settings: customPermissions({ view: true, edit: true }),
  },
  accountant: {
    dashboard: customPermissions({ view: true, print: true, export: true }),
    pos: customPermissions({ view: false }),
    inventory: customPermissions({ view: true, print: true, export: true }),
    purchases: customPermissions({ view: true, print: true, export: true }),
    suppliers: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    customers: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    expenses: customPermissions({ view: true, create: true, edit: true, approve: true, cancel: true, print: true, export: true }),
    reports: customPermissions({ view: true, print: true, export: true }),
    users: customPermissions({ view: false }),
    shifts: customPermissions({ view: true, print: true }),
    audit_log: customPermissions({ view: false }),
    inventory_reports: customPermissions({ view: true, print: true, export: true }),
    stock_audit: customPermissions({ view: true, print: true, export: true }),
    accounting: customPermissions({ view: true, create: true, edit: true, approve: true, cancel: true, print: true, export: true }),
    hr: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    requirements: customPermissions({ view: true }),
    settings: customPermissions({ view: true }),
  },
  cashier: {
    dashboard: customPermissions({ view: false }),
    pos: customPermissions({ view: true, create: true, print: true }), // Returns/Cancel require manager/admin permission usually (so cancel is false)
    inventory: customPermissions({ view: true }), // To search items
    purchases: customPermissions({ view: false }),
    suppliers: customPermissions({ view: false }),
    customers: customPermissions({ view: true, create: true, edit: true }),
    expenses: customPermissions({ view: false }),
    reports: customPermissions({ view: true }), // only cashier's own sales (will handle filters)
    users: customPermissions({ view: false }),
    shifts: customPermissions({ view: true, create: true, edit: true }), // open, close shifts
    audit_log: customPermissions({ view: false }),
    inventory_reports: customPermissions({ view: false }),
    stock_audit: customPermissions({ view: false }),
    accounting: customPermissions({ view: false }),
    hr: customPermissions({ view: false }),
    requirements: customPermissions({ view: false }),
    settings: customPermissions({ view: false }),
  },
  warehouse: {
    dashboard: customPermissions({ view: false }),
    pos: customPermissions({ view: false }),
    inventory: customPermissions({ view: true, create: true, edit: true, print: true, export: true }), // view stock, count
    purchases: customPermissions({ view: true, create: true, edit: true }), // for receipt of goods
    suppliers: customPermissions({ view: true }), // view suppliers
    customers: customPermissions({ view: false }),
    expenses: customPermissions({ view: false }),
    reports: customPermissions({ view: false }),
    users: customPermissions({ view: false }),
    shifts: customPermissions({ view: false }),
    audit_log: customPermissions({ view: false }),
    inventory_reports: customPermissions({ view: true, print: true, export: true }),
    stock_audit: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    accounting: customPermissions({ view: false }),
    hr: customPermissions({ view: false }),
    requirements: customPermissions({ view: false }),
    settings: customPermissions({ view: false }),
  },
  branch_manager: {
    dashboard: customPermissions({ view: true, print: true, export: true }),
    pos: customPermissions({ view: true, create: true, edit: true, cancel: true, print: true }),
    inventory: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    purchases: customPermissions({ view: true, create: true, edit: true, print: true }),
    suppliers: customPermissions({ view: true, create: true, edit: true }),
    customers: customPermissions({ view: true, create: true, edit: true }),
    expenses: customPermissions({ view: true, create: true, edit: true, cancel: true }),
    reports: customPermissions({ view: true, print: true, export: true }),
    users: customPermissions({ view: true, create: true, edit: true }), // manage branch employees
    shifts: customPermissions({ view: true, create: true, edit: true, print: true }),
    audit_log: customPermissions({ view: true }),
    inventory_reports: customPermissions({ view: true, print: true }),
    stock_audit: customPermissions({ view: true, create: true, edit: true, print: true, export: true }),
    accounting: customPermissions({ view: false }),
    hr: customPermissions({ view: true, create: true, edit: true, print: true }),
    requirements: customPermissions({ view: true }),
    settings: customPermissions({ view: true, edit: true }),
  },
};

export function getRolePermissions(role: UserRole, customMatrix?: RolePermissionMatrix): Record<ModuleName, RolePermissionSet> {
  const matrix = customMatrix || DEFAULT_ROLE_PERMISSIONS;
  return matrix[role] || matrix.cashier;
}

export function hasPermission(
  user: User | null,
  module: ModuleName,
  action: PermissionAction,
  customMatrix?: RolePermissionMatrix
): boolean {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'admin') return true;
  
  const permissions = getRolePermissions(user.role, customMatrix);
  return permissions[module]?.[action] || false;
}

export const ROLE_ARABIC_NAMES: Record<UserRole, string> = {
  super_admin: 'المدير المالك (Super Admin)',
  admin: 'المدير العام (Admin)',
  manager: 'المدير التشغيلي (Manager)',
  accountant: 'المحاسب المالي (Accountant)',
  cashier: 'أمين الصندوق (Cashier)',
  warehouse: 'أمين المستودع (Warehouse User)',
  branch_manager: 'مدير الفرع (Branch Manager)',
};

export const MODULE_ARABIC_NAMES: Record<ModuleName, string> = {
  dashboard: 'الرئيسية والملخص',
  pos: 'شاشة المبيعات (POS)',
  inventory: 'الأصناف وإدارة المخزون',
  purchases: 'فواتير المشتريات',
  suppliers: 'الموردين والحسابات',
  customers: 'العملاء والمديونيات',
  expenses: 'المصروفات والتشغيل',
  reports: 'التقارير التحليلية والمالية',
  users: 'إدارة الموظفين والصلاحيات',
  shifts: 'إدارة ورديات الصندوق',
  audit_log: 'سجل الرقابة والعمليات',
  inventory_reports: 'تقارير حركة المخازن',
  stock_audit: 'جرد وتدقيق المخزون',
  accounting: 'القيود والدفاتر المحاسبية',
  hr: 'شؤون العاملين والرواتب',
  requirements: 'المتطلبات والنظام',
  settings: 'الإعدادات العامة للنظام',
};

export const ACTION_ARABIC_NAMES: Record<PermissionAction, string> = {
  view: 'عرض (View)',
  create: 'إضافة (Create)',
  edit: 'تعديل (Edit)',
  delete: 'حذف (Delete)',
  approve: 'اعتماد (Approve)',
  cancel: 'إلغاء (Cancel)',
  print: 'طباعة (Print)',
  export: 'تصدير (Export)',
};
