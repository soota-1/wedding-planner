import { mapEventsForTimeline, formatTimelineEvents, NotificationService } from '../../src/services/notificationService';
import { CalendarEvent } from '../../src/types/calendar';

describe('mapEventsForTimeline & formatTimelineEvents', () => {
  it('combines task deadlines and payment due dates into sorted timeline events', () => {
    const tasks = [
      { id: 't1', title: 'Penyelidikan Kanonik', dueDate: new Date('2027-07-12T00:00:00.000Z') },
    ];
    const transactions = [
      { id: 'tr1', title: 'Pelunasan Katering', dueDate: new Date('2027-09-01T00:00:00.000Z'), amount: 40000000 },
    ];

    const events: CalendarEvent[] = mapEventsForTimeline(tasks, transactions);
    expect(events.length).toBe(2);
    expect(events[0].type).toBe('task_deadline');
    expect(events[0].title).toBe('Penyelidikan Kanonik');
    expect(events[1].type).toBe('payment_deadline');
    expect(events[1].title).toBe('Pelunasan Katering');
    expect(events[1].amount).toBe(40000000);
  });

  it('sorts timeline events by date ascending', () => {
    const tasks = [
      { id: 't2', title: 'Misa Perkawinan', dueDate: new Date('2027-10-10T00:00:00.000Z') },
      { id: 't1', title: 'KPP', dueDate: new Date('2027-04-13T00:00:00.000Z') },
    ];
    const transactions = [
      { id: 'tr1', title: 'DP Gedung', dueDate: new Date('2027-05-01T00:00:00.000Z'), amount: 15000000 },
    ];

    const events = formatTimelineEvents(tasks, transactions);
    expect(events.length).toBe(3);
    expect(events[0].title).toBe('KPP');
    expect(events[1].title).toBe('DP Gedung');
    expect(events[2].title).toBe('Misa Perkawinan');
  });
});

describe('NotificationService scheduling', () => {
  it('schedules notifications for upcoming events', async () => {
    const events: CalendarEvent[] = [
      {
        id: 'e1',
        title: 'Kanonik',
        date: new Date('2027-07-12T00:00:00.000Z'),
        type: 'task_deadline',
      },
    ];

    const mockScheduler = jest.fn().mockResolvedValue('notif-id-1');
    const result = await NotificationService.scheduleUpcomingReminders(events, mockScheduler);
    expect(result.length).toBe(1);
    expect(mockScheduler).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pengingat: Kanonik',
        body: expect.stringContaining('Jatuh tempo pada 2027-07-12'),
      })
    );
  });
});
