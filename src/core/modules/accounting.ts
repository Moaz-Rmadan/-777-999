import { JournalEntry, Expense } from '../../types';

/**
 * Core Accounting Module - Handles dual-entry auditing and corporate expenditure ledgers.
 */
export const AccountingModule = {
  /**
   * Generates a balanced double entry pair.
   */
  createDoubleEntry(
    description: string,
    debitAccount: string,
    creditAccount: string,
    amount: number,
    referenceId: string,
    type: JournalEntry['type'] = 'opening'
  ): { debitEntry: JournalEntry; creditEntry: JournalEntry } {
    const timestamp = new Date().toISOString();
    const batchId = 'je-batch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);

    const debitEntry: JournalEntry = {
      id: 'je-db-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: timestamp,
      type,
      description,
      debit: amount,
      credit: 0,
      account: debitAccount,
      referenceId,
      operationId: `${batchId}-debit`
    };

    const creditEntry: JournalEntry = {
      id: 'je-cr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: timestamp,
      type,
      description,
      debit: 0,
      credit: amount,
      account: creditAccount,
      referenceId,
      operationId: `${batchId}-credit`
    };

    return { debitEntry, creditEntry };
  },

  /**
   * Spawns an expenditure record.
   */
  createExpense(
    title: string,
    category: Expense['category'],
    amount: number,
    notes?: string
  ): Expense {
    return {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title,
      category,
      amount,
      date: new Date().toISOString(),
      notes,
      status: 'active'
    };
  }
};
