import React, { useState } from 'react';
import { PurchaseInvoice, Supplier, Product } from '../types';
import { 
  Receipt, 
  Truck, 
  Plus, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  X
} from 'lucide-react';

interface PurchasesViewProps {
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  products: Product[];
  onAddPurchase: (purchase: PurchaseInvoice) => void;
  onVoidPurchase: (purchaseId: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  suppliers,
  products,
  onAddPurchase,
  onVoidPurchase
}) => {
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; quantity: number; buyPrice: number }[]>([]);
  
  // Add item selector state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseInt(itemQty) || 1;
    const price = parseFloat(itemPrice) || prod.buyPrice;

    setPurchaseItems(prev => {
      const existing = prev.find(i => i.productId === selectedProductId);
      if (existing) {
        return prev.map(i => i.productId === selectedProductId ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { productId: selectedProductId, quantity: qty, buyPrice: price }];
    });
    setSelectedProductId('');
    setItemQty('1');
    setItemPrice('');
  };

  const removeItem = (productId: string) => {
    setPurchaseItems(prev => prev.filter(i => i.productId !== productId));
  };

  const totalPurchaseAmount = purchaseItems.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || purchaseItems.length === 0) {
      alert('يرجى اختيار المورد وإضافة صنف واحد على الأقل لفاتورة الشراء.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);

    const purchaseId = 'pur-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    const newPurchase: PurchaseInvoice = {
      id: purchaseId,
      operationId: `op-pur-${purchaseId}`,
      purchaseNumber: 'PUR-' + Math.floor(1000 + Math.random() * 9000),
      supplierId,
      supplierName: supplier ? supplier.name : 'مورد عام',
      date: new Date().toISOString().substring(0, 10),
      items: purchaseItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: prod ? prod.name : 'صنف',
          buyPrice: item.buyPrice,
          quantity: item.quantity,
          total: item.buyPrice * item.quantity
        };
      }),
      total: totalPurchaseAmount,
      status: status
    };

    onAddPurchase(newPurchase);
    setShowModal(false);
    setPurchaseItems([]);
    setSupplierId('');
    setStatus('paid');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>إدارة المشتريات وفواتير الموردين</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">تسجيل فواتير الشراء الواردة وتحديث أرصدة المخزون وأسعار التكلفة تلقائياً</p>
        </div>
        <button
          onClick={() => { setPurchaseItems([]); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل فاتورة شراء جديدة</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 font-black z-10 select-none">
              <tr>
                <th className="px-3.5 py-2.5">رقم الفاتورة</th>
                <th className="px-3.5 py-2.5">المورد</th>
                <th className="px-3.5 py-2.5">التاريخ</th>
                <th className="px-3.5 py-2.5">عدد الأصناف</th>
                <th className="px-3.5 py-2.5">الحالة</th>
                <th className="px-3.5 py-2.5 text-left">إجمالي الفاتورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map(pur => (
                <tr key={pur.id} className={`hover:bg-blue-50/30 even:bg-slate-50/40 transition-colors ${pur.status === 'voided' ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900 font-mono-numbers">{pur.purchaseNumber}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-800">{pur.supplierName}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 font-mono-numbers">{pur.date}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 font-mono-numbers">{pur.items.length} أصناف</td>
                  <td className="px-3.5 py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      pur.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 
                      pur.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {pur.status === 'paid' ? 'مسددة' : pur.status === 'pending' ? 'آجل' : 'مرتجع/ملغي'}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-left font-black text-blue-600 font-mono-numbers">
                    <div className="flex items-center justify-end gap-3">
                      <span>ج.م {pur.total.toLocaleString()}</span>
                      {pur.status !== 'voided' && (
                        <button
                          onClick={() => onVoidPurchase(pur.id)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="إرجاع المشتريات / إلغاء الفاتورة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">تسجيل فاتورة شراء بضاعة من مورد</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">اختر المورد *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <option value="">-- اختر المورد --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">حالة الدفع *</label>
                  <select
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'paid' | 'pending')}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <option value="paid">مسددة (نقدي)</option>
                    <option value="pending">آجل (دين للمورد)</option>
                  </select>
                </div>
              </div>

              {/* Add item inline */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800">إضافة أصناف للفاتورة</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const p = products.find(x => x.id === e.target.value);
                        if (p) setItemPrice(p.buyPrice.toString());
                      }}
                      className="w-full px-2.5 py-2 bg-white rounded-lg border border-slate-200"
                    >
                      <option value="">-- اختر الصنف --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white rounded-lg border border-slate-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="سعر الشراء"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {purchaseItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2.5">الصنف</th>
                        <th className="p-2.5">الكمية</th>
                        <th className="p-2.5">سعر الشراء</th>
                        <th className="p-2.5">الإجمالي</th>
                        <th className="p-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseItems.map(item => {
                        const p = products.find(x => x.id === item.productId);
                        return (
                          <tr key={item.productId}>
                            <td className="p-2.5 font-bold">{p?.name}</td>
                            <td className="p-2.5">{item.quantity}</td>
                            <td className="p-2.5">ج.م {item.buyPrice}</td>
                            <td className="p-2.5 font-bold text-blue-600">ج.م {item.buyPrice * item.quantity}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(item.productId)}
                                className="text-rose-600 hover:text-rose-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl font-bold text-slate-900 text-sm">
                <span>إجمالي الفاتورة:</span>
                <span className="text-blue-600">ج.م {totalPurchaseAmount.toFixed(2)}</span>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-900/20"
                >
                  حفظ الفاتورة وتحديث المخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
