import { 
  Invoice, 
  Product, 
  InventoryMovement, 
  JournalEntry, 
  AuditLogEntry, 
  Customer, 
  Supplier, 
  PurchaseInvoice, 
  User,
  Expense
} from '../../types';
import { ApplicationServices } from './applicationServices';
import { POSModule } from '../modules/pos';
import { InventoryModule } from '../modules/inventory';
import { SalesModule } from '../modules/sales';
import { PurchasesModule } from '../modules/purchases';
import { AccountingModule } from '../modules/accounting';

/**
 * Atomic Business Transaction Output Type representing the fully calculated and bound transaction tree.
 */
export interface AtomicTransactionResult {
  operationId: string;
  documentId: string;
  invoice?: Invoice;
  purchase?: PurchaseInvoice;
  inventoryMovements: InventoryMovement[];
  journalEntries: JournalEntry[];
  auditLog: AuditLogEntry;
  updatedProducts: Product[];
  updatedCustomer?: Customer;
  updatedSupplier?: Supplier;
}

/**
 * Core Transaction Orchestrator (سلسلة المعالجة المترابطة وغير القابلة للتجزئة)
 * 
 * Flow:
 * Document (POS Order / Supplier Bill)
 *   ↓
 * Business Transaction (Invoice, Cash/Card Payments, Customer Debt)
 *   ↓
 * Inventory Transaction (Stock level deduction/increase, movement logging)
 *   ↓
 * Accounting Transaction (Balanced Journal Entries: Cash/Card Debits, Revenue/Inventory Credits, COGS)
 *   ↓
 * Audit Event (Security and audit logging)
 */
