import { 
  Product, 
  Invoice, 
  PurchaseInvoice, 
  JournalEntry, 
  Shift, 
  Expense, 
  Customer, 
  Supplier,
  CustomerTransaction,
  SupplierTransaction,
  InventoryMovement,
  Account,
  StockAuditSession
} from '../../types';

// ==========================================
// Phase 4 Types & Interfaces
// ==========================================

export interface ProductWithVersion extends Product {
  version?: number; // Optimistic Concurrency Control version
  lastUpdated?: string;
  // Multi-location quantities (defaults: main = total stock, storefront = 0, damaged = 0)
  stockLocations?: {
    main: number;
    storefront: number;
    damaged: number;
  };
}

export interface StockTransfer {
  id: string;
  productId: string;
  productName: string;
  fromLocation: 'main' | 'storefront' | 'damaged';
  toLocation: 'main' | 'storefront' | 'damaged';
  quantity: number;
  date: string;
  byUser: string;
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  type: 'increase' | 'decrease';
  quantity: number;
  reason: 'damaged' | 'gift' | 'sample' | 'theft' | 'inventory_audit' | 'expired' | 'other';
  date: string;
  byUser: string;
  notes?: string;
}

// Concurrency Conflict Error class
export class ConcurrencyError extends Error {
  constructor(public productId: string, public productName: string, public expectedVersion: number, public actualVersion: number) {
    super(`عذراً، حدث تعارض في البيانات للمنتج [${productName}]. لقد قام مستخدم آخر بتحديث هذا المنتج (الإصدار المتوقع: ${expectedVersion}، الحالي: ${actualVersion}). يرجى تحديث الصفحة والمحاولة مجدداً.`);
    this.name = 'ConcurrencyError';
  }
}

// ==========================================
// Helper: Safe State Copy & Sanitization
// ==========================================
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Ensure products have versions & locations
export function ensureVersionAndLocations(products: Product[]): ProductWithVersion[] {
  return products.map(p => {
    const copy = p as ProductWithVersion;
    if (copy.version === undefined) {
      copy.version = 1;
    }
    if (!copy.stockLocations) {
      copy.stockLocations = {
        main: copy.stock,
        storefront: 0,
        damaged: 0
      };
    }
    return copy;
  });
}

// ==========================================
// Phase 4: Stock Transfers & Adjustments
// ==========================================

/**
 * Transfers stock between virtual locations with concurrency check.
 */
export function transferStock(
  transfer: Omit<StockTransfer, 'id' | 'date'>,
  products: Product[],
  byUser: string,
  expectedVersions?: Record<string, number>
): {
  updatedProducts: ProductWithVersion[];
  newTransfer: StockTransfer;
  newMovement: InventoryMovement;
} {
  const updatedProducts = ensureVersionAndLocations(clone(products));
  const product = updatedProducts.find(p => p.id === transfer.productId);
  
  if (!product) {
    throw new Error('المنتج غير موجود.');
  }

  // Concurrency Check
  if (expectedVersions && expectedVersions[product.id] !== undefined) {
    const currentVer = product.version || 1;
    if (currentVer !== expectedVersions[product.id]) {
      throw new ConcurrencyError(product.id, product.name, expectedVersions[product.id], currentVer);
    }
  }

  const qty = Math.abs(transfer.quantity);
  const locations = product.stockLocations!;
  
  if (locations[transfer.fromLocation] < qty) {
    throw new Error(`كمية غير كافية في [${transfer.fromLocation}] لنقل المنتج [${product.name}]. الرصيد المتوفر: ${locations[transfer.fromLocation]}`);
  }

  // Perform movement
  locations[transfer.fromLocation] -= qty;
  locations[transfer.toLocation] += qty;
  
  // Update version
  product.version = (product.version || 1) + 1;
  product.lastUpdated = new Date().toISOString();

  const transferId = 'trsf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const dateStr = new Date().toISOString();

  const newTransfer: StockTransfer = {
    ...transfer,
    id: transferId,
    date: dateStr,
    byUser
  };

  const newMovement: InventoryMovement = {
    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    operationId: `op-trsf-${transferId}`,
    productId: product.id,
    productName: product.name,
    type: 'adjustment',
    quantity: 0, // Zero total stock change, but tracks movement locations
    date: dateStr,
    referenceId: transferId
  };

  return {
    updatedProducts,
    newTransfer,
    newMovement
  };
}

/**
 * Adjusts stock with reason and updates standard journal entries for GAAP costing.
 */
