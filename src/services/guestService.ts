import { supabase } from '../config/supabase';
import { Guest, GuestMetrics, GuestSide, RsvpStatus } from '../types/guest';

export function mapGuestRow(row: any): Guest {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    phone: row.phone ?? null,
    email: row.email ?? null,
    side: row.side,
    groupTag: row.group_tag,
    estimatedPax: Number(row.estimated_pax) || 0,
    actualPax: Number(row.actual_pax) || 0,
    rsvpStatus: row.rsvp_status,
    invitationSent: Boolean(row.invitation_sent),
    notes: row.notes ?? null,
    createdAt: row.created_at,
  };
}

export function calculateGuestMetrics(guests: Guest[] = []): GuestMetrics {
  const totalGuests = guests.length;
  let totalInvitedPax = 0;
  let confirmedAttendingPax = 0;
  let declinedPax = 0;
  let tentativePax = 0;
  let invitationsSentCount = 0;

  guests.forEach((g) => {
    const est = Number(g.estimatedPax) || 0;
    const act = Number(g.actualPax) || 0;
    totalInvitedPax += est;

    if (g.invitationSent) {
      invitationsSentCount++;
    }

    if (g.rsvpStatus === 'attending') {
      confirmedAttendingPax += act > 0 ? act : est;
    } else if (g.rsvpStatus === 'declined') {
      declinedPax += est;
    } else {
      // pending or tentative
      tentativePax += est;
    }
  });

  const attendanceRate =
    totalInvitedPax > 0 ? Math.round((confirmedAttendingPax / totalInvitedPax) * 100) : 0;

  return {
    totalGuests,
    totalInvitedPax,
    confirmedAttendingPax,
    declinedPax,
    tentativePax,
    attendanceRate,
    invitationsSentCount,
  };
}

export class GuestService {
  static async getGuestsByWorkspace(workspaceId: string, filterSide?: GuestSide): Promise<Guest[]> {
    let query = supabase.from('guests').select('*').eq('workspace_id', workspaceId);

    if (filterSide) {
      query = query.eq('side', filterSide);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapGuestRow);
  }

  static async addGuest(workspaceId: string, guest: Partial<Guest>): Promise<Guest> {
    const { data, error } = await supabase
      .from('guests')
      .insert({
        workspace_id: workspaceId,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        side: guest.side || 'both',
        group_tag: guest.groupTag || 'General',
        estimated_pax: guest.estimatedPax ?? 1,
        actual_pax: guest.actualPax ?? 0,
        rsvp_status: guest.rsvpStatus || 'pending',
        invitation_sent: guest.invitationSent ?? false,
        notes: guest.notes,
      })
      .select();

    if (error) throw error;
    return mapGuestRow(data?.[0]);
  }

  static async updateRsvpStatus(guestId: string, status: RsvpStatus, actualPax?: number) {
    const updatePayload: Record<string, any> = {
      rsvp_status: status,
    };

    if (typeof actualPax === 'number') {
      updatePayload.actual_pax = actualPax;
    }

    const { data, error } = await supabase
      .from('guests')
      .update(updatePayload)
      .eq('id', guestId)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] ? mapGuestRow(data[0]) : null };
  }
}
