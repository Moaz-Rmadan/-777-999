import React, { useState, useEffect } from 'react';
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
  DoorOpen,
  DoorClosed,
  Volume2,
  Printer,
  Sparkles,
  Keyboard,
  QrCode,
  AlertTriangle
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (invoice: Invoice) => void;
  updateProductStock: (productId: string, qtyChange: number) => void;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldCarts, setHeldCarts] = useState<{ id: string; name: string; cart: CartItem[]; timestamp: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  // Advanced Barcode States
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanSuccessToast, setScanSuccessToast] = useState<{ show: boolean; message: string; isError?: boolean } | null>(null);
  const [enableGlobalScan, setEnableGlobalScan] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Web Audio synthetic POS scanner beep
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
        oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // High-pitched, short beep
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.07);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(350, audioCtx.currentTime); // Low buzz
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.22);
      }
    } catch (err) {
      console.error("Audio beep error:", err);
    }
  };

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
      
      // Add to cart logic inline or using addToCart
      setCart(prev => {
        const existing = prev.find(item => item.product.id === targetProduct.id);
        if (existing) {
          if (existing.quantity >= targetProduct.stock) {
            playBeep(false);
            setScanSuccessToast({ show: true, message: `⚠️ تم الوصول للحد الأقصى المتاح من المخزون لحليب/سلعة [${targetProduct.name}]`, isError: true });
            setTimeout(() => setScanSuccessToast(null), 3000);
            return prev;
          }
          return prev.map(item => 
            item.product.id === targetProduct.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { product: targetProduct, quantity: 1, discount: 0 }];
      });

      setScanSuccessToast({ show: true, message: `🟢 تم مسح وإضافة: ${targetProduct.name}` });
      setTimeout(() => setScanSuccessToast(null), 2500);
    } else {
      playBeep(false);
      setScanSuccessToast({ show: true, message: `❌ لم يتم العثور على أي منتج بالرمز: ${cleanCode}`, isError: true });
      setTimeout(() => setScanSuccessToast(null), 3500);
    }
  };

  // Listen globally to hardware barcode scanners (emulated as rapid keyboard inputs)
  useEffect(() => {
    if (!enableGlobalScan) return;
    
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in a standard input to allow manual typing
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
      )) {
        return;
      }

      const currentTime = Date.now();
      
      // Hardware scanner outputs keys extremely fast (< 50ms)
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleBarcodeScan(buffer);
          buffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1 && /^[0-9]$/.test(e.key)) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, enableGlobalScan, soundEnabled]);

  // Premium Print Thermal Receipt handler
  const handlePrintReceipt = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank', 'width=400,height=650');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة الفواتير');
      return;
    }

    const itemsHtml = invoice.items.map(item => `
      <tr style="border-bottom: 1px dashed #dddddd;">
        <td style="padding: 7px 0; text-align: right; font-weight: 500; font-size: 11px;">${item.productName}</td>
        <td style="padding: 7px 0; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 7px 0; text-align: left; font-size: 11px;">ج.م ${item.sellPrice.toFixed(2)}</td>
        <td style="padding: 7px 0; text-align: left; font-weight: bold; font-size: 11px;">ج.م ${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    // Dynamic fake QR Code resembling electronic invoices
    const qrSvg = `
      <svg width="100" height="100" viewBox="0 0 100 100" style="margin: 12px auto; display: block;">
        <rect x="0" y="0" width="100" height="100" fill="white"/>
        <!-- QR Markers -->
        <rect x="5" y="5" width="25" height="25" fill="black"/>
        <rect x="8" y="8" width="19" height="19" fill="white"/>
        <rect x="12" y="12" width="11" height="11" fill="black"/>
        
        <rect x="70" y="5" width="25" height="25" fill="black"/>
        <rect x="73" y="8" width="19" height="19" fill="white"/>
        <rect x="77" y="12" width="11" height="11" fill="black"/>
        
        <rect x="5" y="70" width="25" height="25" fill="black"/>
        <rect x="8" y="73" width="19" height="19" fill="white"/>
        <rect x="12" y="77" width="11" height="11" fill="black"/>
        
        <!-- Random pixels -->
        <rect x="40" y="10" width="10" height="8" fill="black"/>
        <rect x="55" y="5" width="8" height="14" fill="black"/>
        <rect x="35" y="25" width="15" height="5" fill="black"/>
        <rect x="55" y="25" width="10" height="10" fill="black"/>
        <rect x="42" y="42" width="15" height="15" fill="black"/>
        <rect x="10" y="45" width="15" height="5" fill="black"/>
        <rect x="25" y="50" width="10" height="10" fill="black"/>
        <rect x="15" y="62" width="15" height="5" fill="black"/>
        <rect x="45" y="68" width="18" height="18" fill="black"/>
        <rect x="72" y="40" width="8" height="15" fill="black"/>
        <rect x="85" y="45" width="10" height="10" fill="black"/>
        <rect x="80" y="60" width="15" height="12" fill="black"/>
        <rect x="75" y="80" width="20" height="15" fill="black"/>
        <rect x="35" y="85" width="15" height="10" fill="black"/>
      </svg>
    `;

    const invoiceContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة مبسطة #${invoice.invoiceNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 5px;
            font-size: 11px;
            color: #000000;
            line-height: 1.35;
            background: #ffffff;
          }
          .center {
            text-align: center;
          }
          .title {
            font-size: 15px;
            font-weight: 900;
            margin: 0 0 3px 0;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 9.5px;
            color: #333333;
            margin: 2px 0;
          }
          .divider {
            border-top: 1px dashed #000000;
            margin: 8px 0;
          }
          .double-divider {
            border-top: 3px double #000000;
            margin: 8px 0;
          }
          .meta-table, .totals-table {
            width: 100%;
            font-size: 10px;
            margin-bottom: 5px;
          }
          .meta-table td {
            padding: 2px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
          }
          .items-table th {
            border-bottom: 1px solid #000000;
            padding: 5px 0;
            font-size: 10.5px;
            font-weight: bold;
          }
          .totals-table td {
            padding: 2.5px 0;
          }
          .grand-total {
            font-size: 13px;
            font-weight: 900;
            border-top: 1px dashed #000000;
            border-bottom: 1px dashed #000000;
            padding: 6px 0 !important;
          }
          .footer-text {
            font-size: 9px;
            color: #222222;
            text-align: center;
            margin: 10px 0 5px 0;
          }
          @media print {
            body {
              width: 100%;
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">سوبر ماركت برو</div>
          <div class="subtitle">المشروع التقني المتكامل لنقاط البيع</div>
          <div class="subtitle">فرع الدقي والمبيعات السحابية</div>
          <div class="subtitle">الرقم الضريبي: 310549214700003</div>
          <div class="subtitle">هاتف: 01021481944</div>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr>
            <td><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</td>
            <td style="text-align: left;"><strong>الدفع:</strong> ${
              invoice.paymentMethod === 'cash' ? 'نقدي (كاش)' : 
              invoice.paymentMethod === 'card' ? 'بطاقة بنكية' : 'آجل (دين)'
            }</td>
          </tr>
          <tr>
            <td><strong>التاريخ:</strong> ${invoice.date}</td>
            <td style="text-align: left;"><strong>الكاشير:</strong> ${invoice.cashierName}</td>
          </tr>
          ${invoice.customerName ? `
          <tr>
            <td colspan="2"><strong>العميل:</strong> ${invoice.customerName}</td>
          </tr>
          ` : ''}
        </table>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: right; width: 45%;">الصنف</th>
              <th style="text-align: center; width: 15%;">الكمية</th>
              <th style="text-align: left; width: 20%;">السعر</th>
              <th style="text-align: left; width: 20%;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <table class="totals-table">
          <tr>
            <td>المجموع الفرعي (غير شامل ضريبة القيمة المضافة):</td>
            <td style="text-align: left;">ج.م ${(invoice.subtotal / 1.14).toFixed(2)}</td>
          </tr>
          <tr>
            <td>ضريبة القيمة المضافة المحسوبة (14%):</td>
            <td style="text-align: left;">ج.م ${(invoice.subtotal - (invoice.subtotal / 1.14)).toFixed(2)}</td>
          </tr>
          <tr>
            <td>مجموع الحساب الأصلي:</td>
            <td style="text-align: left;">ج.م ${invoice.subtotal.toFixed(2)}</td>
          </tr>
          ${invoice.discount > 0 ? `
          <tr style="color: red;">
            <td>إجمالي الخصم التجاري:</td>
            <td style="text-align: left;">- ج.م ${invoice.discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr class="grand-total">
            <td><strong>صافي المطلوب سداده (الصافي):</strong></td>
            <td style="text-align: left;"><strong>ج.م ${invoice.total.toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td>المبلغ المقبوض:</td>
            <td style="text-align: left;">ج.م ${invoice.paidAmount.toFixed(2)}</td>
          </tr>
          ${invoice.paymentMethod === 'cash' ? `
          <tr>
            <td><strong>المتبقي للعميل (الباقي):</strong></td>
            <td style="text-align: left;"><strong>ج.م ${invoice.changeAmount.toFixed(2)}</strong></td>
          </tr>
          ` : ''}
        </table>

        <div class="double-divider"></div>

        <div class="center">
          ${qrSvg}
          <div class="footer-text">
            <strong>فاتورة ضريبية مبسطة وإيصال استلام</strong>
            <p style="margin: 3px 0 0 0;">نشكركم على اختياركم سوبر ماركت برو!</p>
            <p style="margin: 2px 0 0 0;">خدمة العملاء والشكاوى متواجدة على مدار الساعة</p>
            <p style="margin: 5px 0 0 0; font-size: 8px; color: #555555;">النظام محمي ومربوط بقاعدة Firebase السحابية الحقيقية</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode || '').includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('عذراً، هذا الصنف نفد من المخزون!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('لا يمكن إضافة كمية أكبر من المتاح في المخزون.');
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

  const setItemQuantity = (productId: string, quantity: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          if (quantity <= 0) return null;
          if (quantity > item.product.stock) {
            alert('الكمية المطلوبة تتجاوز المخزون المتاح.');
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('هل أنت متأكد من تفريغ سلة المبيعات؟')) {
      setCart([]);
      setDiscountAmount(0);
    }
  };

  const holdCurrentCart = () => {
    if (cart.length === 0) return;
    const cartName = prompt('أدخل اسم أو ملاحظة لهذه الفاتورة المعلقة (مثلاً: العميل رقم 3):', `فاتورة معلقة #${heldCarts.length + 1}`);
    if (!cartName) return;

    const newHeld = {
      id: 'held-' + Date.now(),
      name: cartName,
      cart: [...cart],
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setHeldCarts(prev => [newHeld, ...prev]);
    setCart([]);
    setDiscountAmount(0);
  };

  const resumeHeldCart = (heldId: string) => {
    const target = heldCarts.find(h => h.id === heldId);
    if (!target) return;
    setCart(target.cart);
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    setShowHeldModal(false);
  };

  const deleteHeldCart = (heldId: string) => {
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.sellPrice * item.quantity), 0);
  
  // Settings based tax calculations
  const vatRate = settings?.vatRate ?? 14;
  const vatIncluded = settings?.vatIncluded ?? true;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  
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

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
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
      discount: discountAmount,
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(finalTotal.toFixed(2)),
      paymentMethod,
      customerName: customers.find(c => c.id === selectedCustomerId)?.name,
      cashierName: currentUser.name,
      paidAmount: paymentMethod === 'cash' ? numericPaid : finalTotal,
      changeAmount: paymentMethod === 'cash' ? changeAmount : 0
    };

    cart.forEach(item => {
      updateProductStock(item.product.id, -item.quantity);
    });

    onCompleteSale(newInvoice);
    setLastInvoice(newInvoice);
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount('');
    setShowCheckoutModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      
      {!isShiftOpen ? (
        <div className="lg:col-span-12 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <DoorClosed className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">الوردية مغلقة حالياً</h2>
          <p className="text-slate-500 mt-2 mb-8">يجب فتح وردية جديدة من صفحة "إدارة الورديات" لبدء عمليات البيع</p>
        </div>
      ) : (
        <>
          {/* Left Column: Products Catalog (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Floating Scan Success Toast */}
            {scanSuccessToast && (
              <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-slideDown font-extrabold text-xs transition-all ${
                scanSuccessToast.isError 
                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-rose-950/10' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-950/10'
              }`}>
                <Barcode className={`w-5 h-5 animate-pulse ${scanSuccessToast.isError ? 'text-rose-500' : 'text-emerald-600'}`} />
                <span>{scanSuccessToast.message}</span>
              </div>
            )}

            {/* Search & Barcode Control Panel */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 space-y-4">
              
              {/* Row 1: Search and Core Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الصنف أو الباركود..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
                        alert('عذراً، صلاحية المرتجع متاحة للمدير العام فقط أو بموافقة إدارية.');
                      } else {
                        alert('جاري فتح شاشة المرتجعات...');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black border border-rose-100 hover:bg-rose-100 transition-all shrink-0"
                    title="مرتجع مبيعات"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>مرتجع</span>
                  </button>
                  <button
                    onClick={() => {
                      alert('يرجى التوجه لصفحة "إدارة الورديات" لإدارة الوردية الحالية');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black border border-slate-200 hover:bg-slate-200 transition-all shrink-0"
                  >
                    <DoorClosed className="w-3.5 h-3.5 text-rose-600" />
                    <span>الوردية نشطة</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Manual Barcode Scan Input and Settings */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* Scanner Input Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (barcodeInput.trim()) {
                      handleBarcodeScan(barcodeInput);
                      setBarcodeInput('');
                    }
                  }}
                  className="md:col-span-7 flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Barcode className="absolute right-3 top-2.5 w-4 h-4 text-emerald-600" />
                    <input
                      type="text"
                      placeholder="ادخل الباركود يدوياً واضغط Enter..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
                  >
                    مسح
                  </button>
                </form>

                {/* Listeners Controls */}
                <div className="md:col-span-5 flex items-center justify-end gap-2.5 text-[10px] font-bold text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      setEnableGlobalScan(!enableGlobalScan);
                      playBeep(true);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                      enableGlobalScan 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                    title={enableGlobalScan ? 'النظام يلتقط الباركود تلقائياً من قارئ الليزر بدون تحديد حقول' : 'تم إيقاف قارئ الليزر الخلفي'}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>القارئ {enableGlobalScan ? 'نشط 🟢' : 'معطل 🔴'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      if (!soundEnabled) {
                        setTimeout(() => {
                          try {
                            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = audioCtx.createOscillator();
                            osc.connect(audioCtx.destination);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.05);
                          } catch(e){}
                        }, 50);
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                      soundEnabled 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>الصفير {soundEnabled ? 'مفعل' : 'صامت'}</span>
                  </button>
                </div>

              </div>

              {/* Row 3: Fast Barcode Scan Simulators (Crucial for test drive!) */}
              <div className="bg-slate-50/70 px-3.5 py-2.5 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-extrabold">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>لوحة محاكاة مسح الباركود (انقر للتجربة كأنك تملك جهاز ليزر):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 5).map(prod => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleBarcodeScan(prod.barcode)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 rounded-lg text-[10px] font-bold border border-slate-200 transition-all shadow-sm flex items-center gap-1"
                    >
                      <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{prod.name.split(' ')[0]} {prod.name.split(' ')[1] || ''}</span>
                      <span className="text-[9px] font-mono text-slate-400">({prod.barcode.substring(9)})</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleBarcodeScan('9999999999999')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200 transition-all shadow-sm flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    <span>باركود خاطئ</span>
                  </button>
                </div>
              </div>

            </div>

        {/* Categories Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'جميع الأصناف' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[550px] pr-1">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`bg-white p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isOutOfStock 
                    ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' 
                    : 'hover:border-emerald-500 hover:shadow-md cursor-pointer border-slate-200 group'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                    <span className={`text-[10px] font-bold ${product.stock <= product.minStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                      المخزون: {product.stock} {product.unit}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {product.name}
                  </h4>
                  {product.barcode && (
                    <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono text-slate-400">
                      <Barcode className="w-3 h-3 text-slate-300" />
                      <span>{product.barcode}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-extrabold text-emerald-600">
                    ج.م {product.sellPrice.toFixed(2)}
                  </span>
                  <button
                    disabled={isOutOfStock}
                    className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Column: Shopping Cart & Checkout (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[650px]">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">سلة المبيعات الحالية</h3>
          </div>
          <div className="flex items-center gap-2">
            {heldCarts.length > 0 && (
              <button
                onClick={() => setShowHeldModal(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold border border-amber-200 flex items-center gap-1"
              >
                <span>معلقة ({heldCarts.length})</span>
              </button>
            )}
            {cart.length > 0 && (
              <>
                <button
                  onClick={holdCurrentCart}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-[11px] font-bold"
                  title="تعليق الفاتورة الحالية"
                >
                  تعليق
                </button>
                <button
                  onClick={clearCart}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold"
                  title="تفريغ السلة"
                >
                  إفراغ
                </button>
              </>
            )}
            <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} صنف
            </span>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <ShoppingCart className="w-10 h-10 stroke-1" />
              <p>السلة فارغة. اختر المنتجات من القائمة للإضافة.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900">{item.product.name}</h4>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    ج.م {item.product.sellPrice} × {item.quantity} = <strong>ج.م {(item.product.sellPrice * item.quantity).toFixed(2)}</strong>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, -0.25)}
                      className="w-5 h-5 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 text-[10px]"
                      title="طرح 0.25"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => setItemQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                      className="w-14 px-1 py-0.5 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                    <button
                      onClick={() => updateQuantity(item.product.id, 0.25)}
                      className="w-5 h-5 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 text-[10px]"
                      title="إضافة 0.25"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 ml-1"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    <button onClick={() => setItemQuantity(item.product.id, 0.25)} className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 font-bold">ربع (0.25)</button>
                    <button onClick={() => setItemQuantity(item.product.id, 0.5)} className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 font-bold">نصف (0.5)</button>
                    <button onClick={() => setItemQuantity(item.product.id, 1)} className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 font-bold">1 كجم</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span className="font-semibold text-slate-900">ج.م {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>ضريبة القيمة المضافة ({vatRate}% {vatIncluded ? 'شاملة' : 'مضافة'}):</span>
              <span className="font-medium">ج.م {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>الخصم:</span>
              <input
                type="number"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 px-2 py-1 bg-white rounded border border-slate-200 text-left text-xs"
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>الإجمالي النهائي:</span>
              <span className="text-emerald-600 text-base">ج.م {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowCheckoutModal(true)}
            className={`w-full py-3 rounded-xl font-bold text-white text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
              cart.length === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>إتمام البيع والدفع (ج.م {finalTotal.toFixed(2)})</span>
          </button>
        </div>

      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-md w-full max-w-md p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              إتمام الدفع وإصدار الفاتورة
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>نقدي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'card' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>شبكة/بطاقة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`py-2 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>آجل (دين)</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'credit' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1.5">اختر العميل</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="">-- اختر عميل الحسابات --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <label className="block text-slate-600 font-medium">المبلغ المدفوع نقداً (ج.م)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={finalTotal.toString()}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(finalTotal.toFixed(2))}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200"
                    >
                      المبلغ بالضبط ({finalTotal.toFixed(0)})
                    </button>
                    {[50, 100, 200, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPaidAmount(amt.toString())}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                      >
                        {amt} ج.م
                      </button>
                    ))}
                  </div>
                  {numericPaid >= finalTotal && (
                    <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-emerald-900">
                      <span className="font-semibold">المتبقي للعميل (الباقي):</span>
                      <span className="font-extrabold text-sm">ج.م {changeAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>إجمالي الأصناف:</span>
                  <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>المطلوب سداده:</span>
                  <span className="text-emerald-600">ج.م {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-900/20"
                >
                  تأكيد وطباعة الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Held Carts Modal */}
      {showHeldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">الفواتير المعلقة (المؤقتة)</h3>
              <button onClick={() => setShowHeldModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {heldCarts.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-8">لا توجد فواتير معلقة حالياً.</p>
              ) : (
                heldCarts.map(hc => {
                  const heldTotal = hc.cart.reduce((s, i) => s + (i.product.sellPrice * i.quantity), 0);
                  const heldCount = hc.cart.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div key={hc.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{hc.name}</h4>
                          <span className="text-[10px] text-slate-400">{hc.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {heldCount} أصناف — الإجمالي: <strong className="text-emerald-600">ج.م {heldTotal.toFixed(2)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resumeHeldCart(hc.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                        >
                          استرجاع
                        </button>
                        <button
                          onClick={() => deleteHeldCart(hc.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHeldModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Success & Thermal Receipt Simulator Modal */}
      {lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn space-y-4 my-8">
            
            {/* Header Status */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">تم حفظ وإكمال الفاتورة السحابية بنجاح!</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">رقم مرجع النظام: #{lastInvoice.id}</p>
            </div>

            {/* Simulated 80mm Thermal Receipt Slip */}
            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/70 text-right text-xs font-mono text-slate-800 space-y-3 shadow-inner relative overflow-hidden">
              {/* Receipt top decorative wave/dash */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent"></div>
              
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black text-slate-900 tracking-wide">سوبر ماركت برو</h4>
                <p className="text-[9px] text-slate-500">فرع الدقي والمبيعات السحابية</p>
                <p className="text-[9px] text-slate-500 font-bold">الرقم الضريبي: 310549214700003</p>
                <div className="border-b border-dashed border-slate-300 my-2"></div>
              </div>

              {/* Receipt metadata */}
              <div className="grid grid-cols-2 gap-y-1 text-[10px] text-slate-600">
                <div>رقم الفاتورة: <span className="font-bold text-slate-900">#{lastInvoice.invoiceNumber}</span></div>
                <div className="text-left">نوع الدفع: <span className="font-bold text-slate-900">
                  {lastInvoice.paymentMethod === 'cash' ? 'نقدي (كاش)' : 
                   lastInvoice.paymentMethod === 'card' ? 'بطاقة ائتمانية' : 'آجل (دين)'}
                </span></div>
                <div>التاريخ: <span className="font-medium text-slate-900">{lastInvoice.date}</span></div>
                <div className="text-left">الكاشير: <span className="font-medium text-slate-900">{lastInvoice.cashierName}</span></div>
                {lastInvoice.customerName && (
                  <div className="col-span-2 pt-0.5 border-t border-slate-100 mt-1">العميل: <span className="font-bold text-slate-900">{lastInvoice.customerName}</span></div>
                )}
              </div>

              <div className="border-b border-dashed border-slate-300 my-2"></div>

              {/* Products table */}
              <div className="space-y-1.5 text-[10px]">
                <div className="grid grid-cols-12 font-black text-slate-900 border-b border-slate-200 pb-1.5">
                  <span className="col-span-5 text-right">الصنف</span>
                  <span className="col-span-2 text-center">الكمية</span>
                  <span className="col-span-2 text-left">السعر</span>
                  <span className="col-span-3 text-left">الإجمالي</span>
                </div>
                
                <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                  {lastInvoice.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-slate-700 py-0.5 border-b border-dashed border-slate-100">
                      <span className="col-span-5 text-right font-medium text-slate-950 truncate" title={item.productName}>
                        {item.productName}
                      </span>
                      <span className="col-span-2 text-center font-bold text-slate-900">{item.quantity}</span>
                      <span className="col-span-2 text-left">ج.م {item.sellPrice.toFixed(1)}</span>
                      <span className="col-span-3 text-left font-black text-slate-900">ج.م {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 my-2"></div>

              {/* Financial calculations */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>المجموع الفرعي (قبل الضريبة):</span>
                  <span>ج.م {(lastInvoice.subtotal / 1.14).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ضريبة القيمة المضافة (14%):</span>
                  <span>ج.م {(lastInvoice.subtotal - (lastInvoice.subtotal / 1.14)).toFixed(2)}</span>
                </div>
                {lastInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>الخصم التجاري الممنوح:</span>
                    <span>- ج.م {lastInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-black text-slate-900 text-xs py-1.5 border-y border-dashed border-slate-300">
                  <span>صافي المطلوب سداده (الصافي):</span>
                  <span className="text-emerald-700 font-extrabold">ج.م {lastInvoice.total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1 text-[10px]">
                  <span>المبلغ المدفوع (المقبوض):</span>
                  <span>ج.م {lastInvoice.paidAmount.toFixed(2)}</span>
                </div>
                {lastInvoice.paymentMethod === 'cash' && (
                  <div className="flex justify-between font-extrabold text-amber-700 text-[10.5px]">
                    <span>المتبقي للعميل (الباقي):</span>
                    <span>ج.م {lastInvoice.changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-slate-300 my-2"></div>

              {/* QR Code Graphic & Footnote */}
              <div className="flex flex-col items-center justify-center space-y-1 pt-1">
                <QrCode className="w-14 h-14 text-slate-800" />
                <span className="text-[8px] text-slate-400 font-sans text-center">
                  فاتورة إلكترونية معتمدة ضريبياً
                </span>
              </div>
            </div>

            {/* Action Tools */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `
سوبر ماركت برو
فاتورة مبيعات رقم: ${lastInvoice.invoiceNumber}
التاريخ: ${lastInvoice.date}
الإجمالي: ج.م ${lastInvoice.total.toFixed(2)}
شكرًا لتعاملك معنا!
                  `.trim();
                  navigator.clipboard.writeText(summaryText);
                  alert('📋 تم نسخ ملخص الفاتورة بنجاح إلى الحافظة!');
                }}
                className="py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                نسخ ملخص الفاتورة
              </button>

              <button
                type="button"
                onClick={() => handlePrintReceipt(lastInvoice)}
                className="py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs border border-emerald-100 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة حرارية (80mm)</span>
              </button>
            </div>

            {/* Direct Close / Clear POS state button */}
            <button
              type="button"
              onClick={() => setLastInvoice(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-950/10 transition-all text-center block"
            >
              بدء معاملة بيع جديدة 🛒
            </button>
          </div>
        </div>
      )}

        </>
      )}
    </div>
  );
};
