import React, { useState } from 'react';
import { 
  SystemSettings, 
  Product, 
  Invoice, 
  PurchaseInvoice, 
  Supplier, 
  Customer, 
  Expense, 
  Shift 
} from '../types';
import { 
  Store, 
  Percent, 
  Printer, 
  Volume2, 
  Database, 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Barcode, 
  QrCode, 
  Building2, 
  FileText,
  Smartphone,
  Check
} from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  products: Product[];
  invoices: Invoice[];
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  customers: Customer[];
  expenses: Expense[];
  shifts: Shift[];
  onImportData: (data: {
    products?: Product[];
    invoices?: Invoice[];
    purchases?: PurchaseInvoice[];
    suppliers?: Supplier[];
    customers?: Customer[];
    expenses?: Expense[];
    shifts?: Shift[];
  }) => void;
  onResetData: () => void;
  canEdit?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  products,
  invoices,
  purchases,
  suppliers,
  customers,
  expenses,
  shifts,
  onImportData,
  onResetData,
  canEdit = true
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'financial' | 'receipt' | 'hardware' | 'backup'>('store');
  const [formSettings, setFormSettings] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Barcode test state
  const [testBarcode, setTestBarcode] = useState('');
  const [testResult, setTestResult] = useState<{ found: boolean; message: string; product?: Product } | null>(null);

  // File import state
  const [importSummary, setImportSummary] = useState<{
    show: boolean;
    data: any;
    counts: {
      products: number;
      invoices: number;
      purchases: number;
      suppliers: number;
      customers: number;
      expenses: number;
      shifts: number;
    }
  } | null>(null);

  const handleInputChange = (key: keyof SystemSettings, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setErrorMsg('❌ عذراً، لا تملك الصلاحية لتعديل إعدادات النظام.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    onSaveSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Barcode tester
  const handleTestBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testBarcode.trim()) return;
    const prod = products.find(p => p.barcode === testBarcode.trim() || p.id === testBarcode.trim());
    if (prod) {
      setTestResult({
        found: true,
        message: `🟢 تم العثور على المنتج: ${prod.name} | السعر: ج.م ${prod.sellPrice} | المخزون المتاح: ${prod.stock} ${prod.unit}`,
        product: prod
      });
      // Play system beep if audio is enabled
      if (formSettings.soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.08);
        } catch(e){}
      }
    } else {
      setTestResult({
        found: false,
        message: `❌ لم يتم العثور على أي صنف مسجل برمز الباركود: [${testBarcode}]`
      });
    }
  };

  // Export database handler
  const handleExportData = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      systemVersion: 'PRO-1.2',
      products,
      invoices,
      purchases,
      suppliers,
      customers,
      expenses,
      shifts,
      settings: formSettings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `supermarket_pro_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle JSON file upload for import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Count elements
        const counts = {
          products: Array.isArray(parsed.products) ? parsed.products.length : 0,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices.length : 0,
          purchases: Array.isArray(parsed.purchases) ? parsed.purchases.length : 0,
          suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers.length : 0,
          customers: Array.isArray(parsed.customers) ? parsed.customers.length : 0,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses.length : 0,
          shifts: Array.isArray(parsed.shifts) ? parsed.shifts.length : 0,
        };

        setImportSummary({
          show: true,
          data: parsed,
          counts
        });
      } catch (err) {
        alert('الملف المرفوع غير صالح أو ليس بتنسيق JSON صحيح.');
      }
    };
    fileReader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importSummary || !importSummary.data) return;
    const d = importSummary.data;
    
    // Call props function to restore to State + Firebase
    onImportData({
      products: d.products,
      invoices: d.invoices,
      purchases: d.purchases,
      suppliers: d.suppliers,
      customers: d.customers,
      expenses: d.expenses,
      shifts: d.shifts
    });

    if (d.settings) {
      setFormSettings(d.settings);
      onSaveSettings(d.settings);
    }

    setImportSummary(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn" dir="rtl">
      
      {/* Upper Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">لوحة الإعدادات المتقدمة</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            خصص هوية متجرك، والسياسات الضريبية للفواتير، وتصميم إيصال الطباعة الحرارية والمستودع السحابي.
          </p>
        </div>
        
        {/* Quick Save Indicator/Feedback */}
        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ وتحديث الإعدادات بنجاح في قاعدة البيانات الحقيقية</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-800 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Right Tab Navigation (Col span 3) */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-3 lg:pb-0 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('store')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-black transition-all ${
              activeSubTab === 'store'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/10'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            } w-full`}
          >
            <Building2 className={`w-4 h-4 ${activeSubTab === 'store' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>هوية المتجر والفروع</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('financial')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-black transition-all ${
              activeSubTab === 'financial'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/10'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            } w-full`}
          >
            <Percent className={`w-4 h-4 ${activeSubTab === 'financial' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>الضرائب والسياسة المالية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('receipt')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-black transition-all ${
              activeSubTab === 'receipt'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/10'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            } w-full`}
          >
            <Printer className={`w-4 h-4 ${activeSubTab === 'receipt' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>تصميم الفاتورة والإيصال</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hardware')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-black transition-all ${
              activeSubTab === 'hardware'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/10'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            } w-full`}
          >
            <Volume2 className={`w-4 h-4 ${activeSubTab === 'hardware' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>القارئ والصوتيات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('backup')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-black transition-all ${
              activeSubTab === 'backup'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/10'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            } w-full`}
          >
            <Database className={`w-4 h-4 ${activeSubTab === 'backup' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>النسخ الاحتياطي والبيانات</span>
          </button>
        </div>

        {/* Left Form Content (Col span 9) */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. STORE IDENTITY TAB */}
            {activeSubTab === 'store' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-black text-slate-900">بيانات الهوية والترخيص</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">تظهر هذه المعلومات في أعلى الفواتير المطبوعة والمستندات الرسمية.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">اسم المؤسسة / المتجر</label>
                    <input
                      type="text"
                      value={formSettings.storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">شعار المتجر أو السلوجان</label>
                    <input
                      type="text"
                      value={formSettings.storeSlogan}
                      onChange={(e) => handleInputChange('storeSlogan', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">عنوان الفرع الرئيسي</label>
                    <input
                      type="text"
                      value={formSettings.branchAddress}
                      onChange={(e) => handleInputChange('branchAddress', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">رقم الهاتف وخدمة العملاء</label>
                    <input
                      type="text"
                      value={formSettings.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">رقم التسجيل الضريبي (VAT ID)</label>
                    <input
                      type="text"
                      value={formSettings.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">رقم السجل التجاري (CR No)</label>
                    <input
                      type="text"
                      value={formSettings.commercialRecord}
                      onChange={(e) => handleInputChange('commercialRecord', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAXES & FINANCIAL TAB */}
            {activeSubTab === 'financial' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-black text-slate-900">السياسات المالية وحساب الضرائب</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">اضبط المعايير المحاسبية المطبقة على مبيعات السوبر ماركت تلقائياً.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* VAT Rate */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">معدل ضريبة القيمة المضافة (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={formSettings.vatRate}
                        onChange={(e) => handleInputChange('vatRate', parseFloat(e.target.value) || 0)}
                        className="w-full pr-4 pl-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                        dir="ltr"
                      />
                      <span className="absolute left-4 top-3 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Max cashier discount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">الحد الأقصى للخصم التجاري للكاشير (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={formSettings.maxDiscountPercentage}
                        onChange={(e) => handleInputChange('maxDiscountPercentage', parseFloat(e.target.value) || 0)}
                        className="w-full pr-4 pl-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                        dir="ltr"
                      />
                      <span className="absolute left-4 top-3 text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400">أي خصم يتجاوز هذه النسبة سيتطلب رمز اعتماد من المدير أو يمنع الكاشير.</p>
                  </div>

                  {/* VAT inclusion setting */}
                  <div className="md:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="vatIncluded"
                      checked={formSettings.vatIncluded}
                      onChange={(e) => handleInputChange('vatIncluded', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="vatIncluded" className="text-xs font-bold text-slate-900 cursor-pointer">
                        الأسعار تشمل ضريبة القيمة المضافة تلقائياً عند الإضافة للرفوف
                      </label>
                      <p className="text-[10px] text-slate-400">
                        إذا تم تفعيل هذا، سيتم اعتبار سعر بيع الصنف شاملاً للضريبة، ويتم فصل الضريبة عند الدفع. إذا تم تعطيلها، ستضاف الـ {formSettings.vatRate}% فوق قيمة الفاتورة الكلية.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. RECEIPT CUSTOMIZATION TAB */}
            {activeSubTab === 'receipt' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-black text-slate-900">تخصيص ترويسة وتصميم الإيصال الحراري</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">إعدادات الفواتير الحرارية الصادرة للعملاء بمقاس 80mm.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column Controls */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">رسالة ترحيبية أعلى الفاتورة (Header Note)</label>
                      <textarea
                        value={formSettings.receiptHeader}
                        onChange={(e) => handleInputChange('receiptHeader', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">ملاحظة أسفل الفاتورة (Footer Note / سياسة الاستبدال)</label>
                      <textarea
                        value={formSettings.receiptFooter}
                        onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                        <input
                          type="checkbox"
                          id="enableQrCode"
                          checked={formSettings.enableQrCode}
                          onChange={(e) => handleInputChange('enableQrCode', e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 rounded"
                        />
                        <div className="space-y-0.5">
                          <label htmlFor="enableQrCode" className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-slate-800" />
                            <span>تضمين رمز الاستجابة السريعة (QR Code) للفاتورة الإلكترونية</span>
                          </label>
                          <p className="text-[10px] text-slate-400">متوافق مع معايير هيئة الزكاة والضريبة والجمارك لإثبات الفاتورة الإلكترونية المبسطة.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                        <input
                          type="checkbox"
                          id="printerSimulated"
                          checked={formSettings.printerSimulated}
                          onChange={(e) => handleInputChange('printerSimulated', e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 rounded"
                        />
                        <div className="space-y-0.5">
                          <label htmlFor="printerSimulated" className="text-xs font-bold text-slate-900 cursor-pointer">
                            محاكاة نافذة الطباعة الافتراضية
                          </label>
                          <p className="text-[10px] text-slate-400">يعرض نموذج إيصال تفاعلي فوري بدلاً من فتح محرك الطباعة الفعلي للمتصفح مباشرة.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Live Preview (Awesome Premium Feature!) */}
                  <div className="lg:col-span-5 bg-amber-50/20 rounded-2xl border border-amber-200/50 p-4 shadow-inner">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-800 font-extrabold mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>معاينة حية فورية لإيصال 80mm:</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm text-center text-xs font-mono space-y-3 font-medium text-slate-800 max-h-[380px] overflow-y-auto pr-1">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{formSettings.storeName}</h4>
                        <p className="text-[9px] text-slate-400">{formSettings.storeSlogan}</p>
                        <p className="text-[8px] text-slate-400">{formSettings.branchAddress}</p>
                        <p className="text-[8px] text-slate-400">الرقم الضريبي: {formSettings.taxNumber}</p>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-2 text-right text-[9px] space-y-0.5 text-slate-500">
                        {formSettings.receiptHeader && <p className="text-center italic font-bold text-slate-700 bg-slate-50 p-1.5 rounded mb-2">"{formSettings.receiptHeader}"</p>}
                        <div>رقم الفاتورة: #INV-1025</div>
                        <div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>
                      </div>

                      <div className="border-t border-b border-dashed border-slate-300 py-1.5 text-right text-[9px] space-y-1">
                        <div className="flex justify-between font-black text-slate-900">
                          <span>الصنف</span>
                          <span>الكمية x السعر</span>
                        </div>
                        <div className="flex justify-between">
                          <span>جبنة دومتي فيتا 500جم</span>
                          <span>1 x ج.م 25.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>حليب جهينة كامل الدسم 1لتر</span>
                          <span>2 x ج.م 38.00</span>
                        </div>
                      </div>

                      <div className="text-right text-[9px] space-y-0.5">
                        <div className="flex justify-between"><span>المجموع الفرعي:</span> <span>ج.م 101.00</span></div>
                        <div className="flex justify-between"><span>ضريبة القيمة المضافة ({formSettings.vatRate}%):</span> <span>ج.م {(101 * formSettings.vatRate/100).toFixed(2)}</span></div>
                        <div className="flex justify-between font-black text-slate-900 text-xs border-t border-dashed border-slate-200 pt-1">
                          <span>صافي الحساب:</span>
                          <span>ج.م {(101 + (101 * formSettings.vatRate/100)).toFixed(2)}</span>
                        </div>
                      </div>

                      {formSettings.enableQrCode && (
                        <div className="flex flex-col items-center pt-2">
                          <QrCode className="w-12 h-12 text-slate-800" />
                          <span className="text-[7px] text-slate-400 mt-0.5">مسح الفاتورة المبسطة</span>
                        </div>
                      )}

                      {formSettings.receiptFooter && (
                        <div className="border-t border-dashed border-slate-300 pt-2 text-[8px] text-slate-400 text-center leading-normal whitespace-pre-line">
                          {formSettings.receiptFooter}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 4. HARDWARE & AUDIO TAB */}
            {activeSubTab === 'hardware' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-black text-slate-900">إعدادات قارئ الباركود وجهاز الليزر والصوت</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">تكامل ليزر المسح الضوئي التلقائي للأصناف ومؤثرات الصوت لسرعة البيع.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Toggle audio */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="soundEnabled"
                      checked={formSettings.soundEnabled}
                      onChange={(e) => handleInputChange('soundEnabled', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="soundEnabled" className="text-xs font-bold text-slate-900 cursor-pointer">
                        تفعيل صفير نقطة البيع (Audio Feedback Beep)
                      </label>
                      <p className="text-[10px] text-slate-400">
                        يقوم النظام بإصدار صوت طنين ليزر قصير عند نجاح مسح الباركود، وصوت تنبيه منخفض عند حدوث خطأ أو نفاد الكمية.
                      </p>
                    </div>
                  </div>

                  {/* Toggle auto qty increment */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="autoIncrementQty"
                      checked={formSettings.autoIncrementQty}
                      onChange={(e) => handleInputChange('autoIncrementQty', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="autoIncrementQty" className="text-xs font-bold text-slate-900 cursor-pointer">
                        زيادة الكمية تلقائياً عند تكرار مسح الباركود
                      </label>
                      <p className="text-[10px] text-slate-400">
                        إذا تم قراءة باركود لنفس السلعة الموجودة مسبقاً في السلة، يتم زيادة الكمية بمقدار 1 تلقائياً بدلاً من إضافة سطر منفصل.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Barcode Laser Hardware Tester */}
                  <div className="md:col-span-2 border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/30">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Barcode className="w-4 h-4 text-emerald-600" />
                      <span>اختبار كفاءة جهاز قراءة الباركود (Laser Barcode Reader Tester):</span>
                    </div>
                    <p className="text-[10px] text-slate-400">قم بتوصيل قارئ الباركود عبر الـ USB، ضع مؤشر الكتابة في الحقل أدناه وامسح أي ملصق لاختبار استجابة النظام الفورية.</p>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="امسح باركود المنتج هنا أو اكتبه يدوياً للاختبار..."
                        value={testBarcode}
                        onChange={(e) => setTestBarcode(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-left focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={handleTestBarcode}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                      >
                        اختبار وقراءة 🔎
                      </button>
                    </div>

                    {testResult && (
                      <div className={`p-3 rounded-xl border text-xs font-bold animate-fadeIn ${
                        testResult.found 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                          : 'bg-rose-50 border-rose-100 text-rose-800'
                      }`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* 5. DATABASE BACKUPS & RESET TAB */}
            {activeSubTab === 'backup' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-black text-slate-900">النسخ الاحتياطي السحابي والمحلي للأعمال</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">قم بتصدير قاعدة بيانات السوبر ماركت بالكامل لحمايتها من الضياع أو استعادتها بملف واحد.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Export box */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white hover:border-slate-300 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Download className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">تصدير قاعدة البيانات (JSON)</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      تنزيل ملف مدمج يحتوي على كافة المنتجات، الفواتير، حسابات الموردين، ديون العملاء، سجلات الورديات، والقيود المحاسبية للاحتفاظ بها.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تنزيل النسخة الاحتياطية</span>
                    </button>
                  </div>

                  {/* Import box */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white hover:border-slate-300 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">استرجاع نسخة سابقة (JSON)</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      اختر ملف نسخة احتياطية بصيغة .json تم تنزيله سابقاً لاستعادة البيانات واستبدال البيانات الحالية فورياً في المتصفح والسحاب.
                    </p>
                    
                    <label className="w-full mt-2 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>اختر ملف النسخة الاحتياطية</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Reset Default Data */}
                  <div className="md:col-span-2 border border-rose-100 rounded-2xl p-5 space-y-3 bg-rose-50/10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>منطقة الخطر: استعادة البيانات الأولية والمصنع:</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      سيؤدي هذا الخيار إلى حذف كافة التعديلات، الفواتير، الحسابات المسجلة وإعادة ضبط السوبر ماركت بالكامل إلى البيانات التجريبية الافتراضية للنظام. لا تضغط عليه إلا في حال رغبتك ببدء تجربة جديدة تماماً.
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('⚠️ تحذير شديد: هل أنت متأكد تماماً من رغبتك في مسح كافة الفواتير والبيانات واستعادة إعدادات المصنع الافتراضية؟ لا يمكن التراجع عن هذا الإجراء.')) {
                          onResetData();
                          setSaveSuccess(true);
                          setTimeout(() => setSaveSuccess(false), 3000);
                        }
                      }}
                      className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                    >
                      إعادة تهيئة النظام وإستعادة إعدادات المصنع 🧹
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Core Save Buttons */}
            {activeSubTab !== 'backup' && (
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-[10px] text-slate-400">يرجى الضغط على حفظ لتأكيد وتثبيت أي تغييرات قمت بها في التبويب الحالي.</p>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-slate-950/10"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>حفظ التعديلات الحالية</span>
                  </button>
                </div>
              </div>
            )}

          </form>

        </div>

      </div>

      {/* Confirmation Modal for File Imports */}
      {importSummary && importSummary.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-fadeIn space-y-4">
            
            <div className="flex items-center gap-2 text-purple-700 font-black text-sm">
              <Upload className="w-5 h-5 text-purple-600" />
              <span>مراجعة بيانات الاستيراد المقترحة</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تم فك تشفير ملف النسخة الاحتياطية بنجاح. سيقوم النظام باستيراد واستبدال البيانات الحالية بالأعداد التالية:
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs space-y-2 font-bold text-slate-700">
              <div className="flex justify-between"><span>الأصناف والسلع:</span> <span className="text-slate-900">{importSummary.counts.products} صنف</span></div>
              <div className="flex justify-between"><span>فواتير المبيعات:</span> <span className="text-slate-900">{importSummary.counts.invoices} فاتورة</span></div>
              <div className="flex justify-between"><span>فواتير المشتريات:</span> <span className="text-slate-900">{importSummary.counts.purchases} فاتورة</span></div>
              <div className="flex justify-between"><span>الموردين المسجلين:</span> <span className="text-slate-900">{importSummary.counts.suppliers} مورد</span></div>
              <div className="flex justify-between"><span>العملاء والمديونيات:</span> <span className="text-slate-900">{importSummary.counts.customers} عميل</span></div>
              <div className="flex justify-between"><span>حركات المصروفات:</span> <span className="text-slate-900">{importSummary.counts.expenses} مصروف</span></div>
              <div className="flex justify-between"><span>ورديات الكاشير:</span> <span className="text-slate-900">{importSummary.counts.shifts} وردية</span></div>
            </div>

            <div className="bg-amber-50 text-amber-900 text-[10px] p-3 rounded-lg border border-amber-200 leading-normal font-bold">
              ⚠️ تحذير: استكمال عملية الاستيراد سيقوم بالكتابة فوق قاعدة البيانات السحابية الحالية. يرجى تأكيد العملية.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={confirmImport}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-colors"
              >
                تأكيد الاستيراد واستبدال البيانات السحابية
              </button>
              <button
                type="button"
                onClick={() => setImportSummary(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
