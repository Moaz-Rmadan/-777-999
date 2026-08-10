import React, { useState, useMemo } from 'react';
import { Product, Invoice, Expense, PurchaseInvoice, User } from '../types';
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
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportsViewProps {
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  purchases: PurchaseInvoice[];
  currentUser: User;
}

type TimeRange = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
type SortField = 'name' | 'category' | 'qty' | 'total' | 'profit';
type SortOrder = 'asc' | 'desc';

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  invoices,
  expenses,
  purchases,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'sales' | 'insights'>('financial');
  const [timeRange, setTimeRange] = useState<TimeRange>('last7');
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().substring(0, 10));
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ----------------------------------------------------
  // DATE RANGE RANGE LOGIC (With exact matching previous period)
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
    // 1. Current Period Filter
    const activeInvs = invoices
      .filter(inv => inv.status !== 'voided')
      .filter(inv => currentUser.role === 'admin' ? true : inv.cashierName === currentUser.name)
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

    // 2. Previous Period Filter (for comparison)
    const prevInvs = invoices
      .filter(inv => inv.status !== 'voided')
      .filter(inv => currentUser.role === 'admin' ? true : inv.cashierName === currentUser.name)
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
  // FINANCIAL CALCULATIONS & RATIOS (Current)
  // ----------------------------------------------------
  const metrics = useMemo(() => {
    const calcMetrics = (dataset: typeof filteredData.current) => {
      const sales = dataset.invoices.reduce((sum, inv) => sum + inv.total, 0);
      const expenseAmount = dataset.expenses.reduce((sum, e) => sum + e.amount, 0);
      
      const cogs = dataset.invoices.reduce((sum, inv) => {
        return sum + inv.items.reduce((itemSum, item) => itemSum + ((item.buyPrice || 0) * item.quantity), 0);
      }, 0);

      const grossProfit = sales - cogs;
      const netProfit = grossProfit - expenseAmount;
      const count = dataset.invoices.length;
      const avgInvoice = count > 0 ? sales / count : 0;

      return { sales, cogs, grossProfit, expenses: expenseAmount, netProfit, count, avgInvoice };
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
  // EXTRA ANALYSIS & GROUPING
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
            name: item.name,
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
  // INTERACTIVE CHART DATA GENERATION (CUSTOM RESPONSIVE SVG)
  // ----------------------------------------------------
  const chartData = useMemo(() => {
    const currInvs = filteredData.current.invoices;
    const start = dateRanges.start;
    const end = dateRanges.end;

    // 1. Hourly interval for today/yesterday
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

    // 2. Daily interval for other ranges
    const dailyMap: Record<string, number> = {};
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    // Initialize map with all dates in the range to avoid empty gaps
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

  // Maximum value for chart normalization
  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    return Math.ceil(maxVal / 100) * 100;
  }, [chartData]);

  // ----------------------------------------------------
  // FILTERING, SORTING & PAGINATION FOR PRODUCTS TABLE
  // ----------------------------------------------------
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

  // Handle Sort Change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // ----------------------------------------------------
  // EXPORT TO EXCEL/CSV & PRINT
  // ----------------------------------------------------
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
    link.setAttribute("download", `تقرير_أداء_الأصناف_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 print:p-0 print:space-y-4">
      {/* Printable custom styling */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            padding: 12px !important;
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
              <span>التقارير التحليلية والمالية</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-bold">
              {currentUser.role === 'admin' 
                ? 'لوحة إدارة متكاملة تقدم تحليلات محاسبية تفصيلية، نسب ربحية، وحركة المبيعات' 
                : 'ملخص مبيعاتي الشخصية والعمليات المسجلة في الوردية الحالية'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all border border-slate-200 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-550 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>تصدير البيانات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Time Period Control & Views Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Period options */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl">
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
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  timeRange === opt.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sub-tab view options */}
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            {( [
              { id: 'financial', label: 'القوائم المالية', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'sales', label: 'تحليل المبيعات والأصناف', icon: <ShoppingBag className="w-4 h-4" /> },
              { id: 'insights', label: 'المؤشرات والذكاء المالي', icon: <Percent className="w-4 h-4" /> }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
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
          TAB 1: FINANCIALS (INCOME STATEMENT, COGS, PL)
          ---------------------------------------------------- */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          
          {/* Main KPI Row with dynamic compare trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Sales Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between print-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المبيعات</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-slate-900">ج.م {metrics.current.sales.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 no-print">
                  {metrics.changes.sales >= 0 ? (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{metrics.changes.sales.toFixed(1)}%</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      <span>{Math.abs(metrics.changes.sales).toFixed(1)}%</span>
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
                <p className="text-2xl font-black text-slate-900">ج.م {metrics.current.cogs.toLocaleString()}</p>
                <div className="text-[10px] font-black text-slate-500">
                  تمثل {(metrics.current.sales > 0 ? (metrics.current.cogs / metrics.current.sales * 100) : 0).toFixed(1)}% من المبيعات
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
                <p className="text-2xl font-black text-slate-900">ج.م {metrics.current.expenses.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 no-print">
                  {metrics.changes.expenses <= 0 ? (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      <span>{Math.abs(metrics.changes.expenses).toFixed(1)}%</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{metrics.changes.expenses.toFixed(1)}%</span>
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
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">صافي الربح أو الخسارة</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  metrics.current.netProfit >= 0 ? 'bg-white/10 text-emerald-400' : 'bg-white/10 text-rose-400'
                }`}>
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black">ج.م {metrics.current.netProfit.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 no-print">
                  {metrics.changes.netProfit >= 0 ? (
                    <span className="text-[10px] font-black text-emerald-400 bg-white/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{metrics.changes.netProfit.toFixed(1)}%</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-rose-400 bg-white/10 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" />
                      <span>{Math.abs(metrics.changes.netProfit).toFixed(1)}%</span>
                    </span>
                  )}
                  <span className="text-[9px] text-slate-300 font-bold">مقارنة بالفترة السابقة</span>
                </div>
              </div>
            </div>

          </div>

          {/* Income Statement Detailed Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 print-card">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileText className="w-5 h-5 text-indigo-500" />
              <span>قائمة الدخل ومصفوفة المبيعات</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Vertical Statement Layout */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2.5 border-b border-slate-100 font-bold">
                  <span className="text-xs text-slate-600">إيرادات النشاط الجاري (المبيعات)</span>
                  <span className="text-sm text-slate-900 font-black">ج.م {metrics.current.sales.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-slate-100 font-bold text-rose-600">
                  <span className="text-xs">يخصم: تكلفة البضاعة المباعة (الخامات والمشتريات)</span>
                  <span className="text-sm font-black">ج.م {metrics.current.cogs.toLocaleString()} -</span>
                </div>
                <div className="flex items-center justify-between py-3.5 px-4 bg-emerald-50 rounded-2xl border border-emerald-100 font-bold text-emerald-800">
                  <span className="text-xs">مجمل الربح (Gross Profit)</span>
                  <span className="text-base font-black">ج.م {metrics.current.grossProfit.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-slate-100 font-bold text-rose-600">
                  <span className="text-xs">يخصم: إجمالي المصروفات التشغيلية والرواتب</span>
                  <span className="text-sm font-black">ج.م {metrics.current.expenses.toLocaleString()} -</span>
                </div>
                <div className="flex items-center justify-between py-4 px-4 bg-slate-900 text-white rounded-2xl border border-slate-800 font-bold shadow-md shadow-slate-900/10">
                  <span className="text-xs font-black">صافي الأرباح النشاطية (EBIT)</span>
                  <span className="text-base font-black">ج.م {metrics.current.netProfit.toLocaleString()}</span>
                </div>
              </div>

              {/* Ratios & Operating Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">هامش الربح الإجمالي</span>
                  <div>
                    <span className="text-2xl font-black text-indigo-700">
                      {(metrics.current.sales > 0 ? (metrics.current.grossProfit / metrics.current.sales * 100) : 0).toFixed(1)}%
                    </span>
                    <p className="text-[8px] text-indigo-400 font-bold mt-1">نسبة كفاءة مبيعات التجزئة</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">هامش الربح الصافي</span>
                  <div>
                    <span className="text-2xl font-black text-teal-700">
                      {(metrics.current.sales > 0 ? (metrics.current.netProfit / metrics.current.sales * 100) : 0).toFixed(1)}%
                    </span>
                    <p className="text-[8px] text-teal-400 font-bold mt-1">معدل العائد من المبيعات</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معدل متوسط الفاتورة (AOV)</span>
                    <span className="text-xs font-black text-slate-700">ج.م {metrics.current.avgInvoice.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3 no-print">
                    <div 
                      className="h-full bg-slate-700 rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (metrics.current.avgInvoice / 1000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: SALES & PRODUCT PERFORMANCE
          ---------------------------------------------------- */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          
          {/* Quick numbers bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase">مجموع الفواتير</span>
              <p className="text-lg font-black text-slate-900 mt-1">{metrics.current.count} فاتورة</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase">إجمالي مبيعات اليوم</span>
              <p className="text-lg font-black text-slate-900 mt-1">
                ج.م {(invoices.filter(i=>i.date.startsWith(new Date().toISOString().substring(0, 10)) && i.status !== 'voided').reduce((s,i)=>s+i.total, 0)).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase">طريقة الدفع نقدي</span>
              <p className="text-lg font-black text-emerald-600 mt-1">
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
                <h4 className="text-sm font-black text-slate-900">مخطط حركة المبيعات</h4>
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
                {/* SVG Area Chart */}
                <svg viewBox="0 0 800 240" className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline Grid */}
                  <line x1="40" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="70" x2="780" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="120" x2="780" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="170" x2="780" y2="170" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="40" y1="220" x2="780" y2="220" stroke="#f1f5f9" strokeWidth="1" />

                  {/* Trend Area Points Generation */}
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
                        {/* Area Shading */}
                        <path d={areaD} fill="url(#salesGrad)" />
                        
                        {/* Area Outline */}
                        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Interactive Circles / Data points */}
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
                            {/* Simple SVG tooltips appearing on hover */}
                            <title>{`${p.label}: ج.م ${p.value.toLocaleString()}`}</title>
                          </g>
                        ))}

                        {/* X-Axis labels */}
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

                        {/* Y-Axis Value Labels */}
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
                {analysis.categories.map(([cat, total], idx) => {
                  const percentage = metrics.current.sales > 0 ? (total / metrics.current.sales) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{cat}</span>
                        <span>{total.toLocaleString()} ج.م ({percentage.toFixed(1)}%)</span>
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
                      <span className="text-xs font-black text-slate-900">ج.م {(total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {analysis.cashiers.length === 0 && (
                    <p className="text-center py-6 text-slate-400 italic col-span-2">لا توجد عمليات مبيعات مسجلة لموظفين.</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>طرق التحصيل المالي</span>
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {analysis.paymentMethods.map(([method, total]) => (
                    <div key={method} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 mb-1">{method}</p>
                      <p className="text-sm font-black text-slate-700">ج.م {(total || 0).toLocaleString()}</p>
                    </div>
                  ))}
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

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black">
                    <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>الصنف</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('category')}>التصنيف</th>
                    <th className="p-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('qty')}>الكمية المباعة</th>
                    <th className="p-4 text-left cursor-pointer hover:bg-slate-100" onClick={() => handleSort('total')}>إجمالي الإيرادات</th>
                    <th className="p-4 text-left cursor-pointer hover:bg-slate-100" onClick={() => handleSort('profit')}>هامش الربح المساهم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedProductsTable.paginated.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-slate-900">{p.name}</td>
                      <td className="p-4 text-slate-500">{p.category}</td>
                      <td className="p-4 text-center font-black text-slate-600">{p.qty} وحدة</td>
                      <td className="p-4 text-left font-black text-slate-900">ج.م {p.total.toLocaleString()}</td>
                      <td className="p-4 text-left font-black text-emerald-600">ج.م {p.profit.toLocaleString()}</td>
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
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4 inline" /> السابق
                </button>
                <span className="text-xs font-black text-slate-500">صفحة {currentPage} من {processedProductsTable.totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(processedProductsTable.totalPages, prev + 1))}
                  disabled={currentPage === processedProductsTable.totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black hover:bg-slate-100 disabled:opacity-40"
                >
                  التالي <ChevronLeft className="w-4 h-4 inline" />
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: INSIGHTS & FINANCIAL INTELLIGENCE
          ---------------------------------------------------- */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Safe / Health Scorecard */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 print-card">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                <span>الرؤى والتحليلات الأوتوماتيكية</span>
              </h3>
              
              <div className="space-y-4">
                
                {/* Rule 1: High sales percentage of top items */}
                {analysis.productsPerformance.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-black text-blue-900">تركيز المبيعات الاستراتيجي</p>
                      <p className="text-blue-700 leading-relaxed font-bold">
                        المنتج الأكثر مبيعاً <strong>({analysis.productsPerformance.sort((a,b)=>b.total-a.total)[0]?.name})</strong> يمثل وحدہ 
                        {' '} {((analysis.productsPerformance.sort((a,b)=>b.total-a.total)[0]?.total / (metrics.current.sales || 1)) * 100).toFixed(1)}% من مجمل المبيعات في هذه الفترة. تأكد من ثبات سلسلة توريده.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rule 2: Profit contribution indicator */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-black text-emerald-900">معدل كفاءة التشغيل المالي</p>
                    <p className="text-emerald-700 leading-relaxed font-bold">
                      أرباح النشاط تساهم بنسبة <strong>{(metrics.current.sales > 0 ? (metrics.current.netProfit / metrics.current.sales * 100) : 0).toFixed(1)}%</strong> من إجمالي التدفق الوارد. هذه النسبة ممتازة وتعني الحفاظ على تكاليف تشغيل منخفضة.
                    </p>
                  </div>
                </div>

                {/* Rule 3: Debt-to-Sales Warning */}
                {analysis.paymentMethods.find(m => m[0] === 'آجل')?.[1] && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-black text-amber-900">تحذير الديون والذمم المدينة</p>
                      <p className="text-amber-700 leading-relaxed font-bold">
                        تصل نسبة مبيعات الآجل إلى <strong>{((analysis.paymentMethods.find(m => m[0] === 'آجل')?.[1] || 0) / (metrics.current.sales || 1) * 100).toFixed(1)}%</strong> من الإيرادات. نوصي بمتابعة المذكرات الدورية للتحصيل لضمان سيولة الخزينة.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Inventory Valuation Insights */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 print-card">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>تحليل قيمة وقنوات المخزون السلعي</span>
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold text-xs">
                  <span className="text-slate-500">إجمالي قيمة رأس المال المستثمر في المخزن (تكلفة)</span>
                  <span className="text-slate-900 font-black">
                    ج.م {products.reduce((s,p)=>s+((p.buyPrice || 0) * p.stock), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold text-xs">
                  <span className="text-slate-500">القيمة البيعية المتوقعة للمخزن بالكامل (تجزئة)</span>
                  <span className="text-slate-900 font-black">
                    ج.م {products.reduce((s,p)=>s+((p.sellPrice || 0) * p.stock), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 font-bold text-xs">
                  <span className="text-indigo-900 font-black">هامش الربح المتوقع الكامن بالمخزن</span>
                  <span className="text-indigo-700 font-black">
                    ج.م {(products.reduce((s,p)=>s+((p.sellPrice || 0) * p.stock), 0) - products.reduce((s,p)=>s+((p.buyPrice || 0) * p.stock), 0)).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 leading-relaxed font-bold">
                  يعد المخزن صمام الأمان المالي الرئيسي لعملياتك. يرجى مراجعة صفحة الأصناف بانتظام لتصفية الرواكد وتحفيز المبيعات للمنتجات ذات الهامش المرتفع.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
