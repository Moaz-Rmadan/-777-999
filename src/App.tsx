import React, { useState, useEffect } from 'react';
import { ActiveTab, Product, Invoice, Expense, PurchaseInvoice, Supplier, Customer, User, Shift, AuditLogEntry, SupplierTransaction, CustomerTransaction, JournalEntry, RolePermissionMatrix, SystemSettings, InventoryMovement, Employee, AttendanceRecord, PayrollRecord, AdvancePayment, StockAuditSession, Account } from './types';
import { 
  postSale, 
  postPurchase, 
  postSaleReturn, 
  postPurchaseReturn, 
  postPayment, 
  closeShift, 
  postExpense,
  transferStock,
  adjustStock,
  ensureVersionAndLocations,
  ProductWithVersion,
  StockTransfer,
  StockAdjustment
} from './core/modules/inventory';
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
  INITIAL_AUDIT_SESSIONS,
  INITIAL_ACCOUNTS
} from './mockData';
import { saveToFirebase, loadFromFirebase, auth, logoutFirebase, db } from './firebase';
import { OfflineEngine } from './core/services/offlineEngine';
import { OfflineSyncView } from './components/OfflineSyncView';
import { OfflineQueueItem } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ConfirmModal } from './components/ConfirmModal';
import { AppLoadingScreen } from './components/AppLoadingScreen';

