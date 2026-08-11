import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, RefreshCw, Layers, Check, Loader2 } from 'lucide-react';

interface LoadingStep {
  id: number;
  label: string;
  subLabel: string;
  icon: React.ComponentType<any>;
}

export const AppLoadingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps: LoadingStep[] = [
    {
      id: 0,
      label: 'الاتصال الآمن بالخادم السحابي',
      subLabel: 'تأمين الاتصال المشفر بقاعدة البيانات السحابية الحية...',
      icon: Database,
    },
    {
      id: 1,
      label: 'التحقق من طبقة الأمان والصلاحيات',
      subLabel: 'مراجعة الرموز الأمنية وصلاحيات المستخدمين والمحاسبين...',
      icon: ShieldCheck,
    },
    {
      id: 2,
      label: 'تحديث بيانات المخزون والأصناف',
      subLabel: 'تحميل كميات المخزن الحالي، الباركود، وقوائم الأسعار النشطة...',
      icon: Layers,
    },
    {
      id: 3,
      label: 'تهيئة الدفاتر المالية ونقاط البيع',
      subLabel: 'إعداد الروابط السريعة، الفواتير المعلقة، وجداول اليومية...',
      icon: RefreshCw,
    },
  ];

  useEffect(() => {
    // Progress increment loop
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 100 ? 100 : next;
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Map progress to active step
    if (progress < 25) {
      setCurrentStep(0);
    } else if (progress < 50) {
      setCurrentStep(1);
    } else if (progress < 75) {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans p-6" dir="rtl">
      {/* Container Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        
        {/* Header Branding */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 font-black text-lg tracking-wider shadow-inner">
            POS
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">نظام إدارة المحلات والسوبر ماركت الذكي</h1>
            <p className="text-xs text-slate-400 font-medium">الجيل الثالث من الإدارة الذكية السحابية</p>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {progress}% مكتمل
            </span>
            <span className="text-xs text-slate-400 font-medium animate-pulse">
              جاري تشغيل الأنظمة الفرعية...
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300 ease-out shadow-[0_1px_3px_rgba(16,185,129,0.3)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Loading Steps Checklist */}
        <div className="space-y-5">
          {steps.map((step) => {
            const isCompleted = progress >= (step.id + 1) * 25 || (step.id === 3 && progress === 100);
            const isActive = currentStep === step.id && !isCompleted;
            const isPending = !isCompleted && !isActive;

            return (
              <div 
                key={step.id} 
                className={`flex gap-4 items-start p-3 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-slate-50/80 border border-slate-100' : 'border border-transparent'
                }`}
              >
                {/* Step Icon Status Indicator */}
                <div className="mt-0.5">
                  {isCompleted ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 scale-100 transition-all duration-300">
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400">
                      <step.icon className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Step labels */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-bold leading-none ${
                    isCompleted ? 'text-slate-500 line-through decoration-slate-200' : isActive ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </h3>
                  <p className={`text-xs mt-1.5 leading-relaxed truncate ${
                    isActive ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {isActive ? step.subLabel : isCompleted ? 'تمت العملية بنجاح' : 'في الانتظار...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Offline-First Note */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>دقة الحسابات: 100% مؤمنة</span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            مزامنة مشفرة سحابياً SSL
          </span>
        </div>

      </div>
    </div>
  );
};