export function adjustStock(
  adjustment: Omit<StockAdjustment, 'id' | 'date'>,
  products: Product[],
  journalEntries: JournalEntry[],
  byUser: string,
  expectedVersions?: Record<string, number>
): {
  updatedProducts: ProductWithVersion[];
  updatedJournalEntries: JournalEntry[];
  newAdjustment: StockAdjustment;
  newMovement: InventoryMovement;
} {
  const updatedProducts = ensureVersionAndLocations(clone(products));
  const updatedJournalEntries = clone(journalEntries);
  const product = updatedProducts.find(p => p.id === adjustment.productId);

  if (!product) {
    throw new Error('المنتج غير موجود.');
  }

  // Concurrency Check
  if (expectedVersions && expectedVersions[product.id] !== undefined) {
    const currentVer = product.version || 1;
    if (currentVer !== expectedVersions[product.id]) {
      throw new ConcurrencyError(product.id, product.name, expectedVersions[product.id], currentVer);
    }
  }

  const qty = Math.abs(adjustment.quantity);
  const locations = product.stockLocations!;
  const adjSign = adjustment.type === 'increase' ? 1 : -1;
  const netQtyChange = qty * adjSign;

  if (adjustment.type === 'decrease' && product.stock < qty) {
    throw new Error(`كمية غير كافية في المستودع لإجراء تعديل بالخصم للمنتج [${product.name}]. الرصيد المتوفر: ${product.stock}`);
  }

  // Update Stock
  product.stock = Math.max(0, product.stock + netQtyChange);
  // Default to main location for simple adjustments, or adjust main
  locations.main = Math.max(0, locations.main + netQtyChange);
  
  // Update version
  product.version = (product.version || 1) + 1;
  product.lastUpdated = new Date().toISOString();

  const adjId = 'adj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const dateStr = new Date().toISOString();

  const newAdjustment: StockAdjustment = {
    ...adjustment,
    id: adjId,
    date: dateStr,
    byUser
  };

  const newMovement: InventoryMovement = {
    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    operationId: `op-adj-${adjId}`,
    productId: product.id,
    productName: product.name,
    type: 'adjustment',
    quantity: netQtyChange,
    date: dateStr,
    referenceId: adjId
  };

  // GAAP Double-Entry Logging for Adjustment
  const totalCostValue = qty * product.buyPrice;
  if (totalCostValue > 0) {
    const jeOpId = `op-adj-${adjId}-je`;
    if (adjustment.type === 'decrease') {
      // Dr. Expenses (Loss on Inventory Adjustment) / Cr. Inventory Asset
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-1',
        date: dateStr,
        type: 'expense',
        description: `تسوية مخزنية (عجز/تلف): ${product.name} - سبب: ${adjustment.reason}`,
        debit: totalCostValue,
        credit: 0,
        account: 'expenses',
        referenceId: adjId,
        operationId: `${jeOpId}-debit`
      });
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-2',
        date: dateStr,
        type: 'expense',
        description: `تسوية مخزنية (عجز/تلف): ${product.name} - سبب: ${adjustment.reason}`,
        debit: 0,
        credit: totalCostValue,
        account: 'inventory',
        referenceId: adjId,
        operationId: `${jeOpId}-credit`
      });
    } else {
      // Dr. Inventory Asset / Cr. Revenue (Gain on Inventory Adjustment)
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-1',
        date: dateStr,
        type: 'collection',
        description: `تسوية مخزنية (زيادة): ${product.name} - سبب: ${adjustment.reason}`,
        debit: totalCostValue,
        credit: 0,
        account: 'inventory',
        referenceId: adjId,
        operationId: `${jeOpId}-debit`
      });
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-2',
        date: dateStr,
        type: 'collection',
        description: `تسوية مخزنية (زيادة): ${product.name} - سبب: ${adjustment.reason}`,
        debit: 0,
        credit: totalCostValue,
        account: 'revenue',
        referenceId: adjId,
        operationId: `${jeOpId}-credit`
      });
    }
  }

  return {
    updatedProducts,
    updatedJournalEntries,
    newAdjustment,
    newMovement
  };
}


// ==========================================
// Phase 5: Transaction Engine Functions
// ==========================================

/**
 * 🧾 Function: postSale()
 * Completes a sale invoice, updates stock with concurrency check, updates shift cash levels,
 * logs journal entries, and manages customer debt if payment is credit.
 */
