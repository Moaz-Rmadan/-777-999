import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseSDK';
import { AuditLogEntry, JournalEntry, CustomerTransaction, SupplierTransaction, User } from '../../types';

/**
 * Core Application Services handling local/cloud data sync and transactional audit logging.
 */
export const ApplicationServices = {
  /**
   * Safe save helper to persist system collections to Firestore.
   */
  async saveToFirebase(key: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, 'system_data', key);
      // Sanitize data to remove any undefined values which Firestore rejects
      const sanitizedData = JSON.parse(JSON.stringify(data));
      await setDoc(docRef, { data: sanitizedData });
    } catch (error) {
      console.error(`Firebase write error in ApplicationServices for ${key}:`, error);
    }
  },

  /**
   * Safe load helper to retrieve system collections from Firestore.
   */
  async loadFromFirebase(key: string): Promise<any | null> {
    try {
      const docRef = doc(db, 'system_data', key);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data().data;
      }
    } catch (error) {
      console.error(`Firebase read error in ApplicationServices for ${key}:`, error);
    }
    return null;
  },

  /**
   * Core Audit Logger to log cashier and admin operations.
   */
  createAuditLog(
    currentUser: User | null,
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    before?: any,
    after?: any
  ): AuditLogEntry {
    return {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'النظام',
      userRole: currentUser?.role || 'cashier',
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      before,
      after,
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Core'
    };
  },

  /**
   * Accounting double-entry generator.
   */
  createJournalEntry(
    type: JournalEntry['type'],
    description: string,
    debit: number,
    credit: number,
    account: string,
    referenceId: string,
    operationId?: string
  ): JournalEntry {
    return {
      id: 'je-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: new Date().toISOString(),
      type,
      description,
      debit,
      credit,
      account,
      referenceId,
      operationId: operationId || `op-je-${referenceId}-${account}-${debit > 0 ? 'debit' : 'credit'}`
    };
  },

  /**
   * Customer transaction (Debts / Credits) logger.
   */
  createCustomerTransaction(
    customerId: string,
    type: CustomerTransaction['type'],
    amount: number,
    referenceId: string,
    description: string,
    newBalance: number,
    operationId?: string
  ): CustomerTransaction {
    return {
      id: 'ct-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      customerId,
      type,
      amount,
      date: new Date().toISOString(),
      referenceId,
      description,
      balanceAfter: newBalance,
      operationId: operationId || `op-ct-${referenceId}-${type}`
    };
  },

  /**
   * Supplier transaction (Debts / Credits) logger.
   */
  createSupplierTransaction(
    supplierId: string,
    type: SupplierTransaction['type'],
    amount: number,
    referenceId: string,
    description: string,
    newBalance: number,
    operationId?: string
  ): SupplierTransaction {
    return {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      supplierId,
      type,
      amount,
      date: new Date().toISOString(),
      referenceId,
      description,
      balanceAfter: newBalance,
      operationId: operationId || `op-st-${referenceId}-${type}`
    };
  }
};
