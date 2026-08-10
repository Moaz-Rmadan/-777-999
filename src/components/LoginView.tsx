import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { LogIn, UserCheck, ShieldCheck, Store, Lock, Key, AlertCircle, Sparkles } from 'lucide-react';
import { ROLE_ARABIC_NAMES } from '../permissions';
import { signInWithGoogle } from '../firebase';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
  onAddUser: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, onAddUser }) => {
  const [loginMethod, setLoginMethod] = useState<'firebase' | 'demo'>('firebase');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [password, setPassword] = useState(''); // Visual mock password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When clicking real Google Authentication (Firebase Auth)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const googleUser = await signInWithGoogle();
      if (!googleUser || !googleUser.email) {
        throw new Error('لم يتم الحصول على البريد الإلكتروني من حساب Google');
      }

      // 1. Search for existing user with this email
      let matchedUser = users.find(u => u.email?.toLowerCase() === googleUser.email?.toLowerCase());

      if (!matchedUser) {
        // If not found, search by username matching the prefix of email
        const emailPrefix = googleUser.email.split('@')[0];
        matchedUser = users.find(u => u.username.toLowerCase() === emailPrefix.toLowerCase());
      }

      // 2. If user is not registered in the POS users list, we auto-register them!
      if (!matchedUser) {
        const isFirstUser = users.length === 0 || !users.some(u => u.role === 'super_admin');
        const isOwner = googleUser.email.toLowerCase() === 'cfo.moaz@gmail.com';
        
        // Auto register new user as super_admin if first user or the owner, otherwise as manager for ease of testing
        const assignedRole: UserRole = (isFirstUser || isOwner) ? 'super_admin' : 'manager';

        const newUser: User = {
          id: 'u-' + Date.now(),
          name: googleUser.displayName || googleUser.email.split('@')[0],
          username: googleUser.email.split('@')[0],
          role: assignedRole,
          email: googleUser.email,
          avatar: googleUser.photoURL || undefined
        };

        // Add to global state
        onAddUser(newUser);
        matchedUser = newUser;
      } else if (!matchedUser.email) {
        // If user existed but didn't have email saved, link their email
        matchedUser.email = googleUser.email;
        if (googleUser.photoURL) {
          matchedUser.avatar = googleUser.photoURL;
        }
      }

      // Log in
      onLogin(matchedUser);
    } catch (err: any) {
      console.error("Firebase Authentication error:", err);
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول باستخدام Google');
    } finally {
      setLoading(false);
    }
  };

  // When clicking demo login
  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === selectedUsername);
    if (user) {
      onLogin(user);
    } else {
      setError('يرجى اختيار موظف من القائمة للدخول التجريبي');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden animate-fadeIn">
        
        {/* Brand Header */}
        <div className="bg-slate-900 text-white p-8 text-center relative">
          <div className="absolute top-4 left-4 bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            <span>Firebase Auth متصل</span>
          </div>
          
          <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 mb-4 transition-transform hover:scale-105 duration-300">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">سوبر ماركت برو</h2>
          <p className="text-slate-400 text-xs mt-2 font-bold">نظام نقاط البيع وإدارة الصلاحيات (RBAC)</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => { setLoginMethod('firebase'); setError(null); }}
            className={`flex-1 py-4 text-xs font-black transition-all border-b-2 ${
              loginMethod === 'firebase'
                ? 'border-emerald-600 text-emerald-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل دخول حقيقي (Firebase)
          </button>
          <button
            onClick={() => { setLoginMethod('demo'); setError(null); }}
            className={`flex-1 py-4 text-xs font-black transition-all border-b-2 ${
              loginMethod === 'demo'
                ? 'border-emerald-600 text-emerald-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            تجربة أدوار النظام (Demo)
          </button>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-700 text-xs font-bold animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-black">فشل تسجيل الدخول</p>
                <p className="mt-1 font-medium text-rose-600">{error}</p>
              </div>
            </div>
          )}

          {/* METHOD 1: Real Firebase Google Auth */}
          {loginMethod === 'firebase' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  تسجيل الدخول الآمن عن طريق بريد Google الخاص بك عبر نظام <strong>Firebase Authentication</strong>.
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  سيتم إنشاء حساب موظف تلقائي بالصلاحيات المناسبة فور تسجيل دخولك الأول.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-slate-200 rounded-2xl text-sm font-extrabold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.13 2.76-2.4 3.62l3.72 2.88c2.18-2 3.82-4.96 3.82-8.33z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.72-2.88c-1.03.69-2.35 1.11-4.24 1.11-3.26 0-6.01-2.2-7-5.16H1.14v3.02C3.12 21.1 7.28 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5 14.2c-.25-.75-.4-1.55-.4-2.2s.15-1.45.4-2.2V6.78H1.14C.41 8.24 0 9.87 0 12s.41 3.76 1.14 5.22L5 14.2z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.96 1.19 15.24 0 12 0 7.28 0 3.12 2.9 1.14 6.78L5 9.8c.99-2.96 3.74-5.05 7-5.05z"
                    />
                  </svg>
                )}
                <span>تسجيل الدخول باستخدام Google</span>
              </button>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>البريد الإلكتروني المدعوم للمدير: cfo.moaz@gmail.com</span>
              </div>
            </div>
          )}

          {/* METHOD 2: Offline Demo Roles Switcher */}
          {loginMethod === 'demo' && (
            <form onSubmit={handleDemoLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 mr-1">المستخدم / الموظف التجريبي</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <UserCheck className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    required
                    value={selectedUsername}
                    onChange={(e) => setSelectedUsername(e.target.value)}
                    className="block w-full pr-10 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none font-bold text-slate-900"
                  >
                    <option value="">اختر مستخدم للتجربة...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.username}>
                        {u.name} ({ROLE_ARABIC_NAMES[u.role] || u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 mr-1">كلمة المرور التجريبية</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pr-10 pl-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-extrabold rounded-2xl text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 shadow-md transition-all active:scale-95"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn className="h-4 w-4 text-slate-500 group-hover:text-slate-400" />
                </span>
                دخول للنظام للتجربة
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نظام الحوكمة محمي بصلاحيات مشددة من Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
};