export function postSale(
  invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'>,
  products: Product[],
  invoices: Invoice[],
  journalEntries: JournalEntry[],
  shifts: Shift[],
  customers: Customer[],
  customerTransactions: CustomerTransaction[],
  inventoryMovements: InventoryMovement[],
  activeShift: Shift | null,
  byUser: string,
  expectedVersions?: Record<string, number>
): {
  updatedProducts: ProductWithVersion[];
  updatedInvoices: Invoice[];
  updatedJournalEntries: JournalEntry[];
  updatedShifts: Shift[];
  updatedCustomers: Customer[];
  updatedCustomerTransactions: CustomerTransaction[];
  updatedInventoryMovements: InventoryMovement[];
  newInvoice: Invoice;
} {
  const updatedProducts = ensureVersionAndLocations(clone(products));
  const updatedInvoices = clone(invoices);
  const updatedJournalEntries = clone(journalEntries);
  const updatedShifts = clone(shifts);
  const updatedCustomers = clone(customers);
  const updatedCustomerTransactions = clone(customerTransactions);
  const updatedInventoryMovements = clone(inventoryMovements);

  const invoiceId = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const invoiceNum = 'INV-' + Date.now().toString().substring(6);
  const dateStr = new Date().toISOString();

  // 1. Build and validate items + Stock deduction
  const finalizedItems = invoice.items.map(item => {
    const product = updatedProducts.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`المنتج [${item.productName}] لم يعد متوفراً في النظام.`);
    }

    // Concurrency Check
    if (expectedVersions && expectedVersions[product.id] !== undefined) {
      const currentVer = product.version || 1;
      if (currentVer !== expectedVersions[product.id]) {
        throw new ConcurrencyError(product.id, product.name, expectedVersions[product.id], currentVer);
      }
    }

    if (product.stock < item.quantity) {
      throw new Error(`عذراً، المخزون غير كافٍ للمنتج [${product.name}]. الكمية المتوفرة: ${product.stock}`);
    }

    // Deduct Stock
    product.stock -= item.quantity;
    if (product.stockLocations) {
      // Deduct from storefront or main
      if (product.stockLocations.storefront >= item.quantity) {
        product.stockLocations.storefront -= item.quantity;
      } else {
        const remaining = item.quantity - product.stockLocations.storefront;
        product.stockLocations.storefront = 0;
        product.stockLocations.main = Math.max(0, product.stockLocations.main - remaining);
      }
    }

    // Update product version
    product.version = (product.version || 1) + 1;
    product.lastUpdated = dateStr;

    // Log movement
    const movementId = 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    updatedInventoryMovements.push({
      id: movementId,
      operationId: `op-sale-${invoiceId}`,
      productId: product.id,
      productName: product.name,
      type: 'sale',
      quantity: -item.quantity,
      date: dateStr,
      referenceId: invoiceId
    });

    return {
      ...item,
      buyPrice: product.buyPrice // Lock down cost price at sale time for accurate COGS
    };
  });

  const totalCost = finalizedItems.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);

  const newInvoice: Invoice = {
    ...invoice,
    id: invoiceId,
    invoiceNumber: invoiceNum,
    date: dateStr,
    items: finalizedItems,
    status: 'active',
    operationId: `op-sale-${invoiceId}`
  };

  updatedInvoices.push(newInvoice);

  // 2. Journal Entry Accounting Logging
  const opId = newInvoice.operationId;
  if (invoice.paymentMethod === 'cash') {
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-1',
      date: dateStr,
      type: 'sale',
      description: `مبيعات نقدية - فاتورة ${invoiceNum}`,
      debit: invoice.total,
      credit: 0,
      account: 'cash',
      referenceId: invoiceId,
      operationId: `${opId}-je-cash-debit`
    });
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-2',
      date: dateStr,
      type: 'sale',
      description: `مبيعات نقدية - فاتورة ${invoiceNum}`,
      debit: 0,
      credit: invoice.total,
      account: 'sales',
      referenceId: invoiceId,
      operationId: `${opId}-je-sales-credit`
    });
  } else if (invoice.paymentMethod === 'card') {
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-1',
      date: dateStr,
      type: 'sale',
      description: `مبيعات فيزا - فاتورة ${invoiceNum}`,
      debit: invoice.total,
      credit: 0,
      account: 'bank',
      referenceId: invoiceId,
      operationId: `${opId}-je-bank-debit`
    });
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-2',
      date: dateStr,
      type: 'sale',
      description: `مبيعات فيزا - فاتورة ${invoiceNum}`,
      debit: 0,
      credit: invoice.total,
      account: 'sales',
      referenceId: invoiceId,
      operationId: `${opId}-je-sales-credit`
    });
  } else {
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-1',
      date: dateStr,
      type: 'sale',
      description: `مبيعات آجلة - عميل: ${invoice.customerName} - فاتورة ${invoiceNum}`,
      debit: invoice.total,
      credit: 0,
      account: 'receivables',
      referenceId: invoiceId,
      operationId: `${opId}-je-receivables-debit`
    });
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-2',
      date: dateStr,
      type: 'sale',
      description: `مبيعات آجلة - عميل: ${invoice.customerName} - فاتورة ${invoiceNum}`,
      debit: 0,
      credit: invoice.total,
      account: 'sales',
      referenceId: invoiceId,
      operationId: `${opId}-je-sales-credit`
    });
  }

  // Cost of Goods Sold (COGS) Ledger Entry
  if (totalCost > 0) {
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-3',
      date: dateStr,
      type: 'sale',
      description: `تكلفة مبيعات - فاتورة ${invoiceNum}`,
      debit: totalCost,
      credit: 0,
      account: 'expenses',
      referenceId: invoiceId,
      operationId: `${opId}-je-cogs-debit`
    });
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-4',
      date: dateStr,
      type: 'sale',
      description: `تكلفة مبيعات - فاتورة ${invoiceNum}`,
      debit: 0,
      credit: totalCost,
      account: 'inventory',
      referenceId: invoiceId,
      operationId: `${opId}-je-inventory-credit`
    });
  }

  // 3. Update Shift
  if (activeShift) {
    const shiftIdx = updatedShifts.findIndex(s => s.id === activeShift.id);
    if (shiftIdx !== -1) {
      updatedShifts[shiftIdx].totalSales += invoice.total;
      if (invoice.paymentMethod === 'cash') {
        updatedShifts[shiftIdx].expectedCash += invoice.total;
      }
    }
  }

  // 4. Update Customer Debt (Receivables)
  if (invoice.paymentMethod === 'credit' && invoice.customerName) {
    const customerIdx = updatedCustomers.findIndex(c => c.name === invoice.customerName);
    if (customerIdx !== -1) {
      const c = updatedCustomers[customerIdx];
      const newDebt = c.currentDebt + invoice.total;
      const transOpId = `op-ct-${invoiceId}-sale`;
      
      updatedCustomerTransactions.push({
        id: 'ct-' + Date.now(),
        customerId: c.id,
        type: 'sale',
        amount: invoice.total,
        date: dateStr,
        referenceId: invoiceId,
        description: `بيع آجل فاتورة رقم ${invoiceNum}`,
        balanceAfter: newDebt,
        operationId: transOpId
      });
      c.currentDebt = newDebt;
    }
  }

  return {
    updatedProducts,
    updatedInvoices,
    updatedJournalEntries,
    updatedShifts,
    updatedCustomers,
    updatedCustomerTransactions,
    updatedInventoryMovements,
    newInvoice
  };
}

