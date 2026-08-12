import React, { useState } from 'react';
import { OfflineQueueItem, Product } from '../types';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Play, 
  AlertCircle,
  HelpCircle,
  Database
} from 'lucide-react';

interface OfflineSyncViewProps {
  queue: OfflineQueueItem[];
  isOnline: boolean;
  simulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  onRetry: (item: OfflineQueueItem) => Promise<void>;
  onResolveConflict: (item: OfflineQueueItem, resolution: 'overwrite' | 'keep_server' | 'cancel') => void;
  onClearQueue: () => void;
  onSyncAll: () => Promise<void>;
  products: Product[];
  onSimulateConflict: (productId: string) => void;
  currencySymbol?: string;
}

export function OfflineSyncView({
  queue,
  isOnline,
  simulatedOffline,
  setSimulatedOffline,
  onRetry,
  onResolveConflict,
  onClearQueue,
  onSyncAll,
  products,
  onSimulateConflict,
  currencySymbol = 'ج.م'
}: OfflineSyncViewProps) {
  const [selectedProductForConflict, setSelectedProductForConflict] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'sim' | 'docs'>('queue');

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const syncedCount = queue.filter(q => q.status === 'synced').length;
  const conflictCount = queue.filter(q => q.status === 'conflict').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;

  const handleSyncClick = async () => {
    setSyncing(true);
    try {
      await onSyncAll();
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: OfflineQueueItem['status']) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            تم المزامنة
          </span>
        );
      case 'conflict':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            تعارض بيانات
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            فشلت المحاولة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" />
            قيد الانتظار
          </span>
        );
    }
  };

  const getTypeLabel = (type: OfflineQueueItem['type']) => {
    const map: Record<string, { label: string, color: string }> = {
      sale: { label: 'فاتورة بيع POS', color: 'bg-emerald-500 text-white' },
      purchase: { label: 'فاتورة شراء', color: 'bg-indigo-500 text-white' },
      transfer: { label: 'تحويل مخزني', color: 'bg-amber-500 text-white' },
      adjustment: { label: 'تسوية مخزن', color: 'bg-rose-500 text-white' },
      payment_supplier: { label: 'سداد مورد', color: 'bg-cyan-500 text-white' },
      payment_customer: { label: 'تحصيل عميل', color: 'bg-blue-500 text-white' },
      expense: { label: 'قيد مصروفات', color: 'bg-teal-500 text-white' },
      shift_open: { label: 'فتح وردية', color: 'bg-slate-500 text-white' },
      shift_close: { label: 'إغلاق وردية', color: 'bg-purple-500 text-white' },
      audit_session: { label: 'جلسة جرد', color: 'bg-neutral-500 text-white' }
    };
    return map[type] || { label: type, color: 'bg-slate-500 text-white' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" id="offline-engine-container">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">محرك العمل دون اتصال والاتساق المحاسبي</h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة طوابير العمليات عند انقطاع الشبكة، ومعالجة تعارض إصدارات المخزون (OCC) ومطابقة الحسابات.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSimulatedOffline(!simulatedOffline)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              simulatedOffline 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
            }`}
          >
            {simulatedOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {simulatedOffline ? 'وضع المحاكاة: غير متصل' : 'وضع المحاكاة: متصل بالشبكة'}
          </button>

          <button
            onClick={handleSyncClick}
            disabled={syncing || !isOnline}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            مزامنة الكل الآن
          </button>
        </div>
      </div>

      {/* Connection & Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-sm font-medium">حالة الاتصال الفعلية</div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <div className="text-lg font-bold text-slate-800">
              {isOnline ? 'متصل بالإنترنت' : 'منقطع عن الإنترنت'}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {simulatedOffline ? 'تم حظر اتصال السيرفر يدوياً بغرض المحاكاة' : 'النظام يكتشف الشبكة تلقائياً'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-sm font-medium">العمليات قيد المزامنة</div>
          <div className="text-3xl font-bold text-slate-800 mt-1">{pendingCount}</div>
          <div className="text-xs text-amber-600 mt-1">تنتظر العودة للإنترنت ليتم ترحيلها للسيرفر</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-sm font-medium">تعارضات معلقة (OCC)</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">{conflictCount}</div>
          <div className="text-xs text-slate-400 mt-1">تتطلب مراجعة من المشرف المالي لمنع التداخل</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-sm font-medium">تم ترحيلها بنجاح</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">{syncedCount}</div>
          <div className="text-xs text-slate-400 mt-1">تطابق تام مع قاعدة البيانات وسجل القيود بالخادم</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'queue' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          طابور العمليات وسجل المزامنة ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('sim')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'sim' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          🧪 محاكي تعارضات مخزن البيانات
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'docs' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          📖 التوثيق وهيكل الاتساق
        </button>
      </div>

      {activeTab === 'queue' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">قائمة العمليات المؤجلة والمرحلة</h3>
            <div className="flex gap-2">
              <button
                onClick={onClearQueue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                تفريغ سجل العمليات
              </button>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Database className="w-12 h-12 mx-auto stroke-[1.25] text-slate-300 mb-3" />
              لا توجد عمليات مسجلة في طابور محرك المزامنة حالياً.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-50/50 transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${getTypeLabel(item.type).color}`}>
                          {getTypeLabel(item.type).label}
                        </span>
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border font-mono">
                          ID: {item.id}
                        </code>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-slate-900 font-bold text-base">{item.description}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>الوقت: {new Date(item.timestamp).toLocaleString('ar-EG')}</span>
                        {item.retryCount > 0 && (
                          <span className="text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                            عدد المحاولات: {item.retryCount}
                          </span>
                        )}
                        {item.expectedVersions && (
                          <span className="text-slate-500 font-mono">
                            إصدار OCC المتوقع: {JSON.stringify(item.expectedVersions)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && isOnline && (
                        <button
                          onClick={() => onRetry(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          ترحيل الآن
                        </button>
                      )}

                      {item.status === 'failed' && (
                        <button
                          onClick={() => onRetry(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-all"
                        >
                          <RefreshCw className="w-3 h-3" />
                          إعادة المحاولة
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conflict Resolution Sub-panel */}
                  {item.status === 'conflict' && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                      <div className="flex gap-2 text-amber-800">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm">تم الكشف عن تداخل / تعارض في البيانات (OCC Error)</h4>
                          <p className="text-xs mt-1">
                            تم تحديث كمية أو خصائص الصنف في السيرفر بواسطة موظف آخر في فرع ثانٍ أثناء عملك دون اتصال.
                            يرجى تحديد إجراء الاتساق المناسب للقيود والمخزون:
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => onResolveConflict(item, 'overwrite')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded"
                        >
                          فرض تعديلي (تجاوز وتحديث السيرفر)
                        </button>
                        <button
                          onClick={() => onResolveConflict(item, 'keep_server')}
                          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded"
                        >
                          اعتماد نسخة السيرفر (وإعادة الاحتساب محلياً)
                        </button>
                        <button
                          onClick={() => onResolveConflict(item, 'cancel')}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold rounded"
                        >
                          إلغاء وتراجع عن هذه المعاملة كلياً
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error view */}
                  {item.error && item.status === 'failed' && (
                    <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded">
                      الخطأ: {item.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sim' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900">🧪 لوحة اختبار محاكاة تعارضات التزامن (OCC Testbench)</h3>
            <p className="text-sm text-slate-500 mt-1">
              كيف تختبر تعارض البيانات؟ اتبع هذه الخطوات السهلة لتجربة قوة نظام الاتساق:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600">
            <div className="p-4 bg-slate-50 border rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white text-xs rounded-full inline-flex items-center justify-center">1</span>
                انتقل للوضع غير المتصل
              </div>
              <p className="text-xs">
                انقر فوق الزر العلوي المكتوب عليه <b>وضع المحاكاة: متصل</b> ليتحول إلى <b>غير متصل</b>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white text-xs rounded-full inline-flex items-center justify-center">2</span>
                افرض تحديث السيرفر بالأسفل
              </div>
              <p className="text-xs">
                حدد منتجاً واضغط على <b>محاكاة تعديل خارجي</b> لرفع رقمه البرمجي في خادم السحاب.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 bg-slate-900 text-white text-xs rounded-full inline-flex items-center justify-center">3</span>
                قم بإجراء عملية بيع/جرد محلياً
              </div>
              <p className="text-xs">
                انتقل للمبيعات أو المخزون وسجل تعديلاً. ستتم العملية محلياً، ثم سيظهر تعارض بمجرد الاتصال!
              </p>
            </div>
          </div>

          <div className="p-5 border border-slate-200 rounded-lg bg-slate-50 max-w-xl space-y-4">
            <h4 className="font-bold text-slate-900">محاكاة عملية تحديث خارجية على السيرفر:</h4>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500">اختر المنتج المراد تزييف تعارضه:</label>
              <select
                value={selectedProductForConflict}
                onChange={(e) => setSelectedProductForConflict(e.target.value)}
                className="w-full border p-2 rounded-lg bg-white text-slate-800"
              >
                <option value="">-- اختر صنفاً مخزنياً --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (الإصدار الحالي: {(p as any).version || 1}) - المخزون: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (!selectedProductForConflict) {
                  alert('الرجاء اختيار صنف أولاً.');
                  return;
                }
                onSimulateConflict(selectedProductForConflict);
                alert('تم التعديل بنجاح! السيرفر يحتوي الآن على إصدار أحدث لهذا الصنف. جرب تعديل مخزونه أو بيعه محلياً لمشاهدة التعارض.');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-all"
            >
              محاكاة تعديل خارجي (زيادة إصدار الصنف بالسيرفر)
            </button>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6 text-sm text-slate-600 leading-relaxed">
          <h3 className="font-bold text-lg text-slate-900 mb-2">📖 البنية البرمجية لمحرك العمليات والاتساق المحاسبي</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-950 mb-1">1. طابور العمليات (Offline Queue)</h4>
              <p>
                يقوم محرك العمليات بحفظ العمليات بصيغة JSON في طابور محلي (LocalStorage) بالتوازي مع التحديث الفوري لواجهة العميل لتقديم تجربة سريعة للغاية وبدون انقطاع.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-950 mb-1">2. المعرّف الأحادي (Operation ID / UUID)</h4>
              <p>
                تُولد رموز فريدة لكل عملية (مثل: <code>op-sale-1691234567</code>). يحفظ السيرفر هذا الرمز للتأكد من عدم تكرار الفاتورة أو القيد المحاسبي.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-950 mb-1">3. ضمان عدم التكرار (Idempotency)</h4>
              <p>
                في حال تكرار المزامنة، يتم التحقق من وجود المعرّف في الخادم أولاً. إذا كانت الفاتورة أو القيد مسجلاً مسبقاً، يتخطاها المحرك تلقائياً لمنع الأخطاء الحسابية.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-950 mb-1">4. معالجة التعارضات (Conflict Resolution via OCC)</h4>
              <p>
                نستخدم خوارزمية <i>التزامن المتفائل (Optimistic Concurrency Control)</i>. يحمل كل منتج حقلاً للإصدار (Version). 
                إذا كان الإصدار الحالي بالخادم يختلف عن الإصدار المتوقع عند إنشاء العملية دون اتصال، يُشير النظام فوراً لتعارض للحفاظ على سلامة أرقام الحسابات والأرصدة.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
