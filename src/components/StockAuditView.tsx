import React, { useState, useEffect, useRef } from 'react';
import { Product, StockAuditSession, StockAuditItem, User } from '../types';
import { 
  ClipboardCheck, 
  Search, 
  Plus, 
  Barcode, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Printer, 
  Save, 
  X, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  UserCheck, 
  Calendar, 
  FileText, 
  Sliders,
  DollarSign,
  PieChart,
  History,
  CheckSquare
} from 'lucide-react';

interface StockAuditViewProps {
  products: Product[];
  auditSessions: StockAuditSession[];
  currentUser: User | null;
  onSaveAuditSession: (session: StockAuditSession, applyToInventory: boolean) => void;
  onUpdateProductsBatch: (updatedProducts: Product[]) => void;
  currencySymbol?: string;
  canApprove?: boolean;
}

export const StockAuditView: React.FC<StockAuditViewProps> = ({
  products,
  auditSessions,
  currentUser,
  onSaveAuditSession,
  onUpdateProductsBatch,
  currencySymbol = 'ج.م',
  canApprove = true
}) => {
  const [activeTab, setActiveTab] = useState<'current_audit' | 'history' | 'analytics'>('current_audit');
  
  // Active session parameters
  const [auditTitle, setAuditTitle] = useState(`جرد دوري - ${new Date().toLocaleDateString('ar-EG')}`);
  const [auditorName, setAuditorName] = useState(currentUser?.name || 'مسؤول الجرد والمخازن');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'shortage' | 'surplus' | 'matched' | 'uncounted'>('all');
  
  // Search query in audit
  const [searchQuery, setSearchQuery] = useState('');
  
  // Barcode input scan mode
  const [scanBarcode, setScanBarcode] = useState('');
  const [autoIncrementScan, setAutoIncrementScan] = useState(true);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Audit items state mapping: productId -> StockAuditItem
  const [auditItemsMap, setAuditItemsMap] = useState<Record<string, StockAuditItem>>({});
  
  // Historical session view modal
  const [selectedHistoricalSession, setSelectedHistoricalSession] = useState<StockAuditSession | null>(null);
  
  // Success notification
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize audit items from current products
  useEffect(() => {
    const initialMap: Record<string, StockAuditItem> = {};
    products.forEach(p => {
      initialMap[p.id] = {
        productId: p.id,
        productName: p.name,
        barcode: p.barcode,
        category: p.category,
        unit: p.unit,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        systemStock: p.stock,
        actualStock: p.stock, // Default to system stock before user adjusts
        variance: 0,
        costDifference: 0,
        sellDifference: 0,
        notes: '',
        status: 'matched'
      };
    });
    setAuditItemsMap(initialMap);
  }, [products]);

  // Categories list
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Sound feedback
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      (osc.frequency as any).setValueAtTime(1200, audioCtx.currentTime);
      (gain.gain as any).setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch(e){}
  };

  // Handle single actual stock change
  const handleActualStockChange = (productId: string, newActualQty: number) => {
    setAuditItemsMap(prev => {
      const item = prev[productId];
      if (!item) return prev;
      
      const actual = Math.max(0, newActualQty);
      const variance = actual - item.systemStock;
      const costDiff = variance * item.buyPrice;
      const sellDiff = variance * item.sellPrice;
      
      let status: 'matched' | 'shortage' | 'surplus' = 'matched';
      if (variance < 0) status = 'shortage';
      else if (variance > 0) status = 'surplus';

      return {
        ...prev,
        [productId]: {
          ...item,
          actualStock: actual,
          variance,
          costDifference: costDiff,
          sellDifference: sellDiff,
          status
        }
      };
    });
  };

  // Handle Barcode Scanner Submission
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanBarcode.trim()) return;

    const targetCode = scanBarcode.trim();
    const foundProduct = products.find(p => p.barcode === targetCode || p.id === targetCode);

    if (foundProduct) {
      playBeep();
      setAuditItemsMap(prev => {
        const item = prev[foundProduct.id];
        if (!item) return prev;
        
        const newActual = item.actualStock + (autoIncrementScan ? 1 : 0);
        const variance = newActual - item.systemStock;
        const costDiff = variance * item.buyPrice;
        const sellDiff = variance * item.sellPrice;

        let status: 'matched' | 'shortage' | 'surplus' = 'matched';
        if (variance < 0) status = 'shortage';
        else if (variance > 0) status = 'surplus';

        return {
          ...prev,
          [foundProduct.id]: {
            ...item,
            actualStock: newActual,
            variance,
            costDifference: costDiff,
            sellDifference: sellDiff,
            status
          }
        };
      });

      setSuccessMsg(`🟢 تم مسح [${foundProduct.name}] - المخزون المكتشف الآن: ${(auditItemsMap[foundProduct.id]?.actualStock || 0) + (autoIncrementScan ? 1 : 0)}`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } else {
      setSuccessMsg(`❌ لم يتم العثور على منتج برمز الباركود: [${targetCode}]`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }

    setScanBarcode('');
    if (scanInputRef.current) scanInputRef.current.focus();
  };

  // Filtered items list for current active view
  const currentItemsList = (Object.values(auditItemsMap) as StockAuditItem[]).filter(item => {
    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    
    // Status filter
    if (auditStatusFilter === 'shortage' && item.variance >= 0) return false;
    if (auditStatusFilter === 'surplus' && item.variance <= 0) return false;
    if (auditStatusFilter === 'matched' && item.variance !== 0) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.barcode.includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // KPI Computations for active audit session
  const allAuditItems = Object.values(auditItemsMap) as StockAuditItem[];
  const totalSystemItems = allAuditItems.length;
  const totalShortageItemsList = allAuditItems.filter(i => i.variance < 0);
  const totalSurplusItemsList = allAuditItems.filter(i => i.variance > 0);
  const totalMatchedItemsList = allAuditItems.filter(i => i.variance === 0);

  const totalShortageCost = totalShortageItemsList.reduce((acc, i) => acc + Math.abs(i.costDifference), 0);
  const totalSurplusCost = totalSurplusItemsList.reduce((acc, i) => acc + i.costDifference, 0);
  const netCostImpact = totalSurplusCost - totalShortageCost;

  const totalSystemValue = allAuditItems.reduce((acc, i) => acc + (i.systemStock * i.buyPrice), 0);
  const accuracyRate = totalSystemItems > 0 
    ? ((totalMatchedItemsList.length / totalSystemItems) * 100) 
    : 100;

  // Apply and approve inventory audit session
  const handleApplyAuditSession = (applyToInventory: boolean) => {
    if (allAuditItems.length === 0) return;

    const auditNumber = `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newSession: StockAuditSession = {
      id: `session-${Date.now()}`,
      auditNumber,
      title: auditTitle,
      categoryFilter: selectedCategory,
      auditorName,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: applyToInventory ? 'applied' : 'completed',
      items: allAuditItems,
      totalSystemItems,
      totalAuditedItems: allAuditItems.length,
      totalMatchedItems: totalMatchedItemsList.length,
      totalShortageItems: totalShortageItemsList.length,
      totalSurplusItems: totalSurplusItemsList.length,
      totalShortageCost,
      totalSurplusCost,
      netCostImpact,
      accuracyRate: parseFloat(accuracyRate.toFixed(1)),
      notes: `جرد شامل تم تنفيذه بواسطة ${auditorName}`
    };

    // If applyToInventory is true, update products stock
    if (applyToInventory) {
      const updatedProductsList = products.map(p => {
        const audited = auditItemsMap[p.id];
        if (audited) {
          return {
            ...p,
            stock: audited.actualStock
          };
        }
        return p;
      });
      onUpdateProductsBatch(updatedProductsList);
    }

    onSaveAuditSession(newSession, applyToInventory);

    setSuccessMsg(
      applyToInventory 
        ? `✅ تم اعتماد وتطبيق الجرد برقم [${auditNumber}] وتحديث كافة أرصاد المخزون بالنظام بنجاح!` 
        : `💾 تم حفظ جلسة الجرد كمسودة برقم [${auditNumber}] بدون تعديل المخزون المباشر.`
    );
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Print audit report
  const handlePrintAuditReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/10">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">نظام جرد المخزون والتدقيق الميداني</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                التسوية الآلية
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-bold">
              مطابقة الكميات الفعلية بالرفوف مع الكميات الدفترية للنظام، معالجة العجز والزيادة، واحتساب الفروق المالية.
            </p>
          </div>
        </div>

        {/* View Tabs Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('current_audit')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'current_audit' ? 'bg-slate-900 text-white font-black shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>جلسة الجرد الحالية</span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'history' ? 'bg-slate-900 text-white font-black shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>سجل الجرد السابق ({auditSessions.length})</span>
          </button>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. CURRENT AUDIT SESSION VIEW */}
      {activeTab === 'current_audit' && (
        <div className="space-y-6">
          
          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">إجمالي الأصناف</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl font-black text-slate-900 font-mono-numbers">{totalSystemItems}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">قيمة النظام: {currencySymbol} {totalSystemValue.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">نسبة دقة الجرد</span>
                <PieChart className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-emerald-700 font-mono-numbers">{accuracyRate.toFixed(1)}%</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">{totalMatchedItemsList.length} صنف مطابق من أصل {totalSystemItems}</p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="text-[11px] font-bold">عجز المخزون (Shortage)</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-xl font-black text-rose-700 font-mono-numbers">
                - {currencySymbol} {totalShortageCost.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-rose-600 mt-1 font-bold">{totalShortageItemsList.length} أصناف فيها عجز</p>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
              <div className="flex items-center justify-between text-blue-700 mb-1">
                <span className="text-[11px] font-bold">زيادة المخزون (Surplus)</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-black text-blue-700 font-mono-numbers">
                + {currencySymbol} {totalSurplusCost.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-blue-600 mt-1 font-bold">{totalSurplusItemsList.length} أصناف فيها زيادة</p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-slate-900 text-white p-4.5 rounded-2xl shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold">صافي الأثر المالي للتسوية</span>
                <p className={`text-xl font-black font-mono-numbers mt-1 ${netCostImpact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {netCostImpact >= 0 ? '+' : ''}{currencySymbol} {netCostImpact.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-[9px] text-slate-400">تأثير الفارق على الأرباح والخسائر</span>
            </div>

          </div>

          {/* Session Details Meta Form & Laser Scanner Input */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            
            {/* Meta Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">عنوان وثيقة الجرد</label>
                <input
                  type="text"
                  value={auditTitle}
                  onChange={(e) => setAuditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">المسؤول عن الجرد والدقيق</label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">تصفية حسب القسم المجرود</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="all">جميع الأقسام والأصناف</option>
                  {categories.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fast Laser Barcode Reader Box */}
            <form onSubmit={handleBarcodeScan} className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-2.5 bg-emerald-800 rounded-xl text-emerald-300">
                  <Barcode className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-emerald-100">مسح الباركود السريع المباشر (Quick Laser Count)</h3>
                  <p className="text-[10px] text-emerald-300">امسح باركود المنتج بالليزر لزيادة الكمية المكتشفة تلقائياً بسرعة</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={scanBarcode}
                    onChange={(e) => setScanBarcode(e.target.value)}
                    placeholder="امسح الباركود هنا..."
                    className="w-full pr-4 pl-10 py-2 bg-emerald-950 text-white border border-emerald-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-emerald-600"
                  />
                  <button type="submit" className="absolute left-2 top-2 text-emerald-400 hover:text-white">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <label className="flex items-center gap-2 text-xs text-emerald-200 font-bold shrink-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoIncrementScan}
                    onChange={(e) => setAutoIncrementScan(e.target.checked)}
                    className="h-4 w-4 text-emerald-500 border-emerald-700 rounded focus:ring-0"
                  />
                  <span>زيادة +1 تلقائياً</span>
                </label>
              </div>
            </form>

            {/* Toolbar Filters & Status buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم المنتج، الباركود، أو التصنيف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold overflow-x-auto scrollbar-none">
                {[
                  { id: 'all', label: 'الكل', count: allAuditItems.length },
                  { id: 'shortage', label: 'عجز 🔴', count: totalShortageItemsList.length },
                  { id: 'surplus', label: 'زيادة 🔵', count: totalSurplusItemsList.length },
                  { id: 'matched', label: 'مطابق 🟢', count: totalMatchedItemsList.length }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setAuditStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      auditStatusFilter === f.id ? 'bg-white text-slate-900 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Comparison Table */}
            <div className="overflow-x-auto max-h-[500px] border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200 font-black z-10">
                  <tr>
                    <th className="px-4 py-3">المنتج والتصنيف</th>
                    <th className="px-3 py-3">الباركود</th>
                    <th className="px-3 py-3 text-center">المخزون الدفتري</th>
                    <th className="px-4 py-3 text-center bg-amber-100/70 text-amber-950">الكمية الفعلية (المجرودة)</th>
                    <th className="px-3 py-3 text-center">الفرق (التباين)</th>
                    <th className="px-3 py-3 text-left">التكلفة المالية للفارق</th>
                    <th className="px-3 py-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItemsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        لا توجد أصناف مطابقة للبحث أو الفلتر المحدد.
                      </td>
                    </tr>
                  ) : (
                    currentItemsList.map(item => {
                      const isShortage = item.variance < 0;
                      const isSurplus = item.variance > 0;
                      const isMatched = item.variance === 0;

                      return (
                        <tr 
                          key={item.productId}
                          className={`hover:bg-slate-50 transition-colors ${
                            isShortage ? 'bg-rose-50/30' : isSurplus ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-black text-slate-900">{item.productName}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{item.category} • {item.unit}</div>
                          </td>

                          <td className="px-3 py-2.5 font-mono text-slate-600 text-[11px]">
                            {item.barcode}
                          </td>

                          <td className="px-3 py-2.5 text-center font-mono-numbers font-black text-slate-800 text-sm">
                            {item.systemStock}
                          </td>

                          {/* Editable Actual Count Input */}
                          <td className="px-4 py-2 bg-amber-50/50 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleActualStockChange(item.productId, item.actualStock - 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 font-black hover:bg-slate-100"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={item.actualStock}
                                onChange={(e) => handleActualStockChange(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-16 px-2 py-1.5 bg-white border-2 border-amber-400 rounded-lg text-center font-mono-numbers font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleActualStockChange(item.productId, item.actualStock + 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 font-black hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="px-3 py-2.5 text-center font-mono-numbers font-black text-sm">
                            <span className={isShortage ? 'text-rose-600' : isSurplus ? 'text-blue-600' : 'text-emerald-600'}>
                              {item.variance > 0 ? `+${item.variance}` : item.variance}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-left font-mono-numbers font-bold text-xs">
                            <span className={isShortage ? 'text-rose-700' : isSurplus ? 'text-blue-700' : 'text-slate-400'}>
                              {item.costDifference === 0 
                                ? '0.00' 
                                : `${item.costDifference > 0 ? '+' : ''}${item.costDifference.toFixed(2)} ${currencySymbol}`}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            {isMatched && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                                مطابق 🟢
                              </span>
                            )}
                            {isShortage && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200">
                                عجز 🔴 ({item.variance})
                              </span>
                            )}
                            {isSurplus && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black border border-blue-200">
                                زيادة 🔵 (+{item.variance})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              
              <div className="text-xs text-slate-500 font-bold">
                * عند الضغط على <strong className="text-slate-900">"اعتماد وتحديث المخزون"</strong> سيتم تعديل كميات الأصناف المجرودة مباشرة في شاشة المنتجات والكاشير.
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePrintAuditReport}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>طباعة وثيقة الجرد الرسمية</span>
                </button>

                <button
                  onClick={() => handleApplyAuditSession(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4 text-slate-300" />
                  <span>حفظ كمسودة جرد</span>
                </button>

                {canApprove && (
                  <button
                    onClick={() => handleApplyAuditSession(true)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/10 flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>اعتماد وتحديث كميات المخزون بالنظام</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 2. AUDIT HISTORY & ARCHIVE */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">سجل وثائق وجلسات الجرد السابقة</h2>
              <p className="text-xs text-slate-400 mt-0.5">استعراض محضر الجرد، الأرقام المعتمدة، ونسب الدقة للجلسات السابقة.</p>
            </div>
          </div>

          {auditSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold space-y-2">
              <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300" />
              <p>لم يتم إجراء أي جلسات جرد سابقة حتى الآن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">رقم الجرد والعنوان</th>
                    <th className="px-3 py-3">المسؤول والتاريخ</th>
                    <th className="px-3 py-3 text-center">أصناف المجرودة</th>
                    <th className="px-3 py-3 text-center">نسبة الدقة</th>
                    <th className="px-3 py-3 text-left">تكلفة العجز / الزيادة</th>
                    <th className="px-3 py-3 text-center">الحالة</th>
                    <th className="px-3 py-3 text-center">عرض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditSessions.map(session => (
                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900">{session.title}</div>
                        <div className="text-[10px] font-mono text-emerald-700 font-bold">{session.auditNumber}</div>
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        <div className="font-bold">{session.auditorName}</div>
                        <div className="text-[10px] text-slate-400">{new Date(session.createdAt).toLocaleString('ar-EG')}</div>
                      </td>

                      <td className="px-3 py-3 text-center font-mono-numbers font-bold">
                        {session.totalAuditedItems} صنف
                      </td>

                      <td className="px-3 py-3 text-center font-mono-numbers font-black text-emerald-700">
                        {session.accuracyRate}%
                      </td>

                      <td className="px-3 py-3 text-left font-mono-numbers font-bold">
                        <div className="text-rose-600 text-[11px]">- {currencySymbol} {session.totalShortageCost.toFixed(2)}</div>
                        <div className="text-blue-600 text-[11px]">+ {currencySymbol} {session.totalSurplusCost.toFixed(2)}</div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        {session.status === 'applied' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                            معتمد ومطبق 🟢
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                            مسودة 🟡
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => setSelectedHistoricalSession(session)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold"
                        >
                          معاينة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* HISTORICAL SESSION PREVIEW MODAL */}
      {selectedHistoricalSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedHistoricalSession.title}</h3>
                <p className="text-xs font-mono text-emerald-700 font-bold">{selectedHistoricalSession.auditNumber} • بواسطة: {selectedHistoricalSession.auditorName}</p>
              </div>
              <button onClick={() => setSelectedHistoricalSession(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">إجمالي المجرود</span>
                <span className="font-black text-slate-900 font-mono-numbers text-base">{selectedHistoricalSession.totalAuditedItems}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">نسبة الدقة</span>
                <span className="font-black text-emerald-700 font-mono-numbers text-base">{selectedHistoricalSession.accuracyRate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">تكلفة العجز</span>
                <span className="font-black text-rose-600 font-mono-numbers text-base">- {currencySymbol} {selectedHistoricalSession.totalShortageCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">تكلفة الزيادة</span>
                <span className="font-black text-blue-600 font-mono-numbers text-base">+ {currencySymbol} {selectedHistoricalSession.totalSurplusCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[350px] border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">المنتج</th>
                    <th className="px-3 py-2.5 text-center">النظام</th>
                    <th className="px-3 py-2.5 text-center">الفعلي</th>
                    <th className="px-3 py-2.5 text-center">الفرق</th>
                    <th className="px-3 py-2.5 text-left">التكلفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedHistoricalSession.items as StockAuditItem[]).map(item => (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <div className="font-black text-slate-900">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.barcode}</div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono-numbers font-bold">{item.systemStock}</td>
                      <td className="px-3 py-2 text-center font-mono-numbers font-bold">{item.actualStock}</td>
                      <td className="px-3 py-2 text-center font-mono-numbers font-black">
                        <span className={item.variance < 0 ? 'text-rose-600' : item.variance > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                          {item.variance}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-left font-mono-numbers font-bold">
                        {item.costDifference.toFixed(2)} {currencySymbol}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة تقرير هذه الجلسة</span>
              </button>
              <button
                onClick={() => setSelectedHistoricalSession(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