/**
 * 🧾 Function: postPurchase()
 * Handles a purchase invoice from a supplier, updates the product's buy price using
 * GAAP Weighted Average Cost (WAC) calculations, and updates the inventory stock level.
 */
export function postPurchase(
  purchase: Omit<PurchaseInvoice, 'id' | 'purchaseNumber' | 'date'>,
  products: Product[],
  purchases: PurchaseInvoice[],
  journalEntries: JournalEntry[],
  shifts: Shift[],
  suppliers: Supplier[],
  supplierTransactions: SupplierTransaction[],
  inventoryMovements: InventoryMovement[],
  activeShift: Shift | null,
  byUser: string,
  expectedVersions?: Record<string, number>
): {
  updatedProducts: ProductWithVersion[];
  updatedPurchases: PurchaseInvoice[];
  updatedJournalEntries: JournalEntry[];
  updatedShifts: Shift[];
  updatedSuppliers: Supplier[];
  updatedSupplierTransactions: SupplierTransaction[];
  updatedInventoryMovements: InventoryMovement[];
  newPurchase: PurchaseInvoice;
} {
  const updatedProducts = ensureVersionAndLocations(clone(products));
  const updatedPurchases = clone(purchases);
  const updatedJournalEntries = clone(journalEntries);
  const updatedShifts = clone(shifts);
  const updatedSuppliers = clone(suppliers);
  const updatedSupplierTransactions = clone(supplierTransactions);
  const updatedInventoryMovements = clone(inventoryMovements);

  const purchaseId = 'pur-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const purchaseNum = 'PUR-' + Date.now().toString().substring(6);
  const dateStr = new Date().toISOString();

  // 1. Process items, calculate costing (Weighted Average Cost), and update stock
  const finalizedItems = purchase.items.map(item => {
    const product = updatedProducts.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`المنتج [${item.productName}] غير موجود في النظام.`);
    }

    // Concurrency Check
    if (expectedVersions && expectedVersions[product.id] !== undefined) {
      const currentVer = product.version || 1;
      if (currentVer !== expectedVersions[product.id]) {
        throw new ConcurrencyError(product.id, product.name, expectedVersions[product.id], currentVer);
      }
    }

    const currentStock = product.stock;
    const currentBuyPrice = product.buyPrice;

    // WAC Costing Formula: (Current Total Cost + New Total Cost) / Total New Qty
    let newBuyPrice = item.buyPrice;
    if (currentStock + item.quantity > 0) {
      newBuyPrice = ((currentStock * currentBuyPrice) + (item.quantity * item.buyPrice)) / (currentStock + item.quantity);
      // Round to 2 decimal places
      newBuyPrice = Math.round(newBuyPrice * 100) / 100;
    }

    // Apply updates
    product.buyPrice = newBuyPrice;
    product.stock += item.quantity;
    if (product.stockLocations) {
      product.stockLocations.main += item.quantity; // Direct to main warehouse
    }
    product.version = (product.version || 1) + 1;
    product.lastUpdated = dateStr;

    // Inventory movement log
    const movementId = 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    updatedInventoryMovements.push({
      id: movementId,
      operationId: `op-pur-${purchaseId}`,
      productId: product.id,
      productName: product.name,
      type: 'purchase',
      quantity: item.quantity,
      date: dateStr,
      referenceId: purchaseId
    });

    return {
      ...item,
      buyPrice: item.buyPrice
    };
  });

  const newPurchase: PurchaseInvoice = {
    ...purchase,
    id: purchaseId,
    purchaseNumber: purchaseNum,
    date: dateStr,
    items: finalizedItems,
    operationId: `op-pur-${purchaseId}`
  };

  updatedPurchases.push(newPurchase);

  // 2. Log Journal Entries
  const purchaseOpId = newPurchase.operationId;
  if (purchase.status === 'paid') {
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-1',
      date: dateStr,
      type: 'purchase',
      description: `شراء نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchaseNum}`,
      debit: purchase.total,
      credit: 0,
      account: 'inventory',
      referenceId: purchaseId,
      operationId: `${purchaseOpId}-je-inventory-debit`
    });
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-2',
      date: dateStr,
      type: 'purchase',
      description: `شراء نقدي - مورد: ${purchase.supplierName} - فاتورة ${purchaseNum}`,
      debit: 0,
      credit: purchase.total,
      account: 'cash',
      referenceId: purchaseId,
      operationId: `${purchaseOpId}-je-cash-credit`
    });
  } else {
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-1',
      date: dateStr,
      type: 'purchase',
      description: `شراء آجل - مورد: ${purchase.supplierName} - فاتورة ${purchaseNum}`,
      debit: purchase.total,
      credit: 0,
      account: 'inventory',
      referenceId: purchaseId,
      operationId: `${purchaseOpId}-je-inventory-debit`
    });
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-2',
      date: dateStr,
      type: 'purchase',
      description: `شراء آجل - مورد: ${purchase.supplierName} - فاتورة ${purchaseNum}`,
      debit: 0,
      credit: purchase.total,
      account: 'payables',
      referenceId: purchaseId,
      operationId: `${purchaseOpId}-je-payables-credit`
    });
  }

  // 3. Shift adjustments
  if (activeShift && purchase.status === 'paid') {
    const shiftIdx = updatedShifts.findIndex(s => s.id === activeShift.id);
    if (shiftIdx !== -1) {
      updatedShifts[shiftIdx].totalExpenses += purchase.total;
      updatedShifts[shiftIdx].expectedCash -= purchase.total;
    }
  }

  // 4. Supplier Ledger Adjustments
  const supplierIdx = updatedSuppliers.findIndex(s => s.id === purchase.supplierId);
  if (supplierIdx !== -1) {
    const s = updatedSuppliers[supplierIdx];
    if (purchase.status === 'pending') {
      const newBalance = s.balance + purchase.total;
      const transOpId = `op-st-${purchaseId}-purchase`;
      
      updatedSupplierTransactions.push({
        id: 'st-' + Date.now(),
        supplierId: s.id,
        type: 'purchase',
        amount: purchase.total,
        date: dateStr,
        referenceId: purchaseId,
        description: `شراء فاتورة رقم ${purchaseNum}`,
        balanceAfter: newBalance,
        operationId: transOpId
      });
      s.balance = newBalance;
    } else {
      const transOpId = `op-st-${purchaseId}-purchase-cash`;
      updatedSupplierTransactions.push({
        id: 'st-' + Date.now(),
        supplierId: s.id,
        type: 'purchase',
        amount: purchase.total,
        date: dateStr,
        referenceId: purchaseId,
        description: `شراء نقدي فاتورة رقم ${purchaseNum}`,
        balanceAfter: s.balance,
        operationId: transOpId
      });
    }
  }

  return {
    updatedProducts,
    updatedPurchases,
    updatedJournalEntries,
    updatedShifts,
    updatedSuppliers,
    updatedSupplierTransactions,
    updatedInventoryMovements,
    newPurchase
  };
}

