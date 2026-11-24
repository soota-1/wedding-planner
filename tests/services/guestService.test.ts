import { calculateGuestMetrics, GuestService, mapGuestRow } from '../../src/services/guestService';
import { Guest, GuestSide, RsvpStatus } from '../../src/types/guest';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('mapGuestRow', () => {
  it('correctly maps snake_case database row to camelCase Guest model', () => {
    const row = {
      id: 'g1',
      workspace_id: 'w1',
      name: 'Budi',
      phone: '08123',
      email: 'budi@test.com',
      side: 'groom',
      group_tag: 'Family',
      estimated_pax: '2',
      actual_pax: '2',
      rsvp_status: 'attending',
      invitation_sent: true,
      notes: 'VIP guest',
      created_at: '2027-01-01T00:00:00Z',
    };

    const guest = mapGuestRow(row);
    expect(guest.id).toBe('g1');
    expect(guest.workspaceId).toBe('w1');
    expect(guest.estimatedPax).toBe(2);
    expect(guest.actualPax).toBe(2);
    expect(guest.rsvpStatus).toBe('attending');
    expect(guest.invitationSent).toBe(true);
  });
});

describe('calculateGuestMetrics', () => {
  it('calculates pax aggregation and attendance rate correctly', () => {
    const guests: Guest[] = [
      { id: 'g1', workspaceId: 'w1', name: 'Keluarga Budi', side: 'groom', estimatedPax: 4, actualPax: 3, rsvpStatus: 'attending', invitationSent: true },
      { id: 'g2', workspaceId: 'w1', name: 'Siti', side: 'bride', estimatedPax: 1, actualPax: 1, rsvpStatus: 'attending', invitationSent: true },
      { id: 'g3', workspaceId: 'w1', name: 'Andi', side: 'groom', estimatedPax: 2, actualPax: 0, rsvpStatus: 'declined', invitationSent: false },
      { id: 'g4', workspaceId: 'w1', name: 'Rina', side: 'both', estimatedPax: 2, actualPax: 0, rsvpStatus: 'pending', invitationSent: true },
    ];

    const metrics = calculateGuestMetrics(guests);
    expect(metrics.totalGuests).toBe(4);
    expect(metrics.totalInvitedPax).toBe(9); // 4 + 1 + 2 + 2
    expect(metrics.confirmedAttendingPax).toBe(4); // 3 (Budi) + 1 (Siti)
    expect(metrics.declinedPax).toBe(2);
    expect(metrics.tentativePax).toBe(2);
    expect(metrics.attendanceRate).toBe(44); // Math.round((4/9)*100) = 44%
    expect(metrics.invitationsSentCount).toBe(3);
  });

  it('handles empty guest list gracefully', () => {
    const metrics = calculateGuestMetrics([]);
    expect(metrics.totalGuests).toBe(0);
    expect(metrics.totalInvitedPax).toBe(0);
    expect(metrics.confirmedAttendingPax).toBe(0);
    expect(metrics.attendanceRate).toBe(0);
    expect(metrics.invitationsSentCount).toBe(0);
  });
});

describe('GuestService Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches guests by workspace with optional side filter', async () => {
    const mockDbRows = [
      { id: 'g1', workspace_id: 'w1', name: 'Budi', side: 'groom', estimated_pax: 2, actual_pax: 2, rsvp_status: 'attending' },
    ];

    const queryMock: any = {
      eq: jest.fn().mockImplementation((col: string, val: string) => {
        if (col === 'side') {
          return Promise.resolve({ data: mockDbRows, error: null });
        }
        return queryMock;
      }),
      then: (resolve: any) => resolve({ data: mockDbRows, error: null }),
    };

    const selectMock = jest.fn().mockReturnValue(queryMock);
    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    // Without side filter
    const resultAll = await GuestService.getGuestsByWorkspace('w1');
    expect(supabase.from).toHaveBeenCalledWith('guests');
    expect(resultAll.length).toBe(1);
    expect(resultAll[0].estimatedPax).toBe(2);
    expect(resultAll[0].workspaceId).toBe('w1');

    // With side filter
    const resultSide = await GuestService.getGuestsByWorkspace('w1', 'groom');
    expect(queryMock.eq).toHaveBeenCalledWith('side', 'groom');
    expect(resultSide[0].side).toBe('groom');
  });

  it('adds a new guest and returns mapped camelCase object', async () => {
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 'g1', workspace_id: 'w1', name: 'New Guest', estimated_pax: 2, rsvp_status: 'pending' }],
        error: null,
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

    const result = await GuestService.addGuest('w1', {
      name: 'New Guest',
      side: 'groom',
      estimatedPax: 2,
    });
    expect(result.name).toBe('New Guest');
    expect(result.estimatedPax).toBe(2);
    expect(result.workspaceId).toBe('w1');
  });

  it('updates RSVP status and actual pax returning mapped object', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [{ id: 'g1', workspace_id: 'w1', name: 'Budi', rsvp_status: 'attending', actual_pax: 2 }],
          error: null,
        }),
      }),
    });

    (supabase.from as jest.Mock).mockReturnValue({ update: updateMock });

    const result = await GuestService.updateRsvpStatus('g1', 'attending', 2);
    expect(result.success).toBe(true);
    expect(result.data?.actualPax).toBe(2);
    expect(result.data?.rsvpStatus).toBe('attending');
  });
});
