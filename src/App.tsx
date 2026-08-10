import React, { useState, useEffect } from 'react';
import { ActiveTab, Product, Invoice, Expense, PurchaseInvoice, Supplier, Customer, User, Shift, AuditLogEntry, SupplierTransaction, CustomerTransaction, JournalEntry, RolePermissionMatrix, SystemSettings } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_EXPENSES, 
  INITIAL_INVOICES, 
  INITIAL_PURCHASES,
  INITIAL_USERS,
  DEFAULT_SETTINGS
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
import { AccountingView } from './components/AccountingView';
import { SettingsView } from './components/SettingsView';
import { DEFAULT_ROLE_PERMISSIONS, hasPermission } from './permissions';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

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

  // Save to localStorage & Firebase
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
        const sett = await loadFromFirebase('sm_settings');

        let currentUsersList = u || INITIAL_USERS;

        if (u !== null) setUsers(u); else { await saveToFirebase('sm_users', INITIAL_USERS); }
        if (p !== null) setProducts(p); else { await saveToFirebase('sm_products', INITIAL_PRODUCTS); }
        if (i !== null) setInvoices(i); else { await saveToFirebase('sm_invoices', INITIAL_INVOICES); }
        if (pu !== null) setPurchases(pu); else { await saveToFirebase('sm_purchases', INITIAL_PURCHASES); }
        if (s !== null) setSuppliers(s); else { await saveToFirebase('sm_suppliers', INITIAL_SUPPLIERS); }
        if (c !== null) setCustomers(c); else { await saveToFirebase('sm_customers', INITIAL_CUSTOMERS); }
        if (e !== null) setExpenses(e); else { await saveToFirebase('sm_expenses', INITIAL_EXPENSES); }
        if (pm !== null) setPermissionMatrix(pm); else { await saveToFirebase('pos_permission_matrix', DEFAULT_ROLE_PERMISSIONS); }
        if (sh !== null) setShifts(sh); else { await saveToFirebase('sm_shifts', []); }
        if (al !== null) setAuditLogs(al); else { await saveToFirebase('pos_audit_logs', []); }
        if (st !== null) setSupplierTransactions(st); else { await saveToFirebase('pos_supplier_transactions', []); }
        if (ct !== null) setCustomerTransactions(ct); else { await saveToFirebase('pos_customer_transactions', []); }
        if (je !== null) setJournalEntries(je); else { await saveToFirebase('sm_journal_entries', []); }
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
    referenceId: string
  ) => {
    const entry: JournalEntry = {
      id: 'je-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: new Date().toISOString(),
      type,
      description,
      debit,
      credit,
      account,
      referenceId
    };
    setJournalEntries(prev => [entry, ...prev]);
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
    newBalance: number
  ) => {
    const transaction: CustomerTransaction = {
      id: 'ct-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      customerId,
      type,
      amount,
      date: new Date().toISOString(),
      referenceId,
      description,
      balanceAfter: newBalance
    };
    setCustomerTransactions(prev => [transaction, ...prev]);
  };

  const logSupplierTransaction = (
    supplierId: string,
    type: SupplierTransaction['type'],
    amount: number,
    referenceId: string,
    description: string,
    newBalance: number
  ) => {
    const transaction: SupplierTransaction = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      supplierId,
      type,
      amount,
      date: new Date().toISOString(),
      referenceId,
      description,
      balanceAfter: newBalance
    };
    setSupplierTransactions(prev => [transaction, ...prev]);
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
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      logAction('حذف مستخدم من النظام', 'user', userId, { ...user, password: '***' }, null);
    }
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
    if (confirm('هل أنت متأكد من حذف هذا الصنف من المخزون؟')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      logAction('حذف صنف من المخزون', 'product', productId, product, null);
    }
  };

  const updateProductStock = (productId: string, qtyChange: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, p.stock + qtyChange) };
      }
      return p;
    }));
  };

  const handleCompleteSale = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    logAction('إتمام عملية بيع (فاتورة)', 'invoice', invoice.id, null, invoice);
    
    // Calculate total cost for COGS
    const totalCost = invoice.items.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);

    // 1. Log Sales Entry
    if (invoice.paymentMethod === 'cash') {
      logJournalEntry('sale', `مبيعات نقدية - فاتورة ${invoice.invoiceNumber}`, invoice.total, 0, 'cash', invoice.id);
      logJournalEntry('sale', `مبيعات نقدية - فاتورة ${invoice.invoiceNumber}`, 0, invoice.total, 'sales', invoice.id);
    } else if (invoice.paymentMethod === 'card') {
      logJournalEntry('sale', `مبيعات فيزا - فاتورة ${invoice.invoiceNumber}`, invoice.total, 0, 'bank', invoice.id);
      logJournalEntry('sale', `مبيعات فيزا - فاتورة ${invoice.invoiceNumber}`, 0, invoice.total, 'sales', invoice.id);
    } else {
      logJournalEntry('sale', `مبيعات آجلة - عميل: ${invoice.customerName} - فاتورة ${invoice.invoiceNumber}`, invoice.total, 0, 'receivables', invoice.id);
      logJournalEntry('sale', `مبيعات آجلة - عميل: ${invoice.customerName} - فاتورة ${invoice.invoiceNumber}`, 0, invoice.total, 'sales', invoice.id);
    }

    // 2. Log COGS and Inventory Entry
    logJournalEntry('sale', `تكلفة مبيعات - فاتورة ${invoice.invoiceNumber}`, totalCost, 0, 'expenses', invoice.id);
    logJournalEntry('sale', `تكلفة مبيعات - فاتورة ${invoice.invoiceNumber}`, 0, totalCost, 'inventory', invoice.id);

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
          const newDebt = c.currentDebt + invoice.total;
          logCustomerTransaction(c.id, 'sale', invoice.total, invoice.id, `بيع آجل فاتورة رقم ${invoice.invoiceNumber}`, newDebt);
          return { ...c, currentDebt: newDebt };
        }
        return c;
      }));
    }
  };

  const handleAddPurchase = (purchase: PurchaseInvoice) => {
    setPurchases(prev => [purchase, ...prev]);
    
    // Log Journal Entries for Purchase
    if (purchase.status === 'paid') {
      logJournalEntry('purchase', `شراء نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'inventory', purchase.id);
      logJournalEntry('purchase', `شراء نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'cash', purchase.id);
    } else {
      logJournalEntry('purchase', `شراء آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'inventory', purchase.id);
      logJournalEntry('purchase', `شراء آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'payables', purchase.id);
    }

    // Increase stock for each item in purchase
    purchase.items.forEach(item => {
      updateProductStock(item.productId, item.quantity);
    });

    // Update supplier balance if pending
    if (purchase.status === 'pending') {
      setSuppliers(prev => prev.map(s => {
        if (s.id === purchase.supplierId) {
          const newBalance = s.balance + purchase.total;
          logSupplierTransaction(s.id, 'purchase', purchase.total, purchase.id, `شراء فاتورة رقم ${purchase.purchaseNumber}`, newBalance);
          return { ...s, balance: newBalance };
        }
        return s;
      }));
    } else {
      // Even if paid, we might want to log it as a transaction with 0 impact on balance or two entries?
      // Usually, paid means it went out of cash immediately.
      // Let's log it for history anyway.
      logSupplierTransaction(purchase.supplierId, 'purchase', purchase.total, purchase.id, `شراء نقدي فاتورة رقم ${purchase.purchaseNumber}`, 0);
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

    if (confirm('هل أنت متأكد من إرجاع هذه المشتريات؟ سيتم خصم الكميات من المخزون وتعديل رصيد المورد.')) {
      setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: 'voided' } : p));
      
      // Reverse Journal Entries for Return
      if (purchase.status === 'paid') {
        logJournalEntry('return', `مرتجع مشتريات نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'cash', purchase.id);
        logJournalEntry('return', `مرتجع مشتريات نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'inventory', purchase.id);
      } else {
        logJournalEntry('return', `مرتجع مشتريات آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, purchase.total, 0, 'payables', purchase.id);
        logJournalEntry('return', `مرتجع مشتريات آجل - مورد: ${purchase.supplierName} - فاتورة ${purchase.purchaseNumber}`, 0, purchase.total, 'inventory', purchase.id);
      }

      // Decrease stock for each item
      purchase.items.forEach(item => {
        updateProductStock(item.productId, -item.quantity);
      });

      // Update supplier balance if it was pending
      if (purchase.status === 'pending') {
        setSuppliers(prev => prev.map(s => {
          if (s.id === purchase.supplierId) {
            const newBalance = Math.max(0, s.balance - purchase.total);
            logSupplierTransaction(s.id, 'return', purchase.total, purchase.id, `إرجاع مشتريات فاتورة رقم ${purchase.purchaseNumber}`, newBalance);
            return { ...s, balance: newBalance };
          }
          return s;
        }));
      } else {
        logSupplierTransaction(purchase.supplierId, 'return', purchase.total, purchase.id, `إرجاع مشتريات (نقدي) فاتورة رقم ${purchase.purchaseNumber}`, 0);
      }

      logAction('إرجاع مشتريات (Void)', 'supplier', purchase.supplierId, purchase, { ...purchase, status: 'voided' });
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      logAction('حذف مورد من النظام', 'supplier', supplierId, supplier, null);
    }
  };

  const handlePaySupplierDebt = (supplierId: string, amount: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const newBalance = Math.max(0, s.balance - amount);
        logSupplierTransaction(s.id, 'payment', amount, 'pay-' + Date.now(), 'دفعة نقدية مسددة', newBalance);
        
        // Log Journal Entry
        logJournalEntry('payment', `سداد دفعة للمورد: ${s.name}`, amount, 0, 'payables', s.id);
        logJournalEntry('payment', `سداد دفعة للمورد: ${s.name}`, 0, amount, 'cash', s.id);

        return { ...s, balance: newBalance };
      }
      return s;
    }));
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
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      logAction('حذف عميل من النظام', 'customer', customerId, customer, null);
    }
  };

  const handlePayDebt = (customerId: string, amount: number) => {
    const customer = customers.find(c => c.id === customerId);
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const newDebt = Math.max(0, c.currentDebt - amount);
        logCustomerTransaction(c.id, 'collection', amount, 'pay-' + Date.now(), 'تحصيل نقدي من العميل', newDebt);
        
        // Log Journal Entry
        logJournalEntry('collection', `تحصيل من العميل: ${c.name}`, amount, 0, 'cash', c.id);
        logJournalEntry('collection', `تحصيل من العميل: ${c.name}`, 0, amount, 'receivables', c.id);

        return { ...c, currentDebt: newDebt };
      }
      return c;
    }));
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
    const expenseWithStatus = { ...expense, status: 'active' as const };
    setExpenses(prev => [expenseWithStatus, ...prev]);
    logAction('إضافة مصروف جديد', 'expense', expense.id, null, expenseWithStatus);

    // Log Journal Entry
    logJournalEntry('expense', `صرف مصروف: ${expense.title} (${expense.category})`, expense.amount, 0, 'expenses', expense.id);
    logJournalEntry('expense', `صرف مصروف: ${expense.title} (${expense.category})`, 0, expense.amount, 'cash', expense.id);

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

    if (confirm('هل أنت متأكد من إلغاء (Void) هذا المصروف؟ لن يتم حذفه نهائياً بل سيتم تمييزه كملغي.')) {
      const voidedExpense = { ...expense, status: 'voided' as const };
      setExpenses(prev => prev.map(e => e.id === expenseId ? voidedExpense : e));
      logAction('إلغاء مصروف (Void)', 'expense', expenseId, expense, voidedExpense);
      
      // Reverse Journal Entry
      logJournalEntry('expense', `إلغاء مصروف: ${expense.title}`, expense.amount, 0, 'cash', expense.id);
      logJournalEntry('expense', `إلغاء مصروف: ${expense.title}`, 0, expense.amount, 'expenses', expense.id);

      // Reverse from shift if it was on the same shift (simplified: just log it, reversing from shift is complex if shift is closed)
      if (activeShift) {
         setShifts(prev => prev.map(s => s.id === activeShift.id ? {
           ...s,
           totalExpenses: s.totalExpenses - expense.amount,
           expectedCash: s.expectedCash + expense.amount
         } : s));
      }
    }
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
    </div>
  );
}
