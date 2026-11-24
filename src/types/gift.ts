export type GiftType = 'cash' | 'transfer' | 'physical_gift';

export type GiftRecipient = 'groom' | 'bride' | 'both' | 'family_groom' | 'family_bride';

export interface Gift {
  id: string;
  workspaceId: string;
  guestId?: string | null;
  senderName: string;
  giftType: GiftType;
  amount: number;
  giftDescription?: string | null;
  receivedBy: GiftRecipient;
  receivedAt?: string;
  thankYouSent?: boolean;
  notes?: string | null;
}

export interface GiftSummary {
  totalGifts: number;
  totalCashCollected: number;
  byRecipient: Record<GiftRecipient, number>;
  physicalGiftsCount: number;
  physicalGifts: Gift[];
  thankYouSentCount: number;
  thankYouPendingCount: number;
}
