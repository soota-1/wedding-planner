import { CloudSyncService, isSupabaseConfigured, isValidUuid } from '../../src/services/cloudSyncService';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useWeddingStore } from '../../src/stores/useWeddingStore';
import { supabase } from '../../src/config/supabase';

describe('CloudSyncService (Phase 5 & 6A)', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    useWeddingStore.getState().resetAllData();
    jest.restoreAllMocks();
  });

  it('validates UUIDs properly for PostgreSQL sync', () => {
    expect(isValidUuid('11111111-1111-1111-1111-111111111111')).toBe(true);
    expect(isValidUuid('1')).toBe(false);
    expect(isValidUuid('1732528492000')).toBe(false);
  });

  it('hydrates useWeddingStore from cloud snapshot', () => {
    useWeddingStore.getState().hydrateFromCloud({
      workspace: { wedding_date: '2027-12-25' },
      tasks: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Cloud Task',
          category: 'canonical',
          dueDate: '01 Des 2027',
          offsetDays: -24,
          priority: 'high',
          pic: 'both',
          completed: true,
        },
      ],
    });
    expect(useWeddingStore.getState().profile.weddingDate).toBe('2027-12-25T00:00:00.000Z');
    expect(useWeddingStore.getState().tasks[0].title).toBe('Cloud Task');
  });

  it('returns not_configured when using mock or empty Supabase env', async () => {
    expect(isSupabaseConfigured()).toBe(false);
    const result = await CloudSyncService.syncNow();
    expect(result.synced).toBe(false);
    expect(result.reason).toBe('not_configured');
  });

  it('fetches workspace for authenticated user', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        workspace_id: 'ws-123',
        workspaces: {
          id: 'ws-123',
          name: 'Octa & Jenesia Wedding',
          wedding_date: '2027-10-10',
          religion_template: 'catholic',
        },
      },
      error: null,
    });
    const mockLimit = jest.fn(() => ({ single: mockSingle }));
    const mockEq = jest.fn(() => ({ limit: mockLimit }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const ws = await CloudSyncService.fetchWorkspaceForUser('user-1');
    expect(ws).not.toBeNull();
    expect(ws?.id).toBe('ws-123');
    expect(useAuthStore.getState().activeWorkspace?.name).toBe('Octa & Jenesia Wedding');
  });

  it('pulls workspace snapshot across all 7 tables', async () => {
    const mockEq = jest.fn(() => {
      const p: any = Promise.resolve({
        data: [{ id: 'row-1', title: 'Test', name: 'Test', sender_name: 'Test' }],
        error: null,
      });
      p.single = jest.fn().mockResolvedValue({
        data: { id: 'ws-123', wedding_date: '2027-10-10' },
        error: null,
      });
      return p;
    });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const snapshot = await CloudSyncService.pullWorkspaceSnapshot('ws-123');
    expect(snapshot.workspace?.id).toBe('ws-123');
    expect(snapshot.tasks.length).toBe(1);
    expect(snapshot.guests.length).toBe(1);
    expect(snapshot.documents.length).toBe(1);
  });
});
