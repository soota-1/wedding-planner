export type VendorStatus =
  | 'researching'
  | 'shortlisted'
  | 'contacted'
  | 'negotiating'
  | 'booked'
  | 'paid'
  | 'completed'
  | 'cancelled';

export interface Vendor {
  id: string;
  workspaceId: string;
  budgetCategoryId?: string | null;
  category: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  socialMedia?: string | null;
  status: VendorStatus;
  quotationPrice?: number;
  negotiatedPrice?: number;
  contractValue?: number;
  bookingDate?: string | null;
  rating?: number | null;
  notes?: string | null;
}
