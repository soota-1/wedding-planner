import { calculateGuestMetrics, GuestService } from '../../src/services/guestService';
import { Guest, GuestSide, RsvpStatus } from '../../src/types/guest';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('calculateGuestMetrics', () => {
  it('calculates pax aggregation and attendance rate correctly', () => {
    const guests: Guest[] = [
      { id: 'g1', workspaceId: 'w1', name: 'Keluarga Budi', side: 'groom', estimatedPax: 4, actualPax: 3, rsvpStatus: 'attending' },
      { id: 'g2', workspaceId: 'w1', name: 'Siti', side: 'bride', estimatedPax: 1, actualPax: 1, rsvpStatus: 'attending' },
      { id: 'g3', workspaceId: 'w1', name: 'Andi', side: 'groom', estimatedPax: 2, actualPax: 0, rsvpStatus: 'declined' },
      { id: 'g4', workspaceId: 'w1', name: 'Rina', side: 'both', estimatedPax: 2, actualPax: 0, rsvpStatus: 'pending' },
    ];

    const metrics = calculateGuestMetrics(guests);
    expect(metrics.totalGuests).toBe(4);
    expect(metrics.totalInvitedPax).toBe(9); // 4 + 1 + 2 + 2
    expect(metrics.confirmedAttendingPax).toBe(4); // 3 (Budi) + 1 (Siti)
    expect(metrics.declinedPax).toBe(2);
    expect(metrics.tentativePax).toBe(2);
    expect(metrics.attendanceRate).toBe(44); // Math.round((4/9)*100) = 44%
  });

  it('handles empty guest list gracefully', () => {
    const metrics = calculateGuestMetrics([]);
    expect(metrics.totalGuests).toBe(0);
    expect(metrics.totalInvitedPax).toBe(0);
    expect(metrics.confirmedAttendingPax).toBe(0);
    expect(metrics.attendanceRate).toBe(0);
  });
});

describe('GuestService Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches guests by workspace with optional side filter', async () => {
    const mockGuests = [{ id: 'g1', name: 'Budi', side: 'groom' }];
    const selectMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockImplementation((col: string, val: string) => {
        if (col === 'workspace_id') {
          return {
            eq: jest.fn().mockResolvedValue({ data: mockGuests, error: null }),
            data: mockGuests,
            error: null,
          };
        }
        return { data: mockGuests, error: null };
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const result = await GuestService.getGuestsByWorkspace('w1');
    expect(supabase.from).toHaveBeenCalledWith('guests');
  });

  it('adds a new guest', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [{ id: 'g1', name: 'New Guest' }], error: null }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

    const result = await GuestService.addGuest('w1', {
      name: 'New Guest',
      side: 'groom',
      estimatedPax: 2,
    });
    expect(result.name).toBe('New Guest');
  });

  it('updates RSVP status and actual pax', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: 'g1', rsvp_status: 'attending', actual_pax: 2 }], error: null }),
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const result = await GuestService.updateRsvpStatus('g1', 'attending', 2);
    expect(result.success).toBe(true);
  });
});
