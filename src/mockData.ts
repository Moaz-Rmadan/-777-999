import { Product, Supplier, Customer, Expense, Invoice, PurchaseInvoice, User, SystemSettings } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'أحمد المدير العام', username: 'admin', role: 'super_admin', email: 'cfo.moaz@gmail.com' },
  { id: 'u2', name: 'محمد الكاشير', username: 'cashier1', role: 'cashier' },
  { id: 'u3', name: 'سارة المحاسبة', username: 'accountant', role: 'accountant' },
  { id: 'u4', name: 'ريم مديرة التشغيل', username: 'manager', role: 'manager' },
  { id: 'u5', name: 'حسن أمين المستودع', username: 'warehouse', role: 'warehouse' },
  { id: 'u6', name: 'خالد مدير الفرع', username: 'branch', role: 'branch_manager' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', barcode: '6221155001234', name: 'حليب المراعي كامل الدسم 1 لتر', category: 'ألبان وأجبان', buyPrice: 38, sellPrice: 45, stock: 42, minStock: 10, unit: 'لتر', expiryDate: '2026-09-15' },
  { id: 'p2', barcode: '6221155005678', name: 'جبنة فتا بريزيدن 500جم', category: 'ألبان وأجبان', buyPrice: 55, sellPrice: 68, stock: 18, minStock: 5, unit: 'قطعة', expiryDate: '2026-10-20' },
  { id: 'p3', barcode: '6221001987654', name: 'أرز المصري الفاخر 1 كجم', category: 'حبوب ومقرمشات', buyPrice: 28, sellPrice: 35, stock: 85, minStock: 20, unit: 'كيلو', expiryDate: '2027-05-10' },
  { id: 'p4', barcode: '6221002345678', name: 'زيت ذرة عافية 800 مل', category: 'زيوت ومواد غذائية', buyPrice: 75, sellPrice: 90, stock: 24, minStock: 8, unit: 'قطعة', expiryDate: '2027-01-15' },
  { id: 'p5', barcode: '6221003456789', name: 'سكر الأبيض الناعم 1 كجم', category: 'حبوب ومقرمشات', buyPrice: 26, sellPrice: 32, stock: 9, minStock: 15, unit: 'كيلو' }, // Low stock alert
  { id: 'p6', barcode: '6221004567890', name: 'شاي ليبتون العائلي 250جم', category: 'مشروبات', buyPrice: 60, sellPrice: 75, stock: 30, minStock: 10, unit: 'قطعة' },
  { id: 'p7', barcode: '6221005678901', name: 'مياه معدنية نستله 1.5 لتر', category: 'مشروبات', buyPrice: 6, sellPrice: 9, stock: 120, minStock: 30, unit: 'زجاجة' },
  { id: 'p8', barcode: '6221006789012', name: 'مسحوق غسيل أوتوماتيك برسيل 2.5 كجم', category: 'منظفات وعناية', buyPrice: 140, sellPrice: 175, stock: 14, minStock: 5, unit: 'عبوة' },
  { id: 'p9', barcode: '6221007890123', name: 'شوكولاتة كادبري ديري ميلك 90جم', category: 'حلويات ومقرمشات', buyPrice: 22, sellPrice: 30, stock: 50, minStock: 15, unit: 'قطعة', expiryDate: '2026-08-30' }, // Near expiry
  { id: 'p10', barcode: '6221008901234', name: 'مكرونة الملكة 400جم', category: 'حبوب ومقرمشات', buyPrice: 14, sellPrice: 19, stock: 65, minStock: 20, unit: 'كيس' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'شركة المراعي للصناعات الغذائية', phone: '01012345678', company: 'المراعي', balance: 14500 },
  { id: 's2', name: 'مؤسسة النيل للأرز والسلع', phone: '01123456789', company: 'النيل', balance: 8200 },
  { id: 's3', name: 'شركة يونيليفر مصر للمنظفات', phone: '01234567890', company: 'يونيليفر', balance: 24000 }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'أحمد محمود (عميل دائم)', phone: '01098765432', creditLimit: 2000, currentDebt: 350 },
  { id: 'c2', name: 'دكتور خالد السيد', phone: '01187654321', creditLimit: 5000, currentDebt: 1200 },
  { id: 'c3', name: 'سارة إبراهيم', phone: '01276543210', creditLimit: 1500, currentDebt: 0 }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', title: 'إيجار المحع الشهرى', category: 'إيجار', amount: 15000, date: '2026-08-01', notes: 'إيجار شهر أغسطس' },
  { id: 'e2', title: 'فاتورة الكهرباء', category: 'كهرباء ومياه', amount: 3400, date: '2026-08-05', notes: 'استهلاك تكييفات وثلاجات' },
  { id: 'e3', title: 'مرتبات العاملين (سلفة عيد)', category: 'رواتب', amount: 8000, date: '2026-08-08', notes: 'تح تحت الأبواب' }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-1001',
    date: '2026-08-10 10:30',
    items: [
      { productId: 'p1', productName: 'حليب المراعي كامل الدسم 1 لتر', buyPrice: 38, sellPrice: 45, quantity: 2, total: 90 },
      { productId: 'p3', productName: 'أرز المصري الفاخر 1 كجم', buyPrice: 28, sellPrice: 35, quantity: 1, total: 35 }
    ],
    subtotal: 125,
    discount: 0,
    tax: 0,
    total: 125,
    paymentMethod: 'cash',
    cashierName: 'محمد كاشير',
    paidAmount: 150,
    changeAmount: 25
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-1002',
    date: '2026-08-10 11:15',
    items: [
      { productId: 'p4', productName: 'زيت ذرة عافية 800 مل', buyPrice: 75, sellPrice: 90, quantity: 1, total: 90 },
      { productId: 'p6', productName: 'شاي ليبتون العائلي 250جم', buyPrice: 60, sellPrice: 75, quantity: 1, total: 75 }
    ],
    subtotal: 165,
    discount: 5,
    tax: 0,
    total: 160,
    paymentMethod: 'card',
    customerName: 'أحمد محمود (عميل دائم)',
    cashierName: 'محمد كاشير',
    paidAmount: 160,
    changeAmount: 0
  }
];

export const INITIAL_PURCHASES: PurchaseInvoice[] = [
  {
    id: 'pur-1',
    purchaseNumber: 'PUR-501',
    supplierId: 's1',
    supplierName: 'شركة المراعي للصناعات الغذائية',
    date: '2026-08-02',
    items: [
      { productId: 'p1', productName: 'حليب المراعي كامل الدسم 1 لتر', buyPrice: 38, quantity: 50, total: 1900 },
      { productId: 'p2', productName: 'جبنة فتا بريزيدن 500جم', buyPrice: 55, quantity: 20, total: 1100 }
    ],
    total: 3000,
    status: 'paid'
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  storeName: 'سوبر ماركت برو',
  storeSlogan: 'المشروع التقني المتكامل لنقاط البيع',
  branchAddress: 'فرع الدقي والمبيعات السحابية',
  phone: '01021481944',
  taxNumber: '310549214700003',
  commercialRecord: '2549210-A',
  vatRate: 14,
  vatIncluded: true,
  maxDiscountPercentage: 10,
  receiptHeader: 'أهلاً بكم في سوبر ماركت برو',
  receiptFooter: 'نشكركم على اختياركم سوبر ماركت برو!\nخدمة العملاء متواجدة على مدار الساعة',
  enableQrCode: true,
  soundEnabled: true,
  autoIncrementQty: true,
  printerSimulated: true
};

