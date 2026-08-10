import React, { useState, useMemo } from 'react';
import { Product, Invoice, PurchaseInvoice } from '../types';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  Search, 
  ArrowRightLeft,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface InventoryReportsViewProps {
  products: Product[];
  invoices: Invoice[];
  purchases: PurchaseInvoice[];
}

const InventoryReportsView: React.FC<InventoryReportsViewProps> = ({ products, invoices, purchases }) => {
  const [activeSubTab, setActiveSubTab] = useState<'balance' | 'low_stock' | 'stagnant' | 'expiry' | 'movement'>('balance');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const today = new Date();

  // Calculations
  const inventoryValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock * p.buyPrice), 0);
  }, [products]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  const expiredItems = useMemo(() => {
    return products.filter(p => {
      if (!p.expiryDate) return false;
      return new Date(p.expiryDate) < today;
    });
  }, [products, today]);

  const nearingExpiryItems = useMemo(() => {
    return products.filter(p => {
      if (!p.expiryDate) return false;
      const expDate = new Date(p.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    });
  }, [products, today]);

  const stagnantItems = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all product IDs sold in last 30 days
    const soldProductIds = new Set<string>();
    invoices.forEach(inv => {
      const invDate = new Date(inv.date);
      if (invDate >= thirtyDaysAgo) {
        inv.items.forEach(item => soldProductIds.add(item.productId));
      }
    });

    return products.filter(p => !soldProductIds.has(p.id) && p.stock > 0);
  }, [products, invoices]);

  const itemMovement = useMemo(() => {
    if (!selectedProductId) return [];
    
    const sales = invoices.flatMap(inv => 
      inv.items.filter(item => item.productId === selectedProductId).map(item => ({
        type: 'sale',
        date: inv.date,
        quantity: item.quantity,
        price: item.sellPrice || 0,
        reference: inv.invoiceNumber,
        customer: inv.customerName || 'عميل نقدي'
      }))
    );

    const buys = purchases.flatMap(pInv => 
      pInv.items.filter(item => item.productId === selectedProductId).map(item => ({
        type: 'purchase',
        date: pInv.date,
        quantity: item.quantity,
        price: item.buyPrice || 0,
        reference: pInv.purchaseNumber,
        customer: pInv.supplierName
      }))
    );

    return [...sales, ...buys].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedProductId, invoices, purchases]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" />
              <span>تقارير المخزون المستودعية</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">تحليل حركة السلع، مستويات التخزين، وتقييم الأصول السلعية</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
              <p className="text-[10px] font-bold text-indigo-400 uppercase">قيمة المخزون الإجمالية</p>
              <p className="text-lg font-black text-indigo-700">ج.م {(inventoryValuation || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {[
          { id: 'balance', label: 'رصيد المخزون', icon: <Package className="w-4 h-4" /> },
          { id: 'low_stock', label: 'الأصناف الناقصة', icon: <AlertTriangle className="w-4 h-4" />, count: lowStockItems.length, color: 'rose' },
          { id: 'stagnant', label: 'الأصناف الراكدة', icon: <TrendingDown className="w-4 h-4" />, count: stagnantItems.length, color: 'amber' },
          { id: 'expiry', label: 'الصلاحية والانتهاء', icon: <Clock className="w-4 h-4" />, count: expiredItems.length + nearingExpiryItems.length, color: 'rose' },
          { id: 'movement', label: 'حركة صنف', icon: <ArrowRightLeft className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                activeSubTab === tab.id ? 'bg-white/20 text-white' : `bg-${tab.color}-100 text-${tab.color}-600`
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {activeSubTab === 'balance' && (
          <div className="p-0">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4">الصنف</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">الرصيد الحالي</th>
                  <th className="p-4">سعر الشراء</th>
                  <th className="p-4 text-left">إجمالي القيمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 text-slate-500">{p.category}</td>
                    <td className="p-4">
                      <span className={`font-bold ${p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-700'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{(p.buyPrice || 0).toLocaleString()} ج</td>
                    <td className="p-4 text-left font-black text-slate-900">
                      {(p.stock * p.buyPrice || 0).toLocaleString()} ج
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'low_stock' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 bg-rose-50 p-4 rounded-xl border border-rose-100">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-rose-900">أصناف تحت حد الطلب</h3>
                <p className="text-xs text-rose-600">هذه الأصناف رصيدها أقل من الحد الأدنى المسموح به وتحتاج لإعادة طلب شراء.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map(p => (
                <div key={p.id} className="p-4 border border-rose-100 rounded-2xl bg-white shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-rose-500 mt-1">الرصيد: {p.stock} (الحد: {p.minStock})</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400">نقص بمقدار</p>
                    <p className="text-sm font-black text-rose-600">{p.minStock - p.stock} {p.unit}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 italic">لا توجد نواقص في المخزون حالياً</div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'stagnant' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
              <TrendingDown className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">الأصناف الراكدة (غير المباعة)</h3>
                <p className="text-xs text-amber-600">أصناف متوفرة في المخزون ولم يتم تسجيل أي مبيعات لها خلال الـ 30 يوماً الماضية.</p>
              </div>
            </div>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4">الصنف</th>
                  <th className="p-4">الرصيد</th>
                  <th className="p-4">قيمة الركود</th>
                  <th className="p-4 text-left">الإجراء المقترح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stagnantItems.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 text-slate-600">{p.stock} {p.unit}</td>
                    <td className="p-4 font-bold text-amber-600">{(p.stock * p.buyPrice || 0).toLocaleString()} ج</td>
                    <td className="p-4 text-left">
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-bold">عمل عروض ترويجية</span>
                    </td>
                  </tr>
                ))}
                {stagnantItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 italic">لا توجد أصناف راكدة. حركة البيع جيدة لجميع الأصناف.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'expiry' && (
          <div className="p-6 space-y-8">
            {/* Expired Section */}
            <section>
              <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span>أصناف منتهية الصلاحية (تحتاج إعدام/إرجاع)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiredItems.map(p => (
                  <div key={p.id} className="p-4 border border-rose-200 rounded-2xl bg-rose-50/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-rose-600 mt-1">انتهت بتاريخ: {p.expiryDate}</p>
                    </div>
                    <div className="text-left font-black text-rose-600">
                      {p.stock} {p.unit}
                    </div>
                  </div>
                ))}
                {expiredItems.length === 0 && (
                  <div className="col-span-full py-6 text-center text-slate-400 text-xs italic">لا توجد أصناف منتهية الصلاحية</div>
                )}
              </div>
            </section>

            {/* Nearing Expiry Section */}
            <section>
              <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" />
                <span>أصناف قريبة الانتهاء (أقل من 30 يوماً)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearingExpiryItems.map(p => (
                  <div key={p.id} className="p-4 border border-amber-100 rounded-2xl bg-white flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-amber-600 mt-1">تنتهي بتاريخ: {p.expiryDate}</p>
                    </div>
                    <div className="text-left font-black text-amber-600">
                      {p.stock} {p.unit}
                    </div>
                  </div>
                ))}
                {nearingExpiryItems.length === 0 && (
                  <div className="col-span-full py-6 text-center text-slate-400 text-xs italic">لا توجد أصناف قريبة الانتهاء</div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeSubTab === 'movement' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-end gap-4 max-w-2xl">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 mr-2 uppercase">اختر الصنف لمتابعة حركته</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- اختر صنف --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedProductId ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900">تاريخ العمليات (مشتريات ومبيعات)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">نوع العملية</th>
                        <th className="p-3">الكمية</th>
                        <th className="p-3">السعر</th>
                        <th className="p-3">المرجع/الطرف الآخر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemMovement.map((mv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500">{mv.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              mv.type === 'sale' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {mv.type === 'sale' ? 'بيع' : 'شراء'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {mv.type === 'sale' ? '-' : '+'}{mv.quantity}
                          </td>
                          <td className="p-3 text-slate-600">{(mv.price || 0).toLocaleString()} ج</td>
                          <td className="p-3">
                            <p className="font-medium text-slate-800">{mv.reference}</p>
                            <p className="text-[9px] text-slate-400">{mv.customer}</p>
                          </td>
                        </tr>
                      ))}
                      {itemMovement.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 italic">لا توجد حركات مسجلة لهذا الصنف</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center">
                <ArrowRightLeft className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">برجاء اختيار صنف من القائمة أعلاه لعرض حركة المخزون الخاصة به</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryReportsView;
