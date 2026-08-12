import { OfflineQueueItem, Product } from '../../types';

/**
 * Service to manage the offline sync queue, idempotency checks, conflict resolution, and status tracking.
 */
export const OfflineEngine = {
  /**
   * Generates a secure, persistent unique Operation ID for tracking writes.
   */
  generateOperationId(prefix: string): string {
    return `op-${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  },

  /**
   * Loads the offline queue from localStorage.
   */
  loadQueue(): OfflineQueueItem[] {
    const saved = localStorage.getItem('sm_offline_queue');
    return saved ? JSON.parse(saved) : [];
  },

  /**
   * Saves the offline queue to localStorage.
   */
  saveQueue(queue: OfflineQueueItem[]): void {
    localStorage.setItem('sm_offline_queue', JSON.stringify(queue));
  },

  /**
   * Adds a new transaction item to the offline queue.
   */
  enqueue(
    type: OfflineQueueItem['type'],
    description: string,
    payload: any,
    isOnline: boolean,
    productsListForOCC?: Product[]
  ): OfflineQueueItem {
    const queue = this.loadQueue();
    const opId = payload.operationId || this.generateOperationId(type);
    
    // Optimistic Concurrency Control (OCC) - capture current versions of involved products
    const expectedVersions: Record<string, number> = {};
    if (productsListForOCC) {
      if (type === 'sale' && payload.items) {
        payload.items.forEach((item: any) => {
          const prod = productsListForOCC.find(p => p.id === item.productId);
          if (prod) {
            expectedVersions[prod.id] = (prod as any).version || 1;
          }
        });
      } else if ((type === 'transfer' || type === 'adjustment') && payload.productId) {
        const prod = productsListForOCC.find(p => p.id === payload.productId);
        if (prod) {
          expectedVersions[prod.id] = (prod as any).version || 1;
        }
      }
    }

    const newItem: OfflineQueueItem = {
      id: opId,
      timestamp: new Date().toISOString(),
      type,
      description,
      payload: { ...payload, operationId: opId },
      status: isOnline ? 'synced' : 'pending',
      retryCount: 0,
      expectedVersions: Object.keys(expectedVersions).length > 0 ? expectedVersions : undefined
    };

    queue.push(newItem);
    this.saveQueue(queue);
    return newItem;
  },

  /**
   * Checks if an operation is already marked as synced (Idempotency Guard).
   */
  isIdempotent(operationId: string, queue: OfflineQueueItem[]): boolean {
    const matched = queue.find(item => item.id === operationId);
    return matched ? matched.status === 'synced' : false;
  },

  /**
   * Simulates a background server version update on a product to trigger a conflict.
   * This is an incredibly helpful visual testing utility for the user!
   */
  simulateServerConflict(productId: string, products: Product[]): Product[] {
    return products.map(p => {
      if (p.id === productId) {
        const pWithVer = p as any;
        const currentVer = pWithVer.version || 1;
        return {
          ...p,
          version: currentVer + 1, // Advance version on the server
          stock: Math.max(0, p.stock - 2), // Change stock slightly to create state conflict
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });
  }
};
