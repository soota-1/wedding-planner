import { calculateDashboardMetrics, DashboardMetrics } from '../../src/services/dashboardService';
import { subscribeToWorkspaceChanges } from '../../src/services/realtimeSync';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

describe('calculateDashboardMetrics', () => {
  it('calculates countdown and task completion percentage correctly', () => {
    const today = new Date('2027-01-01T00:00:00.000Z');
    const weddingDate = new Date('2027-01-11T00:00:00.000Z');
    const tasks = [
      { id: '1', status: 'done', dueDate: new Date('2027-01-05T00:00:00.000Z') },
      { id: '2', status: 'todo', dueDate: new Date('2027-01-08T00:00:00.000Z') },
      { id: '3', status: 'todo', dueDate: new Date('2026-12-31T00:00:00.000Z') }, // overdue
    ];

    const metrics: DashboardMetrics = calculateDashboardMetrics(today, weddingDate, tasks);
    expect(metrics.daysRemaining).toBe(10);
    expect(metrics.completionRate).toBe(33); // 1 of 3 -> Math.round((1/3) * 100) = 33
    expect(metrics.overdueCount).toBe(1);
    expect(metrics.totalTasks).toBe(3);
    expect(metrics.completedTasks).toBe(1);
  });

  it('handles empty tasks list gracefully', () => {
    const today = new Date('2027-01-01T00:00:00.000Z');
    const weddingDate = new Date('2027-01-11T00:00:00.000Z');
    const metrics = calculateDashboardMetrics(today, weddingDate, []);
    expect(metrics.completionRate).toBe(0);
    expect(metrics.totalTasks).toBe(0);
    expect(metrics.overdueCount).toBe(0);
  });
});

describe('subscribeToWorkspaceChanges', () => {
  it('subscribes to postgres changes for workspace and returns unsubscribe function', () => {
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

    const onUpdate = jest.fn();
    const unsubscribe = subscribeToWorkspaceChanges('w-123', onUpdate);

    expect(supabase.channel).toHaveBeenCalledWith('workspace-w-123');
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
