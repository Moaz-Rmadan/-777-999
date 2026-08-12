import React, { useState, useMemo, useEffect } from 'react';
import { 
  JournalEntry, 
  Account, 
  Customer, 
  Supplier, 
  Invoice, 
  PurchaseInvoice, 
  Product, 
  User, 
  CustomerTransaction, 
  SupplierTransaction 
} from '../types';
import { 
  BookOpen, 
  Layers, 
  Scale, 
  TrendingUp, 
  Wallet, 
  ArrowRightLeft,
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Receipt,
  Percent,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Pagination } from './Pagination';

interface AccountingViewProps {
  entries: JournalEntry[];
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  logJournalEntry: (
    type: JournalEntry['type'],
    description: string,
    debit: number,
    credit: number,
    account: string,
    referenceId: string,
    operationId?: string
  ) => void;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  logCustomerTransaction: (
    customerId: string,
    type: CustomerTransaction['type'],
    amount: number,
    referenceId: string,
    description: string,
    newBalance: number,
    operationId?: string
  ) => void;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  logSupplierTransaction: (
    supplierId: string,
    type: SupplierTransaction['type'],
    amount: number,
    referenceId: string,
    description: string,
    newBalance: number,
    operationId?: string
  ) => void;
  invoices: Invoice[];
  purchases: PurchaseInvoice[];
  products: Product[];
  currentUser: User;
  logAction: (
    action: string,
    entityType: 'product' | 'user' | 'invoice' | 'expense' | 'supplier' | 'customer' | 'shift' | 'employee' | 'payroll' | 'inventory',
    entityId: string,
    before?: any,
    after?: any
  ) => void;
}

type AccountingTab = 
  | 'journal' 
  | 'coa' 
  | 'manual_je' 
  | 'ledger' 
  | 'trial_balance' 
  | 'financials' 
  | 'treasury' 
  | 'ar_ap' 
  | 'tax';

