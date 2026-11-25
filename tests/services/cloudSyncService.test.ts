import { CloudSyncService, isSupabaseConfigured } from '../../src/services/cloudSyncService';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { supabase } from '../../src/config/supabase';

describe('CloudSyncService (Phase 5)', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    jest.restoreAllMocks();
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
    const mockEq = jest.fn().mockResolvedValue({ data: [{ id: 'row-1' }], error: null });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const snapshot = await CloudSyncService.pullWorkspaceSnapshot('ws-123');
    expect(snapshot.tasks.length).toBe(1);
    expect(snapshot.guests.length).toBe(1);
    expect(snapshot.documents.length).toBe(1);
  });
});
