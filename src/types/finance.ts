export type PaymentStatus = 'pending' | 'paid';

export type TransactionType = 'booking_fee' | 'dp' | 'installment' | 'settlement' | 'other';

export type PaidBy = 'groom' | 'bride' | 'both' | 'family_groom' | 'family_bride';

export type VendorStatus =
  | 'researching'
  | 'shortlisted'
  | 'contacted'
  | 'negotiating'
  | 'booked'
  | 'paid'
  | 'completed'
  | 'cancelled';

export interface Budget {
  targetBudget: number;
}

export interface BudgetCategory {
  id: string;
  workspaceId: string;
  name: string;
  allocatedAmount: number;
}

export interface Vendor {
  id: string;
  name: string;
  contractValue?: number;
  status?: VendorStatus;
  budgetCategoryId?: string;
  category?: string;
}

export interface Transaction {
  id: string;
  vendorId?: string;
  budgetCategoryId?: string;
  taskId?: string;
  title?: string;
  amount: number;
  paymentStatus: PaymentStatus;
  transactionType?: TransactionType;
  paidBy?: PaidBy;
  dueDate?: Date | string;
  paymentDate?: Date | string;
}

export interface ContributorBreakdown {
  groom: number;
  bride: number;
  both: number;
  family_groom: number;
  family_bride: number;
  [key: string]: number;
}

export interface CategorySummary {
  allocated: number;
  committed: number;
  spent: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
}

export interface BudgetSummary {
  targetBudget: number;
  cashSpent: number;
  totalCommitted: number;
  remainingCash: number;
  remainingCommittedLiability: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  contributions: ContributorBreakdown;
  categorySummaries: Record<string, CategorySummary>;
}
