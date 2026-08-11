import React, { useState, useEffect } from 'react';
import { ActiveTab, Product, Invoice, Expense, PurchaseInvoice, Supplier, Customer, User, Shift, AuditLogEntry, SupplierTransaction, CustomerTransaction, JournalEntry, RolePermissionMatrix, SystemSettings, InventoryMovement, Employee, AttendanceRecord, PayrollRecord, AdvancePayment, StockAuditSession } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_EXPENSES, 
  INITIAL_INVOICES, 
  INITIAL_PURCHASES,
  INITIAL_USERS,
  DEFAULT_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYROLLS,
  INITIAL_ADVANCES,
  INITIAL_AUDIT_SESSIONS
} from './mockData';
import { saveToFirebase, loadFromFirebase, auth, logoutFirebase } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { RequirementsView } from './components/RequirementsView';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { InventoryView } from './components/InventoryView';
import { PurchasesView } from './components/PurchasesView';
import { SuppliersView } from './components/SuppliersView';
import { CustomersView } from './components/CustomersView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { LoginView } from './components/LoginView';
import { UsersView } from './components/UsersView';
import { ShiftsView } from './components/ShiftsView';
import AuditLogView from './components/AuditLogView';
import InventoryReportsView from './components/InventoryReportsView';
import { StockAuditView } from './components/StockAuditView';
import { AccountingView } from './components/AccountingView';
import { SettingsView } from './components/SettingsView';
import { HrView } from './components/HrView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DEFAULT_ROLE_PERMISSIONS, hasPermission } from './permissions';