// Lazy load views for optimized chunking and performance
const RequirementsView = React.lazy(() => import('./components/RequirementsView').then(m => ({ default: m.RequirementsView })));
const DashboardView = React.lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const PosView = React.lazy(() => import('./components/PosView').then(m => ({ default: m.PosView })));
const InventoryView = React.lazy(() => import('./components/InventoryView').then(m => ({ default: m.InventoryView })));
const PurchasesView = React.lazy(() => import('./components/PurchasesView').then(m => ({ default: m.PurchasesView })));
const SuppliersView = React.lazy(() => import('./components/SuppliersView').then(m => ({ default: m.SuppliersView })));
const CustomersView = React.lazy(() => import('./components/CustomersView').then(m => ({ default: m.CustomersView })));
const ExpensesView = React.lazy(() => import('./components/ExpensesView').then(m => ({ default: m.ExpensesView })));
const ReportsView = React.lazy(() => import('./components/ReportsView').then(m => ({ default: m.ReportsView })));
const UsersView = React.lazy(() => import('./components/UsersView').then(m => ({ default: m.UsersView })));
const ShiftsView = React.lazy(() => import('./components/ShiftsView').then(m => ({ default: m.ShiftsView })));
const AuditLogView = React.lazy(() => import('./components/AuditLogView'));
const InventoryReportsView = React.lazy(() => import('./components/InventoryReportsView'));
const StockAuditView = React.lazy(() => import('./components/StockAuditView').then(m => ({ default: m.StockAuditView })));
const AccountingView = React.lazy(() => import('./components/AccountingView').then(m => ({ default: m.AccountingView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));
const HrView = React.lazy(() => import('./components/HrView').then(m => ({ default: m.HrView })));
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  const [simulatedOffline, setSimulatedOffline] = useState(() => {
    return localStorage.getItem('sm_simulated_offline') === 'true';
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? (navigator.onLine && !simulatedOffline) : true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => {
    return OfflineEngine.loadQueue();
  });

  useEffect(() => {
    localStorage.setItem('sm_simulated_offline', String(simulatedOffline));
    setIsOnline(navigator.onLine && !simulatedOffline);
  }, [simulatedOffline]);

  useEffect(() => {
    const handleNetworkChange = () => {
      setIsOnline(navigator.onLine && !simulatedOffline);
    };
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [simulatedOffline]);

  useEffect(() => {
    OfflineEngine.saveQueue(offlineQueue);
  }, [offlineQueue]);

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
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_audit_sessions', auditSessions);
    }
  }, [auditSessions, isFirebaseLoading, currentUser, isOnline]);
  useEffect(() => {
    localStorage.setItem('sm_settings', JSON.stringify(settings));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_settings', settings);
    }
  }, [settings, isFirebaseLoading, currentUser, isOnline]);
  useEffect(() => {
    localStorage.setItem('sm_products', JSON.stringify(products));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_products', products);
    }
  }, [products, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_invoices', JSON.stringify(invoices));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_invoices', invoices);
    }
  }, [invoices, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_purchases', JSON.stringify(purchases));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_purchases', purchases);
    }
  }, [purchases, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_suppliers', JSON.stringify(suppliers));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_suppliers', suppliers);
    }
  }, [suppliers, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_customers', JSON.stringify(customers));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_customers', customers);
    }
  }, [customers, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_expenses', JSON.stringify(expenses));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_expenses', expenses);
    }
  }, [expenses, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_users', JSON.stringify(users));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_users', users);
    }
  }, [users, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('pos_permission_matrix', JSON.stringify(permissionMatrix));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('pos_permission_matrix', permissionMatrix);
    }
  }, [permissionMatrix, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_shifts', JSON.stringify(shifts));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_shifts', shifts);
    }
  }, [shifts, isFirebaseLoading, currentUser, isOnline]);

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

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('sm_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem('sm_accounts', JSON.stringify(accounts));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_accounts', accounts);
    }
  }, [accounts, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_journal_entries', JSON.stringify(journalEntries));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_journal_entries', journalEntries);
    }
  }, [journalEntries, isFirebaseLoading, currentUser, isOnline]);

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem('sm_inventory_movements');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sm_inventory_movements', JSON.stringify(inventoryMovements));
    if (!isFirebaseLoading && currentUser && isOnline) {
      saveToFirebase('sm_inventory_movements', inventoryMovements);
    }
  }, [inventoryMovements, isFirebaseLoading, currentUser, isOnline]);

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
    if (!isFirebaseLoading && currentUser && isOnline) saveToFirebase('sm_employees', employees);
  }, [employees, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_attendance', JSON.stringify(attendance));
    if (!isFirebaseLoading && currentUser && isOnline) saveToFirebase('sm_attendance', attendance);
  }, [attendance, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_payrolls', JSON.stringify(payrolls));
    if (!isFirebaseLoading && currentUser && isOnline) saveToFirebase('sm_payrolls', payrolls);
  }, [payrolls, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    localStorage.setItem('sm_advances', JSON.stringify(advances));
    if (!isFirebaseLoading && currentUser && isOnline) saveToFirebase('sm_advances', advances);
  }, [advances, isFirebaseLoading, currentUser, isOnline]);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;
    let activeListeners: (() => void)[] = [];

    const cleanupActiveListeners = () => {
      activeListeners.forEach(unsub => {
        try { unsub(); } catch (e) { console.error("Unsubscribe error:", e); }
      });
      activeListeners = [];
    };

    unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      cleanupActiveListeners();
      if (firebaseUser && firebaseUser.email) {
        setIsFirebaseLoading(true);
        try {
          // Parallelize Firestore queries for maximum throughput and low time-to-interactive (TTI)
          const keys = [
            'sm_users', 'sm_products', 'sm_invoices', 'sm_purchases',
            'sm_suppliers', 'sm_customers', 'sm_expenses', 'pos_permission_matrix',
            'sm_shifts', 'pos_audit_logs', 'pos_supplier_transactions',
            'pos_customer_transactions', 'sm_journal_entries', 'sm_accounts',
            'sm_inventory_movements', 'sm_employees', 'sm_attendance',
            'sm_payrolls', 'sm_advances', 'sm_settings'
          ];
          const results = await Promise.all(keys.map(key => loadFromFirebase(key)));
          const [
            u, p, i, pu,
            s, c, e, pm,
            sh, al, st,
            ct, je, acc,
            mov, emp, att,
            pay, adv, sett
          ] = results;

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
          if (acc !== null) setAccounts(acc); else { await saveToFirebase('sm_accounts', INITIAL_ACCOUNTS); }
          if (mov !== null) setInventoryMovements(prev => mergeUniqueById(prev, mov)); else { await saveToFirebase('sm_inventory_movements', []); }
          if (emp !== null) setEmployees(prev => mergeUniqueById(prev, emp)); else { await saveToFirebase('sm_employees', INITIAL_EMPLOYEES); }
          if (att !== null) setAttendance(prev => mergeUniqueById(prev, att)); else { await saveToFirebase('sm_attendance', INITIAL_ATTENDANCE); }
          if (pay !== null) setPayrolls(prev => mergeUniqueById(prev, pay)); else { await saveToFirebase('sm_payrolls', INITIAL_PAYROLLS); }
          if (adv !== null) setAdvances(prev => mergeUniqueById(prev, adv)); else { await saveToFirebase('sm_advances', INITIAL_ADVANCES); }
          if (sett !== null) setSettings(sett); else { await saveToFirebase('sm_settings', DEFAULT_SETTINGS); }

          // Subscribe to real-time updates for key, fast-changing documents
          activeListeners.push(
            onSnapshot(doc(db, 'system_data', 'sm_products'), (snap) => {
              if (snap.exists()) {
                const data = snap.data().data;
                if (data) setProducts(prev => mergeUniqueById(prev, data));
              }
            }, (err) => console.warn("Real-time listener for products failed:", err))
          );

          activeListeners.push(
            onSnapshot(doc(db, 'system_data', 'sm_invoices'), (snap) => {
              if (snap.exists()) {
                const data = snap.data().data;
                if (data) setInvoices(prev => mergeUniqueById(prev, data));
              }
            }, (err) => console.warn("Real-time listener for invoices failed:", err))
          );

          activeListeners.push(
            onSnapshot(doc(db, 'system_data', 'sm_journal_entries'), (snap) => {
              if (snap.exists()) {
                const data = snap.data().data;
                if (data) setJournalEntries(prev => mergeUniqueById(prev, data));
              }
            }, (err) => console.warn("Real-time listener for journal entries failed:", err))
          );

          const emailLower = firebaseUser.email.toLowerCase();
          const matched = currentUsersList.find((usr: any) => usr.email?.toLowerCase() === emailLower);
          if (matched) {
            setCurrentUser(matched);
          } else {
            // Try username matching the prefix
            const prefix = emailLower.split('@')[0];
            const matchedByUsername = currentUsersList.find((usr: any) => usr.username.toLowerCase() === prefix.toLowerCase());
            if (matchedByUsername) {
              const updatedUser = { ...matchedByUsername, email: firebaseUser.email, avatar: firebaseUser.photoURL || undefined };
              setCurrentUser(updatedUser);
              setUsers(prev => {
                const updatedList = prev.map(usr => usr.id === updatedUser.id ? updatedUser : usr);
                saveToFirebase('sm_users', updatedList);
                return updatedList;
              });
            } else if (emailLower === 'cfo.moaz@gmail.com') {
              const ownerUser: User = {
                id: 'u-owner',
                name: firebaseUser.displayName || 'المالك والمستشار المالي',
                username: 'owner',
                role: 'super_admin',
                email: firebaseUser.email,
                avatar: firebaseUser.photoURL || undefined
              };
              setCurrentUser(ownerUser);
              setUsers(prev => {
                const updatedList = [ownerUser, ...prev.filter(usr => usr.email?.toLowerCase() !== 'cfo.moaz@gmail.com')];
                saveToFirebase('sm_users', updatedList);
                return updatedList;
              });
            } else {
              setCurrentUser(null);
            }
          }
        } catch (err) {
          console.error("Error loading data from Firestore:", err);
        } finally {
          setIsFirebaseLoading(false);
        }
      } else {
        setCurrentUser(null);
        cleanupActiveListeners();
        setIsFirebaseLoading(false);
      }
    });

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      cleanupActiveListeners();
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
    if (!isFirebaseLoading && currentUser) {
      saveToFirebase('pos_audit_logs', auditLogs);
    }
  }, [auditLogs, isFirebaseLoading, currentUser]);

  useEffect(() => {
    localStorage.setItem('pos_supplier_transactions', JSON.stringify(supplierTransactions));
    if (!isFirebaseLoading && currentUser) {
      saveToFirebase('pos_supplier_transactions', supplierTransactions);
    }
  }, [supplierTransactions, isFirebaseLoading, currentUser]);

  useEffect(() => {
    localStorage.setItem('pos_customer_transactions', JSON.stringify(customerTransactions));
    if (!isFirebaseLoading && currentUser) {
      saveToFirebase('pos_customer_transactions', customerTransactions);
    }
  }, [customerTransactions, isFirebaseLoading, currentUser]);

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
    logAction('إضافة مستخدم جديد', 'user', user.id, null, user);
  };

  const handleUpdateUser = (updated: User) => {
    const original = users.find(u => u.id === updated.id);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    logAction('تعديل صلاحيات/بيانات مستخدم', 'user', updated.id, original, updated);
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
        logAction('حذف مستخدم من النظام', 'user', userId, user, null);
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

  const handleTransferStock = (transfer: Omit<StockTransfer, 'id' | 'date'>) => {
    try {
      const opId = OfflineEngine.generateOperationId('transfer');
      const transferWithOp = { ...transfer, operationId: opId };
      const { updatedProducts, newTransfer, newMovement } = transferStock(
        transferWithOp,
        products,
        currentUser?.name || 'مجهول'
      );
      setProducts(updatedProducts);
      setInventoryMovements(prev => [newMovement, ...prev]);
      logAction(`تحويل مخزني: ${transfer.quantity} ${newTransfer.productName}`, 'inventory', newTransfer.productId, null, newTransfer);

      setOfflineQueue(prev => [...prev, OfflineEngine.enqueue('transfer', `تحويل صنف: ${newTransfer.productName}`, { ...newTransfer, operationId: opId }, isOnline, products)]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdjustStock = (adjustment: Omit<StockAdjustment, 'id' | 'date'>) => {
    try {
      const opId = OfflineEngine.generateOperationId('adjustment');
      const adjustmentWithOp = { ...adjustment, operationId: opId };
      const { updatedProducts, updatedJournalEntries, newAdjustment, newMovement } = adjustStock(
        adjustmentWithOp,
        products,
        journalEntries,
        currentUser?.name || 'مجهول'
      );
      setProducts(updatedProducts);
      setJournalEntries(updatedJournalEntries);
      setInventoryMovements(prev => [newMovement, ...prev]);
      logAction(`تسوية مخزنية: ${adjustment.type === 'increase' ? '+' : '-'}${adjustment.quantity} ${newAdjustment.productName}`, 'inventory', newAdjustment.productId, null, newAdjustment);

      setOfflineQueue(prev => [...prev, OfflineEngine.enqueue('adjustment', `تسوية صنف: ${newAdjustment.productName}`, { ...newAdjustment, operationId: opId }, isOnline, products)]);
    } catch (err: any) {
      alert(err.message);
    }
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
    const opId = invoice.operationId || OfflineEngine.generateOperationId('sale');
    const invoiceWithOp = { ...invoice, operationId: opId };

    let invoiceExists = false;
    setInvoices(prev => {
      invoiceExists = prev.some(inv => inv.id === invoiceWithOp.id || (invoiceWithOp.operationId && inv.operationId === invoiceWithOp.operationId));
      if (invoiceExists) return prev;
      return [invoiceWithOp, ...prev];
    });

    if (invoiceExists) {
      console.log(`Invoice ${invoiceWithOp.id} already exists. Skipping ledger logging to prevent duplicates.`);
      return;
    }

    logAction('إتمام عملية بيع (فاتورة)', 'invoice', invoiceWithOp.id, null, invoiceWithOp);
    
    // Calculate total cost for COGS
    const totalCost = invoiceWithOp.items.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);

    // 1. Log Sales Entry
    if (invoiceWithOp.paymentMethod === 'cash') {
      logJournalEntry('sale', `مبيعات نقدية - فاتورة ${invoiceWithOp.invoiceNumber}`, invoiceWithOp.total, 0, 'cash', invoiceWithOp.id, `${opId}-je-cash-debit`);
      logJournalEntry('sale', `مبيعات نقدية - فاتورة ${invoiceWithOp.invoiceNumber}`, 0, invoiceWithOp.total, 'sales', invoiceWithOp.id, `${opId}-je-sales-credit`);
    } else if (invoiceWithOp.paymentMethod === 'card') {
      logJournalEntry('sale', `مبيعات فيزا - فاتورة ${invoiceWithOp.invoiceNumber}`, invoiceWithOp.total, 0, 'bank', invoiceWithOp.id, `${opId}-je-bank-debit`);
      logJournalEntry('sale', `مبيعات فيزا - فاتورة ${invoiceWithOp.invoiceNumber}`, 0, invoiceWithOp.total, 'sales', invoiceWithOp.id, `${opId}-je-sales-credit`);
    } else {
      logJournalEntry('sale', `مبيعات آجلة - عميل: ${invoiceWithOp.customerName} - فاتورة ${invoiceWithOp.invoiceNumber}`, invoiceWithOp.total, 0, 'receivables', invoiceWithOp.id, `${opId}-je-receivables-debit`);
      logJournalEntry('sale', `مبيعات آجلة - عميل: ${invoiceWithOp.customerName} - فاتورة ${invoiceWithOp.invoiceNumber}`, 0, invoiceWithOp.total, 'sales', invoiceWithOp.id, `${opId}-je-sales-credit`);
    }

    // 2. Log COGS and Inventory Entry
    logJournalEntry('sale', `تكلفة مبيعات - فاتورة ${invoiceWithOp.invoiceNumber}`, totalCost, 0, 'expenses', invoiceWithOp.id, `${opId}-je-cogs-debit`);
    logJournalEntry('sale', `تكلفة مبيعات - فاتورة ${invoiceWithOp.invoiceNumber}`, 0, totalCost, 'inventory', invoiceWithOp.id, `${opId}-je-inventory-credit`);

    // Update shift if active
    if (activeShift) {
      setShifts(prev => prev.map(s => s.id === activeShift.id ? {
        ...s,
        totalSales: s.totalSales + invoiceWithOp.total,
        expectedCash: s.expectedCash + (invoiceWithOp.paymentMethod === 'cash' ? invoiceWithOp.total : 0)
      } : s));
    }

    // If credit sale, update customer debt
    if (invoiceWithOp.paymentMethod === 'credit' && invoiceWithOp.customerName) {
      setCustomers(prev => prev.map(c => {
        if (c.name === invoiceWithOp.customerName) {
          const transOpId = `op-ct-${invoiceWithOp.id}-sale`;
          const alreadyExists = customerTransactions.some(t => t.operationId === transOpId);
          if (alreadyExists) return c;

          const newDebt = c.currentDebt + invoiceWithOp.total;
          logCustomerTransaction(c.id, 'sale', invoiceWithOp.total, invoiceWithOp.id, `بيع آجل فاتورة رقم ${invoiceWithOp.invoiceNumber}`, newDebt, transOpId);
          return { ...c, currentDebt: newDebt };
        }
        return c;
      }));
    }

    // Enqueue in Offline Queue!
    setOfflineQueue(prev => [...prev, OfflineEngine.enqueue('sale', `فاتورة بيع رقم ${invoiceWithOp.invoiceNumber}`, invoiceWithOp, isOnline, products)]);
  };

  const handleAddPurchase = (purchase: PurchaseInvoice) => {
    const opId = purchase.operationId || OfflineEngine.generateOperationId('purchase');
    const purchaseWithOp = { ...purchase, operationId: opId };

    let purchaseExists = false;
    setPurchases(prev => {
      purchaseExists = prev.some(p => p.id === purchaseWithOp.id || (purchaseWithOp.operationId && p.operationId === purchaseWithOp.operationId));
      if (purchaseExists) return prev;
      return [purchaseWithOp, ...prev];
    });

    if (purchaseExists) {
      console.log(`Purchase ${purchaseWithOp.id} already exists. Skipping ledger logging.`);
      return;
    }

    const purchaseOpId = purchaseWithOp.operationId || `op-pur-${purchaseWithOp.id}`;
    
    // Log Journal Entries for Purchase
    if (purchaseWithOp.status === 'paid') {
      logJournalEntry('purchase', `شراء نقدي - مورد: ${purchaseWithOp.supplierName} - فاتورة ${purchaseWithOp.purchaseNumber}`, purchaseWithOp.total, 0, 'inventory', purchaseWithOp.id, `${purchaseOpId}-je-inventory-debit`);
      logJournalEntry('purchase', `شراء نقدي - مورد: ${purchaseWithOp.supplierName} - فاتورة ${purchaseWithOp.purchaseNumber}`, 0, purchaseWithOp.total, 'cash', purchaseWithOp.id, `${purchaseOpId}-je-cash-credit`);
    } else {
      logJournalEntry('purchase', `شراء آجل - مورد: ${purchaseWithOp.supplierName} - فاتورة ${purchaseWithOp.purchaseNumber}`, purchaseWithOp.total, 0, 'inventory', purchaseWithOp.id, `${purchaseOpId}-je-inventory-debit`);
      logJournalEntry('purchase', `شراء آجل - مورد: ${purchaseWithOp.supplierName} - فاتورة ${purchaseWithOp.purchaseNumber}`, 0, purchaseWithOp.total, 'payables', purchaseWithOp.id, `${purchaseOpId}-je-payables-credit`);
    }

    // Increase stock for each item in purchase
    purchaseWithOp.items.forEach(item => {
      updateProductStock(item.productId, item.quantity, `op-stock-${purchaseWithOp.id}-${item.productId}`);
    });

    // Update supplier balance if pending
    if (purchaseWithOp.status === 'pending') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === purchaseWithOp.supplierId) {
          const transOpId = `op-st-${purchaseWithOp.id}-purchase`;
          const alreadyExists = supplierTransactions.some(t => t.operationId === transOpId);
          if (alreadyExists) return s;

          const newBalance = s.balance + purchaseWithOp.total;
          logSupplierTransaction(s.id, 'purchase', purchaseWithOp.total, purchaseWithOp.id, `شراء فاتورة رقم ${purchaseWithOp.purchaseNumber}`, newBalance, transOpId);
          return { ...s, balance: newBalance };
        }
        return s;
      }));
    } else {
      const transOpId = `op-st-${purchaseWithOp.id}-purchase-cash`;
      const alreadyExists = supplierTransactions.some(t => t.operationId === transOpId);
      if (!alreadyExists) {
        logSupplierTransaction(purchaseWithOp.supplierId, 'purchase', purchaseWithOp.total, purchaseWithOp.id, `شراء نقدي فاتورة رقم ${purchaseWithOp.purchaseNumber}`, 0, transOpId);
      }
    }

    // Enqueue in Offline Queue!
    setOfflineQueue(prev => [...prev, OfflineEngine.enqueue('purchase', `فاتورة شراء رقم ${purchaseWithOp.purchaseNumber}`, purchaseWithOp, isOnline, products)]);
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
    let supplierName = '';
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        supplierName = s.name;
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

    // Enqueue in Offline Queue!
    setOfflineQueue(prev => [...prev, OfflineEngine.enqueue('payment_supplier', `سداد دفعة للمورد: ${supplierName}`, { supplierId, amount, operationId: transOpId }, isOnline)]);
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
    let customerName = '';
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        customerName = c.name;
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

    // Enqueue in Offline Queue!
    setOfflineQueue(prev => [...prev, OfflineEngine.enqueue('payment_customer', `تحصيل دفعة من العميل: ${customerName}`, { customerId, amount, operationId: transOpId }, isOnline)]);
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

    // Enqueue in Offline Queue!
    setOfflineQueue(prev => [...prev, OfflineEngine.enqueue('expense', `قيد مصروف: ${expense.title}`, { ...expense, operationId: expenseOpId }, isOnline)]);
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

  const rollbackTransaction = (item: OfflineQueueItem) => {
    const payload = item.payload;
    const opId = item.id;

    if (item.type === 'sale') {
      setInvoices(prev => prev.filter(inv => inv.operationId !== opId && inv.id !== payload.id));
      if (payload.items) {
        payload.items.forEach((saleItem: any) => {
          setProducts(prev => prev.map(p => p.id === saleItem.productId ? {
            ...p,
            stock: p.stock + saleItem.quantity,
            stockLocations: p.stockLocations ? {
              ...p.stockLocations,
              main: (p.stockLocations.main || 0) + saleItem.quantity
            } : undefined
          } : p));
        });
      }
      setJournalEntries(prev => prev.filter(je => !je.operationId?.startsWith(opId)));
      if (activeShift) {
        setShifts(prev => prev.map(s => s.id === activeShift.id ? {
          ...s,
          totalSales: Math.max(0, s.totalSales - (payload.total || 0)),
          expectedCash: Math.max(0, s.expectedCash - (payload.paymentMethod === 'cash' ? (payload.total || 0) : 0))
        } : s));
      }
      if (payload.paymentMethod === 'credit' && payload.customerName) {
        setCustomers(prev => prev.map(c => {
          if (c.name === payload.customerName) {
            const transOpId = `op-ct-${payload.id}-sale`;
            setCustomerTransactions(prevTx => prevTx.filter(tx => tx.operationId !== transOpId));
            return {
              ...c,
              currentDebt: Math.max(0, c.currentDebt - (payload.total || 0))
            };
          }
          return c;
        }));
      }
    }

    else if (item.type === 'purchase') {
      setPurchases(prev => prev.filter(p => p.operationId !== opId && p.id !== payload.id));
      if (payload.items) {
        payload.items.forEach((purItem: any) => {
          setProducts(prev => prev.map(p => p.id === purItem.productId ? {
            ...p,
            stock: Math.max(0, p.stock - purItem.quantity),
            stockLocations: p.stockLocations ? {
              ...p.stockLocations,
              main: Math.max(0, (p.stockLocations.main || 0) - purItem.quantity)
            } : undefined
          } : p));
        });
      }
      setJournalEntries(prev => prev.filter(je => !je.operationId?.startsWith(opId)));
      if (payload.status === 'pending') {
        setSuppliers(prev => prev.map(s => {
          if (s.id === payload.supplierId) {
            const transOpId = `op-st-${payload.id}-purchase`;
            setSupplierTransactions(prevTx => prevTx.filter(tx => tx.operationId !== transOpId));
            return {
              ...s,
              balance: Math.max(0, s.balance - (payload.total || 0))
            };
          }
          return s;
        }));
      } else {
        const transOpId = `op-st-${payload.id}-purchase-cash`;
        setSupplierTransactions(prevTx => prevTx.filter(tx => tx.operationId !== transOpId));
      }
    }

    else if (item.type === 'transfer') {
      setProducts(prev => prev.map(p => {
        if (p.id === payload.productId) {
          const copy = { ...p } as any;
          if (copy.stockLocations) {
            copy.stockLocations[payload.fromLocation] = (copy.stockLocations[payload.fromLocation] || 0) + payload.quantity;
            copy.stockLocations[payload.toLocation] = Math.max(0, (copy.stockLocations[payload.toLocation] || 0) - payload.quantity);
          }
          return copy;
        }
        return p;
      }));
      setInventoryMovements(prev => prev.filter(m => m.operationId !== `op-trsf-${payload.id}`));
    }

    else if (item.type === 'adjustment') {
      setProducts(prev => prev.map(p => {
        if (p.id === payload.productId) {
          const copy = { ...p } as any;
          const netChange = payload.quantity * (payload.type === 'increase' ? -1 : 1);
          copy.stock = Math.max(0, copy.stock + netChange);
          if (copy.stockLocations) {
            copy.stockLocations.main = Math.max(0, copy.stockLocations.main + netChange);
          }
          return copy;
        }
        return p;
      }));
      setJournalEntries(prev => prev.filter(je => !je.operationId?.startsWith(`op-adj-${payload.id}`)));
      setInventoryMovements(prev => prev.filter(m => m.operationId !== `op-adj-${payload.id}`));
    }

    else if (item.type === 'payment_supplier') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === payload.supplierId) {
          const transOpId = payload.operationId;
          setSupplierTransactions(prevTx => prevTx.filter(tx => tx.operationId !== transOpId));
          return {
            ...s,
            balance: s.balance + payload.amount
          };
        }
        return s;
      }));
      setJournalEntries(prev => prev.filter(je => !je.operationId?.startsWith(payload.operationId)));
      if (activeShift) {
        setShifts(prev => prev.map(s => s.id === activeShift.id ? {
          ...s,
          expectedCash: s.expectedCash + payload.amount
        } : s));
      }
    }

    else if (item.type === 'payment_customer') {
      setCustomers(prev => prev.map(c => {
        if (c.id === payload.customerId) {
          const transOpId = payload.operationId;
          setCustomerTransactions(prevTx => prevTx.filter(tx => tx.operationId !== transOpId));
          return {
            ...c,
            currentDebt: c.currentDebt + payload.amount
          };
        }
        return c;
      }));
      setJournalEntries(prev => prev.filter(je => !je.operationId?.startsWith(payload.operationId)));
      if (activeShift) {
        setShifts(prev => prev.map(s => s.id === activeShift.id ? {
          ...s,
          expectedCash: Math.max(0, s.expectedCash - payload.amount)
        } : s));
      }
    }

    else if (item.type === 'expense') {
      setExpenses(prev => prev.filter(e => e.operationId !== opId && e.id !== payload.id));
      setJournalEntries(prev => prev.filter(je => !je.operationId?.startsWith(opId)));
      if (activeShift) {
        setShifts(prev => prev.map(s => s.id === activeShift.id ? {
          ...s,
          totalExpenses: Math.max(0, s.totalExpenses - payload.amount),
          expectedCash: s.expectedCash + payload.amount
        } : s));
      }
    }
  };

  const handleSyncAll = async () => {
    const pendingItems = offlineQueue.filter(item => item.status === 'pending' || item.status === 'failed');
    if (pendingItems.length === 0) return;

    await new Promise(resolve => setTimeout(resolve, 1500));

    let updatedQueue = [...offlineQueue];
    let hasConflict = false;

    for (const item of pendingItems) {
      try {
        if (item.expectedVersions) {
          for (const [prodId, expectedVer] of Object.entries(item.expectedVersions)) {
            const currentProd = products.find(p => p.id === prodId);
            if (currentProd) {
              const actualVer = (currentProd as any).version || 1;
              if (actualVer !== expectedVer) {
                throw new Error(`OCC_CONFLICT: ${currentProd.name}`);
              }
            }
          }
        }

        updatedQueue = updatedQueue.map(q => q.id === item.id ? { ...q, status: 'synced', error: undefined } : q);
      } catch (err: any) {
        if (err.message?.startsWith('OCC_CONFLICT')) {
          hasConflict = true;
          updatedQueue = updatedQueue.map(q => q.id === item.id ? { ...q, status: 'conflict', error: err.message } : q);
        } else {
          updatedQueue = updatedQueue.map(q => q.id === item.id ? { ...q, status: 'failed', error: err.message || 'خطأ مجهول أثناء المزامنة' } : q);
        }
      }
    }

    setOfflineQueue(updatedQueue);

    if (hasConflict) {
      alert('تم العثور على تعارضات في طوابير المزامنة المتفائلة! يرجى مراجعة نافذة إدارة المزامنة.');
    } else {
      alert('تم مزامنة جميع العمليات بنجاح مع الخادم ومطابقة قيود دفتر اليومية!');
    }
  };

  const handleRetryQueueItem = async (item: OfflineQueueItem) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      if (item.expectedVersions) {
        for (const [prodId, expectedVer] of Object.entries(item.expectedVersions)) {
          const currentProd = products.find(p => p.id === prodId);
          if (currentProd) {
            const actualVer = (currentProd as any).version || 1;
            if (actualVer !== expectedVer) {
              throw new Error(`OCC_CONFLICT: ${currentProd.name}`);
            }
          }
        }
      }

      setOfflineQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'synced', error: undefined } : q));
    } catch (err: any) {
      if (err.message?.startsWith('OCC_CONFLICT')) {
        setOfflineQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'conflict', error: err.message } : q));
        alert('تعذر ترحيل العملية بسبب تعارض الإصدارات (OCC).');
      } else {
        setOfflineQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'failed', error: err.message || 'فشلت المزامنة' } : q));
      }
    }
  };

  const handleResolveConflict = (item: OfflineQueueItem, resolution: 'overwrite' | 'keep_server' | 'cancel') => {
    if (resolution === 'overwrite') {
      setOfflineQueue(prev => prev.map(q => {
        if (q.id === item.id) {
          return {
            ...q,
            status: 'synced',
            expectedVersions: undefined,
            error: undefined
          };
        }
        return q;
      }));
      alert('تم فرض تعديلك وبثه وتحديث إصدار الصنف بالسيرفر بنجاح.');
    } else if (resolution === 'keep_server') {
      rollbackTransaction(item);
      setOfflineQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'synced', error: 'تراجع واعتماد نسخة الخادم' } : q));
      alert('تم إلغاء التعديل المحلي واعتماد نسخة الخادم مع ضبط الأرصدة وقيود اليومية المتأثرة.');
    } else if (resolution === 'cancel') {
      rollbackTransaction(item);
      setOfflineQueue(prev => prev.filter(q => q.id !== item.id));
      alert('تم التراجع عن المعاملة وحذفها من طابور المزامنة كلياً.');
    }
  };

  const handleSimulateConflict = (productId: string) => {
    setProducts(prev => OfflineEngine.simulateServerConflict(productId, prev));
  };

  const handleClearQueue = () => {
    setOfflineQueue([]);
    OfflineEngine.saveQueue([]);
  };

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  if (isFirebaseLoading) {
    return <AppLoadingScreen />;
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
        <React.Suspense fallback={<AppLoadingScreen />}>
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
            onOpenShift={handleOpenShift}
          />
        )}
        {activeTab === 'accounting' && hasPermission(currentUser, 'accounting', 'view', permissionMatrix) && (
          <AccountingView 
            entries={journalEntries}
            accounts={accounts}
            setAccounts={setAccounts}
            setJournalEntries={setJournalEntries}
            logJournalEntry={logJournalEntry}
            customers={customers}
            setCustomers={setCustomers}
            logCustomerTransaction={logCustomerTransaction}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            logSupplierTransaction={logSupplierTransaction}
            invoices={invoices}
            purchases={purchases}
            products={products}
            currentUser={currentUser}
            logAction={logAction}
          />
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
            journalEntries={journalEntries}
            inventoryMovements={inventoryMovements}
            onTransferStock={handleTransferStock}
            onAdjustStock={handleAdjustStock}
            invoices={invoices}
            purchases={purchases}
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
        {activeTab === 'offline_sync' && hasPermission(currentUser, 'offline_sync', 'view', permissionMatrix) && (
          <OfflineSyncView
            queue={offlineQueue}
            isOnline={isOnline}
            simulatedOffline={simulatedOffline}
            setSimulatedOffline={setSimulatedOffline}
            onRetry={handleRetryQueueItem}
            onResolveConflict={handleResolveConflict}
            onClearQueue={handleClearQueue}
            onSyncAll={handleSyncAll}
            products={products}
            onSimulateConflict={handleSimulateConflict}
            currencySymbol={settings.currencySymbol}
          />
        )}
        </React.Suspense>
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
