import { Shift } from '../../types';

/**
 * Core POS Module - Handles cashier shift logic and register checkout computations.
 */
export const POSModule = {
  /**
   * Calculates the final breakdown of an invoice (subtotal, tax, discount, total).
   */
  calculateInvoiceTotals(
    items: { price: number; quantity: number }[],
    discountValue: number = 0,
    discountType: 'percentage' | 'fixed' = 'percentage',
    taxRatePercentage: number = 15 // Default VAT 15%
  ) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discount = 0;
    if (discountType === 'percentage') {
      discount = (subtotal * discountValue) / 100;
    } else {
      discount = discountValue;
    }
    
    const afterDiscount = Math.max(0, subtotal - discount);
    const tax = (afterDiscount * taxRatePercentage) / 100;
    const total = afterDiscount + tax;

    return {
      subtotal,
      discount,
      tax,
      total: Math.round(total * 100) / 100
    };
  },

  /**
   * Helper to open a new cashier shift.
   */
  openShift(
    cashierId: string,
    cashierName: string,
    openingBalance: number
  ): Shift {
    return {
      id: 'shift-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      cashierId,
      cashierName,
      startTime: new Date().toISOString(),
      status: 'open',
      openingBalance,
      expectedCash: openingBalance,
      totalSales: 0,
      totalReturns: 0,
      totalExpenses: 0,
      totalWithdrawals: 0
    };
  },

  /**
   * Helper to close an active cashier shift and compute actual vs expected cash.
   */
  closeShift(
    shift: Shift,
    actualCash: number
  ): Shift {
    const expectedCash = shift.openingBalance + shift.totalSales - shift.totalReturns - shift.totalExpenses - shift.totalWithdrawals;
    const difference = actualCash - expectedCash;

    return {
      ...shift,
      endTime: new Date().toISOString(),
      status: 'closed',
      actualCash,
      expectedCash,
      difference
    };
  }
};
