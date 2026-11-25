import { CalendarEvent, NotificationPayload } from '../types/calendar';

export function mapEventsForTimeline(
  tasks: Array<{ id: string; title: string; dueDate?: Date | string | null; status?: string }>,
  transactions: Array<{
    id: string;
    title: string;
    dueDate?: Date | string | null;
    amount?: number;
    paymentStatus?: string;
  }>,
  appointments: Array<{
    id: string;
    title: string;
    dueDate?: Date | string | null;
    notes?: string;
    isCompleted?: boolean;
  }> = []
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  tasks.forEach((task) => {
    if (task.dueDate) {
      events.push({
        id: task.id,
        title: task.title,
        date: new Date(task.dueDate),
        type: 'task_deadline',
        isCompleted: task.status === 'done',
      });
    }
  });

  transactions.forEach((tx) => {
    if (tx.dueDate) {
      events.push({
        id: tx.id,
        title: tx.title,
        date: new Date(tx.dueDate),
        type: 'payment_deadline',
        amount: tx.amount,
        isCompleted: tx.paymentStatus === 'paid',
      });
    }
  });

  appointments.forEach((apt) => {
    if (apt.dueDate) {
      events.push({
        id: apt.id,
        title: apt.title,
        date: new Date(apt.dueDate),
        type: 'appointment',
        notes: apt.notes,
        isCompleted: !!apt.isCompleted,
      });
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const formatTimelineEvents = mapEventsForTimeline;

export function formatReminderLeadTime(minutesBefore?: number): string {
  if (!minutesBefore || minutesBefore <= 0) return 'Tepat waktu';
  if (minutesBefore >= 1440) {
    const days = Math.round(minutesBefore / 1440);
    return `H-${days} sebelum jadwal`;
  }
  if (minutesBefore >= 60) {
    const hours = Math.round(minutesBefore / 60);
    return `${hours} jam sebelum jadwal`;
  }
  return `${minutesBefore} menit sebelum jadwal`;
}

export class NotificationService {
  static async scheduleUpcomingReminders(
    events: CalendarEvent[],
    scheduler?: (payload: NotificationPayload) => Promise<string>
  ): Promise<string[]> {
    const scheduledIds: string[] = [];

    for (const event of events) {
      if (event.isCompleted) continue;

      const year = event.date.getFullYear();
      const month = String(event.date.getMonth() + 1).padStart(2, '0');
      const day = String(event.date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const hours = String(event.date.getHours()).padStart(2, '0');
      const mins = String(event.date.getMinutes()).padStart(2, '0');
      const hasTime = event.date.getHours() !== 0 || event.date.getMinutes() !== 0;

      const body =
        event.type === 'payment_deadline'
          ? `Jatuh tempo pembayaran sebesar Rp ${(event.amount || 0).toLocaleString('id-ID')} pada ${dateStr}`
          : event.type === 'appointment'
          ? `Jadwal meeting/fitting pada ${dateStr}${hasTime ? ` pukul ${hours}:${mins}` : ''}${
              event.notes ? ` (${event.notes})` : ''
            }`
          : `Jatuh tempo pada ${dateStr}`;

      const payload: NotificationPayload = {
        title: `Pengingat: ${event.title}`,
        body,
        triggerDate: event.date,
        data: { eventId: event.id, type: event.type },
      };

      if (scheduler) {
        const id = await scheduler(payload);
        scheduledIds.push(id);
      }
    }

    return scheduledIds;
  }

  static async scheduleVendorReminder(
    schedule: {
      id: string;
      title: string;
      date: string;
      time?: string;
      isoDateTime?: string;
      reminderMinutesBefore?: number;
    },
    vendorName: string,
    scheduler?: (payload: NotificationPayload) => Promise<string>
  ): Promise<{ scheduled: boolean; triggerLabel: string; message: string }> {
    const baseDate = schedule.isoDateTime ? new Date(schedule.isoDateTime) : new Date();
    const safeBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const minutesBefore = schedule.reminderMinutesBefore ?? 60;
    const triggerDate = new Date(safeBase.getTime() - minutesBefore * 60 * 1000);
    const leadLabel = formatReminderLeadTime(minutesBefore);

    const payload: NotificationPayload = {
      title: `Pengingat Vendor: ${vendorName}`,
      body: `${schedule.title} pada ${schedule.date}${schedule.time ? ` pukul ${schedule.time}` : ''} (${leadLabel})`,
      triggerDate,
      data: { eventId: schedule.id, type: 'appointment', vendorName },
    };

    if (scheduler) {
      await scheduler(payload);
    }

    return {
      scheduled: true,
      triggerLabel: leadLabel,
      message: `Pengingat aktif ${leadLabel} untuk "${schedule.title}" (${schedule.date}${
        schedule.time ? ` • ${schedule.time}` : ''
      }).`,
    };
  }
}
