import { Customer } from '../../types';

/**
 * Core Customers Module - Handles customer profiles and store credit/debt balances.
 */
export const CustomersModule = {
  /**
   * Spawns a new customer profile.
   */
  createCustomer(
    name: string,
    phone: string,
    creditLimit: number = 5000,
    currentDebt: number = 0
  ): Customer {
    return {
      id: 'cust-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name,
      phone,
      creditLimit,
      currentDebt
    };
  }
};
