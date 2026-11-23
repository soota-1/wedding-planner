import { calculateBudgetSummary } from '../../src/services/budgetCalculator';
import { Budget, Vendor, Transaction, BudgetCategory } from '../../src/types/finance';

describe('calculateBudgetSummary', () => {
  it('correctly separates paid cash from committed liabilities without double counting', () => {
    const budget: Budget = { targetBudget: 150000000 };
    const vendors: Vendor[] = [
      { id: 'v1', name: 'Gedung Paroki', contractValue: 50000000, status: 'booked' }
    ];
    const transactions: Transaction[] = [
      { id: 't1', vendorId: 'v1', amount: 10000000, paymentStatus: 'paid', paidBy: 'groom' },
      { id: 't2', vendorId: 'v1', amount: 20000000, paymentStatus: 'pending', paidBy: 'groom' }
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions);

    expect(result.targetBudget).toBe(150000000);
    expect(result.cashSpent).toBe(10000000); // Only paid
    expect(result.totalCommitted).toBe(50000000); // Vendor contract
    expect(result.remainingCash).toBe(140000000); // Target - CashSpent
    expect(result.remainingCommittedLiability).toBe(40000000); // 50M - 10M
    expect(result.isOverBudget).toBe(false);
    expect(result.overBudgetAmount).toBe(0);
  });

  it('detects over-budget when total commitment exceeds target budget even if paid cash is low', () => {
    const budget: Budget = { targetBudget: 100000000 };
    const vendors: Vendor[] = [
      { id: 'v1', name: 'Vendor A', contractValue: 120000000, status: 'booked' }
    ];
    const transactions: Transaction[] = [
      { id: 't1', vendorId: 'v1', amount: 10000000, paymentStatus: 'paid', paidBy: 'groom' }
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions);
    expect(result.isOverBudget).toBe(true);
    expect(result.overBudgetAmount).toBe(20000000);
  });

  it('calculates contributor breakdown accurately', () => {
    const budget: Budget = { targetBudget: 50000000 };
    const vendors: Vendor[] = [];
    const transactions: Transaction[] = [
      { id: 't1', amount: 10000000, paymentStatus: 'paid', paidBy: 'groom' },
      { id: 't2', amount: 15000000, paymentStatus: 'paid', paidBy: 'bride' },
      { id: 't3', amount: 5000000, paymentStatus: 'paid', paidBy: 'family_groom' },
      { id: 't4', amount: 2000000, paymentStatus: 'pending', paidBy: 'groom' },
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions);
    expect(result.cashSpent).toBe(30000000);
    expect(result.contributions.groom).toBe(10000000);
    expect(result.contributions.bride).toBe(15000000);
    expect(result.contributions.family_groom).toBe(5000000);
  });

  it('handles payments exceeding contract value and uncommitted vendor payments without under-reporting commitment', () => {
    const budget: Budget = { targetBudget: 50000000 };
    // Vendor contract 40M, but paid transactions total 55M
    const vendors: Vendor[] = [
      { id: 'v1', name: 'Katering', contractValue: 40000000, status: 'booked' },
      { id: 'v2', name: 'Fotografer Negosiasi', contractValue: 0, status: 'negotiating' },
    ];
    const transactions: Transaction[] = [
      { id: 't1', vendorId: 'v1', amount: 55000000, paymentStatus: 'paid', paidBy: 'groom' },
      { id: 't2', vendorId: 'v2', amount: 5000000, paymentStatus: 'paid', paidBy: 'bride' },
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions);
    expect(result.cashSpent).toBe(60000000);
    expect(result.totalCommitted).toBe(60000000);
    expect(result.isOverBudget).toBe(true);
    expect(result.overBudgetAmount).toBe(10000000); // 60M - 50M
  });

  it('calculates category-level breakdown and flags category over-budget', () => {
    const budget: Budget = { targetBudget: 100000000 };
    const categories: BudgetCategory[] = [
      { id: 'cat-1', workspaceId: 'w1', name: 'Katering', allocatedAmount: 40000000 },
      { id: 'cat-2', workspaceId: 'w1', name: 'Dekorasi', allocatedAmount: 20000000 },
    ];
    const vendors: Vendor[] = [
      { id: 'v1', name: 'Vendor Katering', contractValue: 50000000, status: 'booked', budgetCategoryId: 'cat-1' },
      { id: 'v2', name: 'Vendor Dekor', contractValue: 15000000, status: 'booked', budgetCategoryId: 'cat-2' },
    ];
    const transactions: Transaction[] = [
      { id: 't1', vendorId: 'v1', budgetCategoryId: 'cat-1', amount: 10000000, paymentStatus: 'paid', paidBy: 'groom' }
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions, categories);
    expect(result.categorySummaries['cat-1']).toBeDefined();
    expect(result.categorySummaries['cat-1'].isOverBudget).toBe(true); // 50M committed > 40M allocated
    expect(result.categorySummaries['cat-1'].overBudgetAmount).toBe(10000000);
    expect(result.categorySummaries['cat-2'].isOverBudget).toBe(false);
  });
});
