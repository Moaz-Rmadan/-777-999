import React, { useState } from 'react';
import { Shift, User } from '../types';
import { 
  History as HistoryIcon, 
  Plus, 
  DoorOpen, 
  DoorClosed, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  ArrowDownLeft,
  X,
  FileText
} from 'lucide-react';

interface ShiftsViewProps {
  shifts: Shift[];
  activeShift: Shift | undefined;
  currentUser: User;
  onOpenShift: (openingBalance: number) => void;
  onCloseShift: (actualCash: number) => void;
  onWithdrawal: (amount: number, description: string) => void;
}

export const ShiftsView: React.FC<ShiftsViewProps> = ({
  shifts,
  activeShift,
  currentUser,
  onOpenShift,
  onCloseShift,
  onWithdrawal
}) => {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  
  const [openingBalance, setOpeningBalance] = useState('0');
  const [actualCash, setActualCash] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNote, setWithdrawalNote] = useState('');

  // Filter shifts based on role
  const displayShifts = currentUser.role === 'admin' 
    ? shifts 
    : shifts.filter(s => s.cashierId === currentUser.id);

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift(parseFloat(openingBalance) || 0);
    setShowOpenModal(false);
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(parseFloat(actualCash) || 0);
    setShowCloseModal(false);
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onWithdrawal(parseFloat(withdrawalAmount) || 0, withdrawalNote);
    setShowWithdrawalModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-indigo-600" />
            <span>إدارة ورديات الصندوق (Shifts)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">متابعة فتح وإغلاق الصندوق، الأرصدة الافتتاحية، وتسوية العجز والزيادة</p>
        </div>
        
        {!activeShift ? (
          <button
            onClick={() => {
              setOpeningBalance('0');
              setShowOpenModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
          >
            <DoorOpen className="w-4 h-4" />
            <span>فتح وردية جديدة</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setWithdrawalAmount('');
                setWithdrawalNote('');
                setShowWithdrawalModal(true);
              }}
              className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-amber-100 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>سحب نقدي / مصروف</span>
            </button>
            <button
              onClick={() => {
                setActualCash('');
                setShowCloseModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-900/20 transition-all"
            >
              <DoorClosed className="w-4 h-4" />
              <span>إغلاق الوردية الحالية</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Shift Card */}
      {activeShift && (
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">الوردية الحالية نشطة</h3>
                <p className="text-xs text-slate-400">بدأت في: {new Date(activeShift.startTime).toLocaleString('ar-EG')}</p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block uppercase tracking-widest">الكاشير المسؤول</span>
              <span className="text-sm font-bold">{activeShift.cashierName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-[10px] text-slate-400 block mb-1">الرصيد الافتتاحي</span>
              <span className="text-lg font-bold">ج.م {activeShift.openingBalance}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-[10px] text-emerald-400 block mb-1">إجمالي المبيعات (نقدي)</span>
              <span className="text-lg font-bold text-emerald-400">ج.م {activeShift.totalSales}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <span className="text-[10px] text-rose-400 block mb-1">سحوبات / مصروفات</span>
              <span className="text-lg font-bold text-rose-400">- ج.م {activeShift.totalWithdrawals + activeShift.totalExpenses}</span>
            </div>
            <div className="bg-emerald-500 rounded-xl p-4 text-emerald-950">
              <span className="text-[10px] font-bold block mb-1 uppercase">النقدية المتوقعة (Cash Expected)</span>
              <span className="text-xl font-black">ج.م {activeShift.expectedCash}</span>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">سجل الورديات السابقة</h3>
          <span className="text-[10px] text-slate-500">تم عرض {displayShifts.length} وردية</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-4">الكاشير</th>
                <th className="p-4">وقت البدء</th>
                <th className="p-4">وقت الإغلاق</th>
                <th className="p-4">المتوقع</th>
                <th className="p-4">الفعلي</th>
                <th className="p-4">الفرق (عجز/زيادة)</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayShifts.filter(s => s.status === 'closed').map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">{s.cashierName}</td>
                  <td className="p-4 text-slate-500">{new Date(s.startTime).toLocaleTimeString('ar-EG')}</td>
                  <td className="p-4 text-slate-500">{s.endTime ? new Date(s.endTime).toLocaleTimeString('ar-EG') : '-'}</td>
                  <td className="p-4 font-bold">ج.م {s.expectedCash}</td>
                  <td className="p-4 font-bold">ج.م {s.actualCash}</td>
                  <td className="p-4">
                    {s.difference !== undefined && (
                      <span className={`font-black px-2 py-1 rounded-lg ${
                        s.difference === 0 ? 'text-slate-400' :
                        s.difference > 0 ? 'text-emerald-600 bg-emerald-50' :
                        'text-rose-600 bg-rose-50'
                      }`}>
                        {s.difference > 0 ? '+' : ''}{s.difference}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">مغلقة</span>
                  </td>
                </tr>
              ))}
              {displayShifts.filter(s => s.status === 'closed').length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 italic">لا توجد ورديات مغلقة حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">فتح وردية جديدة</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleOpenSubmit} className="space-y-4 text-xs">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-4">
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-emerald-900 font-bold">الرصيد الافتتاحي للصندوق</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">أدخل المبلغ الموجود فعلياً في الدرج الآن قبل بدء البيع (الفكة)</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">المبلغ الافتتاحي (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg text-slate-900"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">فتح الوردية وتفعيل الصندوق</button>
            </form>
          </div>
        </div>
      )}

      {showCloseModal && activeShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">إغلاق وتسليم الوردية</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-slate-500">
                  <span>النقدية المتوقعة (حسابياً):</span>
                  <span className="font-bold text-slate-900">ج.م {activeShift.expectedCash}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                  يتم حساب المتوقع كالتالي: (افتتاحي + مبيعات نقدي - سحوبات - مصروفات)
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">النقدية الفعلية في الدرج حالياً *</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="عد المبلغ الموجود في الدرج"
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg text-slate-900"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-900/20">تأكيد الإغلاق وتسجيل العجز/الزيادة</button>
            </form>
          </div>
        </div>
      )}

      {showWithdrawalModal && activeShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">تسجيل سحب نقدي / مصروف</h3>
              <button onClick={() => setShowWithdrawalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">المبلغ المسحوب (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  required
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-lg text-rose-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">السبب / الملاحظات *</label>
                <textarea
                  required
                  value={withdrawalNote}
                  onChange={(e) => setWithdrawalNote(e.target.value)}
                  placeholder="مثال: شراء أدوات نظافة، سلف موظف، سحب للمدير..."
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[80px]"
                ></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold">تأكيد السحب وخصمه من الصندوق</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