/**
 * 🧾 Function: postSaleReturn()
 * Registers a full or partial sales return. Restocks the inventory, reverses the income
 * and cost entries in GAAP style, and returns credit or cash outflow.
 */
export function postSaleReturn(
  invoiceId: string,
  returnedItemIds: string[], // empty array means full return
  products: Product[],
  invoices: Invoice[],
  journalEntries: JournalEntry[],
  shifts: Shift[],
  customers: Customer[],
  customerTransactions: CustomerTransaction[],
  inventoryMovements: InventoryMovement[],
  activeShift: Shift | null,
  byUser: string
): {
  updatedProducts: ProductWithVersion[];
  updatedInvoices: Invoice[];
  updatedJournalEntries: JournalEntry[];
  updatedShifts: Shift[];
  updatedCustomers: Customer[];
  updatedCustomerTransactions: CustomerTransaction[];
  updatedInventoryMovements: InventoryMovement[];
} {
  const updatedProducts = ensureVersionAndLocations(clone(products));
  const updatedInvoices = clone(invoices);
  const updatedJournalEntries = clone(journalEntries);
  const updatedShifts = clone(shifts);
  const updatedCustomers = clone(customers);
  const updatedCustomerTransactions = clone(customerTransactions);
  const updatedInventoryMovements = clone(inventoryMovements);

  const invoice = updatedInvoices.find(inv => inv.id === invoiceId);
  if (!invoice) throw new Error('الفاتورة غير موجودة.');
  if (invoice.status === 'voided') throw new Error('هذه الفاتورة مرتجعة بالفعل.');

  const dateStr = new Date().toISOString();
  const returnOpId = `op-ret-sale-${invoice.id}-${Date.now()}`;

  // Calculate return amount and cost
  let returnAmount = 0;
  let returnCost = 0;

  invoice.status = 'voided'; // Set to voided (returned)

  invoice.items.forEach(item => {
    const isReturned = returnedItemIds.length === 0 || returnedItemIds.includes(item.productId);
    if (isReturned) {
      returnAmount += item.total;
      returnCost += item.buyPrice * item.quantity;

      // Restock Product
      const product = updatedProducts.find(p => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
        if (product.stockLocations) {
          product.stockLocations.storefront += item.quantity; // Put back to storefront shelf
        }
        product.version = (product.version || 1) + 1;
        product.lastUpdated = dateStr;

        // Log restocking movement
        updatedInventoryMovements.push({
          id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          operationId: returnOpId,
          productId: product.id,
          productName: product.name,
          type: 'return',
          quantity: item.quantity,
          date: dateStr,
          referenceId: invoice.id
        });
      }
    }
  });

  // Reverse GAAP Accounting Entries
  // Debit Sales Returns (or Sales Account) / Credit Cash, Bank, or Receivables
  const targetCreditAccount = invoice.paymentMethod === 'cash' ? 'cash' : (invoice.paymentMethod === 'card' ? 'bank' : 'receivables');
  updatedJournalEntries.push({
    id: 'je-' + Date.now() + '-ret-1',
    date: dateStr,
    type: 'return',
    description: `مرتجع مبيعات - فاتورة رقم ${invoice.invoiceNumber}`,
    debit: returnAmount,
    credit: 0,
    account: 'sales', // reversing revenue
    referenceId: invoice.id,
    operationId: `${returnOpId}-debit`
  });
  updatedJournalEntries.push({
    id: 'je-' + Date.now() + '-ret-2',
    date: dateStr,
    type: 'return',
    description: `مرتجع مبيعات - فاتورة رقم ${invoice.invoiceNumber}`,
    debit: 0,
    credit: returnAmount,
    account: targetCreditAccount,
    referenceId: invoice.id,
    operationId: `${returnOpId}-credit`
  });

  // Reverse COGS Entry: Debit Inventory Asset / Credit COGS Expenses
  if (returnCost > 0) {
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-ret-3',
      date: dateStr,
      type: 'return',
      description: `تسوية تكلفة مرتجع مبيعات - فاتورة ${invoice.invoiceNumber}`,
      debit: returnCost,
      credit: 0,
      account: 'inventory',
      referenceId: invoice.id,
      operationId: `${returnOpId}-cogs-reverse-debit`
    });
    updatedJournalEntries.push({
      id: 'je-' + Date.now() + '-ret-4',
      date: dateStr,
      type: 'return',
      description: `تسوية تكلفة مرتجع مبيعات - فاتورة ${invoice.invoiceNumber}`,
      debit: 0,
      credit: returnCost,
      account: 'expenses', // COGS account is under expenses
      referenceId: invoice.id,
      operationId: `${returnOpId}-cogs-reverse-credit`
    });
  }

  // Update Customer balance if credit sale
  if (invoice.paymentMethod === 'credit' && invoice.customerName) {
    const customerIdx = updatedCustomers.findIndex(c => c.name === invoice.customerName);
    if (customerIdx !== -1) {
      const c = updatedCustomers[customerIdx];
      const newDebt = Math.max(0, c.currentDebt - returnAmount);
      
      updatedCustomerTransactions.push({
        id: 'ct-' + Date.now(),
        customerId: c.id,
        type: 'return',
        amount: returnAmount,
        date: dateStr,
        referenceId: invoice.id,
        description: `مرتجع مبيعات آجلة فاتورة ${invoice.invoiceNumber}`,
        balanceAfter: newDebt,
        operationId: `${returnOpId}-cust`
      });
      c.currentDebt = newDebt;
    }
  }

  // Shift updates
  if (activeShift) {
    const shiftIdx = updatedShifts.findIndex(s => s.id === activeShift.id);
    if (shiftIdx !== -1) {
      updatedShifts[shiftIdx].totalReturns += returnAmount;
      if (invoice.paymentMethod === 'cash') {
        updatedShifts[shiftIdx].expectedCash = Math.max(0, updatedShifts[shiftIdx].expectedCash - returnAmount);
      }
    }
  }

  return {
    updatedProducts,
    updatedInvoices,
    updatedJournalEntries,
    updatedShifts,
    updatedCustomers,
    updatedCustomerTransactions,
    updatedInventoryMovements
  };
}

