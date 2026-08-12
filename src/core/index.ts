// Firebase SDK Initialization
export { db, auth, googleProvider } from './firebaseSDK';

// Authentication Layer
export { AuthService } from './auth/authService';

// Application Services Layer
export { ApplicationServices } from './services/applicationServices';
export { TransactionOrchestrator } from './services/transactionOrchestrator';

// Domain/Feature Modules Layer
export { POSModule } from './modules/pos';
export { InventoryModule } from './modules/inventory';
export { SalesModule } from './modules/sales';
export { PurchasesModule } from './modules/purchases';
export { CustomersModule } from './modules/customers';
export { SuppliersModule } from './modules/suppliers';
export { AccountingModule } from './modules/accounting';
export { HRModule } from './modules/hr';
export { ReportsModule } from './modules/reports';
