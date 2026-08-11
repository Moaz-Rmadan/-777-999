import React, { useState, useEffect } from 'react';
import { ActiveTab, User, RolePermissionMatrix, SystemSettings } from '../types';
import { hasPermission } from '../permissions';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  Users, 
  Receipt, 
  FileText, 
  BarChart3, 
  Scale,
  ClipboardList,
  Store,
  UserCog,
  LogOut,
  History as HistoryIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  Search,
  MoreHorizontal,
  X,
  Layers,
  Wallet,
  ShieldAlert
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  currentUser: User | null;
  onLogout: () => void;
  permissionMatrix: RolePermissionMatrix;
  settings: SystemSettings;
  onOpenCommandPalette?: () => void;
}

interface NavSubItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  id: string;
  groupTitle: string;
  groupIcon: React.ReactNode;
  items: NavSubItem[];
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  lowStockCount,
  currentUser,
  onLogout,
  permissionMatrix,
  settings,
  onOpenCommandPalette
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Expanded submenus state (key: groupId, value: boolean)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    pos_ops: true,
    sales_crm: true,
    inventory_sub: true,
    finance_sub: true,
    system_sub: false
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const allNavGroups: NavGroup[] = [
    {
      id: 'pos_ops',
      groupTitle: 'الرئيسية والكاشير',
      groupIcon: <ShoppingCart className="w-4 h-4 text-emerald-500" />,
      items: [
        { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'pos', label: 'نقطة البيع (POS)', icon: <ShoppingCart className="w-4 h-4 text-emerald-600" /> },
        { id: 'shifts', label: 'الورديات والدرج', icon: <HistoryIcon className="w-4 h-4 text-slate-500" /> },
      ]
    },
    {
      id: 'sales_crm',
      groupTitle: 'العملاء والديون',
      groupIcon: <Users className="w-4 h-4 text-purple-500" />,
      items: [
        { id: 'customers', label: 'العملاء والأقساط', icon: <Users className="w-4 h-4 text-purple-600" /> },
      ]
    },
    {
      id: 'inventory_sub',
      groupTitle: 'المخزون والمشتريات',
      groupIcon: <Package className="w-4 h-4 text-blue-500" />,
      items: [
        { id: 'inventory', label: 'الأصناف والمخزون', icon: <Package className="w-4 h-4 text-blue-600" />, badge: lowStockCount },
        { id: 'stock_audit', label: 'جرد وتدقيق المخزون', icon: <ClipboardList className="w-4 h-4 text-emerald-600" /> },
        { id: 'purchases', label: 'المشتريات والطلب', icon: <Receipt className="w-4 h-4 text-amber-600" /> },
        { id: 'suppliers', label: 'الموردين والحسابات', icon: <Truck className="w-4 h-4 text-amber-500" /> },
        { id: 'inventory_reports', label: 'تقارير الحركة', icon: <Layers className="w-4 h-4 text-slate-500" /> },
      ]
    },
    {
      id: 'finance_sub',
      groupTitle: 'المالية والرواتب',
      groupIcon: <Scale className="w-4 h-4 text-indigo-500" />,
      items: [
        { id: 'accounting', label: 'الحسابات والقيود', icon: <Scale className="w-4 h-4 text-indigo-600" /> },
        { id: 'reports', label: 'التقارير المالية', icon: <BarChart3 className="w-4 h-4 text-emerald-600" /> },
        { id: 'expenses', label: 'المصروفات', icon: <FileText className="w-4 h-4 text-rose-500" /> },
        { id: 'hr', label: 'شؤون العاملين والرواتب', icon: <UserCog className="w-4 h-4 text-teal-600" /> },
      ]
    },
    {
      id: 'system_sub',
      groupTitle: 'الإدارة والنظام',
      groupIcon: <Settings className="w-4 h-4 text-slate-500" />,
      items: [
        { id: 'users', label: 'الموظفين والصلاحيات', icon: <UserCog className="w-4 h-4 text-slate-600" /> },
        { id: 'audit_log', label: 'سجل الرقابة', icon: <ShieldAlert className="w-4 h-4 text-slate-400" /> },
        { id: 'requirements', label: 'المتطلبات', icon: <ClipboardList className="w-4 h-4 text-slate-500" /> },
        { id: 'settings', label: 'الإعدادات العامة', icon: <Settings className="w-4 h-4 text-emerald-600" /> },
      ]
    }
  ];

  // Filter groups and items based on permissions
  const filteredGroups = allNavGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasPermission(currentUser, item.id, 'view', permissionMatrix))
  })).filter(group => group.items.length > 0);

  // Flattened nav items for mobile bottom bar
  const flatNavItems = filteredGroups.flatMap(g => g.items);
  const mobilePrimaryItems = flatNavItems.filter(item => 
    ['dashboard', 'pos', 'inventory', 'reports'].includes(item.id)
  ).slice(0, 4);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" dir="rtl">
        {mobilePrimaryItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                isActive ? 'text-emerald-600 font-black' : 'text-slate-400 font-bold'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-100 text-emerald-700 shadow-xs' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400 font-bold"
        >
          <div className="p-1.5">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px]">القائمة</span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-white z-[70] lg:hidden flex flex-col shadow-2xl"
              dir="rtl"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                    <Store className="w-5 h-5" />
                  </div>
                  <h1 className="font-black text-slate-900 text-sm">{settings.storeName || 'سوبر ماركت برو'}</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredGroups.map(group => (
                  <div key={group.id} className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 pb-1">
                      {group.groupTitle}
                    </p>
                    {group.items.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-900/20' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isActive ? 'text-white' : 'text-slate-500'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              isActive ? 'bg-white text-emerald-800' : 'bg-rose-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modern Compact ERP Sidebar (Width: 250px expanded / 76px collapsed) */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 76 : 250 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-white border-l border-slate-200 h-screen sticky top-0 shadow-xs flex-shrink-0 z-40 select-none"
        dir="rtl"
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3 top-8 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-500 shadow-md z-50 transition-all hover:scale-105"
          title={isCollapsed ? 'توسيع القائمة' : 'طَي القائمة'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-900/10 shrink-0 font-black">
            <Store className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <h1 className="text-xs font-black text-slate-900 leading-tight truncate">
                {settings.storeName || 'سوبر ماركت برو'}
              </h1>
              <span className="text-[9px] text-emerald-600 font-bold block truncate">
                نظام إدارة ERP الكاشير
              </span>
            </motion.div>
          )}
        </div>

        {/* Universal Search Command Palette Trigger */}
        {onOpenCommandPalette && (
          <div className="p-3 border-b border-slate-100">
            <button
              onClick={onOpenCommandPalette}
              title={isCollapsed ? "بحث سريع (Ctrl + K)" : undefined}
              className={`w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200/80 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                {!isCollapsed && <span className="text-[11px] font-bold text-slate-500">بحث سريع...</span>}
              </div>
              {!isCollapsed && (
                <kbd className="px-1.5 py-0.5 bg-white text-slate-400 rounded-md text-[9px] font-mono font-black border border-slate-200 shadow-2xs">
                  Ctrl+K
                </kbd>
              )}
            </button>
          </div>
        )}

        {/* Grouped Navigation List */}
        <nav className="flex-1 p-2.5 space-y-3 overflow-y-auto scrollbar-none">
          {filteredGroups.map((group) => {
            const isGroupOpen = openGroups[group.id] !== false;
            const hasActiveChild = group.items.some(i => i.id === activeTab);

            return (
              <div key={group.id} className="space-y-1">
                {/* Section Group Header */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider group"
                  >
                    <div className="flex items-center gap-1.5">
                      {group.groupIcon}
                      <span>{group.groupTitle}</span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-transform ${isGroupOpen ? '' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="w-full text-center py-1 border-b border-slate-100" title={group.groupTitle}>
                    <span className="inline-block p-1 text-slate-300">
                      {group.groupIcon}
                    </span>
                  </div>
                )}

                {/* Group Submenu Items */}
                <AnimatePresence initial={false}>
                  {(isGroupOpen || isCollapsed) && (
                    <motion.div
                      initial={!isCollapsed ? { height: 0, opacity: 0 } : false}
                      animate={!isCollapsed ? { height: 'auto', opacity: 1 } : { opacity: 1 }}
                      exit={!isCollapsed ? { height: 0, opacity: 0 } : undefined}
                      className="space-y-1 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={isCollapsed ? item.label : undefined}
                            className={`w-full flex items-center relative transition-all duration-200 rounded-xl ${
                              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2 text-xs'
                            } ${
                              isActive
                                ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-900/20 ring-1 ring-emerald-500'
                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-emerald-700 font-bold'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                {item.icon}
                              </span>
                              {!isCollapsed && (
                                <span className="truncate">{item.label}</span>
                              )}
                            </div>

                            {/* Badges */}
                            {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                                isActive ? 'bg-white text-emerald-800' : 'bg-rose-500 text-white'
                              }`}>
                                {item.badge}
                              </span>
                            )}

                            {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold border-2 border-white">
                                {item.badge}
                              </span>
                            )}

                            {/* Active Visual Indicator Strip */}
                            {isActive && !isCollapsed && (
                              <div className="w-1 h-3.5 bg-white rounded-full shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className={`bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between ${isCollapsed ? 'flex-col gap-2' : ''}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                {currentUser?.name?.charAt(0) || 'أ'}
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <p className="text-[9px] text-slate-400 font-bold leading-none">
                    {currentUser?.role === 'admin' ? 'المدير' : 'كاشير'}
                  </p>
                  <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                    {currentUser?.name}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              className={`p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors shrink-0 ${
                isCollapsed ? 'w-full flex justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

