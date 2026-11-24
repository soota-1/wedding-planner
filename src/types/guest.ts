export type GuestSide = 'groom' | 'bride' | 'both';

export type RsvpStatus = 'pending' | 'attending' | 'declined' | 'tentative';

export interface Guest {
  id: string;
  workspaceId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  side: GuestSide;
  groupTag?: string;
  estimatedPax: number;
  actualPax: number;
  rsvpStatus: RsvpStatus;
  invitationSent?: boolean;
  notes?: string | null;
  createdAt?: string;
}

export interface GuestMetrics {
  totalGuests: number;
  totalInvitedPax: number;
  confirmedAttendingPax: number;
  declinedPax: number;
  tentativePax: number;
  attendanceRate: number;
}
