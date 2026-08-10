import React, { useState, useMemo } from 'react';
import { Customer, CustomerTransaction } from '../types';
import { Users, Plus, Phone, CreditCard, X, Edit3, Trash2, DollarSign, History, FileText, ArrowRightLeft } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  transactions: CustomerTransaction[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onPayDebt: (customerId: string, amount: number) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ 
  customers, 
  transactions,
  onAddCustomer, 
  onUpdateCustomer, 
  onDeleteCustomer,
  onPayDebt
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('2000');
  const [currentDebt, setCurrentDebt] = useState('0');
  const [payAmount, setPayAmount] = useState('');

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setCreditLimit('2000');
    setCurrentDebt('0');
    setShowModal(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setCreditLimit(cust.creditLimit.toString());
    setCurrentDebt(cust.currentDebt.toString());
    setShowModal(true);
  };

  const handleOpenPay = (cust: Customer) => {
    setPayingCustomer(cust);
    setPayAmount('');
    setShowPayModal(true);
  };

  const handleOpenStatement = (cust: Customer) => {
    setStatementCustomer(cust);
    setShowStatementModal(true);
  };

  const customerTransactions = useMemo(() => {
    if (!statementCustomer) return [];
    return transactions.filter(t => t.customerId === statementCustomer.id);
  }, [statementCustomer, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name,
        phone: phone || 'غير محدد',
        creditLimit: parseFloat(creditLimit) || 2000,
        currentDebt: parseFloat(currentDebt) || 0
      });
    } else {
      const newCustomer: Customer = {
        id: 'cust-' + Date.now(),
        name,
        phone: phone || 'غير محدد',
        creditLimit: parseFloat(creditLimit) || 2000,
        currentDebt: parseFloat(currentDebt) || 0
      };
      onAddCustomer(newCustomer);
    }

    setShowModal(false);
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setCreditLimit('2000');
    setCurrentDebt('0');
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer || !payAmount) return;
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) return;

    onPayDebt(payingCustomer.id, amount);
    setShowPayModal(false);
    setPayingCustomer(null);
    setPayAmount('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>إدارة العملاء والحسابات الآجلة (الديون) — CRUD متكامل</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">متابعة حسابات العملاء الدائمين، الحدود الائتمانية، وسداد الديون</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {customers.map(cust => (
          <div key={cust.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  حد الائتمان: ج.م {cust.creditLimit}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cust)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                    title="تعديل العميل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCustomer(cust.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="حذف العميل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900">{cust.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{cust.phone}</span>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">الديون (المتأخرات):</span>
                  <span className={`text-base font-black ${cust.currentDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ج.م {cust.currentDebt.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenStatement(cust)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-all"
                  title="كشف الحساب"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenPay(cust)}
                  disabled={cust.currentDebt <= 0}
                  className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all shadow-sm border ${
                    cust.currentDebt > 0 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>تحصيل مبلغ</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <label className="block text-slate-600 font-medium mb-1">الحد الائتماني (ج.م)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>
              {!editingCustomer && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">الديون الافتتاحية الحالية (ج.م)</label>
                  <input
                    type="number"
                    value={currentDebt}
                    onChange={(e) => setCurrentDebt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              )}

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
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-900/20"
                >
                  {editingCustomer ? 'حفظ التعديلات' : 'حفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {showPayModal && payingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">سداد دفعة من الدين</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-600">العميل: <strong className="text-slate-900">{payingCustomer.name}</strong></p>
              <p className="text-slate-600">الديون المستحقة حالياً: <strong className="text-rose-600">ج.م {payingCustomer.currentDebt.toLocaleString()}</strong></p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">المبلغ المسدد (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={payingCustomer.currentDebt}
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-900/20"
                >
                  تأكيد السداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Statement Modal */}
      {showStatementModal && statementCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-fadeIn overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-900/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">كشف حساب عميل</h3>
                  <p className="text-xs text-slate-500 font-bold">{statementCustomer.name} - {statementCustomer.phone}</p>
                </div>
              </div>
              <button onClick={() => setShowStatementModal(false)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 bg-white flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-black uppercase">الرصيد الحالي (المتأخرات)</span>
                  <p className={`text-xl font-black mt-1 ${statementCustomer.currentDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ج.م {statementCustomer.currentDebt.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-600 font-black uppercase">إجمالي المسدد (التحصيلات)</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    ج.م {customerTransactions.filter(t => t.type === 'collection').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                  <span className="text-[10px] text-purple-600 font-black uppercase">إجمالي المسحوبات (المبيعات الآجلة)</span>
                  <p className="text-xl font-black text-purple-700 mt-1">
                    ج.م {customerTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 mb-4">
                  <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                  <span>سجل المعاملات التفصيلي (التحركات)</span>
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-4 text-right">التاريخ والوقت</th>
                        <th className="p-4 text-right">النوع</th>
                        <th className="p-4 text-right">البيان / الوصف</th>
                        <th className="p-4 text-left">المبلغ</th>
                        <th className="p-4 text-left">الرصيد بعد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">لا توجد معاملات مسجلة لهذا العميل بعد.</td>
                        </tr>
                      ) : (
                        customerTransactions.map(trans => (
                          <tr key={trans.id} className="hover:bg-slate-50/50 text-[11px] transition-colors">
                            <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(trans.date).toLocaleString('ar-EG')}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-lg font-black text-[9px] ${
                                trans.type === 'sale' ? 'bg-purple-100 text-purple-700' :
                                trans.type === 'collection' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {trans.type === 'sale' ? 'بيع آجل' : trans.type === 'collection' ? 'تحصيل' : 'مرتجع'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-700 font-bold">{trans.description}</td>
                            <td className={`p-4 text-left font-black ${
                              trans.type === 'sale' ? 'text-rose-600' : 'text-emerald-600'
                            }`}>
                              {trans.type === 'sale' ? '+' : '-'} ج.م {trans.amount.toLocaleString()}
                            </td>
                            <td className="p-4 text-left font-black text-slate-900 bg-slate-50/30">
                              ج.م {trans.balanceAfter.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowStatementModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-xs hover:bg-slate-100 transition-all shadow-sm"
              >
                إغلاق الكشف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