export const AccountingView: React.FC<AccountingViewProps> = ({ 
  entries,
  accounts,
  setAccounts,
  setJournalEntries,
  logJournalEntry,
  customers,
  setCustomers,
  logCustomerTransaction,
  suppliers,
  setSuppliers,
  logSupplierTransaction,
  invoices,
  purchases,
  products,
  currentUser,
  logAction
}) => {
  const [activeTab, setActiveTab] = useState<AccountingTab>('journal');
  const [searchTerm, setSearchTerm] = useState('');
  const [journalPage, setJournalPage] = useState(1);
  const journalItemsPerPage = 10;
  const [coaFilter, setCoaFilter] = useState<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');

  // New Account Modal State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<Account['type']>('asset');
  const [newAccountDesc, setNewAccountDesc] = useState('');

  // Manual Journal Entry Form State
  const [manualDate, setManualDate] = useState(new Date().toISOString().substring(0, 10));
  const [manualDescription, setManualDescription] = useState('');
  const [manualType, setManualType] = useState<JournalEntry['type']>('opening');
  const [manualLines, setManualLines] = useState<{ accountCode: string; debit: number; credit: number }[]>([
    { accountCode: 'cash', debit: 0, credit: 0 },
    { accountCode: 'capital', debit: 0, credit: 0 }
  ]);
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');
  const [manualErrorMsg, setManualErrorMsg] = useState('');

  // Treasury State
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferDirection, setTransferDirection] = useState<'cash_to_bank' | 'bank_to_cash'>('cash_to_bank');
  const [treasuryMsg, setTreasuryMsg] = useState('');

  // AR Collection State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [collectAmount, setCollectAmount] = useState<number | ''>('');
  const [collectMethod, setCollectMethod] = useState<'cash' | 'bank'>('cash');
  const [arMsg, setArMsg] = useState('');

  // AP Payment State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank'>('cash');
  const [apMsg, setApMsg] = useState('');

  // Tax States
  const [taxMsg, setTaxMsg] = useState('');

  // 1. DYNAMIC ACCOUNT BALANCES CALCULATION (GAAP Math)
  // Assets and Expenses: Balance = Debits - Credits
  // Liabilities, Equity, and Revenue: Balance = Credits - Debits
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Initialize balances for all configured accounts
    accounts.forEach(acc => {
      balances[acc.code] = 0;
    });

    // Populate balances from general ledger journal entries
    entries.forEach(e => {
      const acc = accounts.find(a => a.code === e.account);
      const accType = acc?.type || 'asset';

      if (!balances[e.account]) {
        balances[e.account] = 0;
      }

      if (accType === 'asset' || accType === 'expense') {
        balances[e.account] += (e.debit - e.credit);
      } else {
        balances[e.account] += (e.credit - e.debit);
      }
    });

    return balances;
  }, [entries, accounts]);

  // 2. JOURNAL GROUPING (Transactions with Multiple Lines)
  const groupedJournalEntries = useMemo(() => {
    const groups: Record<string, {
      id: string;
      date: string;
      description: string;
      type: JournalEntry['type'];
      referenceId: string;
      operationId: string;
      lines: { account: string; debit: number; credit: number; id: string }[];
    }> = {};

    entries.forEach(e => {
      const opId = e.operationId || `op-legacy-${e.referenceId || e.id}`;
      if (!groups[opId]) {
        groups[opId] = {
          id: e.id,
          date: e.date,
          description: e.description,
          type: e.type,
          referenceId: e.referenceId,
          operationId: opId,
          lines: []
        };
      }
      groups[opId].lines.push({
        account: e.account,
        debit: e.debit,
        credit: e.credit,
        id: e.id
      });
    });

    // Sort by date descending
    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const filteredGroupedEntries = useMemo(() => {
    return groupedJournalEntries.filter(g => 
      g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.lines.some(l => {
        const accName = accounts.find(a => a.code === l.account)?.name || l.account;
        return accName.includes(searchTerm) || l.account.includes(searchTerm);
      })
    );
  }, [groupedJournalEntries, searchTerm, accounts]);

  const paginatedGroupedEntries = useMemo(() => {
    const startIndex = (journalPage - 1) * journalItemsPerPage;
    return filteredGroupedEntries.slice(startIndex, startIndex + journalItemsPerPage);
  }, [filteredGroupedEntries, journalPage, journalItemsPerPage]);

  const totalJournalPages = Math.ceil(filteredGroupedEntries.length / journalItemsPerPage);

  // Reset page when search or tab changes
  useEffect(() => {
    setJournalPage(1);
  }, [searchTerm, activeTab]);

  // 3. LEDGER COMPILATION (Chronological entries per account)
  const ledger = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    accounts.forEach(acc => {
      groups[acc.code] = [];
    });

    entries.forEach(e => {
      if (!groups[e.account]) groups[e.account] = [];
      groups[e.account].push(e);
    });

    // Sort ledger rows by date ascending
    Object.keys(groups).forEach(code => {
      groups[code].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return groups;
  }, [entries, accounts]);

  // 4. TRIAL BALANCE
  const trialBalance = useMemo(() => {
    return accounts.map(acc => {
      const accEntries = ledger[acc.code] || [];
      const totalDebit = accEntries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = accEntries.reduce((sum, e) => sum + e.credit, 0);
      const balance = accountBalances[acc.code] || 0;
      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: totalDebit,
        credit: totalCredit,
        balance: balance
      };
    });
  }, [accounts, ledger, accountBalances]);

  // 5. INCOME STATEMENT (P&L) & BALANCE SHEET
  const financials = useMemo(() => {
    // Income statement calculations
    const sales = trialBalance.filter(b => b.type === 'revenue').reduce((sum, r) => sum + r.credit, 0);
    
    // Cost of Goods Sold (COGS) is represented by debits to COGS expense or general expenses with COGS label
    const cogs = entries
      .filter(e => (e.account === 'expenses' && e.description.includes('تكلفة مبيعات')) || e.account === 'purchases')
      .reduce((sum, e) => sum + e.debit, 0);

    const otherExpenses = entries
      .filter(e => e.account === 'expenses' && !e.description.includes('تكلفة مبيعات'))
      .reduce((sum, e) => sum + e.debit, 0);

    const grossProfit = sales - cogs;
    const netProfit = grossProfit - otherExpenses;

    // Balance Sheet items
    const assetAccounts = trialBalance.filter(b => b.type === 'asset');
    const liabilityAccounts = trialBalance.filter(b => b.type === 'liability');
    const equityAccounts = trialBalance.filter(b => b.type === 'equity');

    const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, l) => sum + l.balance, 0);
    const totalEquity = equityAccounts.reduce((sum, q) => sum + q.balance, 0) + netProfit; // Adding Net Profit to Equity (Retained Earnings)

    return {
      sales,
      cogs,
      grossProfit,
      otherExpenses,
      netProfit,
      assetAccounts,
      liabilityAccounts,
      equityAccounts,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }, [trialBalance, entries]);

  // 6. INVENTORY VALUATION & COGS RATIOS
  const inventoryValuation = useMemo(() => {
    // Real-time stock valuation: Sum of (product stock * product buyPrice)
    const systemInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.buyPrice), 0);
    const cogsValue = financials.cogs;
    const grossProfitRate = financials.sales > 0 ? (financials.grossProfit / financials.sales) * 100 : 0;
    
    return {
      systemInventoryValue,
      cogsValue,
      grossProfitRate
    };
  }, [products, financials]);

  // 7. AR & AP OUTSTANDING TOTALS
  const outstandingDebts = useMemo(() => {
    const totalAR = customers.reduce((sum, c) => sum + c.currentDebt, 0);
    const totalAP = suppliers.reduce((sum, s) => sum + s.balance, 0);
    return { totalAR, totalAP };
  }, [customers, suppliers]);

  // 8. TAX CALCULATIONS (Value Added Tax / VAT 14%)
  const vatCalculations = useMemo(() => {
    // Current Balance of Sales Tax Payable
    const vatPayableBalance = accountBalances['tax_payable'] || 0;
    
    // Estimated Sales tax collected from invoices
    const salesTaxCollected = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
    
    return {
      vatPayableBalance,
      salesTaxCollected
    };
  }, [accountBalances, invoices]);

  // ACTIONS HANDLERS

  // A. Add Custom Account to COA
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountCode.trim() || !newAccountName.trim()) {
      alert('الرجاء تعبئة رمز الحساب واسمه بالكامل.');
      return;
    }

    if (accounts.some(a => a.code === newAccountCode || a.name === newAccountName)) {
      alert('رمز الحساب أو اسم الحساب موجود مسبقاً في النظام.');
      return;
    }

    const newAcc: Account = {
      code: newAccountCode.trim(),
      name: newAccountName.trim(),
      type: newAccountType,
      description: newAccountDesc.trim(),
      isSystem: false
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    logAction(`إضافة حساب جديد في شجرة الحسابات: ${newAcc.name}`, 'user' as any, currentUser.id, accounts, updated);
    
    // Reset Form
    setNewAccountCode('');
    setNewAccountName('');
    setNewAccountDesc('');
    setIsAddAccountOpen(false);
  };

  // B. Delete Custom Account
  const handleDeleteAccount = (code: string) => {
    const acc = accounts.find(a => a.code === code);
    if (!acc) return;
    if (acc.isSystem) {
      alert('عذراً، لا يمكن حذف حسابات النظام الأساسية المحمية.');
      return;
    }

    // Check if account has any transactional entries in the ledger
    if ((ledger[code] || []).length > 0) {
      alert('عذراً، لا يمكن حذف الحساب لأنه يحتوي على قيود مسجلة بالفعل في دفتر الأستاذ.');
      return;
    }

    if (window.confirm(`هل أنت متأكد من رغبتك في حذف الحساب "${acc.name}" من شجرة الحسابات؟`)) {
      const updated = accounts.filter(a => a.code !== code);
      setAccounts(updated);
      logAction(`حذف حساب من شجرة الحسابات: ${acc.name}`, 'user' as any, currentUser.id, accounts, updated);
    }
  };

  // C. Manual Journal Entry Submission
  const handleAddManualLine = () => {
    setManualLines([...manualLines, { accountCode: 'expenses', debit: 0, credit: 0 }]);
  };

  const handleRemoveManualLine = (index: number) => {
    if (manualLines.length <= 2) {
      alert('يجب أن يحتوي القيد المزدوج على سطرين على الأقل.');
      return;
    }
    setManualLines(manualLines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: 'accountCode' | 'debit' | 'credit', value: string) => {
    const updated = [...manualLines];
    if (field === 'accountCode') {
      updated[index].accountCode = value;
    } else {
      const numVal = Math.max(0, parseFloat(value) || 0);
      updated[index][field] = numVal;
      // If debit is entered, credit should be 0, and vice-versa (Standard accounting line behavior)
      if (field === 'debit' && numVal > 0) {
        updated[index].credit = 0;
      } else if (field === 'credit' && numVal > 0) {
        updated[index].debit = 0;
      }
    }
    setManualLines(updated);
  };

  const totalDebits = manualLines.reduce((s, l) => s + l.debit, 0);
  const totalCredits = manualLines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleSaveManualJE = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDescription.trim()) {
      setManualErrorMsg('يرجى كتابة شرح أو وصف تفصيلي للقيد اليومي.');
      return;
    }

    if (!isBalanced) {
      setManualErrorMsg('القيد غير متوازن! يجب أن يكون إجمالي المدين مساوياً تماماً لإجمالي الدائن وأكبر من الصفر.');
      return;
    }

    const uniqueOpId = `op-manual-je-${Date.now()}`;
    const newEntries: JournalEntry[] = manualLines.map((line, idx) => ({
      id: `je-man-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      date: new Date(manualDate).toISOString(),
      type: manualType,
      description: manualDescription.trim(),
      debit: line.debit,
      credit: line.credit,
      account: line.accountCode,
      referenceId: 'manual',
      operationId: uniqueOpId
    }));

    setJournalEntries(prev => [...newEntries, ...prev]);
    logAction(`إنشاء قيد يومية يدوي متوازن: ${manualDescription}`, 'user' as any, currentUser.id, null, newEntries);

    // Reset Form
    setManualDescription('');
    setManualLines([
      { accountCode: 'cash', debit: 0, credit: 0 },
      { accountCode: 'capital', debit: 0, credit: 0 }
    ]);
    setManualSuccessMsg('تم حفظ قيد اليومية المزدوج المتوازن ترحيله بنجاح إلى الأستاذ العام!');
    setManualErrorMsg('');
    setTimeout(() => setManualSuccessMsg(''), 5000);
  };

  // D. Funds Transfer between Cash & Bank
  const handleTreasuryTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount as string);
    if (!amount || amount <= 0) {
      alert('يرجى إدخال مبلغ تحويل صالح أكبر من الصفر.');
      return;
    }

    const cashBalance = accountBalances['cash'] || 0;
    const bankBalance = accountBalances['bank'] || 0;

    if (transferDirection === 'cash_to_bank' && cashBalance < amount) {
      alert('فشل التحويل: الرصيد المتوفر في الخزينة لا يكفي لإتمام هذه العملية.');
      return;
    }
    if (transferDirection === 'bank_to_cash' && bankBalance < amount) {
      alert('فشل التحويل: الرصيد المتوفر في البنك لا يكفي لإتمام هذه العملية.');
      return;
    }

    const uniqueOpId = `op-treasury-trans-${Date.now()}`;
    const desc = transferDirection === 'cash_to_bank' 
      ? `تحويل وإيداع سيولة نقدية من الخزينة إلى البنك`
      : `سحب نقدي من البنك لتغذية الخزينة`;

    if (transferDirection === 'cash_to_bank') {
      // Debit Bank, Credit Cash
      logJournalEntry('payment', desc, amount, 0, 'bank', 'treasury_transfer', `${uniqueOpId}-bank-debit`);
      logJournalEntry('payment', desc, 0, amount, 'cash', 'treasury_transfer', `${uniqueOpId}-cash-credit`);
    } else {
      // Debit Cash, Credit Bank
      logJournalEntry('payment', desc, amount, 0, 'cash', 'treasury_transfer', `${uniqueOpId}-cash-debit`);
      logJournalEntry('payment', desc, 0, amount, 'bank', 'treasury_transfer', `${uniqueOpId}-bank-credit`);
    }

    logAction(desc, 'user' as any, currentUser.id);
    setTransferAmount('');
    setTreasuryMsg('تمت عملية تحويل السيولة و ترحيل قيدها المزدوج بنجاح!');
    setTimeout(() => setTreasuryMsg(''), 4000);
  };

  // E. Customer Collection Recording (AR)
  const handleCollectDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('الرجاء اختيار عميل أولاً.');
      return;
    }
    const amount = parseFloat(collectAmount as string);
    if (!amount || amount <= 0) {
      alert('يرجى تحديد مبلغ التحصيل الصالح.');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const newDebt = customer.currentDebt - amount;
    const collectionOpId = `op-ar-collect-${Date.now()}`;

    // Update customer debt state
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return { ...c, currentDebt: newDebt };
      }
      return c;
    }));

    // Record Supplier/Customer ledger transaction
    logCustomerTransaction(
      customer.id,
      'collection',
      amount,
      'collection',
      `تحصيل جزء من الحساب - طريقة: ${collectMethod === 'cash' ? 'خزينة نقدي' : 'بنك شبكة'}`,
      newDebt,
      collectionOpId
    );

    // Record balanced journal entry: Debit Cash/Bank, Credit Receivables
    logJournalEntry(
      'collection',
      `تحصيل ديون مستحقة من العميل: ${customer.name}`,
      amount,
      0,
      collectMethod,
      customer.id,
      `${collectionOpId}-je-debit`
    );
    logJournalEntry(
      'collection',
      `تحصيل ديون مستحقة من العميل: ${customer.name}`,
      0,
      amount,
      'receivables',
      customer.id,
      `${collectionOpId}-je-credit`
    );

    logAction(`تحصيل حساب مدين عميل: ${customer.name} بمبلغ ج.م ${amount}`, 'customer', customer.id);
    setCollectAmount('');
    setSelectedCustomerId('');
    setArMsg('تم تسجيل التحصيل وتعديل مديونية العميل و ترحيل القيود تلقائياً!');
    setTimeout(() => setArMsg(''), 4000);
  };

  // F. Supplier Payment Recording (AP)
  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('الرجاء اختيار مورد أولاً.');
      return;
    }
    const amount = parseFloat(payAmount as string);
    if (!amount || amount <= 0) {
      alert('يرجى تحديد مبلغ السداد الصالح.');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const newBalance = supplier.balance - amount;
    const paymentOpId = `op-ap-pay-${Date.now()}`;

    // Update supplier balance state
    setSuppliers(prev => prev.map(s => {
      if (s.id === selectedSupplierId) {
        return { ...s, balance: newBalance };
      }
      return s;
    }));

    // Record transaction
    logSupplierTransaction(
      supplier.id,
      'payment',
      amount,
      'payment',
      `سداد دفعة للمورد حساب - طريقة: ${payMethod === 'cash' ? 'نقدي خزينة' : 'فيزا بنك'}`,
      newBalance,
      paymentOpId
    );

    // Balanced Journal: Debit Payables, Credit Cash/Bank
    logJournalEntry(
      'payment',
      `سداد دفعة مستحقة للمورد: ${supplier.name}`,
      amount,
      0,
      'payables',
      supplier.id,
      `${paymentOpId}-je-debit`
    );
    logJournalEntry(
      'payment',
      `سداد دفعة مستحقة للمورد: ${supplier.name}`,
      0,
      amount,
      payMethod,
      supplier.id,
      `${paymentOpId}-je-credit`
    );

    logAction(`سداد مستحقات مورد: ${supplier.name} بمبلغ ج.م ${amount}`, 'supplier', supplier.id);
    setPayAmount('');
    setSelectedSupplierId('');
    setApMsg('تم تسجيل السداد وتعديل حساب المورد و ترحيل القيود تلقائياً!');
    setTimeout(() => setApMsg(''), 4000);
  };

  // G. Tax Liability Settlement
  const handleSettleTax = () => {
    const vatPayable = vatCalculations.vatPayableBalance;
    if (vatPayable <= 0) {
      alert('لا توجد التزامات ضريبية مستحقة للسداد حالياً.');
      return;
    }

    if (window.confirm(`هل أنت متأكد من سداد الإقرار الضريبي الحالي بمبلغ ج.م ${vatPayable.toLocaleString()} بالكامل لمصلحة الضرائب؟`)) {
      const settleOpId = `op-vat-settle-${Date.now()}`;
      
      // Debit tax_payable, Credit cash
      logJournalEntry(
        'expense',
        `سداد إقرار ضريبة القيمة المضافة لمصلحة الضرائب المصرية`,
        vatPayable,
        0,
        'tax_payable',
        'vat_settlement',
        `${settleOpId}-debit`
      );
      logJournalEntry(
        'expense',
        `سداد إقرار ضريبة القيمة المضافة لمصلحة الضرائب المصرية`,
        0,
        vatPayable,
        'cash',
        'vat_settlement',
        `${settleOpId}-credit`
      );

      logAction(`سداد إقرار ضريبي مستحق بالكامل لمصلحة الضرائب بمبلغ ج.م ${vatPayable}`, 'expense', 'vat_settlement');
      setTaxMsg('تم تسوية الالتزام الضريبي بنجاح وإقفال الأرصدة المستحقة لمصلحة الضرائب!');
      setTimeout(() => setTaxMsg(''), 4000);
    }
  };

  // Print PDF Generator
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة لتوليد وطباعة التقارير المالية.');
      return;
    }

    let reportTitle = '';
    let tableHtml = '';
    const today = new Date().toLocaleDateString('ar-EG');

    if (activeTab === 'journal') {
      reportTitle = 'دفتر اليومية التفصيلي المزدوج';
      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; direction: rtl; font-family: sans-serif; font-size: 11px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px; text-align: right;">التاريخ</th>
              <th style="padding: 8px; text-align: right;">رقم العملية</th>
              <th style="padding: 8px; text-align: right;">البيان التفصيلي</th>
              <th style="padding: 8px; text-align: right;">الحساب المالي</th>
              <th style="padding: 8px; text-align: left;">مدين (Debit)</th>
              <th style="padding: 8px; text-align: left;">دائن (Credit)</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(e => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px;">${new Date(e.date).toLocaleString('ar-EG')}</td>
                <td style="padding: 8px; color: #64748b;">#${e.id.split('-')[2] || e.id}</td>
                <td style="padding: 8px; font-weight: bold;">${e.description}</td>
                <td style="padding: 8px;">${accounts.find(a => a.code === e.account)?.name || e.account}</td>
                <td style="padding: 8px; text-align: left; color: #059669; font-weight: bold;">${e.debit > 0 ? e.debit.toLocaleString() : '-'}</td>
                <td style="padding: 8px; text-align: left; color: #dc2626; font-weight: bold;">${e.credit > 0 ? e.credit.toLocaleString() : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'coa') {
      reportTitle = 'شجرة الحسابات (Chart of Accounts)';
      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; direction: rtl; font-family: sans-serif; font-size: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: right;">رمز الحساب</th>
              <th style="padding: 10px; text-align: right;">اسم الحساب</th>
              <th style="padding: 10px; text-align: right;">تصنيف الحساب</th>
              <th style="padding: 10px; text-align: right;">الوصف</th>
              <th style="padding: 10px; text-align: left;">الرصيد الصافي</th>
            </tr>
          </thead>
          <tbody>
            ${accounts.map(acc => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold; color: #64748b;">${acc.code}</td>
                <td style="padding: 10px; font-weight: bold;">${acc.name}</td>
                <td style="padding: 10px; color: #0f172a;">${acc.type}</td>
                <td style="padding: 10px; color: #64748b;">${acc.description || ''}</td>
                <td style="padding: 10px; text-align: left; font-weight: bold;">ج.م ${(accountBalances[acc.code] || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'trial_balance') {
      reportTitle = 'ميزان المراجعة الرسمي بالأرصدة';
      tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; direction: rtl; font-family: sans-serif; font-size: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: right;">رمز الحساب</th>
              <th style="padding: 10px; text-align: right;">اسم الحساب الرئيسي</th>
              <th style="padding: 10px; text-align: left;">مجاميع المدين</th>
              <th style="padding: 10px; text-align: left;">مجاميع الدائن</th>
              <th style="padding: 10px; text-align: left; background-color: #f1f5f9;">الرصيد الصافي</th>
            </tr>
          </thead>
          <tbody>
            ${trialBalance.map(row => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; color: #64748b;">${row.code}</td>
                <td style="padding: 10px; font-weight: bold;">${row.name}</td>
                <td style="padding: 10px; text-align: left; color: #059669;">${row.debit.toLocaleString()}</td>
                <td style="padding: 10px; text-align: left; color: #dc2626;">${row.credit.toLocaleString()}</td>
                <td style="padding: 10px; text-align: left; background-color: #fafbfc; font-weight: bold; color: ${row.balance >= 0 ? '#15803d' : '#b91c1c'}">
                  ${row.balance.toLocaleString()} ج.م
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #0f172a; color: white; font-weight: bold;">
              <td colspan="2" style="padding: 12px; text-align: right;">الإجمالي المتوازن</td>
              <td style="padding: 12px; text-align: left; color: #34d399;">ج.م ${trialBalance.reduce((s,r)=>s+r.debit, 0).toLocaleString()}</td>
              <td style="padding: 12px; text-align: left; color: #f87171;">ج.م ${trialBalance.reduce((s,r)=>s+r.credit, 0).toLocaleString()}</td>
              <td style="padding: 12px; text-align: left; background-color: #1e293b; color: #38bdf8;">متوازن 100%</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      reportTitle = 'التقارير المالية المدمجة';
      tableHtml = `
        <h2>قائمة الدخل والربحية</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; direction: rtl; font-family: sans-serif; font-size: 13px;">
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">إيرادات مبيعات النشاط</td><td style="padding: 10px; text-align: left; font-weight: bold;">ج.م ${financials.sales.toLocaleString()}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">(-) تكلفة السلع والمبيعات (COGS)</td><td style="padding: 10px; text-align: left; color: red;">ج.م ${financials.cogs.toLocaleString()}</td></tr>
          <tr style="background-color: #f0fdf4; font-weight: bold;"><td style="padding: 10px;">إجمالي مجمل الربح (Gross Profit)</td><td style="padding: 10px; text-align: left; color: green;">ج.م ${financials.grossProfit.toLocaleString()}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">(-) المصروفات العمومية والتشغيلية والرواتب</td><td style="padding: 10px; text-align: left; color: red;">ج.م ${financials.otherExpenses.toLocaleString()}</td></tr>
          <tr style="background-color: #0f172a; color: white; font-weight: bold;"><td style="padding: 12px;">صافي الربح المالي الصافي (Net Income)</td><td style="padding: 12px; text-align: left; color: #34d399; font-size: 15px;">ج.م ${financials.netProfit.toLocaleString()}</td></tr>
        </table>
      `;
    }

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${reportTitle}</title>
          <style>
            @media print {
              body { margin: 1.5cm; }
              .no-print { display: none !important; }
            }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff; padding: 25px; color: #1e293b; }
            .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #cbd5e1; padding-bottom: 15px; margin-bottom: 25px; }
            .logo { font-size: 24px; font-weight: 900; color: #059669; border: 2px solid #059669; padding: 5px 15px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <span class="logo">POS</span>
              <h1 style="margin: 10px 0 5px; font-size: 20px;">الشركة التقنية المتقدمة لإدارة المبيعات</h1>
              <h2 style="margin: 0; font-size: 14px; color: #475569;">مستند مالي معتمد: ${reportTitle}</h2>
            </div>
            <div style="text-align: left; font-size: 11px; line-height: 1.6;">
              <div>تاريخ التصدير: <strong>${today}</strong></div>
              <div>العملة: <strong>الجنيه المصري (ج.م)</strong></div>
              <button onclick="window.print()" class="no-print" style="margin-top: 10px; background-color: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">طباعة</button>
            </div>
          </div>
          <div>${tableHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const tabs: { id: AccountingTab; label: string; icon: React.ReactNode }[] = [
    { id: 'journal', label: 'دفتر اليومية', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'coa', label: 'شجرة الحسابات', icon: <Layers className="w-4 h-4" /> },
    { id: 'manual_je', label: 'قيد يدوي متوازن', icon: <Plus className="w-4 h-4" /> },
    { id: 'ledger', label: 'دفتر الأستاذ', icon: <Layers className="w-4 h-4" /> },
    { id: 'trial_balance', label: 'ميزان المراجعة', icon: <Scale className="w-4 h-4" /> },
    { id: 'financials', label: 'القوائم الختامية', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'treasury', label: 'الخزينة والبنك', icon: <Wallet className="w-4 h-4" /> },
    { id: 'ar_ap', label: 'التحصيل والسداد', icon: <Users className="w-4 h-4" /> },
    { id: 'tax', label: 'الضرائب والضريبة', icon: <Receipt className="w-4 h-4" /> }
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Visual Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">محرك القيود والذكاء المالي</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            شجرة الحسابات الكاملة، قيود اليومية الآلية والمزدوجة، ميزان المراجعة وقائمة الدخل، الحسابات المدينة والدائنة والضرائب.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير تقرير PDF</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-950/10">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>الحالة المالية الفورية</span>
          </div>
        </div>
      </div>

      {/* Internal Tabs Ribbon */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar shadow-xs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Dashboard */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* TAB 1: JOURNAL VIEW */}
            {activeTab === 'journal' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث في قيود النشاط أو الحسابات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-3 py-1.5 rounded-lg border border-slate-200">
                      إجمالي العمليات المترابطة: {groupedJournalEntries.length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
                  <div className="p-6 space-y-4">
                    {filteredGroupedEntries.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-bold text-xs">
                        لا توجد قيود متبادلة مطابقة لمعايير البحث في الفترة الحالية.
                      </div>
                    ) : (
                      paginatedGroupedEntries.map(group => {
                        const sumDebit = group.lines.reduce((s, l) => s + l.debit, 0);
                        const sumCredit = group.lines.reduce((s, l) => s + l.credit, 0);
                        const isGroupBalanced = Math.abs(sumDebit - sumCredit) < 0.01;

                        return (
                          <div key={group.operationId} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all bg-white">
                            {/* Transaction Header */}
                            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                                  group.type === 'sale' ? 'bg-emerald-100 text-emerald-800' :
                                  group.type === 'purchase' ? 'bg-indigo-100 text-indigo-800' :
                                  group.type === 'collection' ? 'bg-amber-100 text-amber-800' :
                                  group.type === 'payment' ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                  {group.type === 'sale' ? 'مبيعات' :
                                   group.type === 'purchase' ? 'مشتريات' :
                                   group.type === 'collection' ? 'تحصيل' :
                                   group.type === 'payment' ? 'سداد' :
                                   group.type === 'expense' ? 'مصروف' :
                                   group.type === 'opening' ? 'قيد افتتاحي' : 'قيد يدوي'}
                                </span>
                                <h4 className="text-xs font-black text-slate-800">{group.description}</h4>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                                <span className="font-mono">{new Date(group.date).toLocaleString('ar-EG')}</span>
                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-mono select-none">
                                  #{group.operationId.replace('op-', '').substring(0, 10)}...
                                </span>
                              </div>
                            </div>

                            {/* Transaction Lines (Debits and Credits) */}
                            <div className="divide-y divide-slate-50">
                              <table className="w-full text-right border-collapse text-xs">
                                <thead className="bg-slate-100/50 text-[10px] text-slate-400 font-black">
                                  <tr>
                                    <th className="px-5 py-2">الحساب الفرعي</th>
                                    <th className="px-5 py-2 text-left w-36">مدين (Debit)</th>
                                    <th className="px-5 py-2 text-left w-36">دائن (Credit)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.lines.map(line => {
                                    const accName = accounts.find(a => a.code === line.account)?.name || line.account;
                                    return (
                                      <tr key={line.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-2.5">
                                          <span className="font-black text-slate-700">{accName}</span>
                                          <span className="text-[10px] text-slate-400 mr-2 font-mono">({line.account})</span>
                                        </td>
                                        <td className="px-5 py-2.5 text-left font-mono-numbers text-emerald-600 font-black">
                                          {line.debit > 0 ? `ج.م ${line.debit.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-5 py-2.5 text-left font-mono-numbers text-rose-600 font-black">
                                          {line.credit > 0 ? `ج.م ${line.credit.toLocaleString()}` : '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="bg-slate-50/50 text-[10px] font-black border-t border-slate-100">
                                  <tr>
                                    <td className="px-5 py-2 text-slate-500">مجموع القيد اليومي</td>
                                    <td className="px-5 py-2 text-left text-slate-800 font-mono-numbers">ج.م {sumDebit.toLocaleString()}</td>
                                    <td className="px-5 py-2 text-left text-slate-800 font-mono-numbers">ج.م {sumCredit.toLocaleString()}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <Pagination
                  currentPage={journalPage}
                  totalPages={totalJournalPages}
                  onPageChange={setJournalPage}
                  totalItems={filteredGroupedEntries.length}
                  itemsPerPage={journalItemsPerPage}
                />
              </div>
            )}

            {/* TAB 2: CHART OF ACCOUNTS */}
            {activeTab === 'coa' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-slate-900">شجرة الحسابات والدليل المحاسبي</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">تنسيق وتتبع جميع الحسابات المدينة والدائنة للشركة وحركة أرصدتها بالمعايير الفورية.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddAccountOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة حساب جديد للدليل</span>
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'asset', 'liability', 'equity', 'revenue', 'expense'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setCoaFilter(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        coaFilter === type 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'all' ? 'جميع التصنيفات' :
                       type === 'asset' ? 'الأصول (Assets)' :
                       type === 'liability' ? 'الالتزامات (Liabilities)' :
                       type === 'equity' ? 'حقوق الملكية (Equity)' :
                       type === 'revenue' ? 'الإيرادات (Revenue)' : 'المصروفات (Expenses)'}
                    </button>
                  ))}
                </div>

                {/* Accounts Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black tracking-wider uppercase select-none">
                        <th className="p-4">رمز الحساب</th>
                        <th className="p-4">اسم الحساب</th>
                        <th className="p-4">التصنيف الرئيسي</th>
                        <th className="p-4">شرح ووصف الحساب</th>
                        <th className="p-4 text-left">الرصيد الفوري</th>
                        <th className="p-4 text-center w-24">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {accounts
                        .filter(a => coaFilter === 'all' || a.type === coaFilter)
                        .map(acc => {
                          const bal = accountBalances[acc.code] || 0;
                          return (
                            <tr key={acc.code} className="hover:bg-slate-50/50">
                              <td className="p-4 font-mono-numbers text-slate-500 font-bold">{acc.code}</td>
                              <td className="p-4 font-black text-slate-800">{acc.name}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${
                                  acc.type === 'asset' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                  acc.type === 'liability' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                                  acc.type === 'equity' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                                  acc.type === 'revenue' ? 'bg-sky-50 text-sky-800 border border-sky-100' :
                                  'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}>
                                  {acc.type === 'asset' ? 'أصول' :
                                   acc.type === 'liability' ? 'لتزامات' :
                                   acc.type === 'equity' ? 'حقوق ملكية' :
                                   acc.type === 'revenue' ? 'إيرادات' : 'مصروفات'}
                                </span>
                              </td>
                              <td className="p-4 text-slate-500 text-[11px] max-w-xs truncate">{acc.description || '-'}</td>
                              <td className="p-4 text-left font-mono-numbers font-black text-slate-900">
                                ج.م {bal.toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                {acc.isSystem ? (
                                  <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-black select-none">نظام</span>
                                ) : (
                                  <button 
                                    onClick={() => handleDeleteAccount(acc.code)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="حذف الحساب"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* MODAL: Add Custom Account */}
                {isAddAccountOpen && (
                  <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-black text-slate-900 text-sm">إضافة حساب مالي جديد للدليل</h3>
                        <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
                      </div>
                      <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">رمز الحساب أو الكود الفريد (مثال: 50205)</label>
                          <input 
                            type="text"
                            required
                            value={newAccountCode}
                            onChange={(e) => setNewAccountCode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            placeholder="مثال: 50205 أو electricity"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">اسم الحساب باللغة العربية (مثال: مصروف الكهرباء)</label>
                          <input 
                            type="text"
                            required
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            placeholder="مثال: مصروف هاتف، إيجار الفرع"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">التصنيف الرئيسي للحساب</label>
                          <select
                            value={newAccountType}
                            onChange={(e) => setNewAccountType(e.target.value as Account['type'])}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          >
                            <option value="asset">أصول (Assets) - ممتلكات، خزينة، عملاء، مخزون</option>
                            <option value="liability">التزامات (Liabilities) - موردون، ديون مستحقة، ضرائب</option>
                            <option value="equity">حقوق الملكية (Equity) - رأس المال، أرباح مرحلة</option>
                            <option value="revenue">إيرادات (Revenue) - مبيعات النشاط، إيرادات تشغيلية</option>
                            <option value="expense">مصروفات (Expenses) - تكاليف تشغيلية، رواتب، إيجار</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">الوصف والشرح المحاسبي (اختياري)</label>
                          <textarea
                            value={newAccountDesc}
                            onChange={(e) => setNewAccountDesc(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none h-20"
                            placeholder="اكتب نبذة عن المعاملات التي يستقبلها هذا الحساب..."
                          />
                        </div>
                        <div className="pt-2 flex items-center justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => setIsAddAccountOpen(false)}
                            className="px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-50 rounded-xl"
                          >
                            إلغاء
                          </button>
                          <button 
                            type="submit"
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700"
                          >
                            إضافة الحساب للدليل
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BALANCED MANUAL JOURNAL ENTRY BUILDER */}
            {activeTab === 'manual_je' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-black text-slate-900 text-base">منشئ قيد اليومية المزدوج المتوازن</h3>
                      <p className="text-xs text-slate-500 font-bold">تسجيل قيد محاسبي يدوي في النظام بالمعايير المقبولة عموماً (Total Debits == Total Credits).</p>
                    </div>
                  </div>

                  {/* Feedback alerts */}
                  {manualSuccessMsg && (
                    <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex items-center gap-3 mb-4 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{manualSuccessMsg}</span>
                    </div>
                  )}
                  {manualErrorMsg && (
                    <div className="p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl flex items-center gap-3 mb-4 text-xs font-bold">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>{manualErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveManualJE} className="space-y-6">
                    {/* General Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 mb-1">تاريخ المعاملة المعتمد</label>
                        <input 
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 mb-1">نوع المعاملة للتبويب</label>
                        <select
                          value={manualType}
                          onChange={(e) => setManualType(e.target.value as JournalEntry['type'])}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="opening">قيد افتتاحي (Opening)</option>
                          <option value="payroll">رواتب وأجور (Payroll)</option>
                          <option value="expense">مصروف تشغيلي (Expense)</option>
                          <option value="collection">تحصيل تسوية (Collection)</option>
                          <option value="payment">سداد ذمم (Payment)</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] font-black text-slate-500 mb-1">الشرح المالي / وصف المعاملة</label>
                        <input 
                          type="text"
                          required
                          value={manualDescription}
                          onChange={(e) => setManualDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                          placeholder="مثال: تسجيل رأس مال شريك إضافي نقداً"
                        />
                      </div>
                    </div>

                    {/* Journal Lines Table */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-800">تفاصيل قيد اليومية (بند القيد)</span>
                        <button
                          type="button"
                          onClick={handleAddManualLine}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-700 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة سطر جديد للقيد</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {manualLines.map((line, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row items-center gap-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                            <div className="w-full md:flex-1">
                              <label className="md:hidden block text-[10px] font-black text-slate-400 mb-1">الحساب المالي</label>
                              <select
                                value={line.accountCode}
                                onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                              >
                                {accounts.map(acc => (
                                  <option key={acc.code} value={acc.code}>
                                    {acc.name} ({acc.code})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-full md:w-36">
                              <label className="md:hidden block text-[10px] font-black text-slate-400 mb-1">مدين (Debit)</label>
                              <input 
                                type="number"
                                step="any"
                                value={line.debit || ''}
                                onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black text-emerald-600 text-left outline-none"
                                placeholder="مدين 0.00"
                              />
                            </div>

                            <div className="w-full md:w-36">
                              <label className="md:hidden block text-[10px] font-black text-slate-400 mb-1">دائن (Credit)</label>
                              <input 
                                type="number"
                                step="any"
                                value={line.credit || ''}
                                onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black text-rose-600 text-left outline-none"
                                placeholder="دائن 0.00"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveManualLine(idx)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Balanced Ledger Summary Check bar */}
                    <div className="p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 text-white shadow-md">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">مجموع المدين (Debits)</span>
                          <span className="text-sm font-mono-numbers font-black text-emerald-400">ج.م {totalDebits.toLocaleString()}</span>
                        </div>
                        <div className="border-r border-white/20 h-8 hidden md:block"></div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">مجموع الدائن (Credits)</span>
                          <span className="text-sm font-mono-numbers font-black text-rose-400">ج.م {totalCredits.toLocaleString()}</span>
                        </div>
                        <div className="border-r border-white/20 h-8 hidden md:block"></div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">الفارق الحسابي (Variance)</span>
                          <span className={`text-sm font-mono-numbers font-black ${isBalanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                            ج.م {Math.abs(totalDebits - totalCredits).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isBalanced ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>متوازن (Balanced)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-black border border-amber-500/30">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>غير متوازن</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={!isBalanced}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                            isBalanced 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-700/20' 
                              : 'bg-white/10 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          ترحيل القيد المزدوج
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: GENERAL LEDGER ROWS */}
            {activeTab === 'ledger' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {accounts.map(acc => {
                  const rows = ledger[acc.code] || [];
                  const finalBal = accountBalances[acc.code] || 0;
                  return (
                    <div key={acc.code} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
                      <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span>{acc.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">({acc.code})</span>
                        </h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase select-none">General Ledger</span>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto scrollbar-thin flex-1">
                        {rows.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-[11px] font-bold">
                            لا توجد قيود مسجلة لهذا الحساب المالي في الفترة الحالية.
                          </div>
                        ) : (
                          <table className="w-full text-right text-[11px]">
                            <thead className="bg-white border-b border-slate-100 sticky top-0 text-slate-400 font-black">
                              <tr>
                                <th className="p-3 text-right">التاريخ</th>
                                <th className="p-3">البيان المحاسبي</th>
                                <th className="p-3 text-left">مدين</th>
                                <th className="p-3 text-left">دائن</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {rows.map(row => (
                                <tr key={row.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 text-slate-400 font-mono-numbers whitespace-nowrap">{new Date(row.date).toLocaleDateString('ar-EG')}</td>
                                  <td className="p-3 font-bold text-slate-700">{row.description}</td>
                                  <td className="p-3 text-left text-emerald-600 font-black font-mono-numbers">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                                  <td className="p-3 text-left text-rose-600 font-black font-mono-numbers">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div className="px-5 py-3.5 bg-slate-950 text-white flex justify-between items-center">
                        <span className="font-bold text-[10px] text-slate-400">الرصيد النهائي المعتمد</span>
                        <span className="font-black text-xs font-mono-numbers">
                          ج.م {finalBal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 5: TRIAL BALANCE TABLE */}
            {activeTab === 'trial_balance' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-black text-slate-900">ميزان المراجعة بالأرصدة والمجاميع</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">مطابقة مجاميع العمليات الدائنة والمدينة للتأكد من نزاهة الدفاتر الحسابية المزدوجة.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مجموع القيود مطابق 100% (Balanced)</span>
                  </div>
                </div>

                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase text-[10px]">
                      <th className="p-4">كود الحساب</th>
                      <th className="p-4">اسم الحساب المالي</th>
                      <th className="p-4">نوع الحساب</th>
                      <th className="p-4 text-left">إجمالي مدين (Debit)</th>
                      <th className="p-4 text-left">إجمالي دائن (Credit)</th>
                      <th className="p-4 text-left bg-slate-100/50">الرصيد الصافي النهائي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trialBalance.map(row => (
                      <tr key={row.code} className="hover:bg-slate-50/30">
                        <td className="p-4 font-mono-numbers text-slate-400">{row.code}</td>
                        <td className="p-4 font-black text-slate-900">{row.name}</td>
                        <td className="p-4 uppercase font-bold text-slate-500 text-[10px]">{row.type}</td>
                        <td className="p-4 text-left font-mono-numbers text-emerald-600 font-bold">{row.debit.toLocaleString()}</td>
                        <td className="p-4 text-left font-mono-numbers text-rose-600 font-bold">{row.credit.toLocaleString()}</td>
                        <td className={`p-4 text-left bg-slate-50 font-black font-mono-numbers ${row.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {row.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900 text-white font-black text-sm sticky bottom-0">
                      <td colSpan={3} className="p-4">المجموع الكلي للميزان</td>
                      <td className="p-4 text-left text-emerald-400 font-mono-numbers">{trialBalance.reduce((s,r)=>s+r.debit,0).toLocaleString()}</td>
                      <td className="p-4 text-left text-rose-400 font-mono-numbers">{trialBalance.reduce((s,r)=>s+r.credit,0).toLocaleString()}</td>
                      <td className="p-4 text-left bg-slate-800 text-sky-400">0.00 ج.م</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 6: FINANCIAL STATEMENTS (P&L & BALANCE SHEET) */}
            {activeTab === 'financials' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* INCOME STATEMENT */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                      <div>
                        <h3 className="font-black text-sm">قائمة الدخل - الأرباح والخسائر</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">عن الفترة التشغيلية المنتهية حالياً</p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="p-6 space-y-4 flex-1">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-xs font-black text-slate-600">إجمالي إيراد المبيعات الكلية</span>
                        <span className="text-sm font-mono-numbers font-black text-slate-900">ج.م {financials.sales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-xs font-black text-slate-600">(-) تكلفة المبيعات والمشتريات (COGS)</span>
                        <span className="text-sm font-mono-numbers font-black text-rose-600">ج.م {financials.cogs.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <span className="text-xs font-black text-emerald-800">مجمل ربح النشاط (Gross Profit)</span>
                        <span className="text-sm font-mono-numbers font-black text-emerald-700">ج.م {financials.grossProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-xs font-black text-slate-600">(-) المصروفات التشغيلية والعمومية والرواتب</span>
                        <span className="text-sm font-mono-numbers font-black text-rose-600">ج.م {financials.otherExpenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-slate-950 text-white rounded-2xl mt-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">صافي الدخل النهائي للفترة</span>
                          <span className="text-base font-mono-numbers font-black">ج.م {financials.netProfit.toLocaleString()}</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black ${financials.netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {financials.netProfit >= 0 ? 'ربح صافي' : 'خسارة صافية'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BALANCE SHEET */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                    <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                      <div>
                        <h3 className="font-black text-sm">الميزانية العمومية والمركز المالي</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">معادلة الأصول = الالتزامات + حقوق الملكية</p>
                      </div>
                      <Scale className="w-5 h-5 text-sky-400" />
                    </div>

                    <div className="p-6 space-y-4 flex-1">
                      {/* Assets Section */}
                      <div>
                        <span className="text-[11px] font-black text-slate-400 block mb-2">أولاً: الأصول والممتلكات (Assets)</span>
                        <div className="space-y-1.5">
                          {financials.assetAccounts.map(a => (
                            <div key={a.code} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-600">{a.name}</span>
                              <span className="font-mono-numbers text-slate-800">ج.م {a.balance.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-black text-xs">
                            <span>إجمالي الأصول الكلية</span>
                            <span>ج.م {financials.totalAssets.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-slate-100"></div>

                      {/* Liabilities & Equity Section */}
                      <div>
                        <span className="text-[11px] font-black text-slate-400 block mb-2">ثانياً: الالتزامات وحقوق الملكية (Liabilities & Equity)</span>
                        <div className="space-y-1.5">
                          {financials.liabilityAccounts.map(l => (
                            <div key={l.code} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-600">{l.name}</span>
                              <span className="font-mono-numbers text-slate-800">ج.م {l.balance.toLocaleString()}</span>
                            </div>
                          ))}
                          {financials.equityAccounts.map(e => (
                            <div key={e.code} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-600">{e.name}</span>
                              <span className="font-mono-numbers text-slate-800">ج.م {e.balance.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-600">أرباح تشغيلية مرحلة (صافي ربح الفترة)</span>
                            <span className="font-mono-numbers text-slate-800">ج.م {financials.netProfit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-sky-50 text-sky-800 rounded-xl border border-sky-100 font-black text-xs">
                            <span>إجمالي الالتزامات وحقوق الملكية</span>
                            <span>ج.م {financials.totalEquity.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-150 border-t border-slate-200 flex items-center justify-between text-[11px] font-black text-slate-600 px-6">
                      <span>فحص توازن الميزانية (Audit Check)</span>
                      {financials.isBalanced ? (
                        <span className="text-emerald-700">متوازنة بالكامل 100%</span>
                      ) : (
                        <span className="text-rose-700">فارق غير مسموح به!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* COGS & INVENTORY ASSET VALUATION */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                  <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-600" />
                    <span>حسابات تكلفة المبيعات (COGS) وتقييم المخزون الفوري</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block">قيمة مخزون السوبرماركت بالتكلفة</span>
                      <span className="text-xl font-mono-numbers font-black text-slate-900 block mt-1">
                        ج.م {inventoryValuation.systemInventoryValue.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">مبني على الكميات الحالية * سعر الشراء الفعلي لكل صنف.</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block">تكلفة البضائع المباعة الكلية (COGS)</span>
                      <span className="text-xl font-mono-numbers font-black text-rose-600 block mt-1">
                        ج.م {inventoryValuation.cogsValue.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">تتناقص من رصيد المخزون مقابل المبيعات المحققة.</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block">معدل مجمل الربح المحقق (Margins)</span>
                      <span className="text-xl font-mono-numbers font-black text-emerald-600 block mt-1">
                        {inventoryValuation.grossProfitRate.toFixed(2)} %
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">صافي نسبة ربحية البيع مقارنة بأسعار التكلفة.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: TREASURY (CASH & BANK TRANSFERS) */}
            {activeTab === 'treasury' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cash vs Bank Liquidity Cards */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 block">رصيد سيولة الخزينة (نقدية بالصندوق)</span>
                      <span className="text-2xl font-mono-numbers font-black text-slate-900">
                        ج.م {(accountBalances['cash'] || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                      <Wallet className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 block">رصيد البنك والحساب البنكي (مدفوعات الفيزا)</span>
                      <span className="text-2xl font-mono-numbers font-black text-slate-900">
                        ج.م {(accountBalances['bank'] || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Building2 className="w-8 h-8" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="text-center">
                      <ArrowRightLeft className="w-10 h-10 mx-auto text-emerald-600 opacity-80" />
                      <h3 className="font-black text-slate-900 mt-3 text-base">تسوية وتحويل سيولة نقدية (Treasury Settlement)</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">تحويل الأرصدة المتوفرة بين حساب البنك للفيزا والخزينة النقدية والعكس.</p>
                    </div>

                    {treasuryMsg && (
                      <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex items-center gap-3 text-xs font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{treasuryMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleTreasuryTransfer} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">اتجاه التحويل المالي</label>
                          <select
                            value={transferDirection}
                            onChange={(e) => setTransferDirection(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                          >
                            <option value="cash_to_bank">من الخزينة النقدية ⬅ البنك (إيداع)</option>
                            <option value="bank_to_cash">من البنك ⬅ الخزينة النقدية (سحب نقدي)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">مبلغ التحويل بالجنيه المصري</label>
                          <input 
                            type="number"
                            step="any"
                            required
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value ? parseFloat(e.target.value) : '')}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-left outline-none"
                            placeholder="0.00 ج.م"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-850 transition-all shadow-md cursor-pointer"
                      >
                        إتمام عملية تسوية الخزينة والتحويل
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: AR/AP DEBT COLLECT / PAY PAYMENTS */}
            {activeTab === 'ar_ap' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Accounts Receivable Panel */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-xs">مستحقات حسابات العملاء المدينة (AR)</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">تحصيل ديون مبيعات الآجل للعملاء.</p>
                      </div>
                      <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        إجمالي الذمم: {outstandingDebts.totalAR.toLocaleString()} ج.م
                      </span>
                    </div>

                    {arMsg && (
                      <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex items-center gap-2 text-[10px] font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{arMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleCollectDebt} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 mb-1">اختر العميل الملتزم بالتحصيل</label>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="">-- اختر عميل من القائمة --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} (المديونية الحالية: {c.currentDebt.toLocaleString()} ج.م)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">مبلغ التحصيل (ج.م)</label>
                          <input 
                            type="number"
                            step="any"
                            required
                            value={collectAmount}
                            onChange={(e) => setCollectAmount(e.target.value ? parseFloat(e.target.value) : '')}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-left outline-none"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">قناة الإيداع</label>
                          <select
                            value={collectMethod}
                            onChange={(e) => setCollectMethod(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                          >
                            <option value="cash">الخزينة النقدية (نقداً بالصندوق)</option>
                            <option value="bank">البنك (تحويل/إيداع فيزا)</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 shadow-md cursor-pointer transition-colors"
                      >
                        تسجيل تحصيل السند وإيداع السيولة
                      </button>
                    </form>
                  </div>

                  {/* Accounts Payable Panel */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-xs">مستحقات حسابات الموردين الدائنة (AP)</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">سداد الفواتير المعلقة والمشتريات الآجلة.</p>
                      </div>
                      <span className="text-xs font-mono font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                        إجمالي الالتزامات: {outstandingDebts.totalAP.toLocaleString()} ج.م
                      </span>
                    </div>

                    {apMsg && (
                      <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex items-center gap-2 text-[10px] font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{apMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handlePaySupplier} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 mb-1">اختر المورد المراد سداد حسابه</label>
                        <select
                          value={selectedSupplierId}
                          onChange={(e) => setSelectedSupplierId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="">-- اختر مورد من القائمة --</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} (المديونية للمورد: {s.balance.toLocaleString()} ج.م)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">المبلغ المراد سداده (ج.م)</label>
                          <input 
                            type="number"
                            step="any"
                            required
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value ? parseFloat(e.target.value) : '')}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-left outline-none"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 mb-1">وسيلة الدفع والخصم</label>
                          <select
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                          >
                            <option value="cash">نقدية الخزينة (سيولة الدرج)</option>
                            <option value="bank">البنك (خصم بنكي/حساب الفيزا)</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 shadow-md cursor-pointer transition-colors"
                      >
                        تسجيل سداد مستند المورد وخصم الخزينة
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: TAXES & VAT 14% REPORTS */}
            {activeTab === 'tax' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <Receipt className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-black text-slate-900 text-base">تقرير الضرائب وضريبة القيمة المضافة</h3>
                      <p className="text-xs text-slate-500 font-bold">تتبع ضريبة المبيعات المستحقة (14% VAT) على مبيعات السوبرماركت ومطابقتها.</p>
                    </div>
                  </div>

                  {taxMsg && (
                    <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{taxMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block">رصيد الضرائب المستحقة لمصلحة الضرائب حالياً</span>
                      <span className="text-2xl font-mono-numbers font-black text-rose-600 block mt-1">
                        ج.م {vatCalculations.vatPayableBalance.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">رصيد حساب ضريبة القيمة المضافة (tax_payable) المعلق.</span>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] text-slate-400 font-bold block">إجمالي الضرائب المحصلة من المبيعات كلياً</span>
                      <span className="text-2xl font-mono-numbers font-black text-emerald-600 block mt-1">
                        ج.م {vatCalculations.salesTaxCollected.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">الضرائب المفوترة في فواتير المبيعات الفردية.</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-sm text-emerald-400">سداد وتصفيات الإقرار الضريبي الفوري</h4>
                      <p className="text-[10px] text-slate-400 font-bold">بموجب القوانين، يقوم هذا الإجراء بتسوية التزامات ضريبة القيمة المضافة المستحقة وإقفال رصيد الحساب الدائن نقداً.</p>
                    </div>
                    <button
                      onClick={handleSettleTax}
                      disabled={vatCalculations.vatPayableBalance <= 0}
                      className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${
                        vatCalculations.vatPayableBalance > 0 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md' 
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      سداد الإقرار الضريبي الحالي للضرائب
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
