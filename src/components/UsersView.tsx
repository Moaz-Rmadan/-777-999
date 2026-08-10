import React, { useState } from 'react';
import { User, UserRole, RolePermissionMatrix, ModuleName, PermissionAction } from '../types';
import { 
  UserCog, 
  Plus, 
  Shield, 
  User as UserIcon, 
  X, 
  Edit3, 
  Trash2, 
  Key, 
  ShieldAlert, 
  Save, 
  RotateCcw,
  Check,
  Eye,
  Settings,
  Grid,
  FileCheck,
  Printer,
  Download,
  AlertTriangle
} from 'lucide-react';
import { 
  DEFAULT_ROLE_PERMISSIONS, 
  ROLE_ARABIC_NAMES, 
  MODULE_ARABIC_NAMES, 
  ACTION_ARABIC_NAMES 
} from '../permissions';

interface UsersViewProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  permissionMatrix: RolePermissionMatrix;
  onUpdatePermissionMatrix: (matrix: RolePermissionMatrix) => void;
  currentUser: User | null;
}

export const UsersView: React.FC<UsersViewProps> = ({ 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  permissionMatrix,
  onUpdatePermissionMatrix,
  currentUser
}) => {
  const [subTab, setSubTab] = useState<'users' | 'rbac'>('users');
  const [selectedRbacRole, setSelectedRbacRole] = useState<UserRole>('cashier');
  
  // User Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [email, setEmail] = useState('');

  // Matrix edit indicator
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setRole('cashier');
    setEmail('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setRole(user.role);
    setEmail(user.email || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) return;

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name,
        username,
        role,
        email: email || undefined
      });
    } else {
      const newUser: User = {
        id: 'u-' + Date.now(),
        name,
        username,
        role,
        email: email || undefined
      };
      onAddUser(newUser);
    }

    setShowModal(false);
    setEditingUser(null);
    setName('');
    setUsername('');
    setRole('cashier');
    setEmail('');
  };

  // Toggle permission in matrix
  const handleTogglePermission = (module: ModuleName, action: PermissionAction) => {
    const updated = { ...permissionMatrix };
    if (!updated[selectedRbacRole]) {
      // Initialize with default or empty
      updated[selectedRbacRole] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[selectedRbacRole] || DEFAULT_ROLE_PERMISSIONS.cashier));
    }
    
    updated[selectedRbacRole][module][action] = !updated[selectedRbacRole][module][action];
    onUpdatePermissionMatrix(updated);
    
    // Show quick visual success
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  // Reset matrix to default
  const handleResetToDefault = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين صلاحيات هذا الدور لافتراضيات النظام؟')) {
      const updated = { ...permissionMatrix };
      updated[selectedRbacRole] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[selectedRbacRole]));
      onUpdatePermissionMatrix(updated);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    }
  };

  // All roles keys except standard 'admin' to keep it clean, but include it if needed
  const roleKeys: UserRole[] = [
    'super_admin',
    'branch_manager',
    'manager',
    'accountant',
    'cashier',
    'warehouse'
  ];

  const modulesKeys = Object.keys(MODULE_ARABIC_NAMES) as ModuleName[];
  const actionsKeys = Object.keys(ACTION_ARABIC_NAMES) as PermissionAction[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-indigo-600" />
            <span>إدارة الموظفين وصلاحيات المستخدمين (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-bold">إضافة الموظفين وتخصيص صلاحيات العمليات التفصيلية (العرض، الإضافة، التعديل، الحذف، الاعتماد، الإلغاء، الطباعة والتصدير) لكل دور محاسبي وتشغيلي</p>
        </div>
        
        {subTab === 'users' && (
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab('users')}
          className={`px-6 py-3 text-xs font-black border-b-2 transition-all ${
            subTab === 'users' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          قائمة الموظفين والمستخدمين
        </button>
        <button
          onClick={() => setSubTab('rbac')}
          className={`px-6 py-3 text-xs font-black border-b-2 transition-all ${
            subTab === 'rbac' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          جدول الصلاحيات وحوكمة النظام (RBAC Matrix)
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {subTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map(user => (
            <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${
                    user.role === 'super_admin' || user.role === 'admin' 
                      ? 'bg-indigo-600' 
                      : user.role === 'manager' || user.role === 'branch_manager'
                      ? 'bg-blue-600'
                      : user.role === 'accountant'
                      ? 'bg-emerald-600'
                      : user.role === 'warehouse'
                      ? 'bg-amber-600'
                      : 'bg-slate-900'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                      title="تعديل الموظف"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="حذف الموظف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-black text-slate-900">{user.name}</h3>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono font-bold">
                    @{user.username}
                  </p>
                  {user.email ? (
                    <p className="text-[10px] text-emerald-600 bg-emerald-50 rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 self-start mt-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      <span>{user.email} (Google Auth)</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 self-start mt-1">
                      <span>حساب محلي غير مربوط</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.role === 'super_admin' || user.role === 'admin' ? (
                    <Shield className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    user.role === 'super_admin' || user.role === 'admin' 
                      ? 'text-indigo-600' 
                      : 'text-slate-600'
                  }`}>
                    {ROLE_ARABIC_NAMES[user.role] || user.role}
                  </span>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="تغيير كلمة المرور">
                  <Key className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {subTab === 'rbac' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          {/* Top selection row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900">مصفوفة حوكمة العمليات والصلاحيات</h3>
              <p className="text-xs text-slate-500 font-bold mt-1">اختر الدور الوظيفي لتخصيص صلاحيات العمليات الـ 8 التفصيلية على جميع موديلات النظام:</p>
            </div>

            {/* Quick status feedback */}
            {saveSuccess && (
              <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg self-start lg:self-center animate-pulse">
                <Check className="w-4 h-4" />
                <span>تم حفظ تعديل الصلاحية فورياً</span>
              </div>
            )}
          </div>

          {/* Role selector buttons */}
          <div className="flex flex-wrap gap-2">
            {roleKeys.map(roleKey => (
              <button
                key={roleKey}
                onClick={() => setSelectedRbacRole(roleKey)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                  selectedRbacRole === roleKey 
                    ? 'bg-slate-900 border-slate-950 text-white shadow-md' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {ROLE_ARABIC_NAMES[roleKey]}
              </button>
            ))}
          </div>

          {/* Info Card / Scope descriptions */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60 flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 font-bold">
              <p className="text-indigo-900 font-black">الدور المحدد حالياً: {ROLE_ARABIC_NAMES[selectedRbacRole]}</p>
              <div className="text-indigo-700 font-medium text-[11px] leading-relaxed">
                {selectedRbacRole === 'super_admin' && '• صلاحيات مطلقة كاملة ومباشرة على كافة العمليات في النظام.'}
                {selectedRbacRole === 'manager' && '• صلاحية إدارة العمليات والتقارير بشكل كامل ما عدا تعديل إعدادات النظام الحساسة أو الحسابات المعقدة.'}
                {selectedRbacRole === 'accountant' && '• صلاحيات الحسابات، قيود اليومية، العملاء، الموردين، المصروفات، وعرض وتصدير التقارير المالية.'}
                {selectedRbacRole === 'cashier' && '• صلاحيات محدودة بنقطة البيع والبيع وتسجيل فواتير العملاء والورديات الخاصة به ومتابعة مبيعاته.'}
                {selectedRbacRole === 'warehouse' && '• إدارة عمليات المخزون الاستلام، الصرف، التحويل، جرد الأصناف، وعرض تقارير المخزون.'}
                {selectedRbacRole === 'branch_manager' && '• إدارة كاملة على نطاق الفرع تشمل مبيعات وموظفي الفرع والورديات.'}
              </div>
            </div>
          </div>

          {/* The RBAC Matrix Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black">
                  <th className="p-4 w-48 text-slate-900">الوحدة البرمجية / الموديل</th>
                  {actionsKeys.map(actionKey => (
                    <th key={actionKey} className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span>{ACTION_ARABIC_NAMES[actionKey].split(' ')[0]}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{actionKey.toUpperCase()}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modulesKeys
                  .filter(m => m !== 'requirements') // Hide requirements tab from permission mapping for simplicity
                  .map(moduleKey => {
                    const modulePerms = permissionMatrix[selectedRbacRole]?.[moduleKey] || {
                      view: false, create: false, edit: false, delete: false, approve: false, cancel: false, print: false, export: false
                    };

                    return (
                      <tr key={moduleKey} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-black text-slate-800">
                          {MODULE_ARABIC_NAMES[moduleKey]}
                        </td>
                        {actionsKeys.map(actionKey => {
                          const isChecked = modulePerms[actionKey];
                          // Super admin is always checked and disabled from editing
                          const isDisabled = selectedRbacRole === 'super_admin';

                          return (
                            <td key={actionKey} className="p-4 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={() => handleTogglePermission(moduleKey, actionKey)}
                                  className="sr-only peer"
                                />
                                <div className={`w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative ${
                                  isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                                }`}></div>
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Reset buttons */}
          {selectedRbacRole !== 'super_admin' && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all border border-slate-200 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة التعيين للافتراضيات ({ROLE_ARABIC_NAMES[selectedRbacRole].split(' ')[0]})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة موظف جديد للنظام'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الاسم الكامل للموظف *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله"
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">اسم المستخدم للدخول (Username) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: a_abdullah"
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">بريد Google الإلكتروني للمزامنة مع Firebase Auth (اختياري)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="مثال: user@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold font-mono text-left"
                    dir="ltr"
                  />
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">عند تحديد البريد، سيتمكن الموظف من تسجيل الدخول ببريد Google الخاص به.</p>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">الدور الوظيفي وصلاحيات العمل الفورية</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-indigo-500"
                  >
                    {Object.entries(ROLE_ARABIC_NAMES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-900/20"
                >
                  {editingUser ? 'حفظ التعديلات' : 'حفظ الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
