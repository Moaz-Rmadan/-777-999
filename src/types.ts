export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string; // 'قطعة', 'كيلو', 'لتر', 'عبوة', 'كرتونة'
  expiryDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // percentage or fixed
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'credit';
  customerName?: string;
  cashierName: string;
  paidAmount: number;
  changeAmount: number;
  status?: 'active' | 'voided';
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  buyPrice: number;
  quantity: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  total: number;
  status: 'paid' | 'pending' | 'voided';
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: 'purchase' | 'payment' | 'return';
  amount: number;
  date: string;
  referenceId: string; // purchaseId or paymentId
  description: string;
  balanceAfter: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  balance: number; // what we owe them or credit
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: 'sale' | 'collection' | 'return';
  amount: number;
  date: string;
  referenceId: string; // invoiceId or collectionId
  description: string;
  balanceAfter: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  creditLimit: number;
  currentDebt: number;
}

export interface Expense {
  id: string;
  title: string;
  category: 'إيجار' | 'رواتب' | 'كهرباء ومياه' | 'نظافة ونقل' | 'صيانة' | 'أخرى';
  amount: number;
  date: string;
  notes?: string;
  status?: 'active' | 'voided';
}

export interface CashDrawerShift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  totalSalesCash: number;
  totalSalesCard: number;
  totalExpenses: number;
  status: 'open' | 'closed';
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingBalance: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  totalSales: number;
  totalReturns: number;
  totalExpenses: number;
  totalWithdrawals: number;
}

export type ShiftTransactionType = 'sale' | 'return' | 'expense' | 'withdrawal';

export interface ShiftTransaction {
  id: string;
  shiftId: string;
  type: ShiftTransactionType;
  amount: number;
  timestamp: string;
  description: string;
}

export type UserRole = 
  | 'super_admin' 
  | 'manager' 
  | 'accountant' 
  | 'cashier' 
  | 'warehouse' 
  | 'branch_manager' 
  | 'admin';

export interface RolePermissionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  cancel: boolean;
  print: boolean;
  export: boolean;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'cancel' | 'print' | 'export';

export type ModuleName = 
  | 'dashboard' 
  | 'pos' 
  | 'inventory' 
  | 'purchases' 
  | 'suppliers' 
  | 'customers' 
  | 'expenses' 
  | 'reports' 
  | 'users' 
  | 'shifts' 
  | 'audit_log' 
  | 'inventory_reports' 
  | 'accounting'
  | 'requirements'
  | 'settings';

export type RolePermissionMatrix = Record<UserRole, Record<ModuleName, RolePermissionSet>>;

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  email?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'product' | 'user' | 'invoice' | 'expense' | 'supplier' | 'customer' | 'shift';
  entityId: string;
  timestamp: string;
  before?: any;
  after?: any;
  deviceInfo?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  type: 'sale' | 'purchase' | 'expense' | 'collection' | 'payment' | 'return' | 'opening';
  description: string;
  debit: number;
  credit: number;
  account: string;
  referenceId: string;
}

export type ActiveTab = 
  | 'requirements'
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'shifts'
  | 'audit_log'
  | 'inventory_reports'
  | 'accounting'
  | 'settings';

export interface SystemSettings {
  storeName: string;
  storeSlogan: string;
  branchAddress: string;
  phone: string;
  taxNumber: string;
  commercialRecord: string;
  vatRate: number;
  vatIncluded: boolean;
  maxDiscountPercentage: number;
  receiptHeader: string;
  receiptFooter: string;
  enableQrCode: boolean;
  soundEnabled: boolean;
  autoIncrementQty: boolean;
  printerSimulated: boolean;
}

