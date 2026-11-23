import { calculateBudgetSummary } from '../../src/services/budgetCalculator';
import { Budget, Vendor, Transaction } from '../../src/types/finance';

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
      { id: 't4', amount: 2000000, paymentStatus: 'pending', paidBy: 'groom' }, // pending not in cash paid
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions);
    expect(result.cashSpent).toBe(30000000);
    expect(result.contributions.groom).toBe(10000000);
    expect(result.contributions.bride).toBe(15000000);
    expect(result.contributions.family_groom).toBe(5000000);
  });
});
