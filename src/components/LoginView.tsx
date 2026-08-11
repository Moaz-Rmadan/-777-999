import React, { useState } from 'react';
import { User } from '../types';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Store, 
  Sparkles, 
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { ROLE_ARABIC_NAMES } from '../permissions';
import { signInWithGoogle } from '../firebase';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
  onAddUser: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, onAddUser }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When submitting the Odoo-style login form
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUserId) {
      setError('الرجاء اختيار اسم الموظف أولاً');
      return;
    }

    const matchedUser = users.find(u => u.id === selectedUserId);
    if (!matchedUser) {
      setError('المستخدم المحدد غير موجود');
      return;
    }

    const correctPassword = matchedUser.password || '1234';

    if (password !== correctPassword) {
      setError('كلمة المرور أو رمز الـ PIN غير صحيح!');
      return;
    }

    onLogin(matchedUser);
  };

  // Google Sign-In for Super Admins / Owners
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      const googleUser = await signInWithGoogle();
      if (!googleUser || !googleUser.email) {
        throw new Error('لم يتم الحصول على البريد الإلكتروني من حساب Google');
      }

      let matchedUser = users.find(u => u.email?.toLowerCase() === googleUser.email?.toLowerCase());

      if (!matchedUser) {
        const emailPrefix = googleUser.email.split('@')[0];
        matchedUser = users.find(u => u.username.toLowerCase() === emailPrefix.toLowerCase());
      }

      if (!matchedUser) {
        const isFirstUser = users.length === 0 || !users.some(u => u.role === 'super_admin');
        const isOwner = googleUser.email.toLowerCase() === 'cfo.moaz@gmail.com';
        const assignedRole = (isFirstUser || isOwner) ? 'super_admin' : 'manager';

        const newUser: User = {
          id: 'u-' + Date.now(),
          name: googleUser.displayName || googleUser.email.split('@')[0],
          username: googleUser.email.split('@')[0],
          role: assignedRole,
          email: googleUser.email,
          avatar: googleUser.photoURL || undefined,
          password: '1234'
        };

        onAddUser(newUser);
        matchedUser = newUser;
      } else if (!matchedUser.email) {
        matchedUser.email = googleUser.email;
        if (googleUser.photoURL) {
          matchedUser.avatar = googleUser.photoURL;
        }
      }

      onLogin(matchedUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول عبر Google');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f2] flex flex-col justify-between p-6 font-sans text-slate-800 relative" dir="rtl">
      
      {/* Top spacing */}
      <div></div>

      {/* Main Odoo-Style Central Card */}
      <div className="w-full max-w-md mx-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl text-white shadow-md mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">سوبر ماركت برو</h1>
          <p className="text-xs text-slate-500 mt-1 font-bold">نظام الإدارة والمبيعات السحابي المتكامل</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10 relative overflow-hidden">
          
          <h2 className="text-md font-black text-slate-900 mb-6 border-b border-slate-100 pb-3">تسجيل الدخول للنظام</h2>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2.5 text-xs font-bold mb-5 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            
            {/* User Dropdown Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-600 mr-0.5">اسم الموظف / الحساب *</label>
              <div className="relative">
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setError(null);
                  }}
                  className="block w-full appearance-none pr-3 pl-10 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
                >
                  <option value="">-- اختر الموظف لبدء العمل --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({ROLE_ARABIC_NAMES[u.role] || u.role})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center mr-0.5">
                <label className="block text-xs font-black text-slate-600">كلمة المرور / الرمز السري *</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pl-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                تسجيل الدخول
              </button>
            </div>

          </form>

          {/* Elegant Divider */}
          <div className="relative my-6 text-center">
            <hr className="border-slate-100" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-white text-[10px] font-bold text-slate-400">أو دخول المسؤول السحابي</span>
          </div>

          {/* Secondary Google Login Option */}
          <button
            type="button"
            disabled={loadingGoogle}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-50 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loadingGoogle ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.13 2.76-2.4 3.62l3.72 2.88c2.18-2 3.82-4.96 3.82-8.33z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.72-2.88c-1.03.69-2.35 1.11-4.24 1.11-3.26 0-6.01-2.2-7-5.16H1.14v3.02C3.12 21.1 7.28 24 12 24z" />
                <path fill="#FBBC05" d="M5 14.2c-.25-.75-.4-1.55-.4-2.2s.15-1.45.4-2.2V6.78H1.14C.41 8.24 0 9.87 0 12s.41 3.76 1.14 5.22L5 14.2z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.96 1.19 15.24 0 12 0 7.28 0 3.12 2.9 1.14 6.78L5 9.8c.99-2.96 3.74-5.05 7-5.05z" />
              </svg>
            )}
            <span>تسجيل الدخول بواسطة Google</span>
          </button>

        </div>

        {/* Bottom Helpful hints */}
        <div className="text-center mt-6 text-[10px] text-slate-400 font-bold leading-relaxed">
          <p>للدخول المباشر: اختر اسم الموظف واكتب كلمة المرور الخاصة به.</p>
          <p className="mt-0.5">الحساب التجريبي الرئيسي للمالك: <span className="text-emerald-600 font-extrabold select-all">cfo.moaz@gmail.com</span></p>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] text-slate-400 font-bold">
        <span>© {new Date().getFullYear()} سوبر ماركت برو. جميع الحقوق محفوظة. نظام مدعوم ومؤمن بالكامل.</span>
      </div>

    </div>
  );
};
