export type CalendarEventType = 'task_deadline' | 'payment_deadline' | 'appointment';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: CalendarEventType;
  amount?: number;
  notes?: string;
  isCompleted?: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  triggerDate: Date;
  data?: Record<string, any>;
}
