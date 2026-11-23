import { CalendarEvent, NotificationPayload } from '../types/calendar';

export function mapEventsForTimeline(
  tasks: Array<{ id: string; title: string; dueDate?: Date | string | null; status?: string }>,
  transactions: Array<{
    id: string;
    title: string;
    dueDate?: Date | string | null;
    amount?: number;
    paymentStatus?: string;
  }>
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

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const formatTimelineEvents = mapEventsForTimeline;

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

      const payload: NotificationPayload = {
        title: `Pengingat: ${event.title}`,
        body:
          event.type === 'payment_deadline'
            ? `Jatuh tempo pembayaran sebesar Rp ${(event.amount || 0).toLocaleString('id-ID')} pada ${dateStr}`
            : `Jatuh tempo pada ${dateStr}`,
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
}
