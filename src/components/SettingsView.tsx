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
  Check,
  Globe,
  Coins,
  Layout,
  Keyboard,
  ShieldAlert,
  CreditCard,
  Layers,
  Settings,
  Radio,
  Zap,
  RotateCcw,
  X,
  Sliders,
  DollarSign,
  Palette
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
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'financial' | 'receipt' | 'hardware' | 'ui_theme' | 'backup'>('store');
  const [formSettings, setFormSettings] = useState<SystemSettings>({
    currencySymbol: 'ج.م',
    timezone: 'Africa/Cairo (GMT+2)',
    branchCode: 'BR-01',
    defaultPaymentMethod: 'cash',
    enableCreditSales: true,
    enableOfflineMode: true,
    roundTotal: false,
    showTaxBreakdown: true,
    showCashierName: true,
    showCustomerDetails: true,
    showInvoiceBarcode: true,
    receiptFontSize: 'normal',
    directPrintMode: true,
    silentPrintMode: false,
    thermalWidth: '80mm',
    cashDrawerKickOnSale: true,
    scaleBarcodePrefix: '20',
    compactUiMode: false,
    themeColor: 'slate',
    ...settings
  });

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Barcode test state
  const [testBarcode, setTestBarcode] = useState('');
  const [testResult, setTestResult] = useState<{ found: boolean; message: string; product?: Product } | null>(null);

  // File import modal state
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

  // Reset modal state (custom React modal instead of browser window.confirm)
  const [showResetModal, setShowResetModal] = useState(false);

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
        message: `🟢 تم العثور على المنتج: ${prod.name} | السعر: ${formSettings.currencySymbol || 'ج.م'} ${prod.sellPrice} | المخزون المتاح: ${prod.stock} ${prod.unit}`,
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
      systemVersion: 'PRO-2.0',
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
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importSummary || !importSummary.data) return;
    const d = importSummary.data;
    
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

  const executeFactoryReset = () => {
    onResetData();
    setShowResetModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const currencySymbol = formSettings.currencySymbol || 'ج.م';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn" dir="rtl">
      
      {/* Upper Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-950/10">
              <Settings className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">إعدادات النظام والتهيئة المتقدمة</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  الإصدار 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                خصص هوية المتجر، السياسات المالية، الفاتورة الحرارية، تكامل أجهزة الكاشير، والنسخ الاحتياطي.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Save Indicator/Feedback */}
        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            <span>تم حفظ وتحديث كافة الإعدادات بنجاح في النظام والسحاب</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-800 border border-rose-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
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
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right text-xs font-black transition-all ${
              activeSubTab === 'store'
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-950/15'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/70'
            } w-full`}
          >
            <Building2 className={`w-4.5 h-4.5 ${activeSubTab === 'store' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col text-right">
              <span>هوية المتجر والفروع</span>
              <span className={`text-[10px] font-normal ${activeSubTab === 'store' ? 'text-slate-300' : 'text-slate-400'}`}>الاسم، السجل، الشعار والعملة</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('financial')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right text-xs font-black transition-all ${
              activeSubTab === 'financial'
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-950/15'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/70'
            } w-full`}
          >
            <Percent className={`w-4.5 h-4.5 ${activeSubTab === 'financial' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col text-right">
              <span>السياسات المالية والضرائب</span>
              <span className={`text-[10px] font-normal ${activeSubTab === 'financial' ? 'text-slate-300' : 'text-slate-400'}`}>الضريبة، الخصومات والآجل</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('receipt')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right text-xs font-black transition-all ${
              activeSubTab === 'receipt'
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-950/15'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/70'
            } w-full`}
          >
            <Printer className={`w-4.5 h-4.5 ${activeSubTab === 'receipt' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col text-right">
              <span>تصميم الفاتورة الحرارية</span>
              <span className={`text-[10px] font-normal ${activeSubTab === 'receipt' ? 'text-slate-300' : 'text-slate-400'}`}>الترويسة، الـ QR وتنسيق 80mm</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hardware')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right text-xs font-black transition-all ${
              activeSubTab === 'hardware'
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-950/15'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/70'
            } w-full`}
          >
            <Volume2 className={`w-4.5 h-4.5 ${activeSubTab === 'hardware' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col text-right">
              <span>الأجهزة والباركود والصوت</span>
              <span className={`text-[10px] font-normal ${activeSubTab === 'hardware' ? 'text-slate-300' : 'text-slate-400'}`}>قارئ الليزر، درج النقد والميزان</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ui_theme')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right text-xs font-black transition-all ${
              activeSubTab === 'ui_theme'
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-950/15'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/70'
            } w-full`}
          >
            <Keyboard className={`w-4.5 h-4.5 ${activeSubTab === 'ui_theme' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col text-right">
              <span>اختصارات المفاتيح والمظهر</span>
              <span className={`text-[10px] font-normal ${activeSubTab === 'ui_theme' ? 'text-slate-300' : 'text-slate-400'}`}>لوحة المفاتيح والنمط العام</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('backup')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right text-xs font-black transition-all ${
              activeSubTab === 'backup'
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-950/15'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/70'
            } w-full`}
          >
            <Database className={`w-4.5 h-4.5 ${activeSubTab === 'backup' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col text-right">
              <span>النسخ الاحتياطي والبيانات</span>
              <span className={`text-[10px] font-normal ${activeSubTab === 'backup' ? 'text-slate-300' : 'text-slate-400'}`}>تصدير، استيراد وضبط المصنع</span>
            </div>
          </button>
        </div>

        {/* Left Form Content (Col span 9) */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. STORE IDENTITY TAB */}
            {activeSubTab === 'store' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900">بيانات الهوية والترخيص والفرع</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">تظهر هذه المعلومات في أعلى الفواتير المطبوعة والمستندات الرسمية والتقرير المالي.</p>
                  </div>
                  <Building2 className="w-6 h-6 text-slate-300" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">اسم المؤسسة / المتجر الرئيسي</label>
                    <input
                      type="text"
                      value={formSettings.storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">شعار المتجر أو السلوجان التجاري</label>
                    <input
                      type="text"
                      value={formSettings.storeSlogan}
                      onChange={(e) => handleInputChange('storeSlogan', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">رمز الفرع (Branch Code)</label>
                    <input
                      type="text"
                      value={formSettings.branchCode || 'BR-01'}
                      onChange={(e) => handleInputChange('branchCode', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">رمز العملة الافتراضية للنظام</label>
                    <select
                      value={formSettings.currencySymbol || 'ج.م'}
                      onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    >
                      <option value="ج.م">ج.م - جنيه مصري</option>
                      <option value="ر.س">ر.س - ريال سعودي (SAR)</option>
                      <option value="د.إ">د.إ - درهم إماراتي (AED)</option>
                      <option value="د.ك">د.ك - دينار كويتي (KWD)</option>
                      <option value="ر.ع">ر.ع - ريال عماني (OMR)</option>
                      <option value="$">$ - دولار أمريكي (USD)</option>
                      <option value="€">€ - يورو (EUR)</option>
                    </select>
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
                    <label className="text-xs font-bold text-slate-700">البريد الإلكتروني للفرع</label>
                    <input
                      type="email"
                      value={formSettings.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@store.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">النطاق الزمني والتوقيت (Timezone)</label>
                    <input
                      type="text"
                      value={formSettings.timezone || 'Africa/Cairo (GMT+2)'}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">رقم التسجيل الضريبي (VAT Registration ID)</label>
                    <input
                      type="text"
                      value={formSettings.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none text-left font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">رقم السجل التجاري (Commercial Record)</label>
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
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900">السياسات المالية وحساب الضرائب والآجل</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">اضبط المعايير المحاسبية المطبقة على المبيعات والمديونيات في الكاشير.</p>
                  </div>
                  <Percent className="w-6 h-6 text-slate-300" />
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
                    <label className="text-xs font-bold text-slate-700">الحد الأقصى للخصم التجاري المسموح للكاشير (%)</label>
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
                    <p className="text-[10px] text-slate-400">أي خصم يتجاوز هذه النسبة يمنع الكاشير من إتمامه.</p>
                  </div>

                  {/* Default payment method */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">طريقة الدفع الافتراضية في شاشة البيع</label>
                    <select
                      value={formSettings.defaultPaymentMethod || 'cash'}
                      onChange={(e) => handleInputChange('defaultPaymentMethod', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    >
                      <option value="cash">دفع نقدي (Cash)</option>
                      <option value="card">بطاقة / فيزا (Card)</option>
                      <option value="credit">بيع بالآجل / حساب عميل (Credit)</option>
                    </select>
                  </div>

                  {/* Rounding option */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">سياسة تقريب القصور المالية</label>
                    <select
                      value={formSettings.roundTotal ? 'true' : 'false'}
                      onChange={(e) => handleInputChange('roundTotal', e.target.value === 'true')}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    >
                      <option value="false">احتساب الكسرة بدقة (مثال: 105.75)</option>
                      <option value="true">تقريب إجمالي الفاتورة لأقرب قيمة صحيحة</option>
                    </select>
                  </div>

                  {/* VAT inclusion setting */}
                  <div className="md:col-span-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="vatIncluded"
                      checked={formSettings.vatIncluded}
                      onChange={(e) => handleInputChange('vatIncluded', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="vatIncluded" className="text-xs font-bold text-slate-900 cursor-pointer">
                        الأسعار المعروضة على الرفوف تشمل ضريبة القيمة المضافة تلقائياً
                      </label>
                      <p className="text-[10px] text-slate-400">
                        إذا تم تفعيل هذا الخيار، يُعتبر سعر البيع شاملاً للضريبة ويتم استخلاص قيمة الـ {formSettings.vatRate}% منها. إذا تم تعطيلها، ستُضاف الضريبة إضافياً فوق الإجمالي.
                      </p>
                    </div>
                  </div>

                  {/* Allow credit sales */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enableCreditSales"
                      checked={formSettings.enableCreditSales ?? true}
                      onChange={(e) => handleInputChange('enableCreditSales', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="enableCreditSales" className="text-xs font-bold text-slate-900 cursor-pointer">
                        السماح بالبيع بالآجل وحسابات ذمم العملاء
                      </label>
                      <p className="text-[10px] text-slate-400">
                        تمكين الكاشير من اختيار عميل وتسجيل المبيعات كديون مستحقة وفق الحد الائتماني.
                      </p>
                    </div>
                  </div>

                  {/* Offline mode */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enableOfflineMode"
                      checked={formSettings.enableOfflineMode ?? true}
                      onChange={(e) => handleInputChange('enableOfflineMode', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="enableOfflineMode" className="text-xs font-bold text-slate-900 cursor-pointer">
                        تفعيل وضع العمل المحلي عند انقطاع الإنترنت (Offline Support)
                      </label>
                      <p className="text-[10px] text-slate-400">
                        حفظ الفواتير في ذاكرة المتصفح ومزامنتها تلقائياً مع السحاب فور عودة الاتصال.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. RECEIPT CUSTOMIZATION TAB */}
            {activeSubTab === 'receipt' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900">تخصيص وتنسيق الإيصال الحراري للفواتير</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">إعدادات مقاسات الطابعة الحرارية وتنسيق الإيصال للعميل.</p>
                  </div>
                  <Printer className="w-6 h-6 text-slate-300" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column Controls */}
                  <div className="lg:col-span-7 space-y-5">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">عرض ورق الطابعة الحرارية</label>
                        <select
                          value={formSettings.thermalWidth || '80mm'}
                          onChange={(e) => handleInputChange('thermalWidth', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                        >
                          <option value="80mm">80 مم (المعياري للكاشير والمطاعم)</option>
                          <option value="58mm">58 مم (الطابعات المحمولة والصغيرة)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">حجم خط الإيصال</label>
                        <select
                          value={formSettings.receiptFontSize || 'normal'}
                          onChange={(e) => handleInputChange('receiptFontSize', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                        >
                          <option value="compact">خط مدمج صغير (Compact)</option>
                          <option value="normal">خط قياسي (Normal)</option>
                          <option value="large">خط كبير وواضح (Large)</option>
                        </select>
                      </div>
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          id="enableQrCode"
                          checked={formSettings.enableQrCode}
                          onChange={(e) => handleInputChange('enableQrCode', e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 rounded"
                        />
                        <div className="space-y-0.5">
                          <label htmlFor="enableQrCode" className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5 text-slate-800" />
                            <span>تضمين رمز الـ QR الفاتورة الإلكترونية</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          id="showTaxBreakdown"
                          checked={formSettings.showTaxBreakdown ?? true}
                          onChange={(e) => handleInputChange('showTaxBreakdown', e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 rounded"
                        />
                        <div className="space-y-0.5">
                          <label htmlFor="showTaxBreakdown" className="text-xs font-bold text-slate-900 cursor-pointer">
                            إظهار تفاصيل الضريبة المستقطعة
                          </label>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          id="showCashierName"
                          checked={formSettings.showCashierName ?? true}
                          onChange={(e) => handleInputChange('showCashierName', e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 rounded"
                        />
                        <div className="space-y-0.5">
                          <label htmlFor="showCashierName" className="text-xs font-bold text-slate-900 cursor-pointer">
                            طباعة اسم الكاشير المسؤول
                          </label>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          id="showInvoiceBarcode"
                          checked={formSettings.showInvoiceBarcode ?? true}
                          onChange={(e) => handleInputChange('showInvoiceBarcode', e.target.checked)}
                          className="mt-0.5 h-4 w-4 text-slate-900 border-slate-300 rounded"
                        />
                        <div className="space-y-0.5">
                          <label htmlFor="showInvoiceBarcode" className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5 text-slate-800" />
                            <span>باركود الفاتورة أسفل الإيصال</span>
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Dynamic Live Preview */}
                  <div className="lg:col-span-5 bg-amber-50/30 rounded-2xl border border-amber-200/60 p-4 shadow-inner">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-800 font-black mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>معاينة حية فورية لإيصال {formSettings.thermalWidth || '80mm'}:</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm text-center text-xs font-mono space-y-3 font-medium text-slate-800 max-h-[420px] overflow-y-auto pr-1">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{formSettings.storeName}</h4>
                        <p className="text-[9px] text-slate-500">{formSettings.storeSlogan}</p>
                        <p className="text-[8px] text-slate-400">{formSettings.branchAddress}</p>
                        <p className="text-[8px] text-slate-400">الرقم الضريبي: {formSettings.taxNumber}</p>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-2 text-right text-[9px] space-y-0.5 text-slate-600">
                        {formSettings.receiptHeader && <p className="text-center italic font-bold text-slate-800 bg-slate-50 p-1.5 rounded mb-2">"{formSettings.receiptHeader}"</p>}
                        <div>رقم الفاتورة: #INV-1025</div>
                        <div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>
                        {(formSettings.showCashierName ?? true) && <div>الكاشير: أحمد المحاسب</div>}
                      </div>

                      <div className="border-t border-b border-dashed border-slate-300 py-2 text-right text-[9px] space-y-1">
                        <div className="flex justify-between font-black text-slate-900">
                          <span>الصنف</span>
                          <span>الكمية x السعر</span>
                        </div>
                        <div className="flex justify-between">
                          <span>جبنة دومتي فيتا 500جم</span>
                          <span>1 x {currencySymbol} 25.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>حليب جهينة كامل الدسم 1لتر</span>
                          <span>2 x {currencySymbol} 38.00</span>
                        </div>
                      </div>

                      <div className="text-right text-[9px] space-y-1">
                        <div className="flex justify-between"><span>المجموع الفرعي:</span> <span>{currencySymbol} 101.00</span></div>
                        {(formSettings.showTaxBreakdown ?? true) && (
                          <div className="flex justify-between text-slate-500">
                            <span>ضريبة القيمة المضافة ({formSettings.vatRate}%):</span>
                            <span>{currencySymbol} {(101 * formSettings.vatRate/100).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-slate-900 text-xs border-t border-dashed border-slate-300 pt-1.5">
                          <span>إجمالي الفاتورة:</span>
                          <span>{currencySymbol} {(101 + (101 * formSettings.vatRate/100)).toFixed(2)}</span>
                        </div>
                      </div>

                      {formSettings.enableQrCode && (
                        <div className="flex flex-col items-center pt-2">
                          <QrCode className="w-12 h-12 text-slate-800" />
                          <span className="text-[7px] text-slate-400 mt-0.5">مسح الفاتورة الإلكترونية المبسطة</span>
                        </div>
                      )}

                      {(formSettings.showInvoiceBarcode ?? true) && (
                        <div className="flex flex-col items-center pt-1">
                          <Barcode className="w-24 h-6 text-slate-800" />
                          <span className="text-[7px] text-slate-400 font-mono">1025008921</span>
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
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900">إعدادات أجهزة الكاشير والباركود والميزان</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">ربط وتكوين أجهزة الليزر وطابعة الفواتير ودرج النقدية السريع.</p>
                  </div>
                  <Volume2 className="w-6 h-6 text-slate-300" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Direct Thermal Silent Printing Mode */}
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="directPrintMode"
                      checked={formSettings.directPrintMode ?? true}
                      onChange={(e) => handleInputChange('directPrintMode', e.target.checked)}
                      className="mt-1 h-4 w-4 text-emerald-600 border-emerald-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="directPrintMode" className="text-xs font-bold text-emerald-950 cursor-pointer">
                        وضع الطباعة الحرارية المباشرة السريعة (Direct Thermal Silent Print)
                      </label>
                      <p className="text-[10px] text-emerald-700">
                        طباعة الإيصال فوراً بمجرد إتمام الدفع بدون حوارات المتصفح المكررة لسرعة فائقة.
                      </p>
                    </div>
                  </div>

                  {/* Cash drawer kick */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="cashDrawerKickOnSale"
                      checked={formSettings.cashDrawerKickOnSale ?? true}
                      onChange={(e) => handleInputChange('cashDrawerKickOnSale', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="cashDrawerKickOnSale" className="text-xs font-bold text-slate-900 cursor-pointer">
                        فتح درج النقدية تلقائياً عند حفظ الدفع النقدي (Cash Drawer Kick Signal)
                      </label>
                      <p className="text-[10px] text-slate-400">
                        إرسال إشارة نبضية عبر منفذ الطابعة الحرارية لفتح الدرج عند نهاية الفاتورة.
                      </p>
                    </div>
                  </div>

                  {/* Toggle audio */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="soundEnabled"
                      checked={formSettings.soundEnabled}
                      onChange={(e) => handleInputChange('soundEnabled', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="soundEnabled" className="text-xs font-bold text-slate-900 cursor-pointer">
                        تفعيل المؤثرات الصوتية وصوت طنين الباركود (Audio Beep)
                      </label>
                      <p className="text-[10px] text-slate-400">
                        إصدار نغمة ليزر عند إضافة أي صنف للسلة، وصوت تنبيه منخفض عند حدوث خطأ أو نفاد المخزون.
                      </p>
                    </div>
                  </div>

                  {/* Toggle auto qty increment */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="autoIncrementQty"
                      checked={formSettings.autoIncrementQty}
                      onChange={(e) => handleInputChange('autoIncrementQty', e.target.checked)}
                      className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="autoIncrementQty" className="text-xs font-bold text-slate-900 cursor-pointer">
                        زيادة الكمية تلقائياً عند مسح نفس الباركود مجدداً
                      </label>
                      <p className="text-[10px] text-slate-400">
                        إذا تم قراءة باركود سلعة موجودة مسبقاً بالسلة، تُزاد الكمية بمقدار +1 تلقائياً.
                      </p>
                    </div>
                  </div>

                  {/* Scale Barcode prefix */}
                  <div className="space-y-1.5 md:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-800">بادئة باركود ميزان الأجبان واللحوم (Scale Barcode Prefix)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={formSettings.scaleBarcodePrefix || '20'}
                        onChange={(e) => handleInputChange('scaleBarcodePrefix', e.target.value)}
                        className="w-32 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-center focus:ring-2 focus:ring-slate-900"
                      />
                      <p className="text-[10px] text-slate-400">
                        الباركودات التي تبدأ بـ <span className="font-mono font-bold text-slate-800">20</span> أو الرقم المحدد يتم تفكيك وزنها وسعرها تلقائياً عند المسح.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Barcode Laser Hardware Tester */}
                  <div className="md:col-span-2 border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/30">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Barcode className="w-4 h-4 text-emerald-600" />
                      <span>اختبار استجابة ماسح الباركود (Laser Reader Hardware Test):</span>
                    </div>
                    <p className="text-[10px] text-slate-400">ضع المؤشر في الحقل أدناه وامسح أي ملصق باركود باستخدام جهاز الليزر لاختبار القراءة والصوت الفوري.</p>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="امسح باركود بالليزر أو اكتبه يدوياً للاختبار..."
                        value={testBarcode}
                        onChange={(e) => setTestBarcode(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-left focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={handleTestBarcode}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>اختبار وقراءة</span>
                      </button>
                    </div>

                    {testResult && (
                      <div className={`p-3 rounded-xl border text-xs font-bold animate-fadeIn ${
                        testResult.found 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* 5. UI & KEYBOARD SHORTCUTS TAB */}
            {activeSubTab === 'ui_theme' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900">مظهر الواجهة واختصارات لوحة المفاتيح السريعة</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">تخصيص سرعة العمل ونمط العرض للكاشير.</p>
                  </div>
                  <Keyboard className="w-6 h-6 text-slate-300" />
                </div>

                <div className="space-y-6">
                  
                  {/* Shortcuts Cheat Sheet */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                      <Keyboard className="w-4 h-4 text-emerald-600" />
                      <span>اختصارات لوحة المفاتيح المتاحة للكاشير (Keyboard Shortcuts):</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-bold">فتح نقطة البيع (POS)</span>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-black text-slate-800">F1</kbd>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-bold">البحث المباشر في المنتجات</span>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-black text-slate-800">F2</kbd>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-bold">إنهاء الفاتورة والدفع</span>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-black text-slate-800">F10</kbd>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-bold">إلغاء أو تفريغ السلة</span>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-black text-slate-800">Esc</kbd>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-bold">فتح قائمة الأمر السريع</span>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-black text-slate-800">Ctrl + K</kbd>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-bold">طباعة آخر فاتورة</span>
                        <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono font-black text-slate-800">Ctrl + P</kbd>
                      </div>
                    </div>
                  </div>

                  {/* UI Density */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="compactUiMode"
                        checked={formSettings.compactUiMode ?? false}
                        onChange={(e) => handleInputChange('compactUiMode', e.target.checked)}
                        className="mt-1 h-4 w-4 text-slate-900 border-slate-300 rounded"
                      />
                      <div className="space-y-0.5">
                        <label htmlFor="compactUiMode" className="text-xs font-bold text-slate-900 cursor-pointer">
                          تفعيل العرض المدمج للشاشات الصغيرة (Compact UI Density)
                        </label>
                        <p className="text-[10px] text-slate-400">
                          تقليل الهوامش والأبعاد لعرض أكبر قدر من الأصناف والقوائم في الشاشات ذات الدقة المنخفضة.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-800">النمط واللون المعتمد للواجهة</label>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleInputChange('themeColor', 'slate')}
                          className={`w-8 h-8 rounded-full bg-slate-900 border-2 transition-all ${formSettings.themeColor === 'slate' ? 'ring-2 ring-slate-900 ring-offset-2 border-white' : 'border-transparent'}`}
                          title="الداكن المعياري"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('themeColor', 'emerald')}
                          className={`w-8 h-8 rounded-full bg-emerald-600 border-2 transition-all ${formSettings.themeColor === 'emerald' ? 'ring-2 ring-emerald-600 ring-offset-2 border-white' : 'border-transparent'}`}
                          title="الأخضر المالي"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('themeColor', 'indigo')}
                          className={`w-8 h-8 rounded-full bg-indigo-600 border-2 transition-all ${formSettings.themeColor === 'indigo' ? 'ring-2 ring-indigo-600 ring-offset-2 border-white' : 'border-transparent'}`}
                          title="الأزرق الملكي"
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('themeColor', 'amber')}
                          className={`w-8 h-8 rounded-full bg-amber-500 border-2 transition-all ${formSettings.themeColor === 'amber' ? 'ring-2 ring-amber-500 ring-offset-2 border-white' : 'border-transparent'}`}
                          title="الذهبي والدافئ"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 6. DATABASE BACKUPS & RESET TAB */}
            {activeSubTab === 'backup' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900">النسخ الاحتياطي السحابي والمحلي وإدارة البيانات</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">قم بتصدير قاعدة بيانات السوبر ماركت بالكامل لحمايتها أو استعادتها بملف واحد.</p>
                  </div>
                  <Database className="w-6 h-6 text-slate-300" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Export box */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white hover:border-slate-300 transition-all shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Download className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">تصدير النسخة الاحتياطية المدمجة (JSON)</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      تنزيل ملف مدمج يحتوي على كافة المنتجات، الفواتير، حسابات الموردين، ديون العملاء، سجلات الورديات، والقيود المحاسبية للاحتفاظ بها.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تنزيل النسخة الاحتياطية</span>
                    </button>
                  </div>

                  {/* Import box */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white hover:border-slate-300 transition-all shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900">استرجاع نسخة احتياطية سابقة (JSON)</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      اختر ملف نسخة احتياطية بصيغة .json تم تنزيله سابقاً لاستعادة البيانات واستبدال البيانات الحالية فورياً في المتصفح والسحاب.
                    </p>
                    
                    <label className="w-full mt-2 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
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
                  <div className="md:col-span-2 border border-rose-200 rounded-2xl p-5 space-y-3 bg-rose-50/20">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>منطقة الخطر: إعادة تهيئة النظام واستعادة إعدادات المصنع:</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      سيؤدي هذا الخيار إلى مسح كافة التعديلات، الفواتير، الحسابات المسجلة وإعادة ضبط السوبر ماركت بالكامل إلى البيانات التجريبية الافتراضية للنظام. لا تضغط عليه إلا في حال رغبتك ببدء تجربة جديدة تماماً.
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-rose-600/10 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة تهيئة النظام واستعادة إعدادات المصنع</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Core Save Buttons */}
            {activeSubTab !== 'backup' && (
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] text-slate-400">يرجى الضغط على حفظ لتأكيد وتثبيت أي تغييرات قمت بها في التبويب الحالي.</p>
                
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-slate-950/10 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>حفظ كافة التعديلات الحالية</span>
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-fadeIn space-y-4">
            
            <div className="flex items-center gap-2 text-purple-700 font-black text-sm">
              <Upload className="w-5 h-5 text-purple-600" />
              <span>مراجعة بيانات الاستيراد المقترحة</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تم فك تشفير ملف النسخة الاحتياطية بنجاح. سيقوم النظام باستيراد واستبدال البيانات الحالية بالأعداد التالية:
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs space-y-2 font-bold text-slate-700">
              <div className="flex justify-between"><span>الأصناف والسلع:</span> <span className="text-slate-900">{importSummary.counts.products} صنف</span></div>
              <div className="flex justify-between"><span>فواتير المبيعات:</span> <span className="text-slate-900">{importSummary.counts.invoices} فاتورة</span></div>
              <div className="flex justify-between"><span>فواتير المشتريات:</span> <span className="text-slate-900">{importSummary.counts.purchases} فاتورة</span></div>
              <div className="flex justify-between"><span>الموردين المسجلين:</span> <span className="text-slate-900">{importSummary.counts.suppliers} مورد</span></div>
              <div className="flex justify-between"><span>العملاء والمديونيات:</span> <span className="text-slate-900">{importSummary.counts.customers} عميل</span></div>
              <div className="flex justify-between"><span>حركات المصروفات:</span> <span className="text-slate-900">{importSummary.counts.expenses} مصروف</span></div>
              <div className="flex justify-between"><span>ورديات الكاشير:</span> <span className="text-slate-900">{importSummary.counts.shifts} وردية</span></div>
            </div>

            <div className="bg-amber-50 text-amber-900 text-[10px] p-3 rounded-xl border border-amber-200 leading-normal font-bold">
              ⚠️ تحذير: استكمال عملية الاستيراد سيقوم بالكتابة فوق قاعدة البيانات السحابية الحالية. يرجى تأكيد العملية.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={confirmImport}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-colors shadow-sm"
              >
                تأكيد الاستيراد واستبدال البيانات
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

      {/* Safe Custom React Modal for Factory Reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-fadeIn space-y-4">
            
            <div className="flex items-center justify-between text-rose-700 font-black text-sm border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>تأكيد استعادة إعدادات المصنع</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              هل أنت متأكد تماماً من رغبتك في إعادة تهيئة النظام؟
            </p>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1 font-bold">
              <p>⚠️ هذا الإجراء سيؤدي إلى:</p>
              <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-1 font-normal pt-1">
                <li>حذف الفواتير وسجلات الورديات الحالية.</li>
                <li>إعادة ضبط بيانات المخزون والموردين للقيم الافتراضية.</li>
                <li>تصفية الحسابات والمديونيات التجريبية.</li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={executeFactoryReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors shadow-sm"
              >
                تأكيد المسح والاستعادة 🧹
              </button>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
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
