import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { 
  History, 
  Search, 
  User, 
  Clock, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Monitor
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.entityType === filterType;
    
    return matchesSearch && matchesType;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const entityTypeLabels: Record<string, string> = {
    product: 'أصناف',
    user: 'مستخدمين',
    invoice: 'مبيعات',
    expense: 'مصروفات',
    supplier: 'موردين',
    customer: 'عملاء',
    shift: 'ورديات'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            <span>سجل العمليات والتدقيق (Audit Log)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">تتبع كافة التعديلات، الحذف، والعمليات الحساسة في النظام</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="بحث في السجلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="all">كل الأنواع</option>
            {Object.entries(entityTypeLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 font-black z-10 select-none">
              <tr>
                <th className="px-3.5 py-2.5">المستخدم</th>
                <th className="px-3.5 py-2.5">العملية</th>
                <th className="px-3.5 py-2.5">النوع</th>
                <th className="px-3.5 py-2.5">الوقت</th>
                <th className="px-3.5 py-2.5">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className={`hover:bg-indigo-50/30 even:bg-slate-50/40 transition-colors ${expandedId === log.id ? 'bg-indigo-50/70' : ''}`}>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{log.userName}</p>
                          <p className="text-[10px] text-slate-400">{log.userRole === 'admin' ? 'مدير' : 'كاشير'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-800">
                      {log.action}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono-numbers">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>التغييرات</span>
                        {expandedId === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail View */}
                  {expandedId === log.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Metadata */}
                          <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 mb-2">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                              <Tag className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-500 font-bold uppercase">ID العملية:</span>
                              <span className="text-[10px] font-mono text-slate-800">{log.entityId}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                              <Monitor className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-500 font-bold uppercase">الجهاز:</span>
                              <span className="text-[10px] text-slate-800 truncate max-w-[200px]" title={log.deviceInfo}>{log.deviceInfo}</span>
                            </div>
                          </div>

                          {/* Data Comparison */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">قبل التعديل</p>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto shadow-inner text-[11px] font-mono whitespace-pre text-slate-600">
                              {log.before ? JSON.stringify(log.before, null, 2) : '(بيانات جديدة)'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">بعد التعديل</p>
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 max-h-60 overflow-y-auto shadow-inner text-[11px] font-mono whitespace-pre text-slate-700">
                              {log.after ? JSON.stringify(log.after, null, 2) : '(تم الحذف)'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">لا توجد سجلات مطابقة للبحث</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
