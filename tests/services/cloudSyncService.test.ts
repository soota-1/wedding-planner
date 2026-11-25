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
      taskCategories: [
        {
          id: '55555555-4444-4444-4444-444444444444',
          key: '55555555-4444-4444-4444-444444444444',
          label: 'Seserahan & Lamaran',
        },
      ],
      tasks: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Cloud Task',
          category: '55555555-4444-4444-4444-444444444444',
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
    expect(
      useWeddingStore.getState().taskCategories.some((c) => c.label === 'Seserahan & Lamaran')
    ).toBe(true);
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

  it('pulls workspace snapshot across all tables including checklist categories', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [{ id: 'cat-1', name: 'Seserahan' }],
      error: null,
    });
    const mockEq = jest.fn(() => {
      const p: any = Promise.resolve({
        data: [{ id: 'row-1', title: 'Test', name: 'Test', sender_name: 'Test' }],
        error: null,
      });
      p.single = jest.fn().mockResolvedValue({
        data: { id: 'ws-123', wedding_date: '2027-10-10' },
        error: null,
      });
      p.order = mockOrder;
      return p;
    });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const snapshot = await CloudSyncService.pullWorkspaceSnapshot('ws-123');
    expect(snapshot.workspace?.id).toBe('ws-123');
    expect(snapshot.taskCategories.length).toBe(1);
    expect(snapshot.taskCategories[0].label).toBe('Seserahan');
    expect(snapshot.tasks.length).toBe(1);
    expect(snapshot.guests.length).toBe(1);
    expect(snapshot.documents.length).toBe(1);
  });

  it('pulls moodboard_items with colorPalette, vendorId, and isFinal in pullWorkspaceSnapshot', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Pelaminan Minimalis',
          category: 'decor',
          image_url: 'https://cdn.example.com/decor.jpg',
          storage_path: 'ws-123/11111111-1111-1111-1111-111111111111.jpg',
          reference_url: 'https://pinterest.com/pin/123',
          color_palette: ['#F8F7F4', '#9E5A47'],
          notes: 'Bunga putih + daun olive',
          vendor_id: 'v1',
          is_final: true,
          created_by: 'bride',
          created_at: '2026-11-25T10:00:00.000Z',
        },
      ],
      error: null,
    });
    const mockEq = jest.fn(() => {
      const p: any = Promise.resolve({ data: [], error: null });
      p.single = jest.fn().mockResolvedValue({
        data: { id: 'ws-123', wedding_date: '2027-10-10' },
        error: null,
      });
      p.order = mockOrder;
      return p;
    });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const snapshot = await CloudSyncService.pullWorkspaceSnapshot('ws-123');
    expect(snapshot.moodboardItems.length).toBe(1);
    expect(snapshot.moodboardItems[0]).toMatchObject({
      title: 'Pelaminan Minimalis',
      category: 'decor',
      colorPalette: ['#F8F7F4', '#9E5A47'],
      vendorId: 'v1',
      isFinal: true,
    });
  });

  it('throws clear online-required error when pushing or deleting moodboard item offline', async () => {
    await expect(
      CloudSyncService.pushMoodboardItem({
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Dekorasi Altar',
        category: 'decor',
        referenceUrl: 'https://instagram.com/p/abc',
        colorPalette: ['#9E5A47'],
        isFinal: false,
        createdAt: '2026-11-25T10:00:00.000Z',
      })
    ).rejects.toThrow(/Nyalakan data seluler atau Wi-Fi/i);

    await expect(
      CloudSyncService.deleteMoodboardItem('11111111-1111-1111-1111-111111111111')
    ).rejects.toThrow(/Nyalakan data seluler atau Wi-Fi/i);
  });

  it('uploads moodboard image to Supabase Storage bucket moodboard-assets', async () => {
    const prevUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://real-project.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'real-anon-key-123456';

    try {
      useAuthStore.getState().setUser({ id: 'u1', email: 'jenesia23@gmail.com' } as any);
      useAuthStore.getState().setActiveWorkspace({
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Octa & Jenesia',
        wedding_date: '2027-10-10',
        religion_template: 'catholic',
      });

      const mockUpload = jest.fn().mockResolvedValue({ data: { path: '33333333-3333-3333-3333-333333333333/item-1.jpg' }, error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://real-project.supabase.co/storage/v1/object/public/moodboard-assets/33333333-3333-3333-3333-333333333333/item-1.jpg' },
      });
      jest.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as any);

      const res = await CloudSyncService.uploadMoodboardImage('file:///photo.jpg', 'item-1');
      expect(mockUpload).toHaveBeenCalled();
      expect(res.storagePath).toContain('33333333-3333-3333-3333-333333333333/item-1');
      expect(res.imageUrl).toContain('moodboard-assets');
    } finally {
      process.env.EXPO_PUBLIC_SUPABASE_URL = prevUrl;
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    }
  });

  it('throws error in pullWorkspaceSnapshot if moodboard_items query returns an error', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Network timeout' },
    });
    const mockEq = jest.fn(() => {
      const p: any = Promise.resolve({ data: [], error: null });
      p.single = jest.fn().mockResolvedValue({
        data: { id: 'ws-123', wedding_date: '2027-10-10' },
        error: null,
      });
      p.order = mockOrder;
      return p;
    });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    jest.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    await expect(CloudSyncService.pullWorkspaceSnapshot('ws-123')).rejects.toThrow(
      /Network timeout/i
    );
  });
});
