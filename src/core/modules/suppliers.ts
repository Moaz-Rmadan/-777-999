import { Supplier } from '../../types';

/**
 * Core Suppliers Module - Manages partner vendor accounts and payable credit balances.
 */
export const SuppliersModule = {
  /**
   * Spawns a new supplier profile.
   */
  createSupplier(
    name: string,
    phone: string,
    company: string,
    balance: number = 0
  ): Supplier {
    return {
      id: 'sup-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name,
      phone,
      company,
      balance
    };
  }
};