export const TransactionOrchestrator = {
  /**
   * Processes a POS Sale (فواتير المبيعات ونقاط البيع) through the entire atomic flow.
   */
  processSaleTransaction(params: {
    cashierName: string,
    currentUser: User | null,
    items: { productId: string; quantity: number }[],
    discountValue: number,
    discountType: 'percentage' | 'fixed',
    paymentMethod: Invoice['paymentMethod'],
    customer?: Customer,
    products: Product[],
  }): AtomicTransactionResult {
    const operationId = 'op-sale-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    // ----------------------------------------------------
    // 1. DOCUMENT LEVEL
    // ----------------------------------------------------
    // Build actual items mapped to products to fetch prices
    const enrichedItems = params.items.map(item => {
      const prod = params.products.find(p => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product not found in system: ${item.productId}`);
      }
      return {
        productId: item.productId,
        productName: prod.name,
        quantity: item.quantity,
        sellPrice: prod.sellPrice,
        buyPrice: prod.buyPrice,
        total: prod.sellPrice * item.quantity
      };
    });

    // 2. BUSINESS TRANSACTION (Invoice creation + payment parameters)
    const totals = POSModule.calculateInvoiceTotals(
      enrichedItems.map(i => ({ price: i.sellPrice, quantity: i.quantity })),
      params.discountValue,
      params.discountType
    );

    const invoice = SalesModule.createInvoice(
      params.cashierName,
      enrichedItems,
      totals.subtotal,
      totals.discount,
      totals.tax,
      totals.total,
      params.paymentMethod,
      params.customer?.name,
      totals.total, // Paid amount defaults to total
      0, // Change amount defaults to 0
      operationId
    );

    // If Credit sales, update customer balance
    let updatedCustomer: Customer | undefined;
    if (params.paymentMethod === 'credit' && params.customer) {
      updatedCustomer = {
        ...params.customer,
        currentDebt: params.customer.currentDebt + totals.total
      };
    }

    // 3. INVENTORY TRANSACTION (Reduce stock and log movements)
    const inventoryMovements: InventoryMovement[] = [];
    const updatedProducts: Product[] = params.products.map(prod => {
      const saleItem = params.items.find(item => item.productId === prod.id);
      if (saleItem) {
        // Build inventory movement log
        inventoryMovements.push(
          InventoryModule.createMovement(
            operationId,
            prod.id,
            prod.name,
            'sale',
            saleItem.quantity,
            invoice.invoiceNumber
          )
        );
        return {
          ...prod,
          stock: Math.max(0, prod.stock - saleItem.quantity)
        };
      }
      return prod;
    });

    // 4. ACCOUNTING TRANSACTION (General Ledger Balanced Double-Entries)
    const journalEntries: JournalEntry[] = [];

    // Payment Entry: Debit Cash/Bank/Receivables, Credit Sales Revenue
    const paymentAccount = params.paymentMethod === 'cash' 
      ? 'الصندوق الرئيسي (Cash)' 
      : params.paymentMethod === 'card' 
        ? 'البنك (Bank)' 
        : `حسابات مدينين - ${params.customer?.name || 'عملاء آجليون'}`;

    const saleJournalPair = AccountingModule.createDoubleEntry(
      `إثبات مبيعات الفاتورة رقم ${invoice.invoiceNumber}`,
      paymentAccount,
      'إيرادات المبيعات (Sales Revenue)',
      totals.total,
      invoice.invoiceNumber,
      'sale'
    );
    journalEntries.push(saleJournalPair.debitEntry, saleJournalPair.creditEntry);

    // COGS Entry: Debit Cost of Goods Sold, Credit Inventory Asset
    const cogsAmount = enrichedItems.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
    if (cogsAmount > 0) {
      const cogsJournalPair = AccountingModule.createDoubleEntry(
        `إثبات تكلفة البضاعة المباعة للفاتورة ${invoice.invoiceNumber}`,
        'تكلفة البضاعة المباعة (COGS)',
        'المخزون السلعي (Inventory)',
        cogsAmount,
        invoice.invoiceNumber,
        'sale'
      );
      journalEntries.push(cogsJournalPair.debitEntry, cogsJournalPair.creditEntry);
    }

    // 5. AUDIT EVENT (Log transaction security log)
    const auditLog = ApplicationServices.createAuditLog(
      params.currentUser,
      `إنشاء ومعالجة الفاتورة ${invoice.invoiceNumber} بقيمة ${totals.total} ر.س دفع (${params.paymentMethod})`,
      'invoice',
      invoice.id,
      null,
      { invoiceNumber: invoice.invoiceNumber, total: totals.total, itemsCount: enrichedItems.length }
    );

    return {
      operationId,
      documentId: invoice.id,
      invoice,
      inventoryMovements,
      journalEntries,
      auditLog,
      updatedProducts,
      updatedCustomer
    };
  },

  /**
   * Processes a Purchase Bill (فواتير المشتريات والتوريد) through the entire atomic flow.
   */
  processPurchaseTransaction(params: {
    supplier: Supplier,
    currentUser: User | null,
    items: { productId: string; quantity: number; buyPrice: number }[],
    paymentMethod: 'cash' | 'card' | 'credit',
    products: Product[],
  }): AtomicTransactionResult {
    const operationId = 'op-purchase-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    // 1. DOCUMENT LEVEL
    const purchaseItems = params.items.map(item => {
      const prod = params.products.find(p => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product not found in system: ${item.productId}`);
      }
      return {
        productId: item.productId,
        productName: prod.name,
        quantity: item.quantity,
        buyPrice: item.buyPrice,
        total: item.buyPrice * item.quantity
      };
    });

    const totalCost = purchaseItems.reduce((sum, item) => sum + item.total, 0);

    // 2. BUSINESS TRANSACTION (Purchase Invoice creation + vendor balances)
    const purchaseInvoice = PurchasesModule.createPurchaseInvoice(
      params.supplier.id,
      params.supplier.name,
      purchaseItems,
      totalCost,
      params.paymentMethod === 'credit' ? 'pending' : 'paid',
      operationId
    );

    // Update supplier credit balance if unpaid
    let updatedSupplier: Supplier | undefined;
    if (params.paymentMethod === 'credit') {
      updatedSupplier = {
        ...params.supplier,
        balance: params.supplier.balance + totalCost
      };
    }

    // 3. INVENTORY TRANSACTION (Increase stock and movement logging)
    const inventoryMovements: InventoryMovement[] = [];
    const updatedProducts: Product[] = params.products.map(prod => {
      const purchaseItem = params.items.find(item => item.productId === prod.id);
      if (purchaseItem) {
        inventoryMovements.push(
          InventoryModule.createMovement(
            operationId,
            prod.id,
            prod.name,
            'purchase',
            purchaseItem.quantity,
            purchaseInvoice.purchaseNumber
          )
        );
        return {
          ...prod,
          stock: prod.stock + purchaseItem.quantity,
          buyPrice: purchaseItem.buyPrice // Update with the latest cost price
        };
      }
      return prod;
    });

    // 4. ACCOUNTING TRANSACTION (General Ledger Balanced Double-Entries)
    const journalEntries: JournalEntry[] = [];

    // Procurement Entry: Debit Inventory Asset, Credit Cash/Bank/Payables
    const creditAccount = params.paymentMethod === 'cash'
      ? 'الصندوق الرئيسي (Cash)'
      : params.paymentMethod === 'card'
        ? 'البنك (Bank)'
        : `ذمم دائنة للموردين - ${params.supplier.name}`;

    const purchaseJournalPair = AccountingModule.createDoubleEntry(
      `إثبات شراء وتوريد فاتورة رقم ${purchaseInvoice.purchaseNumber}`,
      'المخزون السلعي (Inventory)',
      creditAccount,
      totalCost,
      purchaseInvoice.purchaseNumber,
      'purchase'
    );
    journalEntries.push(purchaseJournalPair.debitEntry, purchaseJournalPair.creditEntry);

    // 5. AUDIT EVENT
    const auditLog = ApplicationServices.createAuditLog(
      params.currentUser,
      `توريد مشتريات بالفاتورة ${purchaseInvoice.purchaseNumber} من المورد ${params.supplier.name} بقيمة ${totalCost} ر.س`,
      'inventory',
      purchaseInvoice.id,
      null,
      { purchaseNumber: purchaseInvoice.purchaseNumber, total: totalCost, supplierName: params.supplier.name }
    );

    return {
      operationId,
      documentId: purchaseInvoice.id,
      purchase: purchaseInvoice,
      inventoryMovements,
      journalEntries,
      auditLog,
      updatedProducts,
      updatedSupplier
    };
  }
};
