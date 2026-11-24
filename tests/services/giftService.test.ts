import { calculateGiftSummary, GiftService, mapGiftRow } from '../../src/services/giftService';
import { Gift, GiftType, GiftRecipient } from '../../src/types/gift';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('mapGiftRow', () => {
  it('correctly maps snake_case database row to camelCase Gift model', () => {
    const row = {
      id: 'gf1',
      workspace_id: 'w1',
      guest_id: 'g1',
      sender_name: 'Om Anton',
      gift_type: 'cash',
      amount: '5000000',
      gift_description: null,
      received_by: 'groom',
      received_at: '2027-10-10T12:00:00Z',
      thank_you_sent: true,
      notes: 'Amplop merah',
    };

    const gift = mapGiftRow(row);
    expect(gift.id).toBe('gf1');
    expect(gift.workspaceId).toBe('w1');
    expect(gift.guestId).toBe('g1');
    expect(gift.senderName).toBe('Om Anton');
    expect(gift.giftType).toBe('cash');
    expect(gift.amount).toBe(5000000);
    expect(gift.thankYouSent).toBe(true);
  });
});

describe('calculateGiftSummary', () => {
  it('separates cash and transfer from physical gifts and computes recipient breakdown', () => {
    const gifts: Gift[] = [
      { id: '1', workspaceId: 'w1', senderName: 'Om Anton', giftType: 'cash', amount: 2000000, receivedBy: 'groom', thankYouSent: true },
      { id: '2', workspaceId: 'w1', senderName: 'Tante Rina', giftType: 'transfer', amount: 3000000, receivedBy: 'bride', thankYouSent: false },
      { id: '3', workspaceId: 'w1', senderName: 'Keluarga Solo', giftType: 'cash', amount: 5000000, receivedBy: 'family_groom', thankYouSent: true },
      { id: '4', workspaceId: 'w1', senderName: 'Sahabat Kuliah', giftType: 'physical_gift', amount: 0, giftDescription: 'Coffee Maker', receivedBy: 'both', thankYouSent: false },
    ];

    const summary = calculateGiftSummary(gifts);
    expect(summary.totalGifts).toBe(4);
    expect(summary.totalCashCollected).toBe(10000000); // 2M + 3M + 5M
    expect(summary.byRecipient.groom).toBe(2000000);
    expect(summary.byRecipient.bride).toBe(3000000);
    expect(summary.byRecipient.family_groom).toBe(5000000);
    expect(summary.byRecipient.both).toBe(0);
    expect(summary.physicalGiftsCount).toBe(1);
    expect(summary.physicalGifts[0].giftDescription).toBe('Coffee Maker');
    expect(summary.thankYouSentCount).toBe(2);
    expect(summary.thankYouPendingCount).toBe(2);
  });

  it('handles empty gifts list gracefully', () => {
    const summary = calculateGiftSummary([]);
    expect(summary.totalGifts).toBe(0);
    expect(summary.totalCashCollected).toBe(0);
    expect(summary.physicalGiftsCount).toBe(0);
    expect(summary.thankYouSentCount).toBe(0);
    expect(summary.thankYouPendingCount).toBe(0);
  });
});

describe('GiftService Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches gifts by workspace returning mapped domain models', async () => {
    const mockDbRows = [
      { id: '1', workspace_id: 'w1', sender_name: 'Budi', gift_type: 'cash', amount: '1000000', thank_you_sent: false },
    ];
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: mockDbRows, error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await GiftService.getGiftsByWorkspace('w1');
    expect(supabase.from).toHaveBeenCalledWith('gifts');
    expect(result.length).toBe(1);
    expect(result[0].senderName).toBe('Budi');
    expect(result[0].amount).toBe(1000000);
    expect(result[0].giftType).toBe('cash');
  });

  it('records a new gift and returns mapped domain model', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: '1', workspace_id: 'w1', sender_name: 'Budi', amount: '1000000', gift_type: 'cash' }],
        error: null,
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

    const result = await GiftService.recordGift('w1', {
      senderName: 'Budi',
      giftType: 'cash',
      amount: 1000000,
      receivedBy: 'both',
    });
    expect(result.senderName).toBe('Budi');
    expect(result.amount).toBe(1000000);
  });

  it('updates thank you note status and returns mapped model', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: '1', workspace_id: 'w1', sender_name: 'Budi', thank_you_sent: true }],
          error: null,
        }),
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const result = await GiftService.updateThankYouStatus('1', true);
    expect(result.success).toBe(true);
    expect(result.data?.thankYouSent).toBe(true);
  });
});