/**
 * 🧾 Function: postPurchaseReturn()
 * Registers a purchase return to a supplier, reduces inventory stock, reverses WAC pricing impacts,
 * and updates supplier receivables or credit notes.
 */
export function postPurchaseReturn(
  purchaseId: string,
  returnedItemIds: string[],
  products: Product[],
  purchases: PurchaseInvoice[],
  journalEntries: JournalEntry[],
  shifts: Shift[],
  suppliers: Supplier[],
  supplierTransactions: SupplierTransaction[],
  inventoryMovements: InventoryMovement[],
  activeShift: Shift | null,
  byUser: string
): {
  updatedProducts: ProductWithVersion[];
  updatedPurchases: PurchaseInvoice[];
  updatedJournalEntries: JournalEntry[];
  updatedShifts: Shift[];
  updatedSuppliers: Supplier[];
  updatedSupplierTransactions: SupplierTransaction[];
  updatedInventoryMovements: InventoryMovement[];
} {
  const updatedProducts = ensureVersionAndLocations(clone(products));
  const updatedPurchases = clone(purchases);
  const updatedJournalEntries = clone(journalEntries);
  const updatedShifts = clone(shifts);
  const updatedSuppliers = clone(suppliers);
  const updatedSupplierTransactions = clone(supplierTransactions);
  const updatedInventoryMovements = clone(inventoryMovements);

  const purchase = updatedPurchases.find(p => p.id === purchaseId);
  if (!purchase) throw new Error('فاتورة الشراء غير موجودة.');
  if (purchase.status === 'voided') throw new Error('هذه الفاتورة مرتجعة بالفعل.');

  const dateStr = new Date().toISOString();
  const returnOpId = `op-ret-pur-${purchase.id}-${Date.now()}`;

  let returnAmount = 0;

  const originalStatus = purchase.status;
  purchase.status = 'voided';

  purchase.items.forEach(item => {
    const isReturned = returnedItemIds.length === 0 || returnedItemIds.includes(item.productId);
    if (isReturned) {
      returnAmount += item.total;

      // Deduct stock
      const product = updatedProducts.find(p => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        if (product.stockLocations) {
          product.stockLocations.main = Math.max(0, product.stockLocations.main - item.quantity);
        }
        product.version = (product.version || 1) + 1;
        product.lastUpdated = dateStr;

        // Log restocking movement
        updatedInventoryMovements.push({
          id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          operationId: returnOpId,
          productId: product.id,
          productName: product.name,
          type: 'return', // purchase return reduces inventory
          quantity: -item.quantity,
          date: dateStr,
          referenceId: purchase.id
        });
      }
    }
  });

  // GAAP Journal Entry reversal
  // Debit Cash or Payables / Credit Inventory Asset
  const targetDebitAccount = originalStatus === 'paid' ? 'cash' : 'payables';
  updatedJournalEntries.push({
    id: 'je-' + Date.now() + '-ret-1',
    date: dateStr,
    type: 'return',
    description: `مرتجع مشتريات - فاتورة رقم ${purchase.purchaseNumber}`,
    debit: returnAmount,
    credit: 0,
    account: targetDebitAccount,
    referenceId: purchase.id,
    operationId: `${returnOpId}-debit`
  });
  updatedJournalEntries.push({
    id: 'je-' + Date.now() + '-ret-2',
    date: dateStr,
    type: 'return',
    description: `مرتجع مشتريات - فاتورة رقم ${purchase.purchaseNumber}`,
    debit: 0,
    credit: returnAmount,
    account: 'inventory',
    referenceId: purchase.id,
    operationId: `${returnOpId}-credit`
  });

  // Supplier transaction updates
  const supplierIdx = updatedSuppliers.findIndex(s => s.id === purchase.supplierId);
  if (supplierIdx !== -1) {
    const s = updatedSuppliers[supplierIdx];
    if (originalStatus === 'pending') {
      const newBalance = Math.max(0, s.balance - returnAmount);
      updatedSupplierTransactions.push({
        id: 'st-' + Date.now(),
        supplierId: s.id,
        type: 'return',
        amount: returnAmount,
        date: dateStr,
        referenceId: purchase.id,
        description: `إرجاع مشتريات فاتورة رقم ${purchase.purchaseNumber}`,
        balanceAfter: newBalance,
        operationId: `${returnOpId}-supp`
      });
      s.balance = newBalance;
    } else {
      updatedSupplierTransactions.push({
        id: 'st-' + Date.now(),
        supplierId: s.id,
        type: 'return',
        amount: returnAmount,
        date: dateStr,
        referenceId: purchase.id,
        description: `إرجاع مشتريات نقدي فاتورة رقم ${purchase.purchaseNumber}`,
        balanceAfter: s.balance,
        operationId: `${returnOpId}-supp-cash`
      });
    }
  }

  return {
    updatedProducts,
    updatedPurchases,
    updatedJournalEntries,
    updatedShifts,
    updatedSuppliers,
    updatedSupplierTransactions,
    updatedInventoryMovements
  };
}