function mergeUniqueById<T extends { id: string; operationId?: string }>(localList: T[], remoteList: T[]): T[] {
  const mergedMap = new Map<string, T>();
  
  // 1. Add remote items first as baseline
  remoteList.forEach(item => {
    const key = item.operationId || item.id;
    mergedMap.set(key, item);
  });
  
  // 2. Add local items. If an item already exists under that key, merge them, keeping remote as baseline
  localList.forEach(item => {
    const key = item.operationId || item.id;
    const existing = mergedMap.get(key);
    if (!existing) {
      mergedMap.set(key, item);
    } else {
      mergedMap.set(key, { ...item, ...existing });
    }
  });
  
  return Array.from(mergedMap.values());
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sm_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('sm_shifts');
    return saved ? JSON.parse(saved) : [];
  });

  const [permissionMatrix, setPermissionMatrix] = useState<RolePermissionMatrix>(() => {
    const saved = localStorage.getItem('pos_permission_matrix');
    return saved ? JSON.parse(saved) : DEFAULT_ROLE_PERMISSIONS;
  });

  const activeShift = shifts.find(s => s.status === 'open' && s.cashierId === currentUser?.id);

  // Persistent states or initial data
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('sm_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('sm_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('sm_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('sm_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('sm_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('sm_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('sm_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [auditSessions, setAuditSessions] = useState<StockAuditSession[]>(() => {
    const saved = localStorage.getItem('sm_audit_sessions');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_SESSIONS;
  });

  // Save to localStorage & Firebase
  useEffect(() => {
    localStorage.setItem('sm_audit_sessions', JSON.stringify(auditSessions));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_audit_sessions', auditSessions);
    }
  }, [auditSessions, isFirebaseLoading]);
  useEffect(() => {
    localStorage.setItem('sm_settings', JSON.stringify(settings));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_settings', settings);
    }
  }, [settings, isFirebaseLoading]);
  useEffect(() => {
    localStorage.setItem('sm_products', JSON.stringify(products));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_products', products);
    }
  }, [products, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_invoices', JSON.stringify(invoices));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_invoices', invoices);
    }
  }, [invoices, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_purchases', JSON.stringify(purchases));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_purchases', purchases);
    }
  }, [purchases, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_suppliers', JSON.stringify(suppliers));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_suppliers', suppliers);
    }
  }, [suppliers, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_customers', JSON.stringify(customers));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_customers', customers);
    }
  }, [customers, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_expenses', JSON.stringify(expenses));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_expenses', expenses);
    }
  }, [expenses, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_users', JSON.stringify(users));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_users', users);
    }
  }, [users, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('pos_permission_matrix', JSON.stringify(permissionMatrix));
    if (!isFirebaseLoading) {
      saveToFirebase('pos_permission_matrix', permissionMatrix);
    }
  }, [permissionMatrix, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_shifts', JSON.stringify(shifts));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_shifts', shifts);
    }
  }, [shifts, isFirebaseLoading]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sm_current_user');
    }
  }, [currentUser]);

  // Handlers
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('pos_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(() => {
    const saved = localStorage.getItem('pos_supplier_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>(() => {
    const saved = localStorage.getItem('pos_customer_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('sm_journal_entries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sm_journal_entries', JSON.stringify(journalEntries));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_journal_entries', journalEntries);
    }
  }, [journalEntries, isFirebaseLoading]);

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem('sm_inventory_movements');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sm_inventory_movements', JSON.stringify(inventoryMovements));
    if (!isFirebaseLoading) {
      saveToFirebase('sm_inventory_movements', inventoryMovements);
    }
  }, [inventoryMovements, isFirebaseLoading]);

  // HR States
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('sm_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('sm_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('sm_payrolls');
    return saved ? JSON.parse(saved) : INITIAL_PAYROLLS;
  });
  const [advances, setAdvances] = useState<AdvancePayment[]>(() => {
    const saved = localStorage.getItem('sm_advances');
    return saved ? JSON.parse(saved) : INITIAL_ADVANCES;
  });

  useEffect(() => {
    localStorage.setItem('sm_employees', JSON.stringify(employees));
    if (!isFirebaseLoading) saveToFirebase('sm_employees', employees);
  }, [employees, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_attendance', JSON.stringify(attendance));
    if (!isFirebaseLoading) saveToFirebase('sm_attendance', attendance);
  }, [attendance, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_payrolls', JSON.stringify(payrolls));
    if (!isFirebaseLoading) saveToFirebase('sm_payrolls', payrolls);
  }, [payrolls, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sm_advances', JSON.stringify(advances));
    if (!isFirebaseLoading) saveToFirebase('sm_advances', advances);
  }, [advances, isFirebaseLoading]);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;

    async function loadAllFirebaseData() {
      try {
        const u = await loadFromFirebase('sm_users');
        const p = await loadFromFirebase('sm_products');
        const i = await loadFromFirebase('sm_invoices');
        const pu = await loadFromFirebase('sm_purchases');
        const s = await loadFromFirebase('sm_suppliers');
        const c = await loadFromFirebase('sm_customers');
        const e = await loadFromFirebase('sm_expenses');
        const pm = await loadFromFirebase('pos_permission_matrix');
        const sh = await loadFromFirebase('sm_shifts');
        const al = await loadFromFirebase('pos_audit_logs');
        const st = await loadFromFirebase('pos_supplier_transactions');
        const ct = await loadFromFirebase('pos_customer_transactions');
        const je = await loadFromFirebase('sm_journal_entries');
        const mov = await loadFromFirebase('sm_inventory_movements');
        const emp = await loadFromFirebase('sm_employees');
        const att = await loadFromFirebase('sm_attendance');
        const pay = await loadFromFirebase('sm_payrolls');
        const adv = await loadFromFirebase('sm_advances');
        const sett = await loadFromFirebase('sm_settings');

        let currentUsersList = u || INITIAL_USERS;

        if (u !== null) setUsers(u); else { await saveToFirebase('sm_users', INITIAL_USERS); }
        if (p !== null) setProducts(prev => mergeUniqueById(prev, p)); else { await saveToFirebase('sm_products', INITIAL_PRODUCTS); }
        if (i !== null) setInvoices(prev => mergeUniqueById(prev, i)); else { await saveToFirebase('sm_invoices', INITIAL_INVOICES); }
        if (pu !== null) setPurchases(prev => mergeUniqueById(prev, pu)); else { await saveToFirebase('sm_purchases', INITIAL_PURCHASES); }
        if (s !== null) setSuppliers(prev => mergeUniqueById(prev, s)); else { await saveToFirebase('sm_suppliers', INITIAL_SUPPLIERS); }
        if (c !== null) setCustomers(prev => mergeUniqueById(prev, c)); else { await saveToFirebase('sm_customers', INITIAL_CUSTOMERS); }
        if (e !== null) setExpenses(prev => mergeUniqueById(prev, e)); else { await saveToFirebase('sm_expenses', INITIAL_EXPENSES); }
        if (pm !== null) setPermissionMatrix(pm); else { await saveToFirebase('pos_permission_matrix', DEFAULT_ROLE_PERMISSIONS); }
        if (sh !== null) setShifts(prev => mergeUniqueById(prev, sh)); else { await saveToFirebase('sm_shifts', []); }
        if (al !== null) setAuditLogs(prev => mergeUniqueById(prev, al)); else { await saveToFirebase('pos_audit_logs', []); }
        if (st !== null) setSupplierTransactions(prev => mergeUniqueById(prev, st)); else { await saveToFirebase('pos_supplier_transactions', []); }
        if (ct !== null) setCustomerTransactions(prev => mergeUniqueById(prev, ct)); else { await saveToFirebase('pos_customer_transactions', []); }
        if (je !== null) setJournalEntries(prev => mergeUniqueById(prev, je)); else { await saveToFirebase('sm_journal_entries', []); }
        if (mov !== null) setInventoryMovements(prev => mergeUniqueById(prev, mov)); else { await saveToFirebase('sm_inventory_movements', []); }
        if (emp !== null) setEmployees(prev => mergeUniqueById(prev, emp)); else { await saveToFirebase('sm_employees', INITIAL_EMPLOYEES); }
        if (att !== null) setAttendance(prev => mergeUniqueById(prev, att)); else { await saveToFirebase('sm_attendance', INITIAL_ATTENDANCE); }
        if (pay !== null) setPayrolls(prev => mergeUniqueById(prev, pay)); else { await saveToFirebase('sm_payrolls', INITIAL_PAYROLLS); }
        if (adv !== null) setAdvances(prev => mergeUniqueById(prev, adv)); else { await saveToFirebase('sm_advances', INITIAL_ADVANCES); }
        if (sett !== null) setSettings(sett); else { await saveToFirebase('sm_settings', DEFAULT_SETTINGS); }

        unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser && firebaseUser.email) {
            const matched = currentUsersList.find((usr: any) => usr.email?.toLowerCase() === firebaseUser.email?.toLowerCase());
            if (matched) {
              setCurrentUser(matched);
            } else {
              // Try username matching the prefix
              const prefix = firebaseUser.email.split('@')[0];
              const matchedByUsername = currentUsersList.find((usr: any) => usr.username.toLowerCase() === prefix.toLowerCase());
              if (matchedByUsername) {
                const updatedUser = { ...matchedByUsername, email: firebaseUser.email, avatar: firebaseUser.photoURL || undefined };
                setCurrentUser(updatedUser);
                setUsers(prev => {
                  const updatedList = prev.map(usr => usr.id === updatedUser.id ? updatedUser : usr);
                  saveToFirebase('sm_users', updatedList);
                  return updatedList;
                });
              }
            }
          }
        });

      } catch (err) {
        console.error("Error loading data from Firestore:", err);
      } finally {
        setIsFirebaseLoading(false);
      }
    }
    loadAllFirebaseData();

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  const logJournalEntry = (
    type: JournalEntry['type'],
    description: string,
    debit: number,
    credit: number,
    account: string,
    referenceId: string,
    operationId?: string
  ) => {
    const opId = operationId || `op-je-${referenceId}-${account}-${debit > 0 ? 'debit' : 'credit'}`;
    
    let alreadyExists = false;
    setJournalEntries(prev => {
      alreadyExists = prev.some(j => j.operationId === opId);
      if (alreadyExists) return prev;

      const entry: JournalEntry = {
        id: 'je-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        date: new Date().toISOString(),
        type,
        description,
        debit,
        credit,
        account,
        referenceId,
        operationId: opId
      };
      return [entry, ...prev];
    });
  };

  useEffect(() => {
    localStorage.setItem('pos_audit_logs', JSON.stringify(auditLogs));
    if (!isFirebaseLoading) {
      saveToFirebase('pos_audit_logs', auditLogs);
    }
  }, [auditLogs, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('pos_supplier_transactions', JSON.stringify(supplierTransactions));
    if (!isFirebaseLoading) {
      saveToFirebase('pos_supplier_transactions', supplierTransactions);
    }
  }, [supplierTransactions, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('pos_customer_transactions', JSON.stringify(customerTransactions));
    if (!isFirebaseLoading) {
      saveToFirebase('pos_customer_transactions', customerTransactions);
    }
  }, [customerTransactions, isFirebaseLoading]);

  const logCustomerTransaction = (
    customerId: string,
    type: CustomerTransaction['type'],
    amount: number,
    referenceId: string,
    description: string,
    newBalance: number,
    operationId?: string
  ) => {
    const opId = operationId || `op-ct-${referenceId}-${type}`;
    
    let alreadyExists = false;
    setCustomerTransactions(prev => {
      alreadyExists = prev.some(t => t.operationId === opId);
      if (alreadyExists) return prev;

      const transaction: CustomerTransaction = {
        id: 'ct-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        customerId,
        type,
        amount,
        date: new Date().toISOString(),
        referenceId,
        description,
        balanceAfter: newBalance,
        operationId: opId
      };
      return [transaction, ...prev];
    });
  };

  const logSupplierTransaction = (
    supplierId: string,
    type: SupplierTransaction['type'],
    amount: number,
    referenceId: string,
    description: string,
    newBalance: number,
    operationId?: string
  ) => {
    const opId = operationId || `op-st-${referenceId}-${type}`;
    
    let alreadyExists = false;
    setSupplierTransactions(prev => {
      alreadyExists = prev.some(t => t.operationId === opId);
      if (alreadyExists) return prev;

      const transaction: SupplierTransaction = {
        id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        supplierId,
        type,
        amount,
        date: new Date().toISOString(),
        referenceId,
        description,
        balanceAfter: newBalance,
        operationId: opId
      };
      return [transaction, ...prev];
    });
  };

  const logAction = (
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    before?: any,
    after?: any
  ) => {
    if (!currentUser) return;
    const newEntry: AuditLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      before,
      after,
      deviceInfo: navigator.userAgent
    };
    setAuditLogs(prev => [newEntry, ...prev].slice(0, 5000)); // Keep last 5000 logs
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // If cashier, default to POS
    if (user.role === 'cashier') {
      setActiveTab('pos');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    logoutFirebase().catch(err => console.error("Firebase Auth sign out error:", err));
  };

  const handleImportData = (data: {
    products?: Product[];
    invoices?: Invoice[];
    purchases?: PurchaseInvoice[];
    suppliers?: Supplier[];
    customers?: Customer[];
    expenses?: Expense[];
    shifts?: Shift[];
  }) => {
    if (data.products) setProducts(data.products);
    if (data.invoices) setInvoices(data.invoices);
    if (data.purchases) setPurchases(data.purchases);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.customers) setCustomers(data.customers);
    if (data.expenses) setExpenses(data.expenses);
    if (data.shifts) setShifts(data.shifts);
    logAction('استيراد قاعدة البيانات بالكامل من ملف خارجي', 'user', currentUser?.id || 'system');
  };

  const handleResetData = () => {
    setProducts(INITIAL_PRODUCTS);
    setInvoices(INITIAL_INVOICES);
    setPurchases(INITIAL_PURCHASES);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setExpenses(INITIAL_EXPENSES);
    setShifts([]);
    setSettings(DEFAULT_SETTINGS);
    setJournalEntries([]);
    setAuditLogs([]);
    setSupplierTransactions([]);
    setCustomerTransactions([]);
    localStorage.removeItem('sm_products');
    localStorage.removeItem('sm_invoices');
    localStorage.removeItem('sm_purchases');
    localStorage.removeItem('sm_suppliers');
    localStorage.removeItem('sm_customers');
    localStorage.removeItem('sm_expenses');
    localStorage.removeItem('sm_shifts');
    localStorage.removeItem('sm_settings');
    localStorage.removeItem('sm_journal_entries');
    localStorage.removeItem('pos_audit_logs');
    localStorage.removeItem('pos_supplier_transactions');
    localStorage.removeItem('pos_customer_transactions');
    logAction('إعادة ضبط المصنع وتهيئة البيانات الافتراضية', 'user', currentUser?.id || 'system');
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [user, ...prev]);
    logAction('إضافة مستخدم جديد', 'user', user.id, null, { ...user, password: '***' });
  };

  const handleUpdateUser = (updated: User) => {
    const original = users.find(u => u.id === updated.id);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    logAction('تعديل صلاحيات/بيانات مستخدم', 'user', updated.id, { ...original, password: '***' }, { ...updated, password: '***' });
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المستخدم',
      message: `هل أنت متأكد من حذف المستخدم "${user?.name || ''}" من النظام؟`,
      confirmLabel: 'نعم، حذف المستخدم',
      onConfirm: () => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        logAction('حذف مستخدم من النظام', 'user', userId, { ...user, password: '***' }, null);
        setConfirmModal(null);
      }
    });
  };

  const handleOpenShift = (openingBalance: number) => {
    if (!currentUser) return;
    const newShift: Shift = {
      id: 'shift-' + Date.now(),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      startTime: new Date().toISOString(),
      status: 'open',
      openingBalance,
      expectedCash: openingBalance,
      totalSales: 0,
      totalReturns: 0,
      totalExpenses: 0,
      totalWithdrawals: 0
    };
    setShifts(prev => [newShift, ...prev]);
    logAction('فتح وردية جديدة', 'shift', newShift.id, null, newShift);
  };

  const handleCloseShift = (actualCash: number) => {
    if (!activeShift) return;
    const difference = actualCash - activeShift.expectedCash;
    const updatedShift = {
      ...activeShift,
      status: 'closed' as const,
      endTime: new Date().toISOString(),
      actualCash,
      difference
    };
    setShifts(prev => prev.map(s => s.id === activeShift.id ? updatedShift : s));
    logAction('إغلاق الوردية', 'shift', activeShift.id, activeShift, updatedShift);
  };

  const handleShiftWithdrawal = (amount: number, description: string) => {
    if (!activeShift) return;
    setShifts(prev => prev.map(s => s.id === activeShift.id ? {
      ...s,
      totalWithdrawals: s.totalWithdrawals + amount,
      expectedCash: s.expectedCash - amount
    } : s));
  };

  const handleAddProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
    logAction('إضافة صنف جديد', 'product', product.id, null, product);
  };

  const handleUpdateProduct = (updated: Product) => {
    const original = products.find(p => p.id === updated.id);
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    logAction('تعديل بيانات صنف', 'product', updated.id, original, updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الصنف',
      message: `هل أنت متأكد من حذف الصنف "${product?.name || ''}" من المخزون؟`,
      confirmLabel: 'نعم، حذف الصنف',
      onConfirm: () => {
        setProducts(prev => prev.filter(p => p.id !== productId));
        logAction('حذف صنف من المخزون', 'product', productId, product, null);
        setConfirmModal(null);
      }
    });
  };

  const updateProductStock = (productId: string, qtyChange: number, operationId?: string) => {
    if (operationId) {
      // Check if this stock operation was already applied to prevent duplication
      let alreadyApplied = false;
      setInventoryMovements(prev => {
        alreadyApplied = prev.some(m => m.operationId === operationId);
        if (alreadyApplied) return prev;

        const product = products.find(p => p.id === productId);
        const newMovement: InventoryMovement = {
          id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          operationId,
          productId,
          productName: product?.name || 'صنف مجهول',
          type: qtyChange > 0 ? (qtyChange > 100 ? 'purchase' : 'adjustment') : 'sale',
          quantity: qtyChange,
          date: new Date().toISOString(),
          referenceId: operationId.split('-')[2] || ''
        };
        return [newMovement, ...prev];
      });

      if (alreadyApplied) {
        console.log(`Inventory movement ${operationId} already applied. Skipping stock modification.`);
        return;
      }
    }

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, p.stock + qtyChange) };
      }
      return p;
    }));
  };

  const handleCompleteSale = (invoice: Invoice) => {
    let invoiceExists = false;
    setInvoices(prev => {
      invoiceExists = prev.some(inv => inv.id === invoice.id || (invoice.operationId && inv.operationId === invoice.operationId));
      if (invoiceExists) return prev;
      return [invoice, ...prev];
    });

    if (invoiceExists) {
      console.log(`Invoice ${invoice.id} already exists. Skipping ledger logging to prevent duplicates.`);
      return;
    }

    logAction('إتمام عملية بيع (فاتورة)', 'invoice', invoice.id, null, invoice);
    
    // Calculate total cost for COGS
    const totalCost = invoice.items.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);

    const invoiceOpId = invoice.operationId || `op-inv-${invoice.id}`;

    // 1. Log Sales Entry
    if (invoice.paymentMethod === 'cash') {
      logJournalEntry('sale', `مبيعات نقدية - فاتورة ${invoice.invoiceNumber}`, invoice.total, 0, 'cash', invoice.id, `${invoiceOpId}-je-cash-debit`);
      logJournalEntry('sale', `مبيعات نقدية - فاتورة ${invoice.invoiceNumber}`, 0, invoice.total, 'sales', invoice.id, `${invoiceOpId}-je-sales-credit`);
    } else if (invoice.paymentMethod === 'card') {
      logJournalEntry('sale', `مبيعات فيزا - فاتورة ${invoice.invoiceNumber}`, invoice.total, 0, 'bank', invoice.id, `${invoiceOpId}-je-bank-debit`);
      logJournalEntry('sale', `مبيعات فيزا - فاتورة ${invoice.invoiceNumber}`, 0, invoice.total, 'sales', invoice.id, `${invoiceOpId}-je-sales-credit`);
    } else {
      logJournalEntry('sale', `مبيعات آجلة - عميل: ${invoice.customerName} - فاتورة ${invoice.invoiceNumber}`, invoice.total, 0, 'receivables', invoice.id, `${invoiceOpId}-je-receivables-debit`);
      logJournalEntry('sale', `مبيعات آجلة - عميل: ${invoice.customerName} - فاتورة ${invoice.invoiceNumber}`, 0, invoice.total, 'sales', invoice.id, `${invoiceOpId}-je-sales-credit`);
    }

    // 2. Log COGS and Inventory Entry
    logJournalEntry('sale', `تكلفة مبيعات - فاتورة ${invoice.invoiceNumber}`, totalCost, 0, 'expenses', invoice.id, `${invoiceOpId}-je-cogs-debit`);
    logJournalEntry('sale', `تكلفة مبيعات - فاتورة ${invoice.invoiceNumber}`, 0, totalCost, 'inventory', invoice.id, `${invoiceOpId}-je-inventory-credit`);

    // Update shift if active
    if (activeShift) {
      setShifts(prev => prev.map(s => s.id === activeShift.id ? {
        ...s,
        totalSales: s.totalSales + invoice.total,
        expectedCash: s.expectedCash + (invoice.paymentMethod === 'cash' ? invoice.total : 0)
      } : s));
    }

    // If credit sale, update customer debt
    if (invoice.paymentMethod === 'credit' && invoice.customerName) {
      setCustomers(prev => prev.map(c => {
        if (c.name === invoice.customerName) {
          const transOpId = `op-ct-${invoice.id}-sale`;
          const alreadyExists = customerTransactions.some(t => t.operationId === transOpId);
          if (alreadyExists) return c;

          const newDebt = c.currentDebt + invoice.total;
          logCustomerTransaction(c.id, 'sale', invoice.total, invoice.id, `بيع آجل فاتورة رقم ${invoice.invoiceNumber}`, newDebt, transOpId);
          return { ...c, currentDebt: newDebt };
        }
        return c;
      }));
    }
  };

  const handleAddPurchase = (purchase: PurchaseInvoice) => {
    let purchaseExists = false;
    setPurchases(prev => {
      purchaseExists = prev.some(p => p.id === purchase.id || (purchase.operationId && p.operationId === purchase.operationId));
      if (purchaseExists) return prev;
      return [purchase, ...prev];
    });

    if (purchaseExists) {
      console.log(`Purchase ${purchase.id} already exists. Skipping ledger logging.`);
      return;
    }

    const purchaseOpId = purchase.operationId || `op-pur-${purchase.id}`;
    
    // Log Journal Entries for Purchase
    if (purchase.status === 'paid') {
      logJournalEntry('purchase', `شراء نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'inventory', purchase.id, `${purchaseOpId}-je-inventory-debit`);
      logJournalEntry('purchase', `شراء نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'cash', purchase.id, `${purchaseOpId}-je-cash-credit`);
    } else {
      logJournalEntry('purchase', `شراء آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'inventory', purchase.id, `${purchaseOpId}-je-inventory-debit`);
      logJournalEntry('purchase', `شراء آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'payables', purchase.id, `${purchaseOpId}-je-payables-credit`);
    }

    // Increase stock for each item in purchase
    purchase.items.forEach(item => {
      updateProductStock(item.productId, item.quantity, `op-stock-${purchase.id}-${item.productId}`);
    });

    // Update supplier balance if pending
    if (purchase.status === 'pending') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === purchase.supplierId) {
          const transOpId = `op-st-${purchase.id}-purchase`;
          const alreadyExists = supplierTransactions.some(t => t.operationId === transOpId);
          if (alreadyExists) return s;

          const newBalance = s.balance + purchase.total;
          logSupplierTransaction(s.id, 'purchase', purchase.total, purchase.id, `شراء فاتورة رقم ${purchase.purchaseNumber}`, newBalance, transOpId);
          return { ...s, balance: newBalance };
        }
        return s;
      }));
    } else {
      const transOpId = `op-st-${purchase.id}-purchase-cash`;
      const alreadyExists = supplierTransactions.some(t => t.operationId === transOpId);
      if (!alreadyExists) {
        logSupplierTransaction(purchase.supplierId, 'purchase', purchase.total, purchase.id, `شراء نقدي فاتورة رقم ${purchase.purchaseNumber}`, 0, transOpId);
      }
    }
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers(prev => [supplier, ...prev]);
    logAction('إضافة مورد جديد', 'supplier', supplier.id, null, supplier);
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    const original = suppliers.find(s => s.id === updated.id);
    setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
    logAction('تعديل بيانات مورد', 'supplier', updated.id, original, updated);
  };

  const handleVoidPurchase = (purchaseId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    setConfirmModal({
      isOpen: true,
      title: 'تأكيد إرجاع/إلغاء المشتريات',
      message: `هل أنت متأكد من إرجاع فاتورة المشتريات رقم ${purchase.purchaseNumber}؟ سيتم خصم الكميات من المخزون وتعديل رصيد المورد.`,
      confirmLabel: 'نعم، إرجاع المشتريات',
      onConfirm: () => {
        setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: 'voided' } : p));
        
        const voidOpId = `op-pur-void-${purchase.id}`;

        // Reverse Journal Entries for Return
        if (purchase.status === 'paid') {
          logJournalEntry('return', `مرتجع مشتريات نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'cash', purchase.id, `${voidOpId}-je-cash-debit`);
          logJournalEntry('return', `مرتجع مشتريات نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'inventory', purchase.id, `${voidOpId}-je-inventory-credit`);
        } else {
          logJournalEntry('return', `مرتجع مشتريات آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'payables', purchase.id, `${voidOpId}-je-payables-debit`);
          logJournalEntry('return', `مرتجع مشتريات آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'inventory', purchase.id, `${voidOpId}-je-inventory-credit`);
        }

        // Decrease stock for each item
        purchase.items.forEach(item => {
          updateProductStock(item.productId, -item.quantity, `op-stock-void-${purchase.id}-${item.productId}`);
        });

        // Update supplier balance if it was pending
        if (purchase.status === 'pending') {
          setSuppliers(prev => prev.map(s => {
            if (s.id === purchase.supplierId) {
              const transOpId = `op-st-${purchase.id}-return`;
              const alreadyExists = supplierTransactions.some(t => t.operationId === transOpId);
              if (alreadyExists) return s;

              const newBalance = Math.max(0, s.balance - purchase.total);
              logSupplierTransaction(s.id, 'return', purchase.total, purchase.id, `إرجاع مشتريات فاتورة رقم ${purchase.purchaseNumber}`, newBalance, transOpId);
              return { ...s, balance: newBalance };
            }
            return s;
          }));
        } else {
          const transOpId = `op-st-${purchase.id}-return-cash`;
          const alreadyExists = supplierTransactions.some(t => t.operationId === transOpId);
          if (!alreadyExists) {
            logSupplierTransaction(purchase.supplierId, 'return', purchase.total, purchase.id, `إرجاع مشتريات (نقدي) فاتورة رقم ${purchase.purchaseNumber}`, 0, transOpId);
          }
        }

        logAction('إرجاع مشتريات (Void)', 'supplier', purchase.supplierId, purchase, { ...purchase, status: 'voided' });
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف المورد',
      message: `هل أنت متأكد من حذف المورد "${supplier?.name || ''}" من النظام؟`,
      confirmLabel: 'نعم، حذف المورد',
      onConfirm: () => {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        logAction('حذف مورد من النظام', 'supplier', supplierId, supplier, null);
        setConfirmModal(null);
      }
    });
  };

  const handlePaySupplierDebt = (supplierId: string, amount: number) => {
    const paymentId = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const transOpId = `op-st-${paymentId}-payment`;

    let alreadyExists = false;
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        alreadyExists = supplierTransactions.some(t => t.operationId === transOpId);
        if (alreadyExists) return s;

        const newBalance = Math.max(0, s.balance - amount);
        logSupplierTransaction(s.id, 'payment', amount, paymentId, 'دفعة نقدية مسددة', newBalance, transOpId);
        
        // Log Journal Entry
        logJournalEntry('payment', `سداد دفعة للمورد: ${s.name}`, amount, 0, 'payables', paymentId, `${transOpId}-je-payables-debit`);
        logJournalEntry('payment', `سداد دفعة للمورد: ${s.name}`, 0, amount, 'cash', paymentId, `${transOpId}-je-cash-credit`);

        return { ...s, balance: newBalance };
      }
      return s;
    }));

    if (alreadyExists) return;

    // Deduct from shift if active
    if (activeShift) {
      setShifts(prev => prev.map(s => s.id === activeShift.id ? {
        ...s,
        totalExpenses: s.totalExpenses + amount, // Treating as cash outflow
        expectedCash: s.expectedCash - amount
      } : s));
    }
  };

  const handleAddCustomer = (customer: Customer) => {
    setCustomers(prev => [customer, ...prev]);
    logAction('إضافة عميل جديد', 'customer', customer.id, null, customer);
  };

  const handleUpdateCustomer = (updated: Customer) => {
    const original = customers.find(c => c.id === updated.id);
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    logAction('تعديل بيانات عميل', 'customer', updated.id, original, updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف العميل',
      message: `هل أنت متأكد من حذف العميل "${customer?.name || ''}" من النظام؟`,
      confirmLabel: 'نعم، حذف العميل',
      onConfirm: () => {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        logAction('حذف عميل من النظام', 'customer', customerId, customer, null);
        setConfirmModal(null);
      }
    });
  };

  const handlePayDebt = (customerId: string, amount: number) => {
    const paymentId = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const transOpId = `op-ct-${paymentId}-collection`;

    let alreadyExists = false;
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        alreadyExists = customerTransactions.some(t => t.operationId === transOpId);
        if (alreadyExists) return c;

        const newDebt = Math.max(0, c.currentDebt - amount);
        logCustomerTransaction(c.id, 'collection', amount, paymentId, 'تحصيل نقدي من العميل', newDebt, transOpId);
        
        // Log Journal Entry
        logJournalEntry('collection', `تحصيل من العميل: ${c.name}`, amount, 0, 'cash', paymentId, `${transOpId}-je-cash-debit`);
        logJournalEntry('collection', `تحصيل من العميل: ${c.name}`, 0, amount, 'receivables', paymentId, `${transOpId}-je-receivables-credit`);

        return { ...c, currentDebt: newDebt };
      }
      return c;
    }));

    if (alreadyExists) return;

    // Add to shift if active
    if (activeShift) {
      setShifts(prev => prev.map(s => s.id === activeShift.id ? {
        ...s,
        totalSales: s.totalSales + amount, // Treating as cash inflow
        expectedCash: s.expectedCash + amount
      } : s));
    }
  };

  const handleAddExpense = (expense: Expense) => {
    let expenseExists = false;
    setExpenses(prev => {
      expenseExists = prev.some(e => e.id === expense.id || (expense.operationId && e.operationId === expense.operationId));
      if (expenseExists) return prev;

      const expenseWithStatus = { ...expense, status: 'active' as const };
      return [expenseWithStatus, ...prev];
    });

    if (expenseExists) return;

    const expenseWithStatus = { ...expense, status: 'active' as const };
    logAction('إضافة مصروف جديد', 'expense', expense.id, null, expenseWithStatus);

    const expenseOpId = expense.operationId || `op-exp-${expense.id}`;

    // Log Journal Entry
    logJournalEntry('expense', `صرف مصروف: ${expense.title} (${expense.category})`, expense.amount, 0, 'expenses', expense.id, `${expenseOpId}-je-expenses-debit`);
    logJournalEntry('expense', `صرف مصروف: ${expense.title} (${expense.category})`, 0, expense.amount, 'cash', expense.id, `${expenseOpId}-je-cash-credit`);

    // Deduct from shift if active
    if (activeShift) {
      setShifts(prev => prev.map(s => s.id === activeShift.id ? {
        ...s,
        totalExpenses: s.totalExpenses + expense.amount,
        expectedCash: s.expectedCash - expense.amount
      } : s));
    }
  };

  const handleUpdateExpense = (updated: Expense) => {
    const original = expenses.find(e => e.id === updated.id);
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    logAction('تعديل بيانات مصروف', 'expense', updated.id, original, updated);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    setConfirmModal({
      isOpen: true,
      title: 'تأكيد إلغاء المصروف',
      message: `هل أنت متأكد من إلغاء (Void) المصروف "${expense.title}" بقيمة ج.م ${expense.amount}؟ سيتم تمييزه كملغي وإعادة تسوية القيد المحاسبي.`,
      confirmLabel: 'نعم، إلغاء المصروف',
      onConfirm: () => {
        const voidedExpense = { ...expense, status: 'voided' as const };
        
        let alreadyVoided = false;
        setExpenses(prev => prev.map(e => {
          if (e.id === expenseId) {
            if (e.status === 'voided') {
              alreadyVoided = true;
            }
            return voidedExpense;
          }
          return e;
        }));

        if (!alreadyVoided) {
          logAction('إلغاء مصروف (Void)', 'expense', expenseId, expense, voidedExpense);
          
          const voidOpId = `op-exp-void-${expense.id}`;

          // Reverse Journal Entry
          logJournalEntry('expense', `إلغاء مصروف: ${expense.title}`, expense.amount, 0, 'cash', expense.id, `${voidOpId}-je-cash-debit`);
          logJournalEntry('expense', `إلغاء مصروف: ${expense.title}`, 0, expense.amount, 'expenses', expense.id, `${voidOpId}-je-expenses-credit`);

          if (activeShift) {
             setShifts(prev => prev.map(s => s.id === activeShift.id ? {
               ...s,
               totalExpenses: s.totalExpenses - expense.amount,
               expectedCash: s.expectedCash + expense.amount
             } : s));
          }
        }
        setConfirmModal(null);
      }
    });
  };

  const handleSaveAuditSession = (session: StockAuditSession, applyToInventory: boolean) => {
    setAuditSessions(prev => [session, ...prev]);
    logAction('جلسة جرد جديد', 'inventory', session.id, null, { title: session.title, status: session.status, netCostImpact: session.netCostImpact });

    if (applyToInventory && session.netCostImpact !== 0) {
      const adjOpId = `op-audit-${session.id}`;
      if (session.netCostImpact < 0) {
        logJournalEntry('expense', `عجز جرد مخزني: ${session.title}`, Math.abs(session.netCostImpact), 0, 'expenses', session.id, `${adjOpId}-je-shortage-exp`);
        logJournalEntry('expense', `عجز جرد مخزني: ${session.title}`, 0, Math.abs(session.netCostImpact), 'inventory_asset', session.id, `${adjOpId}-je-shortage-inv`);
      } else {
        logJournalEntry('collection', `زيادة جرد مخزني: ${session.title}`, session.netCostImpact, 0, 'inventory_asset', session.id, `${adjOpId}-je-surplus-inv`);
        logJournalEntry('collection', `زيادة جرد مخزني: ${session.title}`, 0, session.netCostImpact, 'revenue', session.id, `${adjOpId}-je-surplus-rev`);
      }
    }
  };

  const handleUpdateProductsBatch = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    logAction('تحديث جماعي للمخزون (تسوية جرد)', 'inventory', 'batch-' + Date.now(), null, { count: updatedProducts.length });
  };

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  if (isFirebaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-800 font-sans" dir="rtl">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute text-emerald-600 font-bold text-xs">POS</div>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-slate-800">جاري مزامنة قاعدة البيانات السحابية...</h2>
        <p className="mt-2 text-sm text-slate-500">يرجى الانتظار بينما نقوم بتهيئة وتحديث البيانات السحابية (Firebase)</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} onAddUser={handleAddUser} />;
  }

  return (
    <div className="flex flex-col lg:flex-row-reverse h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans" dir="rtl">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lowStockCount={lowStockCount} 
        currentUser={currentUser}
        onLogout={handleLogout}
        permissionMatrix={permissionMatrix}
        settings={settings}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <main className="flex-1 overflow-y-auto h-full pb-24 lg:pb-12">
        {activeTab === 'requirements' && (
          <RequirementsView onStartUsing={() => setActiveTab('dashboard')} />
        )}
        {activeTab === 'dashboard' && hasPermission(currentUser, 'dashboard', 'view', permissionMatrix) && (
          <DashboardView 
            products={products}
            invoices={invoices}
            expenses={expenses}
            purchases={purchases}
            customers={customers}
            suppliers={suppliers}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'pos' && hasPermission(currentUser, 'pos', 'view', permissionMatrix) && (
          <PosView 
            products={products}
            customers={customers}
            onCompleteSale={handleCompleteSale}
            updateProductStock={updateProductStock}
            currentUser={currentUser}
            activeShift={activeShift}
            settings={settings}
          />
        )}
        {activeTab === 'accounting' && hasPermission(currentUser, 'accounting', 'view', permissionMatrix) && (
          <AccountingView entries={journalEntries} />
        )}
        {activeTab === 'inventory' && hasPermission(currentUser, 'inventory', 'view', permissionMatrix) && (
          <InventoryView 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            canCreate={hasPermission(currentUser, 'inventory', 'create', permissionMatrix)}
            canEdit={hasPermission(currentUser, 'inventory', 'edit', permissionMatrix)}
            canDelete={hasPermission(currentUser, 'inventory', 'delete', permissionMatrix)}
            canApprove={hasPermission(currentUser, 'inventory', 'approve', permissionMatrix)}
            onNavigate={(tab: any) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'purchases' && hasPermission(currentUser, 'purchases', 'view', permissionMatrix) && (
          <PurchasesView 
            purchases={purchases}
            suppliers={suppliers}
            products={products}
            onAddPurchase={handleAddPurchase}
            onVoidPurchase={handleVoidPurchase}
          />
        )}
        {activeTab === 'suppliers' && hasPermission(currentUser, 'suppliers', 'view', permissionMatrix) && (
          <SuppliersView 
            suppliers={suppliers}
            transactions={supplierTransactions}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onPaySupplierDebt={handlePaySupplierDebt}
          />
        )}
        {activeTab === 'customers' && hasPermission(currentUser, 'customers', 'view', permissionMatrix) && (
          <CustomersView 
            customers={customers}
            transactions={customerTransactions}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onPayDebt={handlePayDebt}
          />
        )}
        {activeTab === 'expenses' && hasPermission(currentUser, 'expenses', 'view', permissionMatrix) && (
          <ExpensesView 
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
        {activeTab === 'reports' && hasPermission(currentUser, 'reports', 'view', permissionMatrix) && (
          <ReportsView 
            products={products}
            invoices={invoices}
            expenses={expenses}
            purchases={purchases}
            customers={customers}
            suppliers={suppliers}
            journalEntries={journalEntries}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'users' && hasPermission(currentUser, 'users', 'view', permissionMatrix) && (
          <UsersView 
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            permissionMatrix={permissionMatrix}
            onUpdatePermissionMatrix={setPermissionMatrix}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'hr' && hasPermission(currentUser, 'hr', 'view', permissionMatrix) && (
          <HrView 
            employees={employees}
            setEmployees={setEmployees}
            attendance={attendance}
            setAttendance={setAttendance}
            payrolls={payrolls}
            setPayrolls={setPayrolls}
            advances={advances}
            setAdvances={setAdvances}
            setExpenses={setExpenses}
            setJournalEntries={setJournalEntries}
          />
        )}
        {activeTab === 'shifts' && hasPermission(currentUser, 'shifts', 'view', permissionMatrix) && (
          <ShiftsView 
            shifts={shifts}
            activeShift={activeShift}
            currentUser={currentUser}
            onOpenShift={handleOpenShift}
            onCloseShift={handleCloseShift}
            onWithdrawal={handleShiftWithdrawal}
          />
        )}
        {activeTab === 'audit_log' && hasPermission(currentUser, 'audit_log', 'view', permissionMatrix) && (
          <AuditLogView logs={auditLogs} />
        )}
        {activeTab === 'inventory_reports' && hasPermission(currentUser, 'inventory_reports', 'view', permissionMatrix) && (
          <InventoryReportsView 
            products={products}
            invoices={invoices}
            purchases={purchases}
          />
        )}
        {activeTab === 'stock_audit' && hasPermission(currentUser, 'stock_audit', 'view', permissionMatrix) && (
          <StockAuditView 
            products={products}
            auditSessions={auditSessions}
            currentUser={currentUser}
            onSaveAuditSession={handleSaveAuditSession}
            onUpdateProductsBatch={handleUpdateProductsBatch}
            currencySymbol={settings.currencySymbol}
            canApprove={hasPermission(currentUser, 'inventory', 'approve', permissionMatrix)}
          />
        )}
        {activeTab === 'settings' && hasPermission(currentUser, 'settings', 'view', permissionMatrix) && (
          <SettingsView
            settings={settings}
            onSaveSettings={setSettings}
            products={products}
            invoices={invoices}
            purchases={purchases}
            suppliers={suppliers}
            customers={customers}
            expenses={expenses}
            shifts={shifts}
            onImportData={handleImportData}
            onResetData={handleResetData}
            canEdit={hasPermission(currentUser, 'settings', 'edit', permissionMatrix)}
          />
        )}
      </main>

      {/* Universal Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        products={products}
        customers={customers}
        suppliers={suppliers}
      />

      {/* Universal Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
