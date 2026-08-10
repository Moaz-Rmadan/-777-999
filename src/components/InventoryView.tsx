import React, { useState } from 'react';
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
  X
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
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canApprove = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  // Form state
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('ألبان وأجبان');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formSellPrice, setFormSellPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formUnit, setFormUnit] = useState('قطعة');
  const [formExpiry, setFormExpiry] = useState('');

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode || '').includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode(Math.floor(6221000000000 + Math.random() * 900000000).toString());
    setFormCategory('ألبان وأجبان');
    setFormBuyPrice('');
    setFormSellPrice('');
    setFormStock('');
    setFormMinStock('10');
    setFormUnit('قطعة');
    setFormExpiry('');
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormBuyPrice(p.buyPrice.toString());
    setFormSellPrice(p.sellPrice.toString());
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormUnit(p.unit);
    setFormExpiry(p.expiryDate || '');
    setShowModal(true);
  };

  const handleOpenAuditModal = () => {
    const initialCounts: Record<string, number> = {};
    products.forEach(p => {
      initialCounts[p.id] = p.stock;
    });
    setAuditCounts(initialCounts);
    setShowAuditModal(true);
  };

  const handleSaveAudit = () => {
    products.forEach(p => {
      const counted = auditCounts[p.id];
      if (counted !== undefined && counted !== p.stock) {
        onUpdateProduct({
          ...p,
          stock: Math.max(0, counted)
        });
      }
    });
    setShowAuditModal(false);
    alert('تم اعتماد جرد المخزون وتحديث الأرصدة بنجاح!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBuyPrice || !formSellPrice || !formStock) {
      alert('يرجى تعبئة الحقول الإلزامية.');
      return;
    }

    const productData: Product = {
      id: editingProduct ? editingProduct.id : 'p-' + Date.now(),
      barcode: formBarcode || '622' + Math.floor(1000000000 + Math.random() * 900000000),
      name: formName,
      category: formCategory,
      buyPrice: parseFloat(formBuyPrice) || 0,
      sellPrice: parseFloat(formSellPrice) || 0,
      stock: parseInt(formStock) || 0,
      minStock: parseInt(formMinStock) || 10,
      unit: formUnit,
      expiryDate: formExpiry || undefined
    };

    if (editingProduct) {
      onUpdateProduct(productData);
    } else {
      onAddProduct(productData);
    }
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>إدارة المخزون والأصناف والجرد الفعلي</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">إضافة وتعديل المنتجات، تنفيذ جلسات الجرد الفعلي، ومتابعة الكميات وأسعار الشراء والبيع</p>
        </div>
        <div className="flex items-center gap-3">
          {canApprove && (
            <button
              onClick={handleOpenAuditModal}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>جلسة الجرد الفعلي</span>
            </button>
          )}
          {canCreate && (
            <button
              onClick={handleOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'الكل' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-4">الباركود</th>
                <th className="p-4">اسم الصنف</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4">سعر الشراء</th>
                <th className="p-4">سعر البيع</th>
                <th className="p-4">الرصيد المتاح</th>
                <th className="p-4">تاريخ الصلاحية</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono text-slate-500">{p.barcode}</td>
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">ج.م {p.buyPrice.toFixed(2)}</td>
                    <td className="p-4 font-extrabold text-emerald-600">ج.م {p.sellPrice.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLow && <AlertTriangle className="w-3 h-3" />}
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{p.expiryDate || 'غير محدد'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!canEdit && !canDelete && (
                          <span className="text-[10px] text-slate-400 font-bold">لا توجد صلاحيات تعديل</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد للمخزون'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">اسم الصنف *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: حليب كامل الدسم 1 لتر"
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">الباركود</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="ألبان وأجبان، مشروبات..."
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">وحدة القياس</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <option value="قطعة">قطعة</option>
                    <option value="كيلو">كيلو</option>
                    <option value="لتر">لتر</option>
                    <option value="عبوة">عبوة</option>
                    <option value="كرتونة">كرتونة</option>
                    <option value="زجاجة">زجاجة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">سعر الشراء (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">سعر البيع (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSellPrice}
                    onChange={(e) => setFormSellPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">الرصيد الحالي *</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">الحد الأدنى للتنبيه</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">تاريخ الصلاحية (اختياري)</label>
                  <input
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-900/20"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة الصنف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <span>جلسة الجرد الفعلي للمخزون (Stock Take)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">أدخل العدد الفعلي الموجود بالرفوف لكل صنف للمقارنة مع رصيد النظام وتسجيل الفروق</p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-3">الصنف والباركود</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3 text-center">رصيد النظام</th>
                    <th className="p-3 text-center">العد الفعلي بالمخزن</th>
                    <th className="p-3 text-center">الفارق (عجز / زيادة)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => {
                    const counted = auditCounts[p.id] !== undefined ? auditCounts[p.id] : p.stock;
                    const diff = counted - p.stock;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <span className="text-[10px] text-slate-400">{p.barcode}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{p.stock} {p.unit}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={counted}
                            onChange={(e) => setAuditCounts({ ...auditCounts, [p.id]: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 text-center bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            diff === 0 ? 'bg-slate-100 text-slate-600' :
                            diff > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {diff === 0 ? 'مطابق (0)' : diff > 0 ? `+${diff} (زيادة)` : `${diff} (عجز)`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-slate-500 font-medium">إجمالي عدد الأصناف المخزنية: {products.length} صنف</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveAudit}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20"
                >
                  اعتماد الجرد وتحديث المخزون
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