/**
 * 🧾 Function: postPayment()
 * Handles debt payments (collection from customer or payment to suppliers), balancing
 * bank/cash general accounts.
 */
export function postPayment(
  type: 'collection' | 'payment',
  partyId: string, // customerId or supplierId
  amount: number,
  method: 'cash' | 'bank',
  customers: Customer[],
  customerTransactions: CustomerTransaction[],
  suppliers: Supplier[],
  supplierTransactions: SupplierTransaction[],
  journalEntries: JournalEntry[],
  shifts: Shift[],
  activeShift: Shift | null,
  byUser: string
): {
  updatedCustomers: Customer[];
  updatedCustomerTransactions: CustomerTransaction[];
  updatedSuppliers: Supplier[];
  updatedSupplierTransactions: SupplierTransaction[];
  updatedJournalEntries: JournalEntry[];
  updatedShifts: Shift[];
} {
  const updatedCustomers = clone(customers);
  const updatedCustomerTransactions = clone(customerTransactions);
  const updatedSuppliers = clone(suppliers);
  const updatedSupplierTransactions = clone(supplierTransactions);
  const updatedJournalEntries = clone(journalEntries);
  const updatedShifts = clone(shifts);

  const paymentId = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const dateStr = new Date().toISOString();
  const transOpId = `op-pay-${paymentId}`;

  if (type === 'collection') {
    // Collecting cash from customer
    const cIdx = updatedCustomers.findIndex(c => c.id === partyId);
    if (cIdx !== -1) {
      const c = updatedCustomers[cIdx];
      const newDebt = Math.max(0, c.currentDebt - amount);
      
      updatedCustomerTransactions.push({
        id: 'ct-' + Date.now(),
        customerId: c.id,
        type: 'collection',
        amount: amount,
        date: dateStr,
        referenceId: paymentId,
        description: `تحصيل نقدي من العميل - بواسطة ${byUser}`,
        balanceAfter: newDebt,
        operationId: transOpId
      });
      c.currentDebt = newDebt;

      // Dr. Cash or Bank / Cr. Receivables (Customer Debt)
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-1',
        date: dateStr,
        type: 'collection',
        description: `تحصيل من العميل: ${c.name}`,
        debit: amount,
        credit: 0,
        account: method === 'cash' ? 'cash' : 'bank',
        referenceId: paymentId,
        operationId: `${transOpId}-je-debit`
      });
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-2',
        date: dateStr,
        type: 'collection',
        description: `تحصيل من العميل: ${c.name}`,
        debit: 0,
        credit: amount,
        account: 'receivables',
        referenceId: paymentId,
        operationId: `${transOpId}-je-credit`
      });

      // Shift Impact: cash inflow
      if (activeShift && method === 'cash') {
        const sIdx = updatedShifts.findIndex(s => s.id === activeShift.id);
        if (sIdx !== -1) {
          updatedShifts[sIdx].expectedCash += amount;
          updatedShifts[sIdx].totalSales += amount; // Treating as active inflow
        }
      }
    }
  } else {
    // Paying supplier debt
    const sIdx = updatedSuppliers.findIndex(s => s.id === partyId);
    if (sIdx !== -1) {
      const s = updatedSuppliers[sIdx];
      const newBalance = Math.max(0, s.balance - amount);

      updatedSupplierTransactions.push({
        id: 'st-' + Date.now(),
        supplierId: s.id,
        type: 'payment',
        amount: amount,
        date: dateStr,
        referenceId: paymentId,
        description: `دفعة مسددة للمورد - بواسطة ${byUser}`,
        balanceAfter: newBalance,
        operationId: transOpId
      });
      s.balance = newBalance;

      // Dr. Payables (Supplier Debt) / Cr. Cash or Bank
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-1',
        date: dateStr,
        type: 'payment',
        description: `سداد دفعة للمورد: ${s.name}`,
        debit: amount,
        credit: 0,
        account: 'payables',
        referenceId: paymentId,
        operationId: `${transOpId}-je-debit`
      });
      updatedJournalEntries.push({
        id: 'je-' + Date.now() + '-2',
        date: dateStr,
        type: 'payment',
        description: `سداد دفعة للمورد: ${s.name}`,
        debit: 0,
        credit: amount,
        account: method === 'cash' ? 'cash' : 'bank',
        referenceId: paymentId,
        operationId: `${transOpId}-je-credit`
      });

      // Shift Impact: cash outflow
      if (activeShift && method === 'cash') {
        const sIdx = updatedShifts.findIndex(s => s.id === activeShift.id);
        if (sIdx !== -1) {
          updatedShifts[sIdx].expectedCash -= amount;
          updatedShifts[sIdx].totalExpenses += amount;
        }
      }
    }
  }

  return {
    updatedCustomers,
    updatedCustomerTransactions,
    updatedSuppliers,
    updatedSupplierTransactions,
    updatedJournalEntries,
    updatedShifts
  };
}

