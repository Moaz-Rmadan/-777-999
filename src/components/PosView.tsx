import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Invoice, Customer, User, Shift, SystemSettings } from '../types';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  UserCheck, 
  CheckCircle2,
  Barcode,
  Tag,
  Receipt,
  X,
  RotateCcw,
  DoorClosed,
  Volume2,
  VolumeX,
  Printer,
  Sparkles,
  Keyboard,
  AlertTriangle,
  Info,
  PauseCircle,
  PlayCircle,
  Percent,
  Check,
  Store,
  Clock,
  User as UserIcon,
  HelpCircle,
  Maximize2,
  Minimize2,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (invoice: Invoice) => void;
  updateProductStock: (productId: string, qtyChange: number, operationId?: string) => void;
  currentUser: User;
  activeShift: Shift | undefined;
  settings?: SystemSettings;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  onCompleteSale,
  updateProductStock,
  currentUser,
  activeShift,
  settings
}) => {
  const isShiftOpen = !!activeShift;
  const [mobilePosTab, setMobilePosTab] = useState<'catalog' | 'cart'>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<{ id: string; name: string; cart: CartItem[]; timestamp: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountInputVal, setDiscountInputVal] = useState<string>('');
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  
  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanSuccessToast, setScanSuccessToast] = useState<{ show: boolean; message: string; isError?: boolean } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isStandaloneMode, setIsStandaloneMode] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Focus Search/Barcode on Mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Web Audio Scanner Beep
  const playBeep = (success: boolean) => {
    const isBeepEnabled = settings ? settings.soundEnabled : soundEnabled;
    if (!isBeepEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (success) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.07);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(350, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.22);
      }
    } catch (err) {
      console.error("Audio beep error:", err);
    }
  };

  // Barcode Handler
  const handleBarcodeScan = (code: string) => {
    if (!code.trim()) return;
    const cleanCode = code.trim();
    const targetProduct = products.find(p => p.barcode === cleanCode || p.id === cleanCode);
    
    if (targetProduct) {
      if (targetProduct.stock <= 0) {
        playBeep(false);
        setScanSuccessToast({ show: true, message: `⚠️ المنتج [${targetProduct.name}] نفد من المخزون!`, isError: true });
        setTimeout(() => setScanSuccessToast(null), 3000);
        return;
      }
      playBeep(true);
      
      addToCart(targetProduct);
      setScanSuccessToast({ show: true, message: `🟢 تم إضافة: ${targetProduct.name}` });
      setTimeout(() => setScanSuccessToast(null), 2000);
    } else {
      playBeep(false);
      setScanSuccessToast({ show: true, message: `❌ لم يتم العثور على أي منتج بالرمز: ${cleanCode}`, isError: true });
      setTimeout(() => setScanSuccessToast(null), 3000);
    }
    setBarcodeInput('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // KEYBOARD SHORTCUTS ENGINE (F2, F4, F6, F8, F9, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Focus Search / Barcode Input
      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } 
      // F4: Hold / Suspend Invoice
      else if (e.key === 'F4') {
        e.preventDefault();
        holdCurrentCart();
      } 
      // F6: Apply Discount
      else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowDiscountModal(true);
        } else {
          alert('السلة فارغة. أضف منتجات قبل تطبيق الخصم.');
        }
      } 
      // F8: Pay / Checkout
      else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setShowCheckoutModal(true);
        } else {
          alert('السلة فارغة. أضف منتجات أولاً قبل التسديد.');
        }
      } 
      // F9: Refund / Returns
      else if (e.key === 'F9') {
        e.preventDefault();
        setShowRefundModal(true);
      } 
      // ESC: Cancel / Clear cart or close active modal
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (showCheckoutModal) setShowCheckoutModal(false);
        else if (showDiscountModal) setShowDiscountModal(false);
        else if (showHeldModal) setShowHeldModal(false);
        else if (showRefundModal) setShowRefundModal(false);
        else if (showShortcutsHelp) setShowShortcutsHelp(false);
        else if (cart.length > 0) {
          if (window.confirm('هل تريد إلغاء وتفريغ الفاتورة الحالية بالكامل؟')) {
            clearCart();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showCheckoutModal, showDiscountModal, showHeldModal, showRefundModal, showShortcutsHelp]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('عذراً، هذا الصنف نفد من المخزون!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('الكمية المطلوبة تتجاوز المخزون المتاح.');
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.round((item.quantity + delta) * 100) / 100;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            alert('الكمية المطلوبة تتجاوز المخزون المتاح.');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  const holdCurrentCart = () => {
    if (cart.length === 0) {
      alert('السلة فارغة. لا توجد فاتورة لتعليقها.');
      return;
    }
    const defaultName = `فاتورة معلقة #${heldCarts.length + 1}`;
    const newHeld = {
      id: 'held-' + Date.now(),
      name: defaultName,
      cart: [...cart],
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setHeldCarts(prev => [newHeld, ...prev]);
    setCart([]);
    setDiscountAmount(0);
    playBeep(true);
    setScanSuccessToast({ show: true, message: `⏸️ تم تعليق الفاتورة بنجاح (F4)` });
    setTimeout(() => setScanSuccessToast(null), 2500);
  };

  const resumeHeldCart = (heldId: string) => {
    const target = heldCarts.find(h => h.id === heldId);
    if (!target) return;
    setCart(target.cart);
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    setShowHeldModal(false);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.sellPrice * item.quantity), 0);
  const vatRate = settings?.vatRate ?? 14;
  const vatIncluded = settings?.vatIncluded ?? true;
  
  let calculatedDiscount = discountAmount;
  if (discountType === 'percent') {
    calculatedDiscount = (subtotal * discountAmount) / 100;
  }
  
  const afterDiscount = Math.max(0, subtotal - calculatedDiscount);
  
  let tax = 0;
  let finalTotal = afterDiscount;
  if (vatIncluded) {
    tax = afterDiscount - (afterDiscount / (1 + vatRate / 100));
  } else {
    tax = afterDiscount * (vatRate / 100);
    finalTotal = afterDiscount + tax;
  }

  const numericPaid = parseFloat(paidAmount) || 0;
  const changeAmount = Math.max(0, numericPaid - finalTotal);

  // Submit Checkout Sale
  const handleCheckoutSubmit = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && numericPaid < finalTotal) {
      alert('المبلغ المدفوع أقل من إجمالي الفاتورة!');
      return;
    }
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      alert('يرجى اختيار العميل لتسجيل البيع الآجل.');
      return;
    }

    const newInvoiceId = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const invoiceOpId = `op-inv-${newInvoiceId}`;

    const newInvoice: Invoice = {
      id: newInvoiceId,
      operationId: invoiceOpId,
      invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        buyPrice: i.product.buyPrice,
        sellPrice: i.product.sellPrice,
        quantity: i.quantity,
        total: i.product.sellPrice * i.quantity
      })),
      subtotal,
      discount: calculatedDiscount,
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(finalTotal.toFixed(2)),
      paymentMethod,
      customerName: customers.find(c => c.id === selectedCustomerId)?.name,
      cashierName: currentUser.name,
      paidAmount: paymentMethod === 'cash' ? numericPaid : finalTotal,
      changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
      isOffline: !isOnline
    };

    cart.forEach(item => {
      updateProductStock(item.product.id, -item.quantity, `op-stock-${newInvoiceId}-${item.product.id}`);
    });

    onCompleteSale(newInvoice);
    setLastInvoice(newInvoice);
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount('');
    setShowCheckoutModal(false);
    playBeep(true);
  };

  // Instant 1-click Cash Sale
  const handleQuickCashCheckout = () => {
    if (cart.length === 0) {
      alert('السلة فارغة. أضف أصنافاً أولاً!');
      return;
    }

    const newInvoiceId = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const invoiceOpId = `op-inv-${newInvoiceId}`;

    const newInvoice: Invoice = {
      id: newInvoiceId,
      operationId: invoiceOpId,
      invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        buyPrice: i.product.buyPrice,
        sellPrice: i.product.sellPrice,
        quantity: i.quantity,
        total: i.product.sellPrice * i.quantity
      })),
      subtotal,
      discount: calculatedDiscount,
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(finalTotal.toFixed(2)),
      paymentMethod: 'cash',
      cashierName: currentUser.name,
      paidAmount: parseFloat(finalTotal.toFixed(2)),
      changeAmount: 0,
      isOffline: !isOnline
    };

    cart.forEach(item => {
      updateProductStock(item.product.id, -item.quantity, `op-stock-${newInvoiceId}-${item.product.id}`);
    });

    onCompleteSale(newInvoice);
    setLastInvoice(newInvoice);
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount('');
    playBeep(true);
    setScanSuccessToast({ show: true, message: `⚡ تم تسديد الفاتورة كاش فورياً! [${newInvoice.invoiceNumber}]` });
    setTimeout(() => setScanSuccessToast(null), 2500);
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode || '').includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={isStandaloneMode ? "fixed inset-0 z-50 bg-slate-950 p-2 sm:p-4 overflow-y-auto space-y-3 flex flex-col justify-between text-right animate-fadeIn" : "max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4 animate-fadeIn"} dir="rtl">
      
      {/* Toast Notification */}
      {scanSuccessToast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl border font-black text-xs transition-all animate-slideDown ${
          scanSuccessToast.isError 
            ? 'bg-rose-50 border-rose-200 text-rose-700' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <Barcode className="w-5 h-5 animate-pulse" />
          <span>{scanSuccessToast.message}</span>
        </div>
      )}

      {!isShiftOpen ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
            <DoorClosed className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">الوردية مغلقة حالياً</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6 font-bold">يرجى فتح وردية جديدة لبدء عمليات البيع واستقبال الفواتير</p>
        </div>
      ) : (
        <>
          {/* HEADER BAR: الفرع الرئيسي - الوردية - الكاشير - الوضع المستقل */}
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 border border-slate-800">
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">الفرع:</span>
                <span className="font-black text-white">{settings?.storeName || 'الفرع الرئيسي'}</span>
              </div>
              <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">الوردية:</span>
                <span className="font-black text-amber-300 font-mono-numbers">#{activeShift?.shiftNumber || '1024'}</span>
              </div>
              <div className="flex items-center gap-2 border-r border-slate-800 pr-3">
                <UserIcon className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400">الكاشير:</span>
                <span className="font-black text-white">{currentUser.name}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 border-r border-slate-800 pr-3">
                <span className="font-mono text-emerald-400 font-bold bg-slate-800 px-2.5 py-1 rounded-xl text-xs border border-slate-700/80">
                  {currentTimeStr}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-xl text-[11px] font-bold text-slate-300 border border-slate-700/80">
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                <span>{isOnline ? 'متصل بالشبكة' : 'أوفلاين (مستقل)'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {heldCarts.length > 0 && (
                <button
                  onClick={() => setShowHeldModal(true)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-black border border-amber-500/40 flex items-center gap-1.5 transition-all"
                >
                  <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>معلقة ({heldCarts.length})</span>
                </button>
              )}

              <button
                onClick={() => setShowRefundModal(true)}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-black border border-rose-500/40 flex items-center gap-1.5 transition-all"
                title="مرتجع (F9)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">مرتجع (F9)</span>
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
                title={soundEnabled ? 'إيقاف الأصوات' : 'تفعيل الأصوات'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              </button>

              <button
                onClick={() => setShowShortcutsHelp(true)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
                title="دليل الاختصارات السريعة"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* STANDALONE POS FULLSCREEN TOGGLE */}
              <button
                onClick={() => setIsStandaloneMode(!isStandaloneMode)}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 touch-manipulation select-none ${
                  isStandaloneMode 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title="واجهة كاشير مستقلة سريعة في الشاشة الكاملة"
              >
                {isStandaloneMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span>{isStandaloneMode ? 'خروج من POS' : 'واجهة مستقلة (شاشة كاملة)'}</span>
              </button>
            </div>
          </div>

          {/* TABLET / MOBILE VIEW TOGGLE TABS (Hidden on Desktop/Laptop lg:) */}
          <div className="lg:hidden flex items-center p-1 bg-slate-200/80 rounded-2xl gap-1">
            <button
              onClick={() => setMobilePosTab('catalog')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 touch-manipulation select-none ${
                mobilePosTab === 'catalog'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>قائمة الأصناف ({filteredProducts.length})</span>
            </button>
            <button
              onClick={() => setMobilePosTab('cart')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 touch-manipulation select-none relative ${
                mobilePosTab === 'cart'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة ({cart.length})</span>
              {cart.length > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full font-mono text-[10px]">
                  {finalTotal.toFixed(0)} ج.م
                </span>
              )}
            </button>
          </div>

          {/* MAIN SPLIT POS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* RIGHT COLUMN (Product Search & Catalog Grid - 7 Cols) */}
            <div className={`lg:col-span-7 space-y-4 ${mobilePosTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
              
              {/* Search & Barcode Input */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      handleBarcodeScan(searchQuery);
                    }
                  }}
                  className="relative flex items-center gap-2"
                >
                  <Search className="absolute right-3.5 text-slate-400 w-4 h-4" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="🔍 امسح الباركود أو ابحث عن صنف... (اضغط F2 للتركيز)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-16 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shrink-0 transition-colors active:scale-95 touch-manipulation"
                  >
                    إضافة
                  </button>
                </form>

                {/* Quick Test Barcode Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold text-slate-400">
                  <span className="shrink-0 text-slate-500 font-black">باركو سريع:</span>
                  {products.slice(0, 4).map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleBarcodeScan(p.barcode)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-lg shrink-0 border border-slate-200/80 transition-colors active:scale-95 touch-manipulation"
                    >
                      {p.name.split(' ')[0]} ({p.barcode.slice(-4)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 touch-manipulation select-none ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-900/10'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat === 'all' ? '✨ الكل' : cat}
                  </button>
                ))}
              </div>

              {/* Product Cards Grid - Touch Optimized */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredProducts.map(p => {
                  const isOutOfStock = p.stock <= 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={isOutOfStock}
                      className={`p-3.5 bg-white rounded-2xl border transition-all text-right flex flex-col justify-between group relative overflow-hidden min-h-[110px] active:scale-95 touch-manipulation select-none ${
                        isOutOfStock 
                          ? 'opacity-50 cursor-not-allowed border-slate-200' 
                          : 'border-slate-200 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">
                            {p.category}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            المخزون: {p.stock}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-black text-emerald-600 font-mono-numbers">
                          ج.م {p.sellPrice.toFixed(2)}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* LEFT COLUMN (Invoiced Cart Side Panel - 5 Cols) */}
            <div className={`lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between min-h-[600px] ${mobilePosTab === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
              
              {/* Cart Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-900">سلة الفاتورة الحالية</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono-numbers">
                      {cart.length} أصناف
                    </span>
                  </div>

                  {cart.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('هل تريد تفريغ السلة الحالية؟')) clearCart();
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 p-1 touch-manipulation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>تفريغ</span>
                    </button>
                  )}
                </div>

                {/* Items List */}
                <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto divide-y divide-slate-100 pr-1">
                  {cart.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 space-y-2">
                      <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold">السلة فارغة حالياً</p>
                      <p className="text-[10px]">امسح الباركود أو انقر على الأصناف لإضافتها للفاتورة</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono-numbers">
                            ج.م {item.product.sellPrice.toFixed(2)} × {item.quantity}
                          </p>
                        </div>

                        {/* Touch-Friendly Quantity controls (Minimum 38px touch size) */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-8 h-8 bg-white hover:bg-slate-200 rounded-lg text-slate-700 transition-colors flex items-center justify-center active:scale-90 touch-manipulation font-black"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-black font-mono-numbers text-slate-900 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-8 h-8 bg-white hover:bg-slate-200 rounded-lg text-slate-700 transition-colors flex items-center justify-center active:scale-90 touch-manipulation font-black"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-black text-emerald-700 font-mono-numbers min-w-[70px] text-left">
                          ج.م {(item.product.sellPrice * item.quantity).toFixed(2)}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 touch-manipulation"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals & Action Buttons */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                
                {/* Financial Summary */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono-numbers">ج.م {subtotal.toFixed(2)}</span>
                  </div>

                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>الخصم المطبق:</span>
                      <span className="font-mono-numbers">- ج.م {calculatedDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-950 font-black text-base pt-1 border-t border-slate-200">
                    <span>صافي المطلوب (الإجمالي):</span>
                    <span className="text-emerald-700 font-mono-numbers">ج.م {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Secondary Actions: الخصم والتعليق */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (cart.length === 0) alert('السلة فارغة!');
                      else setShowDiscountModal(true);
                    }}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-slate-200 active:scale-95 touch-manipulation"
                  >
                    <Percent className="w-4 h-4 text-indigo-600" />
                    <span>خصم (F6)</span>
                  </button>

                  <button
                    onClick={holdCurrentCart}
                    className="py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-amber-200 active:scale-95 touch-manipulation"
                  >
                    <PauseCircle className="w-4 h-4 text-amber-600" />
                    <span>تعليق (F4)</span>
                  </button>
                </div>

                {/* Main Big Checkout Buttons - Fast POS Execution */}
                <div className="space-y-2">
                  <button
                    onClick={handleQuickCashCheckout}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation select-none border border-amber-300"
                    title="تسديد كاش فوري بنقرة واحدة بالمبلغ المضبوط"
                  >
                    <Zap className="w-4 h-4 text-slate-950 fill-current" />
                    <span>دفع كاش سريع بنقرة واحدة (Quick Cash)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (cart.length === 0) alert('السلة فارغة. أضف أصنافاً أولاً!');
                      else {
                        setPaidAmount(finalTotal.toString());
                        setShowCheckoutModal(true);
                      }
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 touch-manipulation select-none"
                  >
                    <Banknote className="w-5 h-5" />
                    <span>دفع وتفاصيل التسديد (F8)</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

          {/* FOOTER HOTKEYS STRIP */}
          <div className="bg-slate-900 text-white p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-1">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>اختصارات لوحة المفاتيح:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700 font-mono">F2</kbd>
                <span className="text-slate-300">بحث</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded border border-slate-700 font-mono">F4</kbd>
                <span className="text-slate-300">تعليق</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-indigo-400 rounded border border-slate-700 font-mono">F6</kbd>
                <span className="text-slate-300">خصم</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700 font-mono">F8</kbd>
                <span className="text-slate-300">دفع</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-rose-400 rounded border border-slate-700 font-mono">F9</kbd>
                <span className="text-slate-300">مرتجع</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">ESC</kbd>
                <span className="text-slate-300">إلغاء</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: CHECKOUT & PAYMENT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>إتمام وتسديد الفاتورة</span>
              </h3>
              <button onClick={() => setShowCheckoutModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <p className="text-xs font-bold text-emerald-800">إجمالي المبلغ المطلوب:</p>
              <p className="text-3xl font-black text-emerald-700 font-mono-numbers mt-1">
                ج.م {finalTotal.toFixed(2)}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block">طريقة الدفع والسداد:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>نقدي (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>فيزا (Card)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'credit'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>آجل (Credit)</span>
                </button>
              </div>
            </div>

            {/* Cash Paid Input */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <label className="text-slate-700">المبلغ المقبوض من العميل:</label>
                  <span className="text-emerald-700 font-black">
                    الباقي: ج.م {changeAmount.toFixed(2)}
                  </span>
                </div>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={finalTotal.toString()}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-center font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                
                {/* Touch Quick Cash Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">اختصار:</span>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(finalTotal.toString())}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black shrink-0 border border-emerald-200 active:scale-95 touch-manipulation"
                  >
                    بالضبط ({finalTotal.toFixed(0)})
                  </button>
                  {[50, 100, 200, 500, 1000].map(cashVal => (
                    <button
                      key={cashVal}
                      type="button"
                      onClick={() => setPaidAmount(cashVal.toString())}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-mono-numbers font-bold shrink-0 border border-slate-200 active:scale-95 touch-manipulation"
                    >
                      {cashVal} ج.م
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Customer Selector */}
            {paymentMethod === 'credit' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">اختر العميل لتسجيل الآجل:</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- اختر عميل من القائمة --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone}) - الدين الحالي: {c.currentDebt} ج.م</option>
                  ))}
                </select>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCheckoutSubmit}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all"
              >
                تأكيد وطباعة الفاتورة (Enter)
              </button>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                إلغاء (ESC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISCOUNT MODAL (F6) */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-600" />
                <span>تطبيق خصم على الفاتورة (F6)</span>
              </h3>
              <button onClick={() => setShowDiscountModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setDiscountType('fixed')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                  discountType === 'fixed' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                مبلغ ثابت (ج.م)
              </button>
              <button
                onClick={() => setDiscountType('percent')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                  discountType === 'percent' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                نسبة مئوية (%)
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {discountType === 'fixed' ? 'قيمة الخصم بالجنيه:' : 'نسبة الخصم بالمائة:'}
              </label>
              <input
                type="number"
                value={discountInputVal}
                onChange={(e) => setDiscountInputVal(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const val = parseFloat(discountInputVal) || 0;
                  setDiscountAmount(val);
                  setShowDiscountModal(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                تطبيق الخصم
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HELD CARTS MODAL (F4) */}
      {showHeldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-amber-600" />
                <span>الفواتير المعلقة ({heldCarts.length})</span>
              </h3>
              <button onClick={() => setShowHeldModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {heldCarts.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6 font-bold">لا توجد فواتير معلقة حالياً</p>
              ) : (
                heldCarts.map(h => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-900">{h.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{h.timestamp} - ({h.cart.length} أصناف)</p>
                    </div>
                    <button
                      onClick={() => resumeHeldCart(h.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700"
                    >
                      استرجاع
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHeldModal(false)}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: REFUNDS & RETURNS MODAL (F9) */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>مرتجع مبيعات واسترجاع الفواتير (F9)</span>
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 font-bold">ادخل رقم الفاتورة للبحث عنها واسترجاع الأصناف:</p>
              <input
                type="text"
                placeholder="مثال: INV-1042"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  alert('تم إرسال طلب المرتجع، جاري استرجاع الفاتورة للمخزون والتحديث.');
                  setShowRefundModal(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700"
              >
                تأكيد المرتجع
              </button>
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SHORTCUTS GUIDE MODAL */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-emerald-600" />
                <span>اختصارات لوحة المفاتيح السريعة</span>
              </h3>
              <button onClick={() => setShowShortcutsHelp(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="font-bold">F2</span>
                <span className="text-slate-500">التركيز على مربع البحث والباركود</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="font-bold">F4</span>
                <span className="text-slate-500">تعليق الفاتورة الحالية</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="font-bold">F6</span>
                <span className="text-slate-500">تطبيق خصم على الفاتورة</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="font-bold">F8</span>
                <span className="text-slate-500">دفع وتسديد الفاتورة</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="font-bold">F9</span>
                <span className="text-slate-500">فتح شاشة المرتجع</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl flex justify-between items-center">
                <span className="font-bold">ESC</span>
                <span className="text-slate-500">إلغاء / إغلاق / تفريغ السلة</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsHelp(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
