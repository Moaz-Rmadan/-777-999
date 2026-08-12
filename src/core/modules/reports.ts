import { Invoice, Expense, PurchaseInvoice, Product } from '../../types';

/**
 * Core Reports Module - Synthesizes store logs into financial KPIs and business intelligence reports.
 */
export const ReportsModule = {
  /**
   * Summarizes net profit, sales count, cost of goods, and total overhead expenses.
   */
  calculateFinancialSummary(
    invoices: Invoice[],
    purchases: PurchaseInvoice[],
    expenses: Expense[],
    products: Product[]
  ) {
    // 1. Total Sales (Revenue)
    const totalSales = invoices
      .filter(inv => inv.status !== 'voided')
      .reduce((sum, inv) => sum + inv.total, 0);

    // 2. Cost of Goods Sold (COGS) estimating cost prices
    const totalCOGS = invoices
      .filter(inv => inv.status !== 'voided')
      .reduce((sum, inv) => {
        const invoiceCOGS = inv.items.reduce((itemSum, item) => {
          // Find current cost price (buyPrice) or fallback to item's own buyPrice or 70% of sellPrice
          const matchedProd = products.find(p => p.id === item.productId);
          const costPrice = matchedProd?.buyPrice ?? item.buyPrice ?? (item.sellPrice * 0.7);
          return itemSum + (costPrice * item.quantity);
        }, 0);
        return sum + invoiceCOGS;
      }, 0);

    // 3. Gross Profit
    const grossProfit = totalSales - totalCOGS;

    // 4. Total Operating Expenses (excluding voided)
    const totalExpenses = expenses
      .filter(exp => exp.status !== 'voided')
      .reduce((sum, exp) => sum + exp.amount, 0);

    // 5. Net Profit
    const netProfit = grossProfit - totalExpenses;

    return {
      totalSales,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMarginPercentage: totalSales > 0 ? (netProfit / totalSales) * 100 : 0
    };
  },

  /**
   * Compiles current warehouse inventory valuation.
   */
  calculateInventoryValuation(products: Product[]) {
    return products.reduce((acc, p) => {
      const costValue = p.buyPrice * p.stock;
      const retailValue = p.sellPrice * p.stock;
      return {
        totalStockQty: acc.totalStockQty + p.stock,
        totalCostValue: acc.totalCostValue + costValue,
        totalRetailValue: acc.totalRetailValue + retailValue,
        potentialProfit: acc.potentialProfit + (retailValue - costValue)
      };
    }, { totalStockQty: 0, totalCostValue: 0, totalRetailValue: 0, potentialProfit: 0 });
  }
};
