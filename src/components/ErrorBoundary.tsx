import React, { useState, useEffect, ReactNode } from 'react';

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setErrorMessage(event.message || 'خطأ غير معروف');
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Cairo',sans-serif]" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-slate-900">حدث خطأ غير متوقع في العرض</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMessage || 'نعتذر عن هذا الخلل، يرجى إعادة تحميل الصفحة.'}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
          >
            إعادة تحميل النظام وتحديث البيانات
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
