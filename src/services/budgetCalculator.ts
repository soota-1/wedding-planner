import { Budget, Vendor, Transaction, BudgetSummary, ContributorBreakdown } from '../types/finance';

export function calculateBudgetSummary(
  budget: Budget,
  vendors: Vendor[] = [],
  transactions: Transaction[] = []
): BudgetSummary {
  const targetBudget = budget.targetBudget || 0;

  // 1. Kas Keluar Riil: Hanya transaksi berstatus 'paid'
  let cashSpent = 0;
  const contributions: ContributorBreakdown = {
    groom: 0,
    bride: 0,
    both: 0,
    family_groom: 0,
    family_bride: 0,
  };

  transactions.forEach((tx) => {
    if (tx.paymentStatus === 'paid') {
      cashSpent += Number(tx.amount) || 0;
      if (tx.paidBy && contributions[tx.paidBy] !== undefined) {
        contributions[tx.paidBy] += Number(tx.amount) || 0;
      }
    }
  });

  // 2. Komitmen Vendor: Vendor yang sudah deal/booked/paid/completed
  const committedVendorStatuses = ['booked', 'paid', 'completed'];
  let vendorCommitment = 0;
  const bookedVendorIds = new Set<string>();

  vendors.forEach((v) => {
    if (v.status && committedVendorStatuses.includes(v.status)) {
      vendorCommitment += Number(v.contractValue) || 0;
      bookedVendorIds.add(v.id);
    }
  });

  // 3. Transaksi Mandiri (tidak terhubung ke vendor manapun)
  let standaloneTxCommitment = 0;
  transactions.forEach((tx) => {
    if (!tx.vendorId) {
      standaloneTxCommitment += Number(tx.amount) || 0;
    }
  });

  const totalCommitted = vendorCommitment + standaloneTxCommitment;
  const remainingCash = targetBudget - cashSpent;
  const remainingCommittedLiability = Math.max(0, totalCommitted - cashSpent);

  const isOverBudget = totalCommitted > targetBudget;
  const overBudgetAmount = isOverBudget ? totalCommitted - targetBudget : 0;

  return {
    targetBudget,
    cashSpent,
    totalCommitted,
    remainingCash,
    remainingCommittedLiability,
    isOverBudget,
    overBudgetAmount,
    contributions,
  };
}
