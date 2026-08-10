import React, { useState, useEffect } from 'react';
import { ActiveTab, User, RolePermissionMatrix } from '../types';
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
  Bell,
  UserCog,
  LogOut,
  History as HistoryIcon,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  MoreHorizontal,
  Settings
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  currentUser: User | null;
  onLogout: () => void;
  permissionMatrix: RolePermissionMatrix;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavButtonProps {
  item: NavItem;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCollapsed?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  item, 
  activeTab, 
  setActiveTab, 
  setIsMobileMenuOpen, 
  isCollapsed: collapsed 
}) => {
  const isActive = activeTab === item.id;
  return (
    <button
      onClick={() => {
        setActiveTab(item.id);
        setIsMobileMenuOpen(false);
      }}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center group relative px-3 py-3 rounded-2xl transition-all duration-300 ${
        isActive
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
          : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
      } ${collapsed ? 'justify-center' : 'justify-between'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors`}>
          {item.icon}
        </span>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-bold text-xs whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </div>
      
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
          isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
        }`}>
          {item.badge}
        </span>
      )}

      {collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold border-2 border-white">
          {item.badge}
        </span>
      )}
    </button>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  lowStockCount,
  currentUser,
  onLogout,
  permissionMatrix
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const allNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'pos', label: 'نقطة البيع', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'accounting', label: 'المالية والمحاسبة', icon: <Scale className="w-5 h-5 text-purple-600" /> },
    { id: 'inventory', label: 'الأصناف والمخزون', icon: <Package className="w-5 h-5" />, badge: lowStockCount },
    { id: 'reports', label: 'التقارير المالية', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'purchases', label: 'المشتريات والطلب', icon: <Receipt className="w-5 h-5" /> },
    { id: 'suppliers', label: 'الموردين والحسابات', icon: <Truck className="w-5 h-5" /> },
    { id: 'customers', label: 'العملاء والمديونيات', icon: <Users className="w-5 h-5" /> },
    { id: 'expenses', label: 'المصروفات والتشغيل', icon: <FileText className="w-5 h-5" /> },
    { id: 'shifts', label: 'الورديات والدرج', icon: <HistoryIcon className="w-5 h-5" /> },
    { id: 'users', label: 'الموظفين والصلاحيات', icon: <UserCog className="w-5 h-5" /> },
    { id: 'inventory_reports', label: 'تقارير حركة المخازن', icon: <Package className="w-5 h-5" /> },
    { id: 'audit_log', label: 'سجل الرقابة', icon: <HistoryIcon className="w-5 h-5 text-slate-400" /> },
    { id: 'requirements', label: 'المتطلبات الأساسية', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'settings', label: 'الإعدادات العامة', icon: <Settings className="w-5 h-5 text-emerald-600" /> },
  ];

  const navItems = allNavItems.filter(item => hasPermission(currentUser, item.id, 'view', permissionMatrix));

  // Mobile Bottom Nav Items (Most frequent)
  const mobilePrimaryItems = navItems.filter(item => 
    ['dashboard', 'pos', 'reports', 'inventory'].includes(item.id)
  ).slice(0, 4);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 py-2 flex items-center justify-around shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {mobilePrimaryItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
              activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-50' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-black">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400"
        >
          <div className="p-2">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black">المزيد</span>
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
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                    <Store className="w-5 h-5" />
                  </div>
                  <h1 className="font-black text-slate-900">سوبر ماركت برو</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Connectivity Status (Mobile Drawer) */}
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                {isOnline ? (
                  <>
                    <div className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-emerald-700">متصل بالسحابة (Online)</p>
                      <p className="text-[9px] text-slate-400 font-bold">البيانات متزامنة وآمنة تلقائياً</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-amber-700">يعمل بدون اتصال (Offline)</p>
                      <p className="text-[9px] text-amber-600 font-bold">يتم حفظ العمليات محلياً ومزامنتها فور عودة الاتصال</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {navItems.map(item => (
                  <NavButton 
                    key={item.id} 
                    item={item} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    setIsMobileMenuOpen={setIsMobileMenuOpen} 
                  />
                ))}
              </div>
              <div className="p-6 border-t border-slate-100">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black text-rose-600 bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 88 : 288 }}
        className="hidden lg:flex flex-col bg-white border-l border-slate-200 h-screen sticky top-0 shadow-sm flex-shrink-0 z-40"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 shadow-sm z-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header */}
        <div className={`p-6 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
          <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h1 className="text-base font-black text-slate-900 leading-tight">سوبر ماركت برو</h1>
              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-wider mt-0.5">النظام المحاسبي</p>
            </motion.div>
          )}
        </div>

        {/* Connectivity Status (Desktop Sidebar) */}
        <div className={`px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? (isOnline ? "متصل بالسحابة" : "يعمل بدون اتصال - الحفظ محلي نشط") : undefined}>
          {isOnline ? (
            <>
              <div className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              {!isCollapsed && (
                <div className="text-right">
                  <p className="text-[11px] font-black text-emerald-700">متصل بالسحابة (Online)</p>
                  <p className="text-[9px] text-slate-400 font-bold">البيانات متزامنة وآمنة</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </div>
              {!isCollapsed && (
                <div className="text-right">
                  <p className="text-[11px] font-black text-amber-700">يعمل بدون اتصال (Offline)</p>
                  <p className="text-[9px] text-amber-600 font-bold">يتم الحفظ محلياً تلقائياً</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-none">
          {navItems.map(item => (
            <NavButton 
              key={item.id} 
              item={item} 
              isCollapsed={isCollapsed} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className={`bg-white p-3 rounded-2xl border border-slate-200 shadow-sm transition-all ${isCollapsed ? 'items-center' : 'space-y-3'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name.charAt(0) || '؟'}
                </div>
                {!isCollapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-[10px] text-slate-400 font-bold">{currentUser?.role === 'admin' ? 'المدير العام' : 'كاشير'}</p>
                    <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{currentUser?.name}</p>
                  </motion.div>
                )}
              </div>
              {!isCollapsed && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </div>
            
            {!isCollapsed && (
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            )}
            {isCollapsed && (
              <button 
                onClick={onLogout}
                title="تسجيل الخروج"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition-colors mx-auto"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};
