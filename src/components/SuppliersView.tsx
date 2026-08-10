import React, { useState, useMemo } from 'react';
import { Supplier, SupplierTransaction } from '../types';
import { Truck, Plus, Phone, Building2, Wallet, X, Edit3, Trash2, DollarSign, History, ArrowRightLeft, FileText } from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  transactions: SupplierTransaction[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onPaySupplierDebt: (supplierId: string, amount: number) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ 
  suppliers, 
  transactions,
  onAddSupplier, 
  onUpdateSupplier, 
  onDeleteSupplier,
  onPaySupplierDebt
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [balance, setBalance] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setCompany('');
    setBalance('');
    setShowModal(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone);
    setCompany(sup.company);
    setBalance(sup.balance.toString());
    setShowModal(true);
  };

  const handleOpenPay = (sup: Supplier) => {
    setPayingSupplier(sup);
    setPayAmount('');
    setShowPayModal(true);
  };

  const handleOpenStatement = (sup: Supplier) => {
    setStatementSupplier(sup);
    setShowStatementModal(true);
  };

  const supplierTransactions = useMemo(() => {
    if (!statementSupplier) return [];
    return transactions.filter(t => t.supplierId === statementSupplier.id);
  }, [statementSupplier, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        name,
        phone: phone || 'غير محدد',
        company: company || name,
        balance: parseFloat(balance) || 0
      });
    } else {
      const newSupplier: Supplier = {
        id: 'sup-' + Date.now(),
        name,
        phone: phone || 'غير محدد',
        company: company || name,
        balance: parseFloat(balance) || 0
      };
      onAddSupplier(newSupplier);
    }

    setShowModal(false);
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setCompany('');
    setBalance('');
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || !payAmount) return;
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    onPaySupplierDebt(payingSupplier.id, amount);
    setShowPayModal(false);
    setPayingSupplier(null);
    setPayAmount('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            <span>إدارة الموردين والحسابات الدائنة (سداد المستحقات)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">إضافة وتعديل بيانات الموردين، شركات التوريد، وسداد المستحقات والأرصدة الدائنة</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map(sup => (
          <div key={sup.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {sup.company}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                    title="تعديل المورد"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteSupplier(sup.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="حذف المورد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900">{sup.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{sup.phone}</span>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">رصيد دائن مستحق:</span>
                  <span className="text-base font-black text-amber-700">ج.م {sup.balance.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => handleOpenStatement(sup)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-all"
                  title="كشف الحساب"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenPay(sup)}
                  disabled={sup.balance <= 0}
                  className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all shadow-sm border ${
                    sup.balance > 0 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>سداد دفعة</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Statement Modal */}
      {showStatementModal && statementSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">كشف حساب مورد</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{statementSupplier.name} | {statementSupplier.company}</p>
                </div>
              </div>
              <button onClick={() => setShowStatementModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي الحساب الدائن</p>
                  <p className="text-xl font-black text-amber-700">{statementSupplier.balance.toLocaleString()} ج</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">عدد العمليات</p>
                  <p className="text-xl font-black text-slate-700">{supplierTransactions.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">سجل العمليات</h4>
                {supplierTransactions.length > 0 ? (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">البيان</th>
                          <th className="p-3">المبلغ</th>
                          <th className="p-3">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supplierTransactions.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-400 text-[10px]">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">{t.description}</p>
                              <p className="text-[9px] text-slate-400">#{t.referenceId}</p>
                            </td>
                            <td className="p-3">
                              <span className={`font-black ${
                                t.type === 'purchase' ? 'text-rose-600' : 'text-emerald-600'
                              }`}>
                                {t.type === 'purchase' ? '+' : '-'}{t.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-3 font-black text-slate-900">{t.balanceAfter.toLocaleString()} ج</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-300 italic text-sm">لا توجد عمليات مسجلة لهذا المورد حتى الآن</div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>طباعة الكشف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">اسم المورد أو المسؤول *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">اسم الشركة / المؤسسة</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">الرصيد (دائن مستحق)</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                />
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
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-900/20"
                >
                  {editingSupplier ? 'حفظ التعديلات' : 'حفظ المورد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Debt Modal */}
      {showPayModal && payingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">سداد دفعة للمورد</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-600">المورد: <strong className="text-slate-900">{payingSupplier.name} ({payingSupplier.company})</strong></p>
              <p className="text-slate-600">الرصيد المستحق للمورد: <strong className="text-amber-700">ج.م {payingSupplier.balance.toLocaleString()}</strong></p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">المبلغ المسدد للمورد (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={payingSupplier.balance}
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="أدخل مبلغ السداد"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-900/20"
                >
                  تأكيد سداد الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
