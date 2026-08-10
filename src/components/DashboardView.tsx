import React from 'react';
import { Product, Invoice, Expense, PurchaseInvoice, Customer, Supplier } from '../types';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  Receipt, 
  ArrowUpRight,
  ShieldAlert,
  FileText,
  Users,
  Truck,
  Calendar
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  purchases: PurchaseInvoice[];
  customers: Customer[];
  suppliers: Supplier[];
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  invoices,
  expenses,
  purchases,
  customers,
  suppliers,
  onNavigate
}) => {
  // Today's Date String
  const today = new Date().toISOString().substring(0, 10);

  // Today's Calculations
  const todayInvoices = invoices.filter(inv => inv.date.startsWith(today) && inv.status !== 'voided');
  const todayExpensesItems = expenses.filter(e => e.date.startsWith(today) && e.status !== 'voided');

  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const todayCOGS = todayInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + (item.buyPrice * item.quantity), 0);
  }, 0);
  const todayGrossProfit = todaySales - todayCOGS;
  const todayExpenses = todayExpensesItems.reduce((sum, e) => sum + e.amount, 0);
  const todayNetProfit = todayGrossProfit - todayExpenses;

  // Total Calculations
  const totalSales = invoices.filter(inv => inv.status !== 'voided').reduce((sum, inv) => sum + inv.total, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalExpenses = expenses.filter(e => e.status !== 'voided').reduce((sum, e) => sum + e.amount, 0);
  
  // Summary Metrics
  const activeInvoices = invoices.filter(inv => inv.status !== 'voided');
  const avgInvoiceValue = activeInvoices.length > 0 ? totalSales / activeInvoices.length : 0;
  const customerDebts = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  const supplierDebts = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

  // Top Items Logic
  const itemSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
  activeInvoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!itemSalesMap[item.productId]) {
        itemSalesMap[item.productId] = { name: item.name, qty: 0, total: 0 };
      }
      itemSalesMap[item.productId].qty += item.quantity;
      itemSalesMap[item.productId].total += item.total;
    });
  });

  const top10Items = Object.values(itemSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Stock Alerts
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const expiringSoon = products.filter(p => {
    if (!p.expiryDate) return false;
    const daysUntilExpiry = (new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Banner & Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Banner */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">لوحة القيادة والمؤشرات المالية</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md">متابعة لحظية شاملة لحركة المبيعات، المخزون، والأرباح التشغيلية في السوبر ماركت</p>
          </div>
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => onNavigate('pos')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>بدء البيع POS</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all border border-slate-200"
            >
              <Package className="w-5 h-5" />
              <span>المخزون</span>
            </button>
          </div>
        </div>

        {/* Today's Stats Card */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-emerald-500/20"></div>
          
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6 relative z-10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>ملخص أداء اليوم ({new Date().toLocaleDateString('ar-EG')})</span>
          </h3>

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-slate-400 text-sm">مبيعات اليوم</span>
              <span className="text-xl font-bold">ج.م {(todaySales || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-slate-400 text-sm">تكلفة المبيعات</span>
              <span className="text-lg font-bold text-slate-300">{(todayCOGS || 0).toLocaleString()} ج</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-emerald-400 font-bold text-sm">مجمل الربح</span>
              <span className="text-lg font-bold text-emerald-400">{(todayGrossProfit || 0).toLocaleString()} ج</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-rose-400 text-sm">المصروفات</span>
              <span className="text-lg font-bold text-rose-400">{(todayExpenses || 0).toLocaleString()} ج</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-white font-black text-base">صافي الربح</span>
              <div className="flex flex-col items-end">
                <span className={`text-2xl font-black ${todayNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {(todayNetProfit || 0).toLocaleString()} ج
                </span>
                <span className="text-[10px] text-slate-500">بعد خصم كافة التكاليف والمصاريف</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">إجمالي الفواتير</p>
            <p className="text-lg font-black text-slate-900">{invoices.length} فاتورة</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">متوسط الفاتورة</p>
            <p className="text-lg font-black text-slate-900">ج.م {avgInvoiceValue.toFixed(0)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ديون العملاء</p>
            <p className="text-lg font-black text-amber-600">ج.م {(customerDebts || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ديون الموردين</p>
            <p className="text-lg font-black text-rose-600">ج.م {(supplierDebts || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top 10 Items */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>أفضل 10 أصناف مبيعاً</span>
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {top10Items.length > 0 ? top10Items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                  <p className="text-xs font-bold text-slate-800">{item.name}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-emerald-600">{item.qty} قطعة</p>
                  <p className="text-[8px] text-slate-400">{(item.total || 0).toLocaleString()} ج</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400 text-xs italic">لا توجد بيانات مبيعات بعد</div>
            )}
          </div>
        </div>

        {/* Stock Alerts & Expiring Soon */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-rose-50/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-600" />
                <span>أصناف منخفضة المخزون</span>
              </h3>
              <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">{lowStockItems.length} صنف</span>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {lowStockItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="p-3 border border-slate-100 rounded-2xl flex items-center justify-between bg-white hover:border-rose-200 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-500">الرصيد: <strong className="text-rose-600">{item.stock} {item.unit}</strong></p>
                      </div>
                      <button
                        onClick={() => onNavigate('purchases')}
                        className="text-[10px] bg-rose-600 text-white px-2.5 py-1 rounded-lg hover:bg-rose-700 transition-colors font-medium"
                      >
                        طلب شراء
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">كل الأصناف متوفرة بمخزون آمن</div>
              )}
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-amber-50/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>أصناف قريبة الانتهاء</span>
              </h3>
              <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">{expiringSoon.length} صنف</span>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {expiringSoon.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {expiringSoon.map(item => (
                    <div key={item.id} className="p-3 border border-slate-100 rounded-2xl flex items-center justify-between bg-white hover:border-amber-200 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-500">ينتهي في: <strong className="text-amber-600">{item.expiryDate}</strong></p>
                      </div>
                      <div className="bg-amber-50 px-3 py-1 rounded-xl text-[10px] font-black text-amber-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>قريب</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">لا توجد أصناف قريبة الانتهاء</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>آخر فواتير المبيعات المسجلة</span>
          </h3>
          <button
            onClick={() => onNavigate('pos')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-4 py-2 rounded-xl transition-all"
          >
            عرض الكاشير ←
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">التوقيت</th>
                <th className="p-4">طريقة الدفع</th>
                <th className="p-4">عدد الأصناف</th>
                <th className="p-4 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 8).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="p-4 text-slate-500">{inv.date}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      inv.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-800' :
                      inv.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'card' ? 'بطاقة' : 'آجل'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{inv.items.length} أصناف</td>
                  <td className="p-4 text-left font-black text-slate-900 text-sm">ج.م {inv.total.toFixed(2)}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 italic">لا توجد فواتير مسجلة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