/**
 * 🧾 Function: closeShift()
 * Formally closes the cash drawer shift, recording variances.
 */
export function closeShift(
  shiftId: string,
  actualCash: number,
  shifts: Shift[]
): Shift[] {
  const updatedShifts = clone(shifts);
  const shiftIdx = updatedShifts.findIndex(s => s.id === shiftId);
  if (shiftIdx === -1) throw new Error('الوردية غير موجودة.');

  const shift = updatedShifts[shiftIdx];
  if (shift.status === 'closed') return updatedShifts;

  const difference = actualCash - shift.expectedCash;

  updatedShifts[shiftIdx] = {
    ...shift,
    status: 'closed',
    endTime: new Date().toISOString(),
    actualCash,
    difference
  };

  return updatedShifts;
}

/**
 * 🧾 Function: postExpense()
 * Records a generic commercial expense (rent, utilities, salaries) in double-entry.
 */
export function postExpense(
  expenseData: Omit<Expense, 'id' | 'date'>,
  expenses: Expense[],
  journalEntries: JournalEntry[],
  shifts: Shift[],
  activeShift: Shift | null,
  byUser: string
): {
  updatedExpenses: Expense[];
  updatedJournalEntries: JournalEntry[];
  updatedShifts: Shift[];
  newExpense: Expense;
} {
  const updatedExpenses = clone(expenses);
  const updatedJournalEntries = clone(journalEntries);
  const updatedShifts = clone(shifts);

  const expenseId = 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const dateStr = new Date().toISOString();
  const opId = `op-exp-${expenseId}`;

  const newExpense: Expense = {
    ...expenseData,
    id: expenseId,
    date: dateStr,
    status: 'active',
    operationId: opId
  };

  updatedExpenses.push(newExpense);

  // GAAP Journal Entries
  // Dr. Expenses (under current expense category) / Cr. Cash (or Bank if specified)
  updatedJournalEntries.push({
    id: 'je-' + Date.now() + '-1',
    date: dateStr,
    type: 'expense',
    description: `صرف مصروف: ${expenseData.title} (${expenseData.category}) - بواسطة ${byUser}`,
    debit: expenseData.amount,
    credit: 0,
    account: 'expenses',
    referenceId: expenseId,
    operationId: `${opId}-je-expenses-debit`
  });
  updatedJournalEntries.push({
    id: 'je-' + Date.now() + '-2',
    date: dateStr,
    type: 'expense',
    description: `صرف مصروف: ${expenseData.title} (${expenseData.category}) - بواسطة ${byUser}`,
    debit: 0,
    credit: expenseData.amount,
    account: 'cash',
    referenceId: expenseId,
    operationId: `${opId}-je-cash-credit`
  });

  // Shift outflow
  if (activeShift) {
    const shiftIdx = updatedShifts.findIndex(s => s.id === activeShift.id);
    if (shiftIdx !== -1) {
      updatedShifts[shiftIdx].totalExpenses += expenseData.amount;
      updatedShifts[shiftIdx].expectedCash -= expenseData.amount;
    }
  }

  return {
    updatedExpenses,
    updatedJournalEntries,
    updatedShifts,
    newExpense
  };
}

/**
 * Legacy InventoryModule container for backward compatibility with orchestrators.
 */
export const InventoryModule = {
  isLowStock(product: Product): boolean {
    return product.stock <= product.minStock;
  },

  createMovement(
    operationId: string,
    productId: string,
    productName: string,
    type: InventoryMovement['type'],
    quantity: number,
    referenceId: string
  ): InventoryMovement {
    return {
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      operationId,
      productId,
      productName,
      type,
      quantity,
      date: new Date().toISOString(),
      referenceId
    };
  },

  createAuditSession(
    title: string,
    categoryFilter: string,
    auditorName: string,
    notes?: string
  ): StockAuditSession {
    return {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      auditNumber: 'AUD-' + Date.now().toString().slice(-6),
      title,
      categoryFilter,
      auditorName,
      createdAt: new Date().toISOString(),
      status: 'in_progress',
      items: [],
      totalSystemItems: 0,
      totalAuditedItems: 0,
      totalMatchedItems: 0,
      totalShortageItems: 0,
      totalSurplusItems: 0,
      totalShortageCost: 0,
      totalSurplusCost: 0,
      netCostImpact: 0,
      accuracyRate: 100,
      notes
    };
  }
};
