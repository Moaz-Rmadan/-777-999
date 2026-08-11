import React, { useState } from 'react';
import { Expense } from '../types';
import { FileText, Plus, TrendingDown, X, Edit3, Trash2 } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ 
  expenses, 
  onAddExpense, 
  onUpdateExpense, 
  onDeleteExpense 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('إيجار');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const activeExpenses = expenses.filter(e => e.status !== 'voided');
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('إيجار');
    setAmount('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount.toString());
    setNotes(exp.notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        title,
        category,
        amount: parseFloat(amount) || 0,
        notes
      });
    } else {
      const newExpense: Expense = {
        id: 'exp-' + Date.now(),
        title,
        category,
        amount: parseFloat(amount) || 0,
        date: new Date().toISOString().substring(0, 10),
        notes
      };
      onAddExpense(newExpense);
    }

    setShowModal(false);
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-600" />
            <span>إدارة المصروفات التشغيلية (CRUD متكامل)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">تسجيل وتعديل وحذف مصروفات الإيجار، الرواتب، الفواتير، والصيانة</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-xs text-rose-800 font-bold">
            إجمالي المصروفات: ج.م {totalExpenses.toLocaleString()}
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 font-black z-10 select-none">
              <tr>
                <th className="px-3.5 py-2.5">بيان المصروف</th>
                <th className="px-3.5 py-2.5">التصنيف</th>
                <th className="px-3.5 py-2.5">التاريخ</th>
                <th className="px-3.5 py-2.5">ملاحظات</th>
                <th className="px-3.5 py-2.5">المبلغ</th>
                <th className="px-3.5 py-2.5 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-rose-50/30 even:bg-slate-50/40 transition-colors">
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{exp.title}</span>
                      {exp.status === 'voided' && (
                        <span className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded-md font-black">ملغي (Voided)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500 font-mono-numbers">{exp.date}</td>
                  <td className="px-3.5 py-2.5 text-slate-500">{exp.notes || '-'}</td>
                  <td className="px-3.5 py-2.5 font-black text-rose-600 font-mono-numbers">ج.م {exp.amount.toFixed(2)}</td>
                  <td className="px-3.5 py-2.5 text-left">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(exp)}
                        disabled={exp.status === 'voided'}
                        className={`p-1 rounded-lg transition-colors ${exp.status === 'voided' ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        disabled={exp.status === 'voided'}
                        className={`p-1.5 rounded-lg transition-colors ${exp.status === 'voided' ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
                        title={exp.status === 'voided' ? 'ملغي' : 'حذف'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingExpense ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">بيان المصروف *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء المحل"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <option value="إيجار">إيجار</option>
                  <option value="رواتب">رواتب</option>
                  <option value="كهرباء ومياه">كهرباء ومياه</option>
                  <option value="نظافة ونقل">نظافة ونقل</option>
                  <option value="صيانة">صيانة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-900/20"
                >
                  {editingExpense ? 'حفظ التعديلات' : 'حفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
