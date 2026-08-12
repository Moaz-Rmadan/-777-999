import { Invoice, InvoiceItem } from '../../types';

/**
 * Core Sales Module - Manages invoices, VAT, and customer refunds.
 */
export const SalesModule = {
  /**
   * Prepares a structured invoice object for the POS flow.
   */
  createInvoice(
    cashierName: string,
    items: InvoiceItem[],
    subtotal: number,
    discount: number,
    tax: number,
    total: number,
    paymentMethod: Invoice['paymentMethod'],
    customerName?: string,
    paidAmount?: number,
    changeAmount?: number,
    operationId?: string
  ): Invoice {
    return {
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      invoiceNumber: 'INV-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      customerName,
      cashierName,
      paidAmount: paidAmount ?? total,
      changeAmount: changeAmount ?? 0,
      status: 'active',
      operationId
    };
  }
};
