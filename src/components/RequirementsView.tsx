import React from 'react';
import { 
  ClipboardList, 
  ShoppingCart, 
  Package, 
  Truck, 
  Users, 
  FileText, 
  BarChart3, 
  Sparkles, 
  ShieldCheck, 
  Server, 
  Database,
  ArrowRight
} from 'lucide-react';

interface RequirementsViewProps {
  onStartUsing: () => void;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({ onStartUsing }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            تحليل متطلبات هندسة النظام (System Requirements Analysis)
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            النظام المحاسبي وإدارة السوبر ماركت الشامل (SuperMarket Pro)
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            بناءً على طلبكم لتحليل متطلبات نظام محاسبي وإداري متكامل لسوبر ماركت، يوضح هذا المستند الهيكل الوظيفي، التقني، والمحاسبي المطلوب لضمان دورة عمل سلسة ودقيقة بدءاً من المبيعات وحتى إعداد القوائم المالية والأرباح.
          </p>
          <button
            onClick={onStartUsing}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-900/40 hover:scale-[1.02]"
          >
            <span>انتقل إلى النظام التجريبي الفعلي</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Core Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Module 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">1. نظام نقطة البيع (POS)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            شاشة كاشير سريعة تدعم قارئ الباركود، البحث السريع، حساب الخصومات، ضريبة القيمة المضافة، إصدار الفواتير، وطرق دفع متعددة (نقدي، بطاقة، آجل).
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
            <li className="flex items-center gap-1.5">• خصم آلي من المخزون فور البيع</li>
            <li className="flex items-center gap-1.5">• دعم تعليق واسترجاع الفواتير</li>
            <li className="flex items-center gap-1.5">• حساب المتبقي للعميل (الباقي)</li>
          </ul>
        </div>

        {/* Module 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">2. إدارة المخزون والأصناف</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            متابعة دقيقة للأرصدة، تصنيف المنتجات، وحدات القياس (قطعة، كيلو، كرتونة)، تنبيهات انخفاض المخزون وتواريخ الصلاحية للأغذية والألبان.
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
            <li className="flex items-center gap-1.5">• جرد المخزون وتحديث التكلفة وسعر البيع</li>
            <li className="flex items-center gap-1.5">• تنبيهات الأرصدة التي وصلت للحد الأدنى</li>
            <li className="flex items-center gap-1.5">• تقييم إجمالي قيمة المخزون بسعر الشراء</li>
          </ul>
        </div>

        {/* Module 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">3. المشتريات والموردين</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            تسجيل فواتير الشراء من الموردين، تحديث أسعار التكلفة والأرصدة تلقائياً، ومتابعة أرصدة الموردين والحسابات الدائنة (المستحقة للموردين).
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
            <li className="flex items-center gap-1.5">• ربط فواتير الشراء بحسابات الموردين</li>
            <li className="flex items-center gap-1.5">• متابعة أرصدة الموردين وحالة السداد</li>
          </ul>
        </div>

        {/* Module 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">4. العملاء والديون (A/R)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            إدارة حسابات العملاء الدائمين والبيع الآجل (الحسابات)، تحديد الحد الائتماني لكل عميل، ومتابعة التحصيلات والديون المستحقة.
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
            <li className="flex items-center gap-1.5">• كشف حساب تفصيلي لكل عميل</li>
            <li className="flex items-center gap-1.5">• مراقبة تجاوز الحد الائتماني</li>
          </ul>
        </div>

        {/* Module 5 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">5. الخزينة والمصروفات</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            تسجيل المصروفات النثرية والتشغيلية (إيجار، كهرباء، رواتب، صيانة)، ومتابعة حركة النقدية اليومية (وردية الكاشير، الإيرادات والمصروفات).
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
            <li className="flex items-center gap-1.5">• تصنيف المصروفات لمتابعة الهدر</li>
            <li className="flex items-center gap-1.5">• تقرير النقدية اليومية في الدرج</li>
          </ul>
        </div>

        {/* Module 6 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">6. التقارير المالية والأرباح</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            تقارير الأرباح والخسائر اللحظية، إجمالي المبيعات، صافي الربح بعد خصم تكلفة البضاعة المباعة والمصروفات، وتقارير حركة الأصناف الأكثر مبيعاً.
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
            <li className="flex items-center gap-1.5">• قائمة الدخل والأرباح اليومية والشهرية</li>
            <li className="flex items-center gap-1.5">• تقرير الأصناف الأكثر مبيعاً وربحية</li>
          </ul>
        </div>

      </div>

      {/* Technical Architecture & AI Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-3">
            <Server className="w-4 h-4" />
            الهندسة التقنية والأمان
          </div>
          <h3 className="text-xl font-bold mb-3">معمارية متكاملة عالية الأمان</h3>
          <p className="text-slate-300 text-xs leading-relaxed mb-4">
            يعتمد النظام على تقنيات الويب الحديثة (React, TypeScript, Tailwind CSS, Node.js & Express) مع حماية كاملة للبيانات وحفظ محلي وآمن لضمان عدم فقدان فواتير المبيعات أو بيانات العملاء في حال انقطاع الاتصال.
          </p>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>حفظ فوري واستجابة سريعة جداً لشاشات الكاشير</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>إدارة هيكلية دقيقة لحركة المخزون والحسابات</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-4 h-4" />
            المساعد الذكي (Gemini AI)
          </div>
          <h3 className="text-xl font-bold mb-3">تحليلات ذكية واستشارات إدارية</h3>
          <p className="text-slate-300 text-xs leading-relaxed mb-4">
            مزود بمساعد ذكي يعتمد على نموذج Gemini لتحليل حركة المبيعات، التنبؤ بالنواقص قبل نفادها، واقتراح استراتيجيات لزيادة أرباح السوبر ماركت وتخفيض الهدر في السلع سريعة التلف.
          </p>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 italic">
            "يمكنك في أي وقت الانتقال إلى تبويب (المستشار الذكي) لسؤال النظام عن أفضل الأصناف ربحية، أو كيفية تسعير البضائع الجديدة بناءً على السوق."
          </div>
        </div>
      </div>

    </div>
  );
};
