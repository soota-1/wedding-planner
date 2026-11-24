import { supabase } from '../config/supabase';
import { Gift, GiftSummary, GiftRecipient } from '../types/gift';

export function mapGiftRow(row: any): Gift {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    guestId: row.guest_id ?? null,
    senderName: row.sender_name,
    giftType: row.gift_type,
    amount: Number(row.amount) || 0,
    giftDescription: row.gift_description ?? null,
    receivedBy: row.received_by,
    receivedAt: row.received_at,
    thankYouSent: Boolean(row.thank_you_sent),
    notes: row.notes ?? null,
  };
}

export function calculateGiftSummary(gifts: Gift[] = []): GiftSummary {
  let totalCashCollected = 0;
  const byRecipient: Record<GiftRecipient, number> = {
    groom: 0,
    bride: 0,
    both: 0,
    family_groom: 0,
    family_bride: 0,
  };

  const physicalGifts: Gift[] = [];
  let thankYouPendingCount = 0;
  let thankYouSentCount = 0;

  gifts.forEach((g) => {
    const amount = Number(g.amount) || 0;

    if (g.giftType === 'cash' || g.giftType === 'transfer') {
      totalCashCollected += amount;
      if (g.receivedBy && byRecipient[g.receivedBy] !== undefined) {
        byRecipient[g.receivedBy] += amount;
      }
    } else if (g.giftType === 'physical_gift') {
      physicalGifts.push(g);
    }

    if (g.thankYouSent) {
      thankYouSentCount++;
    } else {
      thankYouPendingCount++;
    }
  });

  return {
    totalGifts: gifts.length,
    totalCashCollected,
    byRecipient,
    physicalGiftsCount: physicalGifts.length,
    physicalGifts,
    thankYouSentCount,
    thankYouPendingCount,
  };
}

export class GiftService {
  static async getGiftsByWorkspace(workspaceId: string): Promise<Gift[]> {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return (data || []).map(mapGiftRow);
  }

  static async recordGift(workspaceId: string, gift: Partial<Gift>): Promise<Gift> {
    const { data, error } = await supabase
      .from('gifts')
      .insert({
        workspace_id: workspaceId,
        guest_id: gift.guestId,
        sender_name: gift.senderName,
        gift_type: gift.giftType || 'cash',
        amount: gift.amount ?? 0,
        gift_description: gift.giftDescription,
        received_by: gift.receivedBy || 'both',
        thank_you_sent: gift.thankYouSent ?? false,
        notes: gift.notes,
      })
      .select();

    if (error) throw error;
    return mapGiftRow(data?.[0]);
  }

  static async updateThankYouStatus(giftId: string, sent: boolean) {
    const { data, error } = await supabase
      .from('gifts')
      .update({ thank_you_sent: sent })
      .eq('id', giftId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] ? mapGiftRow(data[0]) : null };
  }
}
