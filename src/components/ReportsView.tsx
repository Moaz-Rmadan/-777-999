import React, { useState, useMemo } from 'react';
import { Product, Invoice, Expense, PurchaseInvoice, User, Customer, Supplier, JournalEntry } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  FileText, 
  User as UserIcon,
  Calendar,
  CreditCard,
  ShoppingBag,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  AlertCircle,
  Percent,
  TrendingUp as TrendIcon,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  PieChart,
  Scale,
  Target,
  ShieldAlert,
  Activity,
  Wallet,
  Receipt,
  Users,
  Truck,
  HelpCircle,
  CheckCircle2,
  Sliders,
  Award,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportsViewProps {
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  purchases: PurchaseInvoice[];
  customers?: Customer[];
  suppliers?: Supplier[];
  journalEntries?: JournalEntry[];
  currentUser: User;
}

type ReportTab = 'financial' | 'cashflow' | 'balance_sheet' | 'aging' | 'breakeven' | 'sales' | 'insights';
type TimeRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
type SortField = 'name' | 'category' | 'qty' | 'total' | 'profit';
type SortOrder = 'asc' | 'desc';

export const ReportsView: React.FC<ReportsViewProps> = ({
  products = [],
  invoices = [],
  expenses = [],
  purchases = [],
  customers = [],
  suppliers = [],
  journalEntries = [],
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');
  const [timeRange, setTimeRange] = useState<TimeRange>('last7');
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().substring(0, 10));
  
  // Table state for products
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const itemsPerPage = 8;

  // ----------------------------------------------------
  // DATE RANGE LOGIC (With exact matching previous period)
  // ----------------------------------------------------
  const dateRanges = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    let start = todayStart;
    let end = todayEnd;
    let prevStart = todayStart;
    let prevEnd = todayEnd;

    if (timeRange === 'today') {
      start = todayStart;
      end = todayEnd;
      prevStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange === 'yesterday') {
      start = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      end = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);
      prevStart = new Date(todayStart.getTime() - 2 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(todayEnd.getTime() - 2 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'last7') {
      start = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      end = todayEnd;
      prevStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(start.getTime() - 1);
    } else if (timeRange === 'last30') {
      start = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
      end = todayEnd;
      prevStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(start.getTime() - 1);
    } else if (timeRange === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = todayEnd;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (timeRange === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const duration = end.getTime() - start.getTime();
      prevStart = new Date(start.getTime() - duration - 1);
      prevEnd = new Date(start.getTime() - 1);
    } else if (timeRange === 'custom') {
      start = new Date(startDate + 'T00:00:00');
      end = new Date(endDate + 'T23:59:59.999');
      const duration = end.getTime() - start.getTime();
      prevStart = new Date(start.getTime() - duration - 1);
      prevEnd = new Date(start.getTime() - 1);
    }

    return { start, end, prevStart, prevEnd };
  }, [timeRange, startDate, endDate]);

  // ----------------------------------------------------
  // FILTERED DATASETS FOR CURRENT & PREVIOUS PERIOD
  // ----------------------------------------------------
  const filteredData = useMemo(() => {
    // Current Period Filter
    const activeInvs = invoices
      .filter(inv => inv.status !== 'voided')
      .filter(inv => currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'accountant' ? true : inv.cashierName === currentUser.name)
      .filter(inv => {
        const d = new Date(inv.date);
        return d >= dateRanges.start && d <= dateRanges.end;
      });

    const activePurchases = purchases
      .filter(p => p.status !== 'voided')
      .filter(p => {
        const d = new Date(p.date);
        return d >= dateRanges.start && d <= dateRanges.end;
      });

    const activeExpenses = expenses
      .filter(e => e.status !== 'voided')
      .filter(e => {
        const d = new Date(e.date);
        return d >= dateRanges.start && d <= dateRanges.end;
      });

    // Previous Period Filter (for comparison)
    const prevInvs = invoices
      .filter(inv => inv.status !== 'voided')
      .filter(inv => currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'accountant' ? true : inv.cashierName === currentUser.name)
      .filter(inv => {
        const d = new Date(inv.date);
        return d >= dateRanges.prevStart && d <= dateRanges.prevEnd;
      });

    const prevPurchases = purchases
      .filter(p => p.status !== 'voided')
      .filter(p => {
        const d = new Date(p.date);
        return d >= dateRanges.prevStart && d <= dateRanges.prevEnd;
      });

    const prevExpenses = expenses
      .filter(e => e.status !== 'voided')
      .filter(e => {
        const d = new Date(e.date);
        return d >= dateRanges.prevStart && d <= dateRanges.prevEnd;
      });

    return {
      current: { invoices: activeInvs, purchases: activePurchases, expenses: activeExpenses },
      previous: { invoices: prevInvs, purchases: prevPurchases, expenses: prevExpenses }
    };
  }, [invoices, purchases, expenses, dateRanges, currentUser]);

  // ----------------------------------------------------
  // COMPREHENSIVE FINANCIAL METRICS
  // ----------------------------------------------------
  const metrics = useMemo(() => {
    const calcMetrics = (dataset: typeof filteredData.current) => {
      const grossSales = dataset.invoices.reduce((sum, inv) => sum + (inv.subtotal || inv.total), 0);
      const totalDiscounts = dataset.invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
      const sales = dataset.invoices.reduce((sum, inv) => sum + inv.total, 0);
      
      const expenseAmount = dataset.expenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Expenses by Category
      const expensesByCategory: Record<string, number> = {};
      dataset.expenses.forEach(e => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
      });

      const cogs = dataset.invoices.reduce((sum, inv) => {
        return sum + inv.items.reduce((itemSum, item) => itemSum + ((item.buyPrice || 0) * item.quantity), 0);
      }, 0);

      const grossProfit = sales - cogs;
      const operatingProfit = grossProfit - expenseAmount; // EBIT
      const netProfit = operatingProfit;
      const count = dataset.invoices.length;
      const avgInvoice = count > 0 ? sales / count : 0;

      // Cash vs Card vs Credit sales breakdown
      const cashSales = dataset.invoices.filter(i => i.paymentMethod === 'cash').reduce((s, i) => s + i.total, 0);
      const cardSales = dataset.invoices.filter(i => i.paymentMethod === 'card').reduce((s, i) => s + i.total, 0);
      const creditSales = dataset.invoices.filter(i => i.paymentMethod === 'credit').reduce((s, i) => s + i.total, 0);

      return { 
        grossSales, 
        totalDiscounts, 
        sales, 
        cogs, 
        grossProfit, 
        expenses: expenseAmount, 
        expensesByCategory,
        operatingProfit, 
        netProfit, 
        count, 
        avgInvoice,
        cashSales,
        cardSales,
        creditSales
      };
    };

    const current = calcMetrics(filteredData.current);
    const previous = calcMetrics(filteredData.previous);

    // Percentage Changes
    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      current,
      previous,
      changes: {
        sales: pctChange(current.sales, previous.sales),
        grossProfit: pctChange(current.grossProfit, previous.grossProfit),
        expenses: pctChange(current.expenses, previous.expenses),
        netProfit: pctChange(current.netProfit, previous.netProfit),
        avgInvoice: pctChange(current.avgInvoice, previous.avgInvoice)
      }
    };
  }, [filteredData]);

  // ----------------------------------------------------
  // BALANCE SHEET & CASH FLOW CALCULATIONS
  // ----------------------------------------------------
  const financialStatements = useMemo(() => {
    // 1. Balance Sheet Items
    const inventoryBuyValuation = products.reduce((sum, p) => sum + ((p.buyPrice || 0) * p.stock), 0);
    const inventorySellValuation = products.reduce((sum, p) => sum + ((p.sellPrice || 0) * p.stock), 0);
    const totalReceivables = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
    const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

    // Estimate Cash in Hand/Bank based on journal entries or cash sales minus expenses/purchases
    let totalCashBalance = 0;
    if (journalEntries.length > 0) {
      const cashDebit = journalEntries.filter(e => e.account === 'cash').reduce((s, e) => s + (e.debit || 0), 0);
      const cashCredit = journalEntries.filter(e => e.account === 'cash').reduce((s, e) => s + (e.credit || 0), 0);
      totalCashBalance = cashDebit - cashCredit;
    } else {
      // Fallback calculation from sales - expenses
      const allCashSales = invoices.filter(i => i.status !== 'voided' && i.paymentMethod === 'cash').reduce((s, i) => s + i.total, 0);
      const allExpenses = expenses.filter(e => e.status !== 'voided').reduce((s, e) => s + e.amount, 0);
      const allPaidPurchases = purchases.filter(p => p.status === 'paid').reduce((s, p) => s + p.total, 0);
      totalCashBalance = Math.max(0, allCashSales - allExpenses - allPaidPurchases);
    }

    const currentAssets = totalCashBalance + inventoryBuyValuation + totalReceivables;
    const currentLiabilities = totalPayables;
    const workingCapital = currentAssets - currentLiabilities;
    const equity = currentAssets - currentLiabilities;

    // 2. Cash Flow Items (Current Period)
    const cashInflowsSales = metrics.current.cashSales;
    const cashInflowsCollections = 0; // Customer debt payments in this period
    const totalCashInflows = cashInflowsSales + cashInflowsCollections;

    const paidPurchasesPeriod = filteredData.current.purchases.filter(p => p.status === 'paid').reduce((s, p) => s + p.total, 0);
    const cashOutflowsExpenses = metrics.current.expenses;
    const totalCashOutflows = paidPurchasesPeriod + cashOutflowsExpenses;

    const netOperatingCashFlow = totalCashInflows - totalCashOutflows;

    // 3. Break-Even Calculations
    // Fixed expenses vs Variable costs (COGS + 10% estimated variable operational fees)
    const fixedCosts = metrics.current.expenses;
    const totalSalesVal = metrics.current.sales || 1;
    const variableCosts = metrics.current.cogs;
    const contributionMargin = totalSalesVal - variableCosts;
    const contributionMarginRatio = contributionMargin / totalSalesVal;

    const breakEvenSales = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;
    const breakEvenInvoices = metrics.current.avgInvoice > 0 ? Math.ceil(breakEvenSales / metrics.current.avgInvoice) : 0;
    const marginOfSafety = totalSalesVal > breakEvenSales ? totalSalesVal - breakEvenSales : 0;
    const marginOfSafetyPct = totalSalesVal > 0 ? (marginOfSafety / totalSalesVal) * 100 : 0;

    // 4. Financial Health Score (0 to 100)
    let healthScore = 70; // baseline
    if (metrics.current.netProfit > 0) healthScore += 15; else healthScore -= 20;
    if (workingCapital > 0) healthScore += 10; else healthScore -= 15;
    if (contributionMarginRatio > 0.25) healthScore += 5;
    healthScore = Math.min(100, Math.max(0, healthScore));

    return {
      balanceSheet: {
        totalCashBalance,
        inventoryBuyValuation,
        inventorySellValuation,
        totalReceivables,
        totalPayables,
        currentAssets,
        currentLiabilities,
        workingCapital,
        equity
      },
      cashFlow: {
        cashInflowsSales,
        totalCashInflows,
        paidPurchasesPeriod,
        cashOutflowsExpenses,
        totalCashOutflows,
        netOperatingCashFlow
      },
      breakEven: {
        fixedCosts,
        variableCosts,
        contributionMargin,
        contributionMarginRatio,
        breakEvenSales,
        breakEvenInvoices,
        marginOfSafety,
        marginOfSafetyPct
      },
      healthScore
    };
  }, [products, customers, suppliers, journalEntries, invoices, expenses, purchases, metrics, filteredData]);

  // ----------------------------------------------------
  // AGING DEBT ANALYSIS (CUSTOMERS & SUPPLIERS)
  // ----------------------------------------------------
  const debtAging = useMemo(() => {
    // Customers with debt
    const customerDebts = customers.filter(c => (c.currentDebt || 0) > 0).map(c => {
      // Find latest unpaid invoice for this customer
      const custInvs = invoices.filter(i => i.customerName === c.name && i.status !== 'voided' && i.paymentMethod === 'credit');
      const latestDate = custInvs.length > 0 ? new Date(custInvs[custInvs.length - 1].date) : new Date();
      const diffDays = Math.max(0, Math.floor((new Date().getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)));

      let bucket: '30' | '60' | '90' | '90+' = '30';
      if (diffDays > 90) bucket = '90+';
      else if (diffDays > 60) bucket = '90';
      else if (diffDays > 30) bucket = '60';

      return { customer: c, debt: c.currentDebt, diffDays, bucket };
    });

    const customerBuckets = {
      b30: customerDebts.filter(d => d.bucket === '30').reduce((s, d) => s + d.debt, 0),
      b60: customerDebts.filter(d => d.bucket === '60').reduce((s, d) => s + d.debt, 0),
      b90: customerDebts.filter(d => d.bucket === '90').reduce((s, d) => s + d.debt, 0),
      b90plus: customerDebts.filter(d => d.bucket === '90+').reduce((s, d) => s + d.debt, 0)
    };

    // Suppliers with balance
    const supplierBalances = suppliers.filter(s => (s.balance || 0) > 0).map(s => {
      const suppPurchases = purchases.filter(p => p.supplierId === s.id && p.status === 'pending');
      const latestDate = suppPurchases.length > 0 ? new Date(suppPurchases[suppPurchases.length - 1].date) : new Date();
      const diffDays = Math.max(0, Math.floor((new Date().getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)));

      let bucket: '30' | '60' | '90' | '90+' = '30';
      if (diffDays > 90) bucket = '90+';
      else if (diffDays > 60) bucket = '90';
      else if (diffDays > 30) bucket = '60';

      return { supplier: s, balance: s.balance, diffDays, bucket };
    });

    const supplierBuckets = {
      b30: supplierBalances.filter(b => b.bucket === '30').reduce((s, b) => s + b.balance, 0),
      b60: supplierBalances.filter(b => b.bucket === '60').reduce((s, b) => s + b.balance, 0),
      b90: supplierBalances.filter(b => b.bucket === '90').reduce((s, b) => s + b.balance, 0),
      b90plus: supplierBalances.filter(b => b.bucket === '90+').reduce((s, b) => s + b.balance, 0)
    };

    return { customerDebts, customerBuckets, supplierBalances, supplierBuckets };
  }, [customers, suppliers, invoices, purchases]);

  // ----------------------------------------------------
  // EXTRA ANALYSIS & GROUPING FOR SALES & PRODUCTS
  // ----------------------------------------------------
  const analysis = useMemo(() => {
    const currInvs = filteredData.current.invoices;
    
    // Group by Cashier
    const cashierMap: Record<string, number> = {};
    currInvs.forEach(inv => {
      cashierMap[inv.cashierName] = (cashierMap[inv.cashierName] || 0) + inv.total;
    });
    const cashiers = Object.entries(cashierMap).sort((a, b) => b[1] - a[1]);

    // Group by Payment Method
    const paymentMap: Record<string, number> = { 'نقدي': 0, 'بطاقة': 0, 'آجل': 0 };
    currInvs.forEach(inv => {
      const method = inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'card' ? 'بطاقة' : 'آجل';
      paymentMap[method] = (paymentMap[method] || 0) + inv.total;
    });
    const paymentMethods = Object.entries(paymentMap);

    // Group by Product Performance
    const productMap: Record<string, { name: string; category: string; qty: number; total: number; profit: number }> = {};
    currInvs.forEach(inv => {
      inv.items.forEach(item => {
        if (!productMap[item.productId]) {
          const prodRef = products.find(p => p.id === item.productId);
          productMap[item.productId] = {
            name: item.productName || item.productId,
            category: prodRef?.category || 'عام',
            qty: 0,
            total: 0,
            profit: 0
          };
        }
        productMap[item.productId].qty += item.quantity;
        productMap[item.productId].total += item.total;
        productMap[item.productId].profit += item.total - ((item.buyPrice || 0) * item.quantity);
      });
    });

    const productsPerformance = Object.values(productMap);

    // Group by Category
    const categoryMap: Record<string, number> = {};
    productsPerformance.forEach(p => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + p.total;
    });
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    return { cashiers, paymentMethods, productsPerformance, categories };
  }, [filteredData, products]);

  // ----------------------------------------------------
  // CHART DATA GENERATION
  // ----------------------------------------------------
  const chartData = useMemo(() => {
    const currInvs = filteredData.current.invoices;
    const start = dateRanges.start;
    const end = dateRanges.end;

    if (timeRange === 'today' || timeRange === 'yesterday') {
      const hours = Array.from({ length: 24 }, (_, i) => ({
        label: `${i}:00`,
        value: 0
      }));
      currInvs.forEach(inv => {
        const h = new Date(inv.date).getHours();
        if (h >= 0 && h < 24) {
          hours[h].value += inv.total;
        }
      });
      return hours;
    }

    const dailyMap: Record<string, number> = {};
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i < Math.max(1, daysDiff); i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
      dailyMap[key] = 0;
    }

    currInvs.forEach(inv => {
      const key = new Date(inv.date).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += inv.total;
      }
    });

    return Object.entries(dailyMap).map(([label, value]) => ({ label, value }));
  }, [filteredData, timeRange, dateRanges]);

  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    return Math.ceil(maxVal / 100) * 100;
  }, [chartData]);

  // Table pagination
  const processedProductsTable = useMemo(() => {
    const filtered = analysis.productsPerformance.filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return { paginated, totalPages, totalItems };
  }, [analysis.productsPerformance, searchTerm, sortField, sortOrder, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['الصنف', 'التصنيف', 'الكمية المباعة', 'إجمالي الإيراد (ج.م)', 'إجمالي الربح التقديري (ج.م)'];
    const rows = analysis.productsPerformance.map(p => [
      p.name,
      p.category,
      p.qty,
      p.total.toFixed(2),
      p.profit.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_مالي_أداء_الأصناف_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openStandalonePrintWindow = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const dateStr = new Date().toLocaleDateString('ar-EG');
    const timeStr = new Date().toLocaleTimeString('ar-EG');
    
    const rangeLabel = timeRange === 'today' ? 'اليوم' :
      timeRange === 'yesterday' ? 'الأمس' :
      timeRange === 'last7' ? 'آخر 7 أيام' :
      timeRange === 'last30' ? 'آخر 30 يوم' :
      timeRange === 'thisMonth' ? 'الشهر الحالي' :
      timeRange === 'lastMonth' ? 'الشهر السابق' : `${startDate} إلى ${endDate}`;

    const reportHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>التقرير المالي الرسمي - ${dateStr}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          body { font-family: 'Cairo', sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #fff; direction: rtl; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #475569; }
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
          .meta-item strong { display: block; color: #64748b; font-size: 10px; margin-bottom: 2px; }
          .section-title { font-size: 14px; font-weight: 900; margin-top: 20px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
          th { background-color: #f1f5f9; font-weight: 700; }
          .highlight-row { background-color: #f8fafc; font-weight: 700; }
          .footer-signatures { margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; font-size: 11px; color: #475569; }
          .signature-box { border-top: 1px dashed #94a3b8; padding-top: 24px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:20px; text-align:left;">
          <button onclick="window.print()" style="padding:10px 20px; background:#0f172a; color:#fff; border:none; border-radius:6px; cursor:pointer; font-family:'Cairo'; font-weight:bold;">طباعة التقرير (Print)</button>
        </div>

        <div class="header">
          <h1>التقرير المالي والقوائم الحسابية المعتمدة</h1>
          <p>تاريخ الاستخراج: ${dateStr} - ${timeStr} | المستخدم: ${currentUser.name} (${currentUser.role})</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <strong>الفترة الزمنية المختارة</strong>
            <span>${rangeLabel}</span>
          </div>
          <div class="meta-item">
            <strong>عدد الفواتير الصادرة</strong>
            <span>${metrics?.current?.count || 0} فاتورة</span>
          </div>
          <div class="meta-item">
            <strong>متوسط قيمة الفاتورة</strong>
            <span>ج.م ${(metrics?.current?.avgInvoice || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="section-title">1. قائمة الدخل والربحية (Income Statement)</div>
        <table>
          <thead>
            <tr>
              <th>البند المحاسبي</th>
              <th>المبلغ بالجنيه (EGP)</th>
              <th>الملاحظات والتفاصيل</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>إجمالي المبيعات الإجمالية (Gross Sales)</td>
              <td>ج.م ${(metrics?.current?.grossSales || 0).toLocaleString()}</td>
              <td>المبيعات قبل تطبيق الخصومات</td>
            </tr>
            <tr>
              <td>إجمالي الخصومات والتخفيضات</td>
              <td>ج.م ${(metrics?.current?.totalDiscounts || 0).toLocaleString()}</td>
              <td>خصومات الفواتير الممنوحة للعملاء</td>
            </tr>
            <tr class="highlight-row">
              <td>صافي الإيرادات والمبيعات (Net Sales)</td>
              <td>ج.م ${(metrics?.current?.sales || 0).toLocaleString()}</td>
              <td>صافي المبيعات الفعلي المحقق</td>
            </tr>
            <tr>
              <td>تكلفة المبيعات والبضاعة المباعة (COGS)</td>
              <td>ج.م ${(metrics?.current?.cogs || 0).toLocaleString()}</td>
              <td>تكلفة التأسيس والتوريد للمنتجات المباعة</td>
            </tr>
            <tr class="highlight-row">
              <td>مجمل الربح التجاري (Gross Profit)</td>
              <td>ج.م ${(metrics?.current?.grossProfit || 0).toLocaleString()}</td>
              <td>الأرباح المباشرة قبل المصروفات التشغيلية</td>
            </tr>
            <tr>
              <td>المصروفات التشغيلية والعمومية (Operating Expenses)</td>
              <td>ج.م ${(metrics?.current?.expenses || 0).toLocaleString()}</td>
              <td>مصروفات الإيجار، الرواتب، النثريات، والصيانة</td>
            </tr>
            <tr class="highlight-row" style="background-color: #e2e8f0;">
              <td><strong>صافي الربح النهائي (Net Profit)</strong></td>
              <td><strong>ج.م ${(metrics?.current?.netProfit || 0).toLocaleString()}</strong></td>
              <td><strong>صافي الأرباح القابلة للتوزيع/الترحيل</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">2. ملخص المركز المالي والميزانية (Balance Sheet Summary)</div>
        <table>
          <thead>
            <tr>
              <th>بند المركز المالي</th>
              <th>القيمة بالجنيه (EGP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>قيمة المخزون السلعي (بسعر التكلفة)</td>
              <td>ج.م ${(financialStatements?.balanceSheet?.inventoryBuyValuation || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>إجمالي الذمم والديون المدينة (العملاء)</td>
              <td>ج.م ${(financialStatements?.balanceSheet?.totalReceivables || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>إجمالي الالتزامات والدائنين (الموردين)</td>
              <td>ج.م ${(financialStatements?.balanceSheet?.totalPayables || 0).toLocaleString()}</td>
            </tr>
            <tr class="highlight-row">
              <td>رأس المال العامل الصافي (Working Capital)</td>
              <td>ج.م ${(financialStatements?.balanceSheet?.workingCapital || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer-signatures">
          <div class="signature-box">
            <p>إعداد المحاسب المسؤول</p>
            <p>_____________________</p>
          </div>
          <div class="signature-box">
            <p>اعتماد مدير الإدارة المالية</p>
            <p>_____________________</p>
          </div>
          <div class="signature-box">
            <p>خاتم المنشأة / التاريخ</p>
            <p>_____________________</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 print:p-0 print:space-y-4">
      {/* Printable custom styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible !important;
          }
          #printable-report-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Header Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner no-print">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span>التقارير والتحليلات المالية المتقدمة</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-bold">
              {currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'accountant'
                ? 'منظومة الشؤون المالية والتقارير المعتمدة: قائمة الدخل، التدفقات النقدية، الميزانية، أعمار الديون، ونقطة التعادل' 
                : 'ملخص المبيعات الشخصية والأداء المالي الحالي'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all border border-slate-200 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير المالي</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير CSV / Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Time Period Control & Sub-tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Period options */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-2xl">
            {( [
              { id: 'today', label: 'اليوم' },
              { id: 'yesterday', label: 'الأمس' },
              { id: 'last7', label: 'آخر 7 أيام' },
              { id: 'last30', label: 'آخر 30 يوم' },
              { id: 'thisMonth', label: 'الشهر الحالي' },
              { id: 'lastMonth', label: 'الشهر السابق' },
              { id: 'custom', label: 'مخصص...' }
            ] as const).map(opt => (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  timeRange === opt.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Report Tab Selector */}
          <div className="flex flex-wrap p-1 bg-slate-100 rounded-2xl">
            {( [
              { id: 'financial', label: 'قائمة الدخل', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'cashflow', label: 'التدفقات النقدية', icon: <Wallet className="w-4 h-4" /> },
              { id: 'balance_sheet', label: 'الميزانية والمركز المالي', icon: <Scale className="w-4 h-4" /> },
              { id: 'aging', label: 'أعمار الديون والذمم', icon: <Clock className="w-4 h-4" /> },
              { id: 'breakeven', label: 'نقطة التعادل', icon: <Target className="w-4 h-4" /> },
              { id: 'sales', label: 'المبيعات والأصناف', icon: <ShoppingBag className="w-4 h-4" /> },
              { id: 'insights', label: 'الصحة والذكاء المالي', icon: <Activity className="w-4 h-4" /> }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-sm font-black' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Inputs */}
        <AnimatePresence>
          {timeRange === 'custom' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 items-end text-xs overflow-hidden"
            >
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">تاريخ البداية</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">تاريخ النهاية</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-emerald-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ----------------------------------------------------
          TAB 1: FINANCIALS (INCOME STATEMENT & P&L)
          ---------------------------------------------------- */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          
          {/* Main Financial KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Sales Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between print-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المبيعات الإجمالية</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-slate-900 font-mono-numbers">ج.م {metrics.current.sales.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 no-print">
                  {metrics.changes.sales >= 0 ? (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-mono-numbers">{metrics.changes.sales.toFixed(1)}%</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      <span className="font-mono-numbers">{Math.abs(metrics.changes.sales).toFixed(1)}%</span>
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-bold">مقارنة بالفترة السابقة</span>
                </div>
              </div>
            </div>

            {/* COGS Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between print-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تكلفة البضاعة المباعة (COGS)</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-slate-900 font-mono-numbers">ج.م {metrics.current.cogs.toLocaleString()}</p>
                <div className="text-[10px] font-bold text-slate-500">
                  تمثل <span className="font-mono-numbers">{(metrics.current.sales > 0 ? (metrics.current.cogs / metrics.current.sales * 100) : 0).toFixed(1)}%</span> من المبيعات
                </div>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between print-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المصروفات التشغيلية</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-slate-900 font-mono-numbers">ج.م {metrics.current.expenses.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 no-print">
                  {metrics.changes.expenses <= 0 ? (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      <span className="font-mono-numbers">{Math.abs(metrics.changes.expenses).toFixed(1)}%</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-mono-numbers">{metrics.changes.expenses.toFixed(1)}%</span>
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 font-bold">مقارنة بالفترة السابقة</span>
                </div>
              </div>
            </div>

            {/* Net Profit Card */}
            <div className={`p-6 rounded-3xl border shadow-lg flex flex-col justify-between print-card ${
              metrics.current.netProfit >= 0 
                ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/10' 
                : 'bg-rose-900 text-white border-rose-800 shadow-rose-900/10'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">صافي الربح / الخسارة</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  metrics.current.netProfit >= 0 ? 'bg-white/10 text-emerald-400' : 'bg-white/10 text-rose-400'
                }`}>
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black font-mono-numbers">ج.م {metrics.current.netProfit.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 no-print">
                  {metrics.changes.netProfit >= 0 ? (
                    <span className="text-[10px] font-black text-emerald-400 bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-mono-numbers">{metrics.changes.netProfit.toFixed(1)}%</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-400 bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      <span className="font-mono-numbers">{Math.abs(metrics.changes.netProfit).toFixed(1)}%</span>
                    </span>
                  )}
                  <span className="text-[9px] text-slate-300 font-bold">مقارنة بالفترة السابقة</span>
                </div>
              </div>
            </div>

          </div>

          {/* Income Statement Detailed Table & Ratios */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 print-card">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileText className="w-5 h-5 text-indigo-500" />
              <span>قائمة الدخل التحللية والمعتمدة (Profit & Loss Statement)</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Vertical Statement Layout */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-600">إجمالي إيرادات المبيعات (Gross Revenues)</span>
                  <span className="text-slate-900 font-black font-mono-numbers">ج.م {metrics.current.grossSales.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 font-bold text-amber-600">
                  <span>يخصم: الخصومات والتخفيضات الممنوحة</span>
                  <span className="font-black font-mono-numbers">ج.م {metrics.current.totalDiscounts.toLocaleString()} -</span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl font-bold text-slate-900 border border-slate-200">
                  <span>صافي الإيرادات (Net Revenues)</span>
                  <span className="font-black font-mono-numbers text-sm">ج.م {metrics.current.sales.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100 font-bold text-rose-600">
                  <span>يخصم: تكلفة البضاعة المباعة (COGS)</span>
                  <span className="font-black font-mono-numbers">ج.م {metrics.current.cogs.toLocaleString()} -</span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-emerald-50 rounded-2xl border border-emerald-100 font-bold text-emerald-800">
                  <span>مجمل الربح (Gross Profit)</span>
                  <span className="text-base font-black font-mono-numbers">ج.م {metrics.current.grossProfit.toLocaleString()}</span>
                </div>
                
                {/* Expense Categories Breakdown */}
                <div className="space-y-1.5 pt-2 pl-2">
                  <p className="font-black text-slate-500 text-[10px] uppercase">تفصيل المصروفات التشغيلية:</p>
                  {Object.entries(metrics.current.expensesByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between text-slate-500 font-bold pr-2 text-[11px]">
                      <span>• {cat}</span>
                      <span className="font-mono-numbers text-rose-600">ج.م {amt.toLocaleString()}</span>
                    </div>
                  ))}
                  {Object.keys(metrics.current.expensesByCategory).length === 0 && (
                    <p className="text-slate-400 italic text-[11px] pr-2">لا توجد مصروفات مسجلة بالفترة.</p>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 font-bold text-rose-600">
                  <span>إجمالي المصروفات التشغيلية</span>
                  <span className="font-black font-mono-numbers">ج.م {metrics.current.expenses.toLocaleString()} -</span>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-slate-900 text-white rounded-2xl border border-slate-800 font-bold shadow-md shadow-slate-900/10">
                  <span className="font-black">صافي الأرباح النشاطية (Net Operating Income)</span>
                  <span className="text-base font-black font-mono-numbers">ج.م {metrics.current.netProfit.toLocaleString()}</span>
                </div>
              </div>

              {/* Ratios & Operating Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">هامش الربح الإجمالي</span>
                  <div>
                    <span className="text-2xl font-black text-indigo-700 font-mono-numbers">
                      {(metrics.current.sales > 0 ? (metrics.current.grossProfit / metrics.current.sales * 100) : 0).toFixed(1)}%
                    </span>
                    <p className="text-[9px] text-indigo-400 font-bold mt-1">كفاءة الربح المباشر المتبقي بعد الخامات</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">هامش الربح الصافي</span>
                  <div>
                    <span className="text-2xl font-black text-teal-700 font-mono-numbers">
                      {(metrics.current.sales > 0 ? (metrics.current.netProfit / metrics.current.sales * 100) : 0).toFixed(1)}%
                    </span>
                    <p className="text-[9px] text-teal-400 font-bold mt-1">معدل العائد النهائي الصافي المتبقي للخزينة</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">متوسط قيمة الفاتورة (AOV)</span>
                    <span className="text-sm font-black text-slate-800 font-mono-numbers">ج.م {metrics.current.avgInvoice.toFixed(1)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-3 no-print">
                    <div 
                      className="h-full bg-slate-800 rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (metrics.current.avgInvoice / 1000) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">توزيع التحصيل حسب طرق الدفع</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs font-bold">
                    <div className="bg-white p-2 rounded-xl border border-amber-200">
                      <p className="text-[9px] text-slate-400">نقدي</p>
                      <p className="text-slate-900 font-mono-numbers">ج.م {metrics.current.cashSales.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-amber-200">
                      <p className="text-[9px] text-slate-400">بطاقة</p>
                      <p className="text-slate-900 font-mono-numbers">ج.م {metrics.current.cardSales.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-amber-200">
                      <p className="text-[9px] text-slate-400">آجل (ديون)</p>
                      <p className="text-slate-900 font-mono-numbers">ج.م {metrics.current.creditSales.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: CASH FLOW STATEMENT
          ---------------------------------------------------- */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print-card">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي التدفقات النقدية الداخلة</span>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono-numbers">
                + ج.م {financialStatements.cashFlow.totalCashInflows.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">المقبوضات المباشرة من المبيعات والتحصيلات</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print-card">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي التدفقات النقدية الخارجة</span>
              <p className="text-2xl font-black text-rose-600 mt-2 font-mono-numbers">
                - ج.م {financialStatements.cashFlow.totalCashOutflows.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">المدفوعات الفورية لشراء المخزون والمصروفات</p>
            </div>

            <div className={`p-6 rounded-3xl border shadow-sm print-card ${
              financialStatements.cashFlow.netOperatingCashFlow >= 0 ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-rose-900 text-white border-rose-800'
            }`}>
              <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">صافي التدفق النقدي التشغيلي</span>
              <p className="text-2xl font-black mt-2 font-mono-numbers">
                ج.م {financialStatements.cashFlow.netOperatingCashFlow.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-200 font-bold mt-1">السيولة الصافية المولدة من عمليات الفترة</p>
            </div>

          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>جدول حركة المقبوضات والمدفوعات النقدية بالتفصيل</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">بيان التدفق النقدي</th>
                    <th className="px-4 py-3 text-left">التدفقات الداخلة (+ Inflow)</th>
                    <th className="px-4 py-3 text-left">التدفقات الخارجة (- Outflow)</th>
                    <th className="px-4 py-3 text-left">الرصيد الصافي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">المبيعات النقدية المباشرة (POS Cash Sales)</td>
                    <td className="px-4 py-3 text-left font-bold text-emerald-600 font-mono-numbers">ج.م {financialStatements.cashFlow.cashInflowsSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-left font-bold text-slate-400 font-mono-numbers">-</td>
                    <td className="px-4 py-3 text-left font-black text-emerald-600 font-mono-numbers">ج.م {financialStatements.cashFlow.cashInflowsSales.toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">المصروفات التشغيلية والرواتب المسددة</td>
                    <td className="px-4 py-3 text-left font-bold text-slate-400 font-mono-numbers">-</td>
                    <td className="px-4 py-3 text-left font-bold text-rose-600 font-mono-numbers">ج.م {financialStatements.cashFlow.cashOutflowsExpenses.toLocaleString()}</td>
                    <td className="px-4 py-3 text-left font-black text-rose-600 font-mono-numbers">- ج.م {financialStatements.cashFlow.cashOutflowsExpenses.toLocaleString()}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">المشتريات السداد الفوري للموردين</td>
                    <td className="px-4 py-3 text-left font-bold text-slate-400 font-mono-numbers">-</td>
                    <td className="px-4 py-3 text-left font-bold text-rose-600 font-mono-numbers">ج.م {financialStatements.cashFlow.paidPurchasesPeriod.toLocaleString()}</td>
                    <td className="px-4 py-3 text-left font-black text-rose-600 font-mono-numbers">- ج.م {financialStatements.cashFlow.paidPurchasesPeriod.toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black">
                  <tr>
                    <td className="px-4 py-3">إجمالي التدفق النقدي المباشر للفترة</td>
                    <td className="px-4 py-3 text-left text-emerald-400 font-mono-numbers">ج.م {financialStatements.cashFlow.totalCashInflows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-left text-rose-400 font-mono-numbers">ج.م {financialStatements.cashFlow.totalCashOutflows.toLocaleString()}</td>
                    <td className="px-4 py-3 text-left font-mono-numbers text-base">ج.م {financialStatements.cashFlow.netOperatingCashFlow.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: BALANCE SHEET & FINANCIAL POSITION
          ---------------------------------------------------- */}
      {activeTab === 'balance_sheet' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 print-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  <span>الميزانية العمومية والمركز المالي (Balance Sheet Statement)</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">توازن الأصول والخصوم وحقوق الملكية للنشاط التجاري</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-800 text-xs font-black rounded-xl border border-indigo-100">ميزانية متوازنة</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Assets Side */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>الأصول (Assets)</span>
                  </h4>
                  <span className="text-xs font-black text-emerald-700 font-mono-numbers">ج.م {financialStatements.balanceSheet.currentAssets.toLocaleString()}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-slate-700">
                    <span>النقدية بالخزينة والصناديق (Cash & Bank)</span>
                    <span className="font-mono-numbers font-black text-slate-900">ج.م {financialStatements.balanceSheet.totalCashBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-slate-700">
                    <span>تقييم المخزون السلعي (بسعر التكلفة)</span>
                    <span className="font-mono-numbers font-black text-slate-900">ج.م {financialStatements.balanceSheet.inventoryBuyValuation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-slate-700">
                    <span>الذمم المدينة لديون العملاء (Accounts Receivable)</span>
                    <span className="font-mono-numbers font-black text-slate-900">ج.م {financialStatements.balanceSheet.totalReceivables.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-100/60 text-emerald-900 rounded-xl font-black text-xs flex justify-between border border-emerald-200">
                  <span>إجمالي قيمة الأصول المتداولة:</span>
                  <span className="font-mono-numbers text-sm">ج.م {financialStatements.balanceSheet.currentAssets.toLocaleString()}</span>
                </div>
              </div>

              {/* Liabilities & Equity Side */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-rose-600" />
                    <span>الخصوم وحقوق الملكية (Liabilities & Equity)</span>
                  </h4>
                  <span className="text-xs font-black text-rose-700 font-mono-numbers">ج.م {financialStatements.balanceSheet.currentAssets.toLocaleString()}</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-slate-700">
                    <span>الذمم الدائنة لمستحقات الموردين (Accounts Payable)</span>
                    <span className="font-mono-numbers font-black text-rose-600">ج.م {financialStatements.balanceSheet.totalPayables.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 font-bold text-slate-700">
                    <span>حقوق الملكية والأرباح التراكمية (Equity & Capital)</span>
                    <span className="font-mono-numbers font-black text-slate-900">ج.م {financialStatements.balanceSheet.equity.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-white rounded-xl font-black text-xs flex justify-between">
                  <span>إجمالي الخصوم + حقوق الملكية:</span>
                  <span className="font-mono-numbers text-sm">ج.م {financialStatements.balanceSheet.currentAssets.toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Working Capital Banner */}
            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-indigo-900">صافي رأس المال العامل (Working Capital)</p>
                <p className="text-[11px] text-indigo-700 font-bold mt-0.5">القدرة على تغطية الالتزامات قصيرة الأجل (الأصول المتداولة - الخصوم المتداولة)</p>
              </div>
              <span className="text-xl font-black text-indigo-800 font-mono-numbers bg-white px-4 py-2 rounded-xl border border-indigo-200 shadow-xs">
                ج.م {financialStatements.balanceSheet.workingCapital.toLocaleString()}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: AGING ACCOUNTS (RECEIVABLE & PAYABLE)
          ---------------------------------------------------- */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Debt Aging */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>جدول اعمار ديون العملاء (Receivables Aging)</span>
                </h3>
                <span className="text-xs font-black text-amber-700 font-mono-numbers">
                  ج.م {debtAging.customerDebts.reduce((s,d)=>s+d.debt,0).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-[9px] text-emerald-700 block">أقل من 30 يوم</span>
                  <span className="font-mono-numbers text-emerald-900 font-black">ج.م {debtAging.customerBuckets.b30.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <span className="text-[9px] text-amber-700 block">31 - 60 يوم</span>
                  <span className="font-mono-numbers text-amber-900 font-black">ج.م {debtAging.customerBuckets.b60.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-xl">
                  <span className="text-[9px] text-orange-700 block">61 - 90 يوم</span>
                  <span className="font-mono-numbers text-orange-900 font-black">ج.م {debtAging.customerBuckets.b90.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-[9px] text-rose-700 block">+90 يوم (خطر)</span>
                  <span className="font-mono-numbers text-rose-900 font-black">ج.م {debtAging.customerBuckets.b90plus.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {debtAging.customerDebts.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.customer.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono-numbers">عمر الدين: {item.diffDays} يوم</p>
                    </div>
                    <span className="font-black text-amber-700 font-mono-numbers">ج.م {item.debt.toLocaleString()}</span>
                  </div>
                ))}
                {debtAging.customerDebts.length === 0 && (
                  <p className="text-center py-6 text-slate-400 italic text-xs">لا توجد ديون مستحقة على العملاء حالياً.</p>
                )}
              </div>
            </div>

            {/* Supplier Payables Aging */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>جدول اعمار مستحقات الموردين (Payables Aging)</span>
                </h3>
                <span className="text-xs font-black text-blue-700 font-mono-numbers">
                  ج.م {debtAging.supplierBalances.reduce((s,b)=>s+b.balance,0).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-[9px] text-emerald-700 block">أقل من 30 يوم</span>
                  <span className="font-mono-numbers text-emerald-900 font-black">ج.م {debtAging.supplierBuckets.b30.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                  <span className="text-[9px] text-blue-700 block">31 - 60 يوم</span>
                  <span className="font-mono-numbers text-blue-900 font-black">ج.م {debtAging.supplierBuckets.b60.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <span className="text-[9px] text-indigo-700 block">61 - 90 يوم</span>
                  <span className="font-mono-numbers text-indigo-900 font-black">ج.م {debtAging.supplierBuckets.b90.toLocaleString()}</span>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-[9px] text-rose-700 block">+90 يوم (تأخير)</span>
                  <span className="font-mono-numbers text-rose-900 font-black">ج.م {debtAging.supplierBuckets.b90plus.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {debtAging.supplierBalances.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.supplier.name} ({item.supplier.company})</p>
                      <p className="text-[10px] text-slate-400 font-mono-numbers">مدة الاستحقاق: {item.diffDays} يوم</p>
                    </div>
                    <span className="font-black text-rose-600 font-mono-numbers">ج.م {item.balance.toLocaleString()}</span>
                  </div>
                ))}
                {debtAging.supplierBalances.length === 0 && (
                  <p className="text-center py-6 text-slate-400 italic text-xs">لا توجد مستحقات متأخرة للموردين حالياً.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          TAB 5: BREAK-EVEN & MARGIN ANALYSIS
          ---------------------------------------------------- */}
      {activeTab === 'breakeven' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print-card">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي التكاليف الثابتة (Fixed)</span>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono-numbers">
                ج.م {financialStatements.breakEven.fixedCosts.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">المصروفات التشغيلية المباشرة للفترة</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print-card">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نقطة التعادل بالإيراد (Break-Even Revenue)</span>
              <p className="text-2xl font-black text-indigo-600 mt-2 font-mono-numbers">
                ج.م {financialStatements.breakEven.breakEvenSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">الإيراد المطلوب لتغطية كافة المصروفات دون خسارة</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print-card">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">هامش الأمان (Margin of Safety)</span>
              <p className="text-2xl font-black text-emerald-600 mt-2 font-mono-numbers">
                {financialStatements.breakEven.marginOfSafetyPct.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">نسبة الفائض الحالي عن نقطة التعادل</p>
            </div>

          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 print-card">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>تحليل استراتيجي لنقطة التعادل وهامش المساهمة (Break-Even Analysis)</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
              
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-600">هامش المساهمة الكلي (Contribution Margin)</span>
                  <span className="font-mono-numbers font-black text-emerald-600">ج.م {financialStatements.breakEven.contributionMargin.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-600">نسبة هامش المساهمة (Margin Ratio)</span>
                  <span className="font-mono-numbers font-black text-indigo-600">{(financialStatements.breakEven.contributionMarginRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 font-bold">
                  <span className="text-slate-600">عدد الفواتير المطلوبة للوصول للتعادل</span>
                  <span className="font-mono-numbers font-black text-slate-900">{financialStatements.breakEven.breakEvenInvoices} فاتورة</span>
                </div>
                <div className="flex justify-between py-2.5 px-3 bg-emerald-50 rounded-xl border border-emerald-100 font-bold text-emerald-900">
                  <span>فائض مبيعات الأمان بعد التعادل</span>
                  <span className="font-mono-numbers font-black">ج.م {financialStatements.breakEven.marginOfSafety.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <p className="font-black text-slate-900 text-sm">مفاهيم التخطيط المالي:</p>
                <p className="text-slate-600 leading-relaxed font-bold">
                  تعبر <strong>نقطة التعادل</strong> عن الحد الأدنى من المبيعات اللازم لتغطية التكاليف دون تحقيق ربح أو خسارة. 
                  كل جنيه مبيعات يتجاوز مبلغ التعادل (<strong>ج.م {financialStatements.breakEven.breakEvenSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>) 
                  يساهم بشكل مباشر بنسبة <strong>{(financialStatements.breakEven.contributionMarginRatio * 100).toFixed(1)}%</strong> في صافي الأرباح المباشرة.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 6: SALES & PRODUCT PERFORMANCE
          ---------------------------------------------------- */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase">مجموع الفواتير</span>
              <p className="text-lg font-black text-slate-900 mt-1 font-mono-numbers">{metrics.current.count} فاتورة</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase">إجمالي مبيعات اليوم</span>
              <p className="text-lg font-black text-slate-900 mt-1 font-mono-numbers">
                ج.م {(invoices.filter(i=>i.date.startsWith(new Date().toISOString().substring(0, 10)) && i.status !== 'voided').reduce((s,i)=>s+i.total, 0)).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase">طريقة الدفع نقدي</span>
              <p className="text-lg font-black text-emerald-600 mt-1 font-mono-numbers">
                ج.م {(analysis.paymentMethods.find(m => m[0] === 'نقدي')?.[1] || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase">أفضل فئة مبيعاً</span>
              <p className="text-lg font-black text-indigo-600 mt-1 truncate" title={analysis.categories[0]?.[0] || '---'}>
                {analysis.categories[0]?.[0] || '---'}
              </p>
            </div>
          </div>

          {/* SVG Trend Area Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">مخطط حركة وتوجه المبيعات</h4>
                <p className="text-[10px] text-slate-400 font-bold">الرصد البياني المباشر للإيرادات عبر الفترة المحددة</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg no-print">تحديث مباشر</span>
            </div>

            {chartData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-slate-400 italic font-bold">
                لا توجد مبيعات في الفترة المختارة لعرض المخطط.
              </div>
            ) : (
              <div className="w-full">
                <svg viewBox="0 0 800 240" className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="40" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="70" x2="780" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="120" x2="780" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="170" x2="780" y2="170" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="220" x2="780" y2="220" stroke="#f1f5f9" strokeWidth="1" />

                  {(() => {
                    const width = 740;
                    const height = 200;
                    const len = chartData.length;
                    const points = chartData.map((d, index) => {
                      const x = 40 + (index / (len - 1 || 1)) * width;
                      const y = 220 - (d.value / maxChartValue) * height;
                      return { x, y, label: d.label, value: d.value };
                    });

                    const pathD = points.reduce((acc, p, i) => {
                      return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                    }, '');

                    const areaD = pathD + ` L ${points[points.length - 1].x} 220 L ${points[0].x} 220 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#salesGrad)" />
                        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {points.map((p, i) => (
                          <g key={i} className="group cursor-pointer">
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="4" 
                              fill="#ffffff" 
                              stroke="#4f46e5" 
                              strokeWidth="2" 
                              className="transition-all hover:r-6"
                            />
                            <title>{`${p.label}: ج.م ${p.value.toLocaleString()}`}</title>
                          </g>
                        ))}

                        {points.filter((_, idx) => {
                          if (len <= 10) return true;
                          return idx % Math.ceil(len / 8) === 0 || idx === len - 1;
                        }).map((p, i) => (
                          <text 
                            key={i} 
                            x={p.x} 
                            y="235" 
                            textAnchor="middle" 
                            fill="#94a3b8" 
                            fontSize="9" 
                            fontWeight="bold"
                          >
                            {p.label}
                          </text>
                        ))}

                        <text x="35" y="25" textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="bold">{maxChartValue.toLocaleString()}</text>
                        <text x="35" y="125" textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="bold">{(maxChartValue / 2).toLocaleString()}</text>
                        <text x="35" y="223" textAnchor="end" fill="#94a3b8" fontSize="8" fontWeight="bold">0</text>
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Category Analysis List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card lg:col-span-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>المبيعات حسب الفئات</span>
              </h4>
              <div className="space-y-4">
                {analysis.categories.map(([cat, total]) => {
                  const percentage = metrics.current.sales > 0 ? (total / metrics.current.sales) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{cat}</span>
                        <span className="font-mono-numbers">{total.toLocaleString()} ج.م ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden no-print">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {analysis.categories.length === 0 && (
                  <p className="text-center py-8 text-slate-400 italic">لا توجد مبيعات فئات.</p>
                )}
              </div>
            </div>

            {/* Cashiers Performance & Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <span>مبيعات موظفي الصندوق (الكاشير)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysis.cashiers.map(([name, total]) => (
                    <div key={name} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-xs font-black text-slate-700">{name}</span>
                      <span className="text-xs font-black text-slate-900 font-mono-numbers">ج.م {(total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {analysis.cashiers.length === 0 && (
                    <p className="text-center py-6 text-slate-400 italic col-span-2 text-xs">لا توجد عمليات مبيعات مسجلة لموظفين.</p>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Interactive Products sales performance table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print-card">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">جدول أداء ومبيعات الأصناف بالتفصيل</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1">فرز وتصفية جميع المنتجات المباعة خلال الفترة الحالية</p>
              </div>

              <div className="relative max-w-xs w-full no-print">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث عن صنف..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs text-slate-700 font-black z-10 border-b border-slate-200 select-none">
                  <tr>
                    <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>الصنف</th>
                    <th className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('category')}>التصنيف</th>
                    <th className="px-3.5 py-2.5 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('qty')}>الكمية المباعة</th>
                    <th className="px-3.5 py-2.5 text-left cursor-pointer hover:bg-slate-100" onClick={() => handleSort('total')}>إجمالي الإيرادات</th>
                    <th className="px-3.5 py-2.5 text-left cursor-pointer hover:bg-slate-100" onClick={() => handleSort('profit')}>هامش الربح المساهم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedProductsTable.paginated.map((p, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 even:bg-slate-50/40 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-3.5 py-2.5 text-slate-500">{p.category}</td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-slate-700 font-mono-numbers">{p.qty} وحدة</td>
                      <td className="px-3.5 py-2.5 text-left font-bold text-slate-900 font-mono-numbers">ج.م {p.total.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 text-left font-black text-emerald-600 font-mono-numbers">ج.م {p.profit.toLocaleString()}</td>
                    </tr>
                  ))}
                  {processedProductsTable.paginated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 italic">لا توجد أصناف تطابق البحث أو في نطاق التصفية المختار.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            {processedProductsTable.totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between no-print">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 inline" /> السابق
                </button>
                <span className="text-xs font-black text-slate-500">صفحة {currentPage} من {processedProductsTable.totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(processedProductsTable.totalPages, prev + 1))}
                  disabled={currentPage === processedProductsTable.totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  التالي <ChevronLeft className="w-4 h-4 inline" />
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          TAB 7: FINANCIAL INTELLIGENCE & HEALTH SCORE
          ---------------------------------------------------- */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Financial Health Gauge */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between print-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">مؤشر الصحة المالية العام</span>
                <Award className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="my-6 text-center space-y-2">
                <p className="text-5xl font-black text-emerald-400 font-mono-numbers">{financialStatements.healthScore}</p>
                <p className="text-xs text-slate-300 font-bold">من أصل 100 نقطة قياسية</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl text-[10px] text-slate-300 font-bold text-center">
                {financialStatements.healthScore >= 80 ? 'أداء مالي ممتازة ومعدلات سيولة وربحية متينة' : 
                 financialStatements.healthScore >= 60 ? 'وضع مالي مستقر مع إمكانية تحسين هوامش الربح' : 
                 'ينصح بضبط المصروفات وتحصيل الديون المتأخرة'}
              </div>
            </div>

            {/* Smart Automated Insights */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card md:col-span-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                <span>الرؤى والتحليلات الأوتوماتيكية الذكية</span>
              </h3>
              
              <div className="space-y-3">
                
                {/* Rule 1: Sales Concentration */}
                {analysis.productsPerformance.length > 0 && (
                  <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-black text-blue-900">تركيز المبيعات الاستراتيجي</p>
                      <p className="text-blue-700 leading-relaxed font-bold">
                        المنتج الأكثر مبيعاً <strong>({analysis.productsPerformance.sort((a,b)=>b.total-a.total)[0]?.name})</strong> يمثل وحدہ 
                        {' '} <span className="font-mono-numbers">{((analysis.productsPerformance.sort((a,b)=>b.total-a.total)[0]?.total / (metrics.current.sales || 1)) * 100).toFixed(1)}%</span> من مجمل المبيعات في هذه الفترة. تأكد من ثبات سلسلة توريده.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rule 2: Profit contribution indicator */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-black text-emerald-900">معدل كفاءة التشغيل المالي</p>
                    <p className="text-emerald-700 leading-relaxed font-bold">
                      أرباح النشاط تساهم بنسبة <strong className="font-mono-numbers">{(metrics.current.sales > 0 ? (metrics.current.netProfit / metrics.current.sales * 100) : 0).toFixed(1)}%</strong> من إجمالي التدفق الوارد. هذه النسبة ممتازة وتعني الحفاظ على تكاليف تشغيل منخفضة.
                    </p>
                  </div>
                </div>

                {/* Rule 3: Debt-to-Sales Warning */}
                {analysis.paymentMethods.find(m => m[0] === 'آجل')?.[1] && (
                  <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-black text-amber-900">تحذير الديون والذمم المدينة</p>
                      <p className="text-amber-700 leading-relaxed font-bold">
                        تصل نسبة مبيعات الآجل إلى <strong className="font-mono-numbers">{((analysis.paymentMethods.find(m => m[0] === 'آجل')?.[1] || 0) / (metrics.current.sales || 1) * 100).toFixed(1)}%</strong> من الإيرادات. نوصي بمتابعة المذكرات الدورية للتحصيل لضمان سيولة الخزينة.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Inventory Valuation Insights */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 print-card">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>تحليل قيمة وقنوات المخزون السلعي الكامن</span>
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold text-xs">
                <span className="text-slate-500">إجمالي قيمة رأس المال المستثمر في المخزن (تكلفة الشراء)</span>
                <span className="text-slate-900 font-black font-mono-numbers">
                  ج.م {products.reduce((s,p)=>s+((p.buyPrice || 0) * p.stock), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold text-xs">
                <span className="text-slate-500">القيمة البيعية المتوقعة للمخزن بالكامل (سعر التجزئة)</span>
                <span className="text-slate-900 font-black font-mono-numbers">
                  ج.م {products.reduce((s,p)=>s+((p.sellPrice || 0) * p.stock), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 font-bold text-xs">
                <span className="text-indigo-900 font-black">هامش الربح المتوقع الكامن بالمخزن</span>
                <span className="text-indigo-700 font-black font-mono-numbers">
                  ج.م {(products.reduce((s,p)=>s+((p.sellPrice || 0) * p.stock), 0) - products.reduce((s,p)=>s+((p.buyPrice || 0) * p.stock), 0)).toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 leading-relaxed font-bold">
                يعد المخزن صمام الأمان المالي الرئيسي لعملياتك. يرجى مراجعة صفحة الأصناف بانتظام لتصفية الرواكد وتحفيز المبيعات للمنتجات ذات الهامش المرتفع.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Financial Report Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">معاينة وطباعة التقرير المالي المعتمد</h3>
                  <p className="text-xs text-slate-500 font-bold">يمكنك الطباعة المباشرة، التصدير لـ PDF، أو الفتح في نافذة منفصلة</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية (Print)</span>
                </button>

                <button
                  onClick={openStandalonePrintWindow}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح في نافذة طباعة جديدة</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area Content */}
            <div id="printable-report-area" className="space-y-6 bg-white p-4 lg:p-6 text-slate-900 font-sans">
              
              {/* Header Letterhead */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-2xl font-black text-xl mb-1">
                  POS
                </div>
                <h1 className="text-2xl font-black text-slate-900">التقرير المالي والقوائم الحسابية المعتمدة</h1>
                <p className="text-xs font-bold text-slate-600">
                  تاريخ الإصدار والاستخراج: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')} | المستخرج: {currentUser.name} ({currentUser.role})
                </p>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="block text-slate-500 font-bold mb-1">الفترة الزمنية المختارة</span>
                  <span className="font-black text-slate-900">
                    {timeRange === 'today' ? 'اليوم' :
                     timeRange === 'yesterday' ? 'الأمس' :
                     timeRange === 'last7' ? 'آخر 7 أيام' :
                     timeRange === 'last30' ? 'آخر 30 يوم' :
                     timeRange === 'thisMonth' ? 'الشهر الحالي' :
                     timeRange === 'lastMonth' ? 'الشهر السابق' : `${startDate} إلى ${endDate}`}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold mb-1">عدد الفواتير الصادرة</span>
                  <span className="font-black text-slate-900">{metrics?.current?.count || 0} فاتورة</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-bold mb-1">متوسط قيمة الفاتورة</span>
                  <span className="font-black text-slate-900 font-mono-numbers">ج.م {(metrics?.current?.avgInvoice || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* 1. Income Statement Table */}
              <div className="space-y-3">
                <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200">
                  1. قائمة الدخل والأرباح التشغيلية (Income Statement)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold">
                        <th className="p-3 border border-slate-200">البند المحاسبي</th>
                        <th className="p-3 border border-slate-200">المبلغ بالجنيه (EGP)</th>
                        <th className="p-3 border border-slate-200">البيان والتفاصيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3 border border-slate-200 font-bold">إجمالي المبيعات الإجمالية (Gross Sales)</td>
                        <td className="p-3 border border-slate-200 font-black font-mono-numbers">ج.م {(metrics?.current?.grossSales || 0).toLocaleString()}</td>
                        <td className="p-3 border border-slate-200 text-slate-500">المبيعات قبل الخصومات</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-slate-200 font-bold">إجمالي الخصومات والتخفيضات</td>
                        <td className="p-3 border border-slate-200 font-black text-rose-600 font-mono-numbers">ج.م {(metrics?.current?.totalDiscounts || 0).toLocaleString()}</td>
                        <td className="p-3 border border-slate-200 text-slate-500">خصومات الفواتير الممنوحة للعملاء</td>
                      </tr>
                      <tr className="bg-slate-50 font-black">
                        <td className="p-3 border border-slate-200">صافي الإيرادات والمبيعات (Net Revenue)</td>
                        <td className="p-3 border border-slate-200 text-emerald-700 font-mono-numbers">ج.م {(metrics?.current?.sales || 0).toLocaleString()}</td>
                        <td className="p-3 border border-slate-200 text-slate-600">صافي المبيعات الفعلي المحقق</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-slate-200 font-bold">تكلفة المبيعات والبضاعة المباعة (COGS)</td>
                        <td className="p-3 border border-slate-200 font-black text-slate-800 font-mono-numbers">ج.م {(metrics?.current?.cogs || 0).toLocaleString()}</td>
                        <td className="p-3 border border-slate-200 text-slate-500">تكلفة التأسيس والتوريد للمنتجات المباعة</td>
                      </tr>
                      <tr className="bg-slate-50 font-black">
                        <td className="p-3 border border-slate-200">مجمل الربح التجاري (Gross Profit)</td>
                        <td className="p-3 border border-slate-200 text-emerald-800 font-mono-numbers">ج.م {(metrics?.current?.grossProfit || 0).toLocaleString()}</td>
                        <td className="p-3 border border-slate-200 text-slate-600">الأرباح المباشرة قبل المصروفات التشغيلية</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-slate-200 font-bold">المصروفات التشغيلية والعمومية (Expenses)</td>
                        <td className="p-3 border border-slate-200 font-black text-rose-600 font-mono-numbers">ج.م {(metrics?.current?.expenses || 0).toLocaleString()}</td>
                        <td className="p-3 border border-slate-200 text-slate-500">مصروفات الإيجار، الرواتب، النثريات والصيانة</td>
                      </tr>
                      <tr className="bg-slate-900 text-white font-black text-sm">
                        <td className="p-3 border border-slate-900">صافي الربح النهائي (Net Profit)</td>
                        <td className="p-3 border border-slate-900 font-mono-numbers">ج.م {(metrics?.current?.netProfit || 0).toLocaleString()}</td>
                        <td className="p-3 border border-slate-900 text-slate-300 font-normal text-xs">الربح الصافي النهائي المعتمد</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Balance Sheet Summary Table */}
              <div className="space-y-3 pt-2">
                <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200">
                  2. ملخص قائمة المركز المالي والميزانية (Balance Sheet Summary)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold">
                        <th className="p-3 border border-slate-200">بند المركز المالي</th>
                        <th className="p-3 border border-slate-200">القيمة بالجنيه (EGP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3 border border-slate-200 font-bold">قيمة المخزون السلعي الحالي (بسعر التكلفة)</td>
                        <td className="p-3 border border-slate-200 font-black font-mono-numbers">ج.م {(financialStatements?.balanceSheet?.inventoryBuyValuation || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-slate-200 font-bold">إجمالي الذمم والديون المدينة (المستحق على العملاء)</td>
                        <td className="p-3 border border-slate-200 font-black font-mono-numbers">ج.م {(financialStatements?.balanceSheet?.totalReceivables || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="p-3 border border-slate-200 font-bold">إجمالي الالتزامات والدائنين (المستحق للموردين)</td>
                        <td className="p-3 border border-slate-200 font-black text-rose-600 font-mono-numbers">ج.م {(financialStatements?.balanceSheet?.totalPayables || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-emerald-50 font-black text-emerald-900">
                        <td className="p-3 border border-slate-200">رأس المال العامل الصافي (Working Capital)</td>
                        <td className="p-3 border border-slate-200 font-mono-numbers">ج.م {(financialStatements?.balanceSheet?.workingCapital || 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Signatures Block */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-700">
                <div className="space-y-6">
                  <p>إعداد المحاسب المسؤول</p>
                  <p className="text-slate-300">________________________</p>
                </div>
                <div className="space-y-6">
                  <p>اعتماد المدير المالي</p>
                  <p className="text-slate-300">________________________</p>
                </div>
                <div className="space-y-6">
                  <p>خاتم المنشأة والتاريخ</p>
                  <p className="text-slate-300">________________________</p>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 no-print">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
