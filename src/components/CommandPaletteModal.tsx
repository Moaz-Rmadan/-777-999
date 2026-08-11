import React, { useState, useEffect } from 'react';
import { ActiveTab, Product, Customer, Supplier } from '../types';
import { 
  Search, 
  Command, 
  Keyboard, 
  X, 
  ArrowLeft, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  Receipt, 
  BarChart3, 
  Scale, 
  UserCog, 
  Settings, 
  ClipboardList,
  Sparkles,
  Plus
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  products?: Product[];
  customers?: Customer[];
  suppliers?: Supplier[];
}

interface CommandItem {
  id: string;
  title: string;
  category: 'تنقل سريع' | 'إجراءات فوري' | 'أصناف' | 'عملاء وموردين';
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  products = [],
  customers = [],
  suppliers = []
}) => {
  const [query, setQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          setShowShortcuts(false);
          // Trigger open
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pageCommands: CommandItem[] = [
    {
      id: 'nav-pos',
      title: 'شاشة البيع الكاشير (POS)',
      category: 'تنقل سريع',
      icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />,
      shortcut: 'F2',
      action: () => { setActiveTab('pos'); onClose(); }
    },
    {
      id: 'nav-inventory',
      title: 'إدارة المخزون والأصناف',
      category: 'تنقل سريع',
      icon: <Package className="w-4 h-4 text-blue-600" />,
      action: () => { setActiveTab('inventory'); onClose(); }
    },
    {
      id: 'nav-accounting',
      title: 'شجرة الحسابات العامة والقيود',
      category: 'تنقل سريع',
      icon: <Scale className="w-4 h-4 text-indigo-600" />,
      action: () => { setActiveTab('accounting'); onClose(); }
    },
    {
      id: 'nav-customers',
      title: 'حسابات العملاء والديون والأقساط',
      category: 'تنقل سريع',
      icon: <Users className="w-4 h-4 text-purple-600" />,
      action: () => { setActiveTab('customers'); onClose(); }
    },
    {
      id: 'nav-suppliers',
      title: 'الموردين وفواتير الشراء',
      category: 'تنقل سريع',
      icon: <Truck className="w-4 h-4 text-amber-600" />,
      action: () => { setActiveTab('suppliers'); onClose(); }
    },
    {
      id: 'nav-expenses',
      title: 'المصروفات والمنصرفات اليومية',
      category: 'تنقل سريع',
      icon: <Receipt className="w-4 h-4 text-rose-600" />,
      action: () => { setActiveTab('expenses'); onClose(); }
    },
    {
      id: 'nav-hr',
      title: 'شؤون العاملين والمرتبات',
      category: 'تنقل سريع',
      icon: <UserCog className="w-4 h-4 text-cyan-600" />,
      action: () => { setActiveTab('hr'); onClose(); }
    },
    {
      id: 'nav-reports',
      title: 'التقارير المالية وقائمة الدخل',
      category: 'تنقل سريع',
      icon: <BarChart3 className="w-4 h-4 text-emerald-600" />,
      action: () => { setActiveTab('reports'); onClose(); }
    },
    {
      id: 'nav-settings',
      title: 'إعدادات النظام والأجهزة والطابعات',
      category: 'تنقل سريع',
      icon: <Settings className="w-4 h-4 text-slate-600" />,
      action: () => { setActiveTab('settings'); onClose(); }
    }
  ];

  // Search filtered items
  const filteredProducts: CommandItem[] = products
    .filter(p => query.trim() !== '' && (p.name.includes(query) || p.barcode.includes(query)))
    .slice(0, 5)
    .map(p => ({
      id: `prod-${p.id}`,
      title: `صنف: ${p.name} (سعر: ج.م ${p.price} | كمية: ${p.stock})`,
      category: 'أصناف',
      icon: <Package className="w-4 h-4 text-emerald-500" />,
      action: () => {
        setActiveTab('inventory');
        onClose();
      }
    }));

  const filteredCustomers: CommandItem[] = customers
    .filter(c => query.trim() !== '' && (c.name.includes(query) || c.phone.includes(query)))
    .slice(0, 5)
    .map(c => ({
      id: `cust-${c.id}`,
      title: `عميل: ${c.name} (دين: ج.م ${c.currentDebt})`,
      category: 'عملاء وموردين',
      icon: <Users className="w-4 h-4 text-purple-500" />,
      action: () => {
        setActiveTab('customers');
        onClose();
      }
    }));

  const allFilteredCommands = [
    ...pageCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase())),
    ...filteredProducts,
    ...filteredCustomers
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-start justify-center pt-16 px-4 animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-0">
        
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="ابحث عن صفحة، صنف، عميل، أو أمر سريع... (مثال: كاشير، حسابات، أحمد)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-sm font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                showShortcuts ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>اختصارات الكيبورد</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shortcuts View or Search Results */}
        {showShortcuts ? (
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-black text-slate-900">دليل اختصارات السرعة الفائقة للكاشير والمحاسب</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">شاشات وأمر البحث السريع</span>
                <kbd className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-mono font-black">Ctrl + K</kbd>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">الانتقال لشاشة الكاشير</span>
                <kbd className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-mono font-black">F2</kbd>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">إتمام السداد النقدي بالفاتورة</span>
                <kbd className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-mono font-black">F4</kbd>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">تعليق السلة / حفظ مسودة</span>
                <kbd className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-mono font-black">F8</kbd>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">إلغاء النافذة / تنظيف السلة</span>
                <kbd className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-mono font-black">ESC</kbd>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">التركيز على مربع الباركود</span>
                <kbd className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-mono font-black">F3</kbd>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 max-h-[60vh] overflow-y-auto space-y-1 divide-y divide-slate-100">
            {allFilteredCommands.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">لم نجد أي نتائج تطابق "{query}"</p>
              </div>
            ) : (
              allFilteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between transition-colors text-right group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                      {cmd.icon}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {cmd.title}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400">
                        {cmd.category}
                      </span>
                    </div>
                  </div>

                  {cmd.shortcut ? (
                    <kbd className="px-2 py-1 bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 rounded-lg text-[10px] font-mono font-black">
                      {cmd.shortcut}
                    </kbd>
                  ) : (
                    <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {/* Footer Hint */}
        <div className="p-3 bg-slate-900 text-white text-[11px] flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-emerald-400" />
            <span>نظام التصفح والبحث السريع الموحد (Ctrl + K)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>اضغط <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded">ESC</kbd> للإغلاق</span>
          </div>
        </div>

      </div>
    </div>
  );
};
