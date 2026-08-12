import React, { useState } from 'react';
import { User } from '../types';
import { 
  Store, 
  Sparkles, 
  ShieldAlert,
  LockKeyhole
} from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
  onAddUser: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin, onAddUser }) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Sign-In for all users / owners
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      const googleUser = await signInWithGoogle();
      if (!googleUser || !googleUser.email) {
        throw new Error('لم يتم الحصول على البريد الإلكتروني من حساب Google الخاص بك.');
      }

      const emailLower = googleUser.email.toLowerCase();
      let matchedUser = users.find(u => u.email?.toLowerCase() === emailLower);

      if (!matchedUser) {
        // Try username matching the prefix
        const emailPrefix = emailLower.split('@')[0];
        matchedUser = users.find(u => u.username.toLowerCase() === emailPrefix);
      }

      if (!matchedUser) {
        // Auto-create super_admin for the system owner or if it's the very first user
        const isOwner = emailLower === 'cfo.moaz@gmail.com';
        const isFirstUser = users.length === 0;
        
        if (isOwner || isFirstUser) {
          const assignedRole = 'super_admin';
          const newUser: User = {
            id: 'u-' + Date.now(),
            name: googleUser.displayName || googleUser.email.split('@')[0],
            username: googleUser.email.split('@')[0],
            role: assignedRole,
            email: googleUser.email,
            avatar: googleUser.photoURL || undefined
          };

          onAddUser(newUser);
          matchedUser = newUser;
        } else {
          throw new Error('عذراً! هذا البريد الإلكتروني غير مسجل بالنظام كحساب موظف مصرح له بالدخول. يرجى التواصل مع المدير العام لإضافتك أولاً.');
        }
      } else {
        // Update user record with latest details from Google SSO
        if (!matchedUser.email) {
          matchedUser.email = googleUser.email;
        }
        if (googleUser.photoURL) {
          matchedUser.avatar = googleUser.photoURL;
        }
      }

      onLogin(matchedUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول عبر Google SSO.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f2] flex flex-col justify-between p-6 font-sans text-slate-800 relative" dir="rtl">
      
      {/* Top spacing */}
      <div></div>

      {/* Main Secure Login Card */}
      <div className="w-full max-w-md mx-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-md mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">سوبر ماركت برو</h1>
          <p className="text-xs text-slate-500 mt-1 font-bold">بوابة الوصول والمصادقة الأمنية الموحدة SSO</p>
        </div>

        {/* Security Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10 relative overflow-hidden">
          
          <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4">
            <LockKeyhole className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-900">تسجيل الدخول الموحد (Single Sign-On)</h2>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6">
            النظام يدعم حصرياً الدخول عبر حسابات الموظفين المصرح لهم من خلال بريد Google الإلكتروني الموثق. تم إيقاف وتسريح جميع كلمات المرور المحلية لرفع معايير الأمان وحماية النقدية والعمليات من أي وصول غير مصرح به.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2.5 text-xs font-bold mb-6 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Google Login Button */}
          <button
            type="button"
            disabled={loadingGoogle}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-black text-slate-700 bg-white hover:bg-indigo-50/20 hover:text-indigo-900 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {loadingGoogle ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.13 2.76-2.4 3.62l3.72 2.88c2.18-2 3.82-4.96 3.82-8.33z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.72-2.88c-1.03.69-2.35 1.11-4.24 1.11-3.26 0-6.01-2.2-7-5.16H1.14v3.02C3.12 21.1 7.28 24 12 24z" />
                <path fill="#FBBC05" d="M5 14.2c-.25-.75-.4-1.55-.4-2.2s.15-1.45.4-2.2V6.78H1.14C.41 8.24 0 9.87 0 12s.41 3.76 1.14 5.22L5 14.2z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.96 1.19 15.24 0 12 0 7.28 0 3.12 2.9 1.14 6.78L5 9.8c.99-2.96 3.74-5.05 7-5.05z" />
              </svg>
            )}
            <span>الدخول الآمن بواسطة حساب Google</span>
          </button>

          {/* Real-time sync indicator */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>بوابة مشفرة ومحمية بقواعد بيانات Firebase السحابية</span>
          </div>

        </div>

        {/* Bottom Helpful hints */}
        <div className="text-center mt-6 text-[10px] text-slate-400 font-bold leading-relaxed">
          <p>الحساب التجريبي الرئيسي للمالك: <span className="text-indigo-600 font-extrabold select-all">cfo.moaz@gmail.com</span></p>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] text-slate-400 font-bold">
        <span>© {new Date().getFullYear()} سوبر ماركت برو. جميع الحقوق محفوظة لشركة النظم المحاسبية الموحدة.</span>
      </div>

    </div>
  );
};
