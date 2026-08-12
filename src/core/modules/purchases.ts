import { PurchaseInvoice, PurchaseItem } from '../../types';

/**
 * Core Purchases Module - Handles supplier purchase records and procurement accounting.
 */
export const PurchasesModule = {
  /**
   * Prepares a structured purchase invoice document.
   */
  createPurchaseInvoice(
    supplierId: string,
    supplierName: string,
    items: PurchaseItem[],
    total: number,
    status: PurchaseInvoice['status'] = 'paid',
    operationId?: string
  ): PurchaseInvoice {
    return {
      id: 'pur-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      purchaseNumber: 'PUR-' + Date.now().toString().slice(-6),
      supplierId,
      supplierName,
      date: new Date().toISOString(),
      items,
      total,
      status,
      operationId
    };
  }
};
