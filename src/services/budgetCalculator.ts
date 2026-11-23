import { Budget, Vendor, Transaction, BudgetCategory, BudgetSummary, ContributorBreakdown, CategorySummary } from '../types/finance';

export function calculateBudgetSummary(
  budget: Budget,
  vendors: Vendor[] = [],
  transactions: Transaction[] = [],
  categories: BudgetCategory[] = []
): BudgetSummary {
  const targetBudget = budget.targetBudget || 0;

  // 1. Kas Keluar Riil & Rekap Pembayar & Pelacakan Bayar per Vendor & Kategori
  let cashSpent = 0;
  const contributions: ContributorBreakdown = {
    groom: 0,
    bride: 0,
    both: 0,
    family_groom: 0,
    family_bride: 0,
  };

  const vendorPaidMap = new Map<string, number>();
  const categorySpentMap = new Map<string, number>();

  transactions.forEach((tx) => {
    if (tx.paymentStatus === 'paid') {
      const amount = Number(tx.amount) || 0;
      cashSpent += amount;

      if (tx.paidBy && contributions[tx.paidBy] !== undefined) {
        contributions[tx.paidBy] += amount;
      }

      if (tx.vendorId) {
        vendorPaidMap.set(tx.vendorId, (vendorPaidMap.get(tx.vendorId) || 0) + amount);
      }

      if (tx.budgetCategoryId) {
        categorySpentMap.set(
          tx.budgetCategoryId,
          (categorySpentMap.get(tx.budgetCategoryId) || 0) + amount
        );
      }
    }
  });

  // 2. Komitmen Vendor: Minimal sebesar uang yang sudah dibayarkan jika melebihi nilai kontrak
  const committedVendorStatuses = ['booked', 'paid', 'completed'];
  let vendorCommitment = 0;
  const vendorEffectiveCommitmentMap = new Map<string, number>();

  vendors.forEach((v) => {
    const paidForVendor = vendorPaidMap.get(v.id) || 0;
    const contractVal = Number(v.contractValue) || 0;

    let effectiveVendorLiability = 0;
    if (v.status && committedVendorStatuses.includes(v.status)) {
      effectiveVendorLiability = Math.max(contractVal, paidForVendor);
    } else {
      // Vendor belum deal tapi ada kas keluar (booking fee/DP awal)
      effectiveVendorLiability = paidForVendor;
    }

    vendorCommitment += effectiveVendorLiability;
    vendorEffectiveCommitmentMap.set(v.id, effectiveVendorLiability);
  });

  // 3. Transaksi Mandiri (tidak terhubung ke vendor terdaftar)
  let standaloneTxCommitment = 0;
  const categoryStandaloneCommitmentMap = new Map<string, number>();

  transactions.forEach((tx) => {
    if (!tx.vendorId) {
      const amount = Number(tx.amount) || 0;
      standaloneTxCommitment += amount;

      if (tx.budgetCategoryId) {
        categoryStandaloneCommitmentMap.set(
          tx.budgetCategoryId,
          (categoryStandaloneCommitmentMap.get(tx.budgetCategoryId) || 0) + amount
        );
      }
    }
  });

  // Total komitmen tidak boleh lebih kecil dari uang kas riil yang sudah keluar
  const totalCommitted = Math.max(vendorCommitment + standaloneTxCommitment, cashSpent);
  const remainingCash = targetBudget - cashSpent;
  const remainingCommittedLiability = Math.max(0, totalCommitted - cashSpent);

  const isOverBudget = totalCommitted > targetBudget;
  const overBudgetAmount = isOverBudget ? totalCommitted - targetBudget : 0;

  // 4. Ringkasan per Kategori Anggaran
  const categorySummaries: Record<string, CategorySummary> = {};
  categories.forEach((cat) => {
    const allocated = Number(cat.allocatedAmount) || 0;
    const spent = categorySpentMap.get(cat.id) || 0;

    // Hitung komitmen vendor dalam kategori ini
    let catVendorCommitted = 0;
    vendors.forEach((v) => {
      if (v.budgetCategoryId === cat.id) {
        catVendorCommitted += vendorEffectiveCommitmentMap.get(v.id) || 0;
      }
    });

    const catStandaloneCommitted = categoryStandaloneCommitmentMap.get(cat.id) || 0;
    const committed = Math.max(catVendorCommitted + catStandaloneCommitted, spent);

    const isCatOverBudget = committed > allocated;
    const catOverBudgetAmount = isCatOverBudget ? committed - allocated : 0;

    categorySummaries[cat.id] = {
      allocated,
      committed,
      spent,
      isOverBudget: isCatOverBudget,
      overBudgetAmount: catOverBudgetAmount,
    };
  });

  return {
    targetBudget,
    cashSpent,
    totalCommitted,
    remainingCash,
    remainingCommittedLiability,
    isOverBudget,
    overBudgetAmount,
    contributions,
    categorySummaries,
  };
}
