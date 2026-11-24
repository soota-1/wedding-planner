import { calculateGiftSummary, GiftService } from '../../src/services/giftService';
import { Gift, GiftType, GiftRecipient } from '../../src/types/gift';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('calculateGiftSummary', () => {
  it('separates cash and transfer from physical gifts and computes recipient breakdown', () => {
    const gifts: Gift[] = [
      { id: '1', workspaceId: 'w1', senderName: 'Om Anton', giftType: 'cash', amount: 2000000, receivedBy: 'groom', thankYouSent: true },
      { id: '2', workspaceId: 'w1', senderName: 'Tante Rina', giftType: 'transfer', amount: 3000000, receivedBy: 'bride', thankYouSent: false },
      { id: '3', workspaceId: 'w1', senderName: 'Keluarga Solo', giftType: 'cash', amount: 5000000, receivedBy: 'family_groom', thankYouSent: true },
      { id: '4', workspaceId: 'w1', senderName: 'Sahabat Kuliah', giftType: 'physical_gift', amount: 0, giftDescription: 'Coffee Maker', receivedBy: 'both', thankYouSent: false },
    ];

    const summary = calculateGiftSummary(gifts);
    expect(summary.totalCashCollected).toBe(10000000); // 2M + 3M + 5M
    expect(summary.byRecipient.groom).toBe(2000000);
    expect(summary.byRecipient.bride).toBe(3000000);
    expect(summary.byRecipient.family_groom).toBe(5000000);
    expect(summary.byRecipient.both).toBe(0);
    expect(summary.physicalGiftsCount).toBe(1);
    expect(summary.physicalGifts[0].giftDescription).toBe('Coffee Maker');
    expect(summary.thankYouPendingCount).toBe(2);
  });

  it('handles empty gifts list gracefully', () => {
    const summary = calculateGiftSummary([]);
    expect(summary.totalCashCollected).toBe(0);
    expect(summary.physicalGiftsCount).toBe(0);
    expect(summary.thankYouPendingCount).toBe(0);
  });
});

describe('GiftService Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches gifts by workspace', async () => {
    const mockGifts = [{ id: '1', sender_name: 'Budi' }];
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: mockGifts, error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await GiftService.getGiftsByWorkspace('w1');
    expect(supabase.from).toHaveBeenCalledWith('gifts');
    expect(result).toEqual(mockGifts);
  });

  it('records a new gift', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [{ id: '1', sender_name: 'Budi', amount: 1000000 }], error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

    const result = await GiftService.recordGift('w1', {
      senderName: 'Budi',
      giftType: 'cash',
      amount: 1000000,
      receivedBy: 'both',
    });
    expect(result.sender_name).toBe('Budi');
  });

  it('updates thank you note status', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: '1', thank_you_sent: true }], error: null }),
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const result = await GiftService.updateThankYouStatus('1', true);
    expect(result.success).toBe(true);
  });
});
