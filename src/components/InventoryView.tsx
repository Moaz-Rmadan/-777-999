import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  Tag, 
  Edit3, 
  Trash2,
  CheckCircle2,
  ClipboardCheck,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  Sliders,
  CheckSquare,
  Square,
  Percent,
  ArrowUpDown,
  Barcode,
  XCircle,
  Eye,
  RefreshCw,
  FileText
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  onNavigate?: (tab: any) => void;
}

type FilterTab = 'all' | 'low' | 'out' | 'active';

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canApprove = true,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState<boolean>(false);
  const [showStockAdjModal, setShowStockAdjModal] = useState<boolean>(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Single Product Form state
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('ألبان وأجبان');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formSellPrice, setFormSellPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formUnit, setFormUnit] = useState('قطعة');
  const [formExpiry, setFormExpiry] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Bulk Price state
  const [bulkAdjTarget, setBulkAdjTarget] = useState<'sell' | 'buy'>('sell');
  const [bulkAdjMode, setBulkAdjMode] = useState<'percent' | 'fixed'>('percent');
  const [bulkAdjDirection, setBulkAdjDirection] = useState<'increase' | 'decrease'>('increase');
  const [bulkAdjVal, setBulkAdjVal] = useState<string>('');

  // Stock Adj state
  const [stockAdjProduct, setStockAdjProduct] = useState<Product | null>(null);
  const [stockAdjNewQty, setStockAdjNewQty] = useState<string>('');
  const [stockAdjReason, setStockAdjReason] = useState<string>('تعديل جرد سنوي');

  // Excel import preview
  const [importText, setImportText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Density state: 'compact' | 'dense' | 'comfortable'
  const [tableDensity, setTableDensity] = useState<'compact' | 'dense' | 'comfortable'>('dense');

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtering Engine
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.barcode || '').includes(searchQuery) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesTab = true;
    if (activeFilterTab === 'low') {
      matchesTab = p.stock > 0 && p.stock <= p.minStock;
    } else if (activeFilterTab === 'out') {
      matchesTab = p.stock <= 0;
    } else if (activeFilterTab === 'active') {
      matchesTab = p.isActive !== false;
    }

    return matchesSearch && matchesCategory && matchesTab;
  });

  // Selection handlers
  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id));
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Add / Edit Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode(Math.floor(6221000000000 + Math.random() * 900000000).toString());
    setFormSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
    setFormCategory('ألبان وأجبان');
    setFormBuyPrice('');
    setFormSellPrice('');
    setFormStock('');
    setFormMinStock('10');
    setFormUnit('قطعة');
    setFormExpiry('');
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBarcode(p.barcode);
    setFormSku(p.sku || 'SKU-' + p.id.substring(0, 4));
    setFormCategory(p.category);
    setFormBuyPrice(p.buyPrice.toString());
    setFormSellPrice(p.sellPrice.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormUnit(p.unit);
    setFormExpiry(p.expiryDate || '');
    setFormIsActive(p.isActive !== false);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBuyPrice || !formSellPrice || !formStock) {
      alert('يرجى تعبئة جميع الحقول الإلزامية.');
      return;
    }

    const productData: Product = {
      id: editingProduct ? editingProduct.id : 'p-' + Date.now(),
      barcode: formBarcode || '622' + Math.floor(1000000000 + Math.random() * 900000000),
      sku: formSku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      name: formName,
      category: formCategory,
      buyPrice: parseFloat(formBuyPrice) || 0,
      sellPrice: parseFloat(formSellPrice) || 0,
      stock: parseInt(formStock) || 0,
      minStock: parseInt(formMinStock) || 10,
      unit: formUnit,
      expiryDate: formExpiry || undefined,
      isActive: formIsActive
    };

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    setShowModal(false);
  };

  // Bulk Price Change Logic
  const handleApplyBulkPriceChange = () => {
    const val = parseFloat(bulkAdjVal);
    if (isNaN(val) || val <= 0) {
      alert('يرجى كتابة قيمة صالحة للتعديل.');
      return;
    }

    const targets = selectedIds.length > 0 
      ? products.filter(p => selectedIds.includes(p.id))
      : filteredProducts;

    if (targets.length === 0) {
      alert('لا توجد منتجات مطابقة لتعديل الأسعار.');
      return;
    }

    targets.forEach(p => {
      let oldVal = bulkAdjTarget === 'sell' ? p.sellPrice : p.buyPrice;
      let newVal = oldVal;

      if (bulkAdjMode === 'percent') {
        const factor = (val / 100);
        newVal = bulkAdjDirection === 'increase' ? oldVal * (1 + factor) : oldVal * (1 - factor);
      } else {
        newVal = bulkAdjDirection === 'increase' ? oldVal + val : oldVal - val;
      }

      newVal = Math.max(0.1, parseFloat(newVal.toFixed(2)));

      onUpdateProduct({
        ...p,
        [bulkAdjTarget === 'sell' ? 'sellPrice' : 'buyPrice']: newVal
      });
    });

    setShowBulkPriceModal(false);
    setBulkAdjVal('');
    alert(`تم تعديل أسعار ${targets.length} منتج بنجاح!`);
  };

  // Stock Adjustment logic
  const handleSaveStockAdj = () => {
    if (!stockAdjProduct) return;
    const newQty = parseInt(stockAdjNewQty);
    if (isNaN(newQty) || newQty < 0) {
      alert('ادخل كمية صحيحة للمخزون.');
      return;
    }

    onUpdateProduct({
      ...stockAdjProduct,
      stock: newQty
    });

    setShowStockAdjModal(false);
    setStockAdjProduct(null);
    alert(`تم تعديل مخزون [${stockAdjProduct.name}] إلى ${newQty} ${stockAdjProduct.unit}`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const itemsToExport = selectedIds.length > 0 
      ? products.filter(p => selectedIds.includes(p.id))
      : filteredProducts;

    if (itemsToExport.length === 0) {
      alert('لا توجد بيانات للتصدير.');
      return;
    }

    const headers = ['الباركود', 'SKU', 'اسم المنتج', 'التصنيف', 'الكمية', 'سعر الشراء', 'سعر البيع', 'الوحدة', 'تاريخ الصلاحية'];
    const rows = itemsToExport.map(p => [
      `"${p.barcode}"`,
      `"${p.sku || ''}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      p.stock,
      p.buyPrice,
      p.sellPrice,
      `"${p.unit}"`,
      `"${p.expiryDate || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import Excel/CSV parser sample demo
  const handleImportCSVData = () => {
    const sampleData = [
      { name: 'عصير برتقال طبيعي 1 لتر', barcode: '6228001122334', sku: 'SKU-JUICE-01', category: 'مشروبات ومياه', buyPrice: 18, sellPrice: 25, stock: 45, unit: 'زجاجة' },
      { name: 'شاي ناعم 250 جرام', barcode: '6228001122335', sku: 'SKU-TEA-02', category: 'بقالة ومعلبات', buyPrice: 40, sellPrice: 52, stock: 30, unit: 'عبوة' },
      { name: 'جبن ابيض فيتا 500 جرام', barcode: '6228001122336', sku: 'SKU-CHEESE-03', category: 'ألبان وأجبان', buyPrice: 32, sellPrice: 42, stock: 18, unit: 'عبوة' }
    ];

    sampleData.forEach(p => {
      onAddProduct({
        id: 'p-imp-' + Date.now() + Math.random().toString(36).substring(2, 5),
        barcode: p.barcode,
        sku: p.sku,
        name: p.name,
        category: p.category,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        stock: p.stock,
        minStock: 10,
        unit: p.unit,
        isActive: true
      });
    });

    setShowImportModal(false);
    alert('تم استيراد 3 منتجات تجريبية بنجاح لجدول الأصناف!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Top Main Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">شاشة المنتجات والمخزون</h2>
              <p className="text-xs text-slate-500 font-bold mt-0.5">إدارة كاملة للأصناف، الأسعار، التعديل الجماعي، واستيراد وتصدير Excel</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Header Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {onNavigate && (
            <button
              onClick={() => onNavigate('stock_audit')}
              className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-emerald-300 rounded-2xl text-xs font-black border border-emerald-700 flex items-center gap-2 transition-all shadow-sm"
              title="الانتقال إلى نظام الجرد وتدقيق المخزون الميداني"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>جرد المخزون الفعلي</span>
            </button>
          )}

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all"
            title="استيراد من ملف Excel / CSV"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all"
            title="تصدير إلى ملف CSV"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowBarcodePrintModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all"
            title="طباعة ملصقات الباركود"
          >
            <Printer className="w-4 h-4 text-purple-600" />
            <span>Print Barcode</span>
          </button>

          <button
            onClick={() => setShowBulkPriceModal(true)}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-2xl text-xs font-black border border-indigo-200 flex items-center gap-2 transition-all"
            title="تعديل جماعي للأسعار"
          >
            <Percent className="w-4 h-4 text-indigo-600" />
            <span>تعديل الأسعار</span>
          </button>

          {canCreate && (
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-900/10 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </button>
          )}

        </div>
      </div>

      {/* Search & Status Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 بحث بالاسم / Barcode / SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'الكل', count: products.length },
              { id: 'low', label: 'منخفض المخزون', count: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length },
              { id: 'out', label: 'نفد / منتهي', count: products.filter(p => p.stock <= 0).length },
              { id: 'active', label: 'نشط', count: products.filter(p => p.isActive !== false).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilterTab(tab.id as FilterTab)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeFilterTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-numbers ${
                  activeFilterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter & Table Density Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">التصنيف:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">جميع التصنيفات</option>
                {categories.filter(c => c !== 'all').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Density Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold shrink-0">
              <span className="px-1.5 text-slate-400 text-[10px]">العرض:</span>
              <button
                onClick={() => setTableDensity('compact')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  tableDensity === 'compact' ? 'bg-white text-emerald-800 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض كثيف جداً (36px)"
              >
                مضغوط
              </button>
              <button
                onClick={() => setTableDensity('dense')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  tableDensity === 'dense' ? 'bg-white text-emerald-800 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض كثيف مريح (42px)"
              >
                كثيف مريح
              </button>
              <button
                onClick={() => setTableDensity('comfortable')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  tableDensity === 'comfortable' ? 'bg-white text-emerald-800 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض واسع مريح (52px)"
              >
                واسع
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-slideDown">
          <div className="flex items-center gap-3 text-xs font-black">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <span>تم تحديد <strong className="text-emerald-300 font-mono-numbers">{selectedIds.length}</strong> منتج</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowBulkPriceModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors"
            >
              تعديل أسعار المحدد
            </button>
            <button
              onClick={() => setShowBarcodePrintModal(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-colors"
            >
              طباعة باركود المحدد
            </button>
            <button
              onClick={() => {
                if (window.confirm(`هل أنت أؤكد حذف ${selectedIds.length} منتج محدد؟`)) {
                  selectedIds.forEach(id => onDeleteProduct(id));
                  setSelectedIds([]);
                }
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors"
            >
              حذف المحدد
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Products Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 font-black z-10 select-none">
              <tr>
                <th className={`w-10 text-center ${tableDensity === 'compact' ? 'px-2 py-2' : tableDensity === 'dense' ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
                  <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-900">
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className={tableDensity === 'compact' ? 'px-2 py-2' : tableDensity === 'dense' ? 'px-3.5 py-2.5' : 'px-4 py-3.5'}>المنتج والرمز</th>
                <th className={tableDensity === 'compact' ? 'px-2 py-2' : tableDensity === 'dense' ? 'px-3.5 py-2.5' : 'px-4 py-3.5'}>Barcode</th>
                <th className={tableDensity === 'compact' ? 'px-2 py-2' : tableDensity === 'dense' ? 'px-3.5 py-2.5' : 'px-4 py-3.5'}>المخزون</th>
                <th className={tableDensity === 'compact' ? 'px-2 py-2' : tableDensity === 'dense' ? 'px-3.5 py-2.5' : 'px-4 py-3.5'}>التكلفة (شراء)</th>
                <th className={tableDensity === 'compact' ? 'px-2 py-2' : tableDensity === 'dense' ? 'px-3.5 py-2.5' : 'px-4 py-3.5'}>سعر البيع</th>
                <th className={`text-center ${tableDensity === 'compact' ? 'px-2 py-2' : tableDensity === 'dense' ? 'px-3.5 py-2.5' : 'px-4 py-3.5'}`}>الإجراءات والعمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p>لا توجد منتجات مطابقة لخيارات البحث أو الفلترة</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock <= 0;
                  const cellPadding = tableDensity === 'compact' ? 'px-2 py-1.5' : tableDensity === 'dense' ? 'px-3.5 py-2.5' : 'px-4 py-3.5';

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-emerald-50/30 even:bg-slate-50/40 transition-colors ${isSelected ? 'bg-emerald-50/70' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className={`${cellPadding} text-center`}>
                        <button onClick={() => toggleSelectOne(p.id)} className="text-slate-400 hover:text-emerald-600">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Product Name & Details */}
                      <td className={cellPadding}>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-xs sm:text-sm">{p.name}</span>
                            {p.sku && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded font-mono text-[10px]">
                                {p.sku}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold block">{p.category} • {p.unit}</span>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className={cellPadding}>
                        <span className="font-mono-numbers font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {p.barcode}
                        </span>
                      </td>

                      {/* Stock Badge */}
                      <td className={cellPadding}>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black inline-flex items-center gap-1 font-mono-numbers ${
                          isOut 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : isLow 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut && <XCircle className="w-3 h-3 text-rose-600" />}
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          <span>{p.stock} {p.unit}</span>
                        </span>
                      </td>

                      {/* Buy Cost */}
                      <td className={`${cellPadding} font-mono-numbers text-slate-600 font-bold`}>
                        ج.م {p.buyPrice.toFixed(2)}
                      </td>

                      {/* Sell Price */}
                      <td className={`${cellPadding} font-mono-numbers font-black text-emerald-700`}>
                        ج.م {p.sellPrice.toFixed(2)}
                      </td>

                      {/* Action buttons */}
                      <td className={`${cellPadding} text-center`}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setStockAdjProduct(p);
                              setStockAdjNewQty(p.stock.toString());
                              setShowStockAdjModal(true);
                            }}
                            className="p-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg transition-colors"
                            title="تسوية مخزون سريع"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-lg transition-colors"
                              title="تعديل بيانات المنتج"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors"
                              title="حذف المنتج"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>{editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمخزون'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المنتج *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: كوكاكولا 1 لتر"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رمز SKU (اختياري)</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="SKU-1001"
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الباركود (Barcode)</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="مشروبات، ألبان، بقالة..."
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">سعر الشراء (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono-numbers font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">سعر البيع (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono-numbers font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المخزون الأولي *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono-numbers font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">وحدة القياس</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="لتر">لتر</option>
                    <option value="عبوة">عبوة</option>
                    <option value="كرتونة">كرتونة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">حد التنبيه (أدنى مخزون)</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono-numbers"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج للمخزون'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK PRICE ADJUSTMENT MODAL */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" />
                <span>تعديل الأسعار جماعياً (Bulk Price Adjustment)</span>
              </h3>
              <button onClick={() => setShowBulkPriceModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold">
              سيتم تطبيق التعديل على {selectedIds.length > 0 ? `${selectedIds.length} منتج محدد` : 'جميع المنتجات المعروضة حالياً'}.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">السعر المستهدف:</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setBulkAdjTarget('sell')}
                    className={`py-2 rounded-lg font-black transition-all ${
                      bulkAdjTarget === 'sell' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    سعر البيع
                  </button>
                  <button
                    onClick={() => setBulkAdjTarget('buy')}
                    className={`py-2 rounded-lg font-black transition-all ${
                      bulkAdjTarget === 'buy' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    سعر الشراء (التكلفة)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع التعديل والإتجاه:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={bulkAdjDirection}
                    onChange={(e) => setBulkAdjDirection(e.target.value as any)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="increase">زيادة 📈</option>
                    <option value="decrease">تخفيض 📉</option>
                  </select>

                  <select
                    value={bulkAdjMode}
                    onChange={(e) => setBulkAdjMode(e.target.value as any)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  قيمة {bulkAdjMode === 'percent' ? 'النسبة المئوية (%)' : 'المبلغ الثابت (ج.م)'}:
                </label>
                <input
                  type="number"
                  value={bulkAdjVal}
                  onChange={(e) => setBulkAdjVal(e.target.value)}
                  placeholder="مثال: 10"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-numbers"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={handleApplyBulkPriceChange}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                تأكيد وتطبيق التعديل
              </button>
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK ADJUSTMENT MODAL (تسوية المخزون) */}
      {showStockAdjModal && stockAdjProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>تسوية المخزون (Stock Adjustment)</span>
              </h3>
              <button onClick={() => setShowStockAdjModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs">
              <p className="font-black text-blue-950">{stockAdjProduct.name}</p>
              <p className="text-[10px] text-blue-700 font-bold mt-0.5">
                المخزون الحالي بالنظام: <span className="font-mono-numbers font-black">{stockAdjProduct.stock} {stockAdjProduct.unit}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الكمية الفعلية المكتشفة:</label>
                <input
                  type="number"
                  value={stockAdjNewQty}
                  onChange={(e) => setStockAdjNewQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono-numbers"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">سبب التسوية المخزنية:</label>
                <select
                  value={stockAdjReason}
                  onChange={(e) => setStockAdjReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="جرد دوري">جرد دوري</option>
                  <option value="تسويه عجز">تسويه عجز مخزني</option>
                  <option value="تسويه زيادة">تسويه زيادة مخزنية</option>
                  <option value="تلف أو كسر">تلف أو كسر</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveStockAdj}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 shadow-md"
              >
                حفظ التسوية
              </button>
              <button
                onClick={() => setShowStockAdjModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINT BARCODE STICKERS MODAL */}
      {showBarcodePrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <span>طباعة ملصقات الباركود (Barcode Stickers)</span>
              </h3>
              <button onClick={() => setShowBarcodePrintModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 font-bold">
              معاينة ملصقات الباركود الجاهزة للطباعة الحيوية على طابعات الباركود الحرارية (Xprinter / Zebra).
            </div>

            {/* Grid Preview of Stickers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(selectedIds.length > 0 ? products.filter(p => selectedIds.includes(p.id)) : filteredProducts.slice(0, 6)).map(p => (
                <div key={p.id} className="p-3 bg-white rounded-xl border-2 border-slate-300 text-center space-y-1 shadow-2xs">
                  <p className="text-[10px] font-black text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs font-black text-emerald-700 font-mono-numbers">ج.م {p.sellPrice.toFixed(2)}</p>

                  {/* Simulated Barcode Graphics */}
                  <div className="py-1 flex items-center justify-center gap-0.5">
                    {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6].map((w, i) => (
                      <div
                        key={i}
                        style={{ width: `${(w % 3) + 1}px` }}
                        className="h-8 bg-slate-900"
                      />
                    ))}
                  </div>
                  <p className="text-[9px] font-mono text-slate-500 tracking-wider">{p.barcode}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة جميع الملصقات المعروضة</span>
              </button>
              <button
                onClick={() => setShowBarcodePrintModal(false)}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: IMPORT EXCEL / CSV MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>استيراد منتجات من ملف Excel / CSV</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/50 text-center space-y-2">
              <Upload className="w-8 h-8 mx-auto text-emerald-600 animate-bounce" />
              <p className="text-xs font-black text-emerald-950">اسحب وأسقط ملف Excel هنا</p>
              <p className="text-[10px] text-emerald-700 font-bold">أو اضغط زر الاستيراد التجريبي التلقائي المباشر</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleImportCSVData}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                استيراد البيانات التجريبية
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
