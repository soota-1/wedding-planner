import { supabase } from '../config/supabase';
import { Gift, GiftSummary, GiftRecipient } from '../types/gift';

export function calculateGiftSummary(gifts: Gift[]): GiftSummary {
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

    if (!g.thankYouSent) {
      thankYouPendingCount++;
    }
  });

  return {
    totalCashCollected,
    byRecipient,
    physicalGiftsCount: physicalGifts.length,
    physicalGifts,
    thankYouPendingCount,
  };
}

export class GiftService {
  static async getGiftsByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return data;
  }

  static async recordGift(workspaceId: string, gift: Partial<Gift>) {
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
    return data?.[0];
  }

  static async updateThankYouStatus(giftId: string, sent: boolean) {
    const { data, error } = await supabase
      .from('gifts')
      .update({ thank_you_sent: sent })
      .eq('id', giftId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  }
}
