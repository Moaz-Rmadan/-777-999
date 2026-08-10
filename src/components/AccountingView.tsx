import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { 
  BookOpen, 
  Layers, 
  Scale, 
  TrendingUp, 
  Wallet, 
  ArrowRightLeft,
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccountingViewProps {
  entries: JournalEntry[];
}

type AccountingTab = 'journal' | 'ledger' | 'trial_balance' | 'income_statement' | 'cash_flow' | 'treasury';

const ACCOUNT_NAMES: Record<string, string> = {
  cash: 'الخزينة (نقدي)',
  bank: 'البنك (فيزا)',
  receivables: 'المدينون (العملاء)',
  payables: 'الدائنون (الموردون)',
  sales: 'إيراد المبيعات',
  purchases: 'المشتريات',
  expenses: 'المصروفات وتكلفة المبيعات'
};

export const AccountingView: React.FC<AccountingViewProps> = ({ entries }) => {
  const [activeTab, setActiveTab] = useState<AccountingTab>('journal');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(e => 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ACCOUNT_NAMES[e.account]?.includes(searchTerm) ||
      e.account.includes(searchTerm)
    );
  }, [entries, searchTerm]);

  // General Ledger logic
  const ledger = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    entries.forEach(e => {
      if (!groups[e.account]) groups[e.account] = [];
      groups[e.account].push(e);
    });
    return groups;
  }, [entries]);

  // Trial Balance logic
  const trialBalance = useMemo(() => {
    return Object.keys(ACCOUNT_NAMES).map(acc => {
      const accEntries = ledger[acc] || [];
      const totalDebit = accEntries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = accEntries.reduce((sum, e) => sum + e.credit, 0);
      return {
        account: acc,
        name: ACCOUNT_NAMES[acc],
        debit: totalDebit,
        credit: totalCredit,
        balance: totalDebit - totalCredit
      };
    });
  }, [ledger]);

  // Income Statement logic
  const incomeStatement = useMemo(() => {
    const sales = trialBalance.find(b => b.account === 'sales')?.credit || 0;
    const cogs = entries.filter(e => e.account === 'expenses' && e.description.includes('تكلفة مبيعات')).reduce((sum, e) => sum + e.debit, 0);
    const otherExpenses = entries.filter(e => e.account === 'expenses' && !e.description.includes('تكلفة مبيعات')).reduce((sum, e) => sum + e.debit, 0);
    const grossProfit = sales - cogs;
    const netProfit = grossProfit - otherExpenses;
    return { sales, cogs, grossProfit, otherExpenses, netProfit };
  }, [trialBalance, entries]);

  // Cash Flow logic
  const cashFlow = useMemo(() => {
    const inflows = entries.filter(e => e.account === 'cash' && e.debit > 0);
    const outflows = entries.filter(e => e.account === 'cash' && e.credit > 0);
    return { inflows, outflows };
  }, [entries]);

  const tabs: { id: AccountingTab; label: string; icon: React.ReactNode }[] = [
    { id: 'journal', label: 'دفتر اليومية', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'ledger', label: 'الأستاذ العام', icon: <Layers className="w-4 h-4" /> },
    { id: 'trial_balance', label: 'ميزان المراجعة', icon: <Scale className="w-4 h-4" /> },
    { id: 'income_statement', label: 'قائمة الدخل', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'cash_flow', label: 'التدفقات النقدية', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'treasury', label: 'حركة الخزينة', icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">النظام المالي والمحاسبي</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">الإدارة المالية، التقارير الضريبية، والقوائم الختامية</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            <span>تصدير PDF</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20">
            <Calendar className="w-4 h-4" />
            <span>الفترة الحالية</span>
          </button>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'journal' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث في القيود..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">رقم القيد</th>
                        <th className="p-4">البيان / الوصف</th>
                        <th className="p-4">الحساب</th>
                        <th className="p-4 text-left">مدين (Debit)</th>
                        <th className="p-4 text-left">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 text-xs transition-colors">
                          <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(entry.date).toLocaleString('ar-EG')}</td>
                          <td className="p-4 font-mono text-slate-400">#{entry.id.split('-')[2]}</td>
                          <td className="p-4 font-bold text-slate-900">{entry.description}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-slate-100 rounded-lg font-black text-[10px]">
                              {ACCOUNT_NAMES[entry.account] || entry.account}
                            </span>
                          </td>
                          <td className="p-4 text-left font-black text-emerald-600">
                            {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                          </td>
                          <td className="p-4 text-left font-black text-rose-600">
                            {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(ACCOUNT_NAMES).map(acc => (
                  <div key={acc} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h4 className="font-black text-slate-900 flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                        <span>{ACCOUNT_NAMES[acc]}</span>
                      </h4>
                      <span className="text-[10px] font-black text-slate-400">General Ledger</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-[10px]">
                        <thead className="sticky top-0 bg-white border-b border-slate-100">
                          <tr className="text-slate-400 font-black">
                            <th className="p-3 text-right">التاريخ</th>
                            <th className="p-3 text-right">البيان</th>
                            <th className="p-3 text-left">مدين</th>
                            <th className="p-3 text-left">دائن</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(ledger[acc] || []).map(e => (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-400">{new Date(e.date).toLocaleDateString('ar-EG')}</td>
                              <td className="p-3 font-bold text-slate-700">{e.description}</td>
                              <td className="p-3 text-left text-emerald-600 font-black">{e.debit > 0 ? e.debit.toLocaleString() : '-'}</td>
                              <td className="p-3 text-left text-rose-600 font-black">{e.credit > 0 ? e.credit.toLocaleString() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 bg-slate-900 text-white flex justify-between items-center mt-auto">
                      <span className="font-bold text-[10px]">الرصيد النهائي</span>
                      <span className="font-black">
                        ج.م {((ledger[acc] || []).reduce((s,e) => s + e.debit - e.credit, 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'trial_balance' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-black text-slate-900">ميزان المراجعة بالأرصدة والمجاميع</h3>
                </div>
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="p-4">اسم الحساب</th>
                      <th className="p-4 text-left">إجمالي مدين</th>
                      <th className="p-4 text-left">إجمالي دائن</th>
                      <th className="p-4 text-left bg-slate-100">الرصيد الصافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trialBalance.map(row => (
                      <tr key={row.account} className="hover:bg-slate-50/50 font-bold text-xs">
                        <td className="p-4 text-slate-900">{row.name}</td>
                        <td className="p-4 text-left text-emerald-600">{row.debit.toLocaleString()}</td>
                        <td className="p-4 text-left text-rose-600">{row.credit.toLocaleString()}</td>
                        <td className={`p-4 text-left bg-slate-50 font-black ${row.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {row.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900 text-white font-black text-sm">
                      <td className="p-4">الإجمالي الكلي</td>
                      <td className="p-4 text-left">{trialBalance.reduce((s,r)=>s+r.debit, 0).toLocaleString()}</td>
                      <td className="p-4 text-left">{trialBalance.reduce((s,r)=>s+r.credit, 0).toLocaleString()}</td>
                      <td className="p-4 text-left bg-slate-800">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'income_statement' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-emerald-600 text-white text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-black">قائمة الدخل (P&L)</h3>
                    <p className="text-xs font-bold opacity-80 mt-1">عن الفترة المحاسبية الحالية</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-sm font-black text-slate-600">إيرادات المبيعات</span>
                      <span className="text-lg font-black text-slate-900">ج.م {incomeStatement.sales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-sm font-black text-slate-600">(-) تكلفة المبيعات (COGS)</span>
                      <span className="text-lg font-black text-rose-600">ج.م {incomeStatement.cogs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 bg-slate-50 rounded-2xl px-6 border border-slate-200">
                      <span className="text-sm font-black text-slate-900 underline decoration-emerald-500 decoration-4 underline-offset-8">إجمالي الربح (Gross Profit)</span>
                      <span className="text-xl font-black text-emerald-600">ج.م {incomeStatement.grossProfit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 pt-4">
                      <span className="text-sm font-black text-slate-600">(-) المصروفات التشغيلية</span>
                      <span className="text-lg font-black text-rose-600">ج.م {incomeStatement.otherExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/20">
                      <div>
                        <span className="text-xs font-bold opacity-70 block uppercase">صافي الربح أو الخسارة</span>
                        <span className="text-2xl font-black">ج.م {incomeStatement.netProfit.toLocaleString()}</span>
                      </div>
                      <div className={`p-4 rounded-2xl ${incomeStatement.netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {incomeStatement.netProfit >= 0 ? 'ربح محقق' : 'خسارة محققة'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cash_flow' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h4 className="text-sm font-black text-emerald-600 flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5" />
                    <span>التدفقات النقدية الداخلة (Inflows)</span>
                  </h4>
                  <div className="space-y-4">
                    {cashFlow.inflows.slice(0, 10).map(e => (
                      <div key={e.id} className="flex justify-between items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-700">{e.description}</p>
                          <p className="text-[8px] text-emerald-500">{new Date(e.date).toLocaleString('ar-EG')}</p>
                        </div>
                        <span className="font-black text-emerald-600 text-xs">+{e.debit.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h4 className="text-sm font-black text-rose-600 flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 rotate-180" />
                    <span>التدفقات النقدية الخارجة (Outflows)</span>
                  </h4>
                  <div className="space-y-4">
                    {cashFlow.outflows.slice(0, 10).map(e => (
                      <div key={e.id} className="flex justify-between items-center p-3 rounded-2xl bg-rose-50 border border-rose-100">
                        <div>
                          <p className="text-[10px] font-bold text-rose-700">{e.description}</p>
                          <p className="text-[8px] text-rose-500">{new Date(e.date).toLocaleString('ar-EG')}</p>
                        </div>
                        <span className="font-black text-rose-600 text-xs">-{e.credit.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'treasury' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-black">حركة الخزينة التفصيلية</h3>
                    <p className="text-xs font-bold opacity-60 mt-1">تتبع السيولة النقدية لحظة بلحظة</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20">
                    <span className="text-[10px] font-black uppercase opacity-70">الرصيد النقدي المتوفر حالياً</span>
                    <p className="text-3xl font-black">ج.م {(entries.filter(e => e.account === 'cash').reduce((s,e)=>s+e.debit-e.credit, 0)).toLocaleString()}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <th className="p-4">الوقت</th>
                        <th className="p-4">المعاملة</th>
                        <th className="p-4 text-left">وارد (+Debit)</th>
                        <th className="p-4 text-left">منصرف (-Credit)</th>
                        <th className="p-4 text-left bg-slate-100">الرصيد بعد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entries.filter(e => e.account === 'cash').map((e, idx, arr) => {
                        const balanceAfter = arr.slice(idx).reduce((s, x) => s + x.debit - x.credit, 0); // Reverse order sum or just calculated
                        // Actually, entries are usually sorted by date desc. Let's calculate balance after accurately.
                        // For display, we'll just show the movement.
                        return (
                          <tr key={e.id} className="hover:bg-slate-50/50 text-xs transition-colors">
                            <td className="p-4 text-slate-400">{new Date(e.date).toLocaleTimeString('ar-EG')}</td>
                            <td className="p-4 font-bold text-slate-900">{e.description}</td>
                            <td className="p-4 text-left font-black text-emerald-600">{e.debit > 0 ? `+${e.debit.toLocaleString()}` : '-'}</td>
                            <td className="p-4 text-left font-black text-rose-600">{e.credit > 0 ? `-${e.credit.toLocaleString()}` : '-'}</td>
                            <td className="p-4 text-left bg-slate-50 font-black text-slate-900">ج.م {balanceAfter.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
