import { useWeddingStore } from '../../src/stores/useWeddingStore';
import { CloudSyncService } from '../../src/services/cloudSyncService';

describe('useWeddingStore (Phase 4 Unified Store & Persistence)', () => {
  beforeEach(() => {
    useWeddingStore.getState().resetAllData();
  });

  it('toggles, adds, updates, and deletes checklist tasks', () => {
    const initialCount = useWeddingStore.getState().tasks.length;
    useWeddingStore.getState().addTask({
      title: 'Cetak Undangan Fisik',
      category: 'vendor',
      dueDate: '01 Agu 2027',
      offsetDays: -70,
      priority: 'high',
      pic: 'both',
      completed: false,
    });

    const afterAdd = useWeddingStore.getState().tasks;
    expect(afterAdd.length).toBe(initialCount + 1);
    const created = afterAdd[0];
    expect(created.title).toBe('Cetak Undangan Fisik');

    useWeddingStore.getState().toggleTask(created.id);
    expect(useWeddingStore.getState().tasks.find((t) => t.id === created.id)?.completed).toBe(true);

    useWeddingStore.getState().updateTask(created.id, { title: 'Cetak Undangan VIP' });
    expect(useWeddingStore.getState().tasks.find((t) => t.id === created.id)?.title).toBe('Cetak Undangan VIP');

    useWeddingStore.getState().deleteTask(created.id);
    expect(useWeddingStore.getState().tasks.length).toBe(initialCount);
  });

  it('shifts uncompleted task dates dynamically when weddingDate changes', () => {
    // Task 1 is completed, Task 2 (-150 days) is not completed
    const task1Before = useWeddingStore.getState().tasks.find((t) => t.id === '1')!;
    expect(task1Before.completed).toBe(true);
    const originalCompletedDate = task1Before.dueDate;

    useWeddingStore.getState().updateProfile({
      weddingDate: '2027-12-20T00:00:00.000Z',
    });

    const task1After = useWeddingStore.getState().tasks.find((t) => t.id === '1')!;
    const task2After = useWeddingStore.getState().tasks.find((t) => t.id === '2')!;

    expect(task1After.dueDate).toBe(originalCompletedDate);
    expect(task2After.dueDate).not.toBe('13 Mei 2027');
  });

  it('supports CRUD across budget, guests, gifts, and documents', () => {
    useWeddingStore.getState().addCategory({
      name: 'Souvenir Tamu',
      allocated: 12000000,
      committed: 10000000,
    });
    expect(useWeddingStore.getState().categories.some((c) => c.name === 'Souvenir Tamu')).toBe(true);

    useWeddingStore.getState().addGuest({
      name: 'Romo Paroki',
      side: 'both',
      groupTag: 'Klerus',
      estimatedPax: 1,
      actualPax: 1,
      rsvpStatus: 'attending',
    });
    expect(useWeddingStore.getState().guests[0].name).toBe('Romo Paroki');

    useWeddingStore.getState().addGift({
      senderName: 'Keluarga Besar',
      giftType: 'transfer',
      amount: 3000000,
      receivedBy: 'both',
      thankYouSent: false,
    });
    expect(useWeddingStore.getState().gifts[0].amount).toBe(3000000);

    useWeddingStore.getState().addDocument({
      title: 'Surat Keterangan Belum Menikah',
      documentType: 'Dokumen Sipil',
      category: 'civil_disdukcapil',
      owner: 'groom',
      status: 'verified',
    });
    expect(useWeddingStore.getState().documents[0].title).toBe('Surat Keterangan Belum Menikah');
  });

  it('supports adding, editing, and deleting checklist task categories with icons', () => {
    const initialCatCount = useWeddingStore.getState().taskCategories.length;
    const created = useWeddingStore.getState().addTaskCategory('Seserahan', 'gift-outline');
    expect(useWeddingStore.getState().taskCategories.length).toBe(initialCatCount + 1);
    expect(created.label).toBe('Seserahan');
    expect(created.icon).toBe('gift-outline');

    useWeddingStore.getState().updateTaskCategory(created.id, 'Seserahan & Hantaran', 'flower-outline');
    const updated = useWeddingStore.getState().taskCategories.find((c) => c.id === created.id);
    expect(updated?.label).toBe('Seserahan & Hantaran');
    expect(updated?.icon).toBe('flower-outline');

    useWeddingStore.getState().deleteTaskCategory(created.id);
    expect(useWeddingStore.getState().taskCategories.length).toBe(initialCatCount);
  });

  it('starts moodboardItems empty and validates photo or referenceUrl requirement', async () => {
    expect(useWeddingStore.getState().moodboardItems).toEqual([]);

    await expect(
      useWeddingStore.getState().addMoodboardItemOnline({
        title: 'Tanpa Foto dan Link',
        category: 'decor',
        colorPalette: ['#F8F7F4'],
        isFinal: false,
      })
    ).rejects.toThrow(/foto.*link|referensi/i);
    expect(useWeddingStore.getState().moodboardItems).toEqual([]);
  });

  it('aborts moodboard mutations cleanly when offline without mutating state', async () => {
    jest
      .spyOn(CloudSyncService, 'pushMoodboardItem')
      .mockRejectedValue(
        new Error('Koneksi Internet Diperlukan: Nyalakan data seluler atau Wi-Fi.')
      );

    await expect(
      useWeddingStore.getState().addMoodboardItemOnline({
        title: 'Dekorasi Altar',
        category: 'decor',
        referenceUrl: 'https://pinterest.com/pin/1',
        colorPalette: ['#9E5A47'],
        isFinal: false,
      })
    ).rejects.toThrow(/Nyalakan data seluler atau Wi-Fi/i);

    expect(useWeddingStore.getState().moodboardItems).toEqual([]);
  });

  it('supports online-first add, toggleFinal, update, delete, and empty cloud hydration', async () => {
    const uploadSpy = jest
      .spyOn(CloudSyncService, 'uploadMoodboardImage')
      .mockResolvedValue({
        imageUrl: 'https://cdn.example.com/photo.jpg',
        storagePath: 'ws-1/item-1.jpg',
      });
    const pushSpy = jest.spyOn(CloudSyncService, 'pushMoodboardItem').mockResolvedValue();
    const deleteSpy = jest.spyOn(CloudSyncService, 'deleteMoodboardItem').mockResolvedValue();

    const created = await useWeddingStore.getState().addMoodboardItemOnline(
      {
        title: 'Gaun Pemberkatan',
        category: 'attire',
        colorPalette: ['#F8F7F4', '#B89242'],
        notes: 'Lace klasik lengan panjang',
        vendorId: 'v4',
        isFinal: false,
      },
      'file:///mock-gallery/photo.jpg'
    );

    expect(uploadSpy).toHaveBeenCalled();
    expect(pushSpy).toHaveBeenCalled();
    expect(created.imageUrl).toBe('https://cdn.example.com/photo.jpg');
    expect(useWeddingStore.getState().moodboardItems.length).toBe(1);

    await useWeddingStore.getState().toggleMoodboardFinalOnline(created.id);
    expect(useWeddingStore.getState().moodboardItems[0].isFinal).toBe(true);

    await useWeddingStore.getState().updateMoodboardItemOnline(created.id, {
      title: 'Gaun Pemberkatan Final',
    });
    expect(useWeddingStore.getState().moodboardItems[0].title).toBe('Gaun Pemberkatan Final');

    // Cloud deletion clearing list to []
    useWeddingStore.getState().hydrateFromCloud({ moodboardItems: [] });
    expect(useWeddingStore.getState().moodboardItems).toEqual([]);

    // Re-add then delete online
    const created2 = await useWeddingStore.getState().addMoodboardItemOnline({
      title: 'Makeup Natural',
      category: 'makeup',
      referenceUrl: 'https://instagram.com/p/mua',
      colorPalette: ['#9E5A47'],
      isFinal: true,
    });
    expect(useWeddingStore.getState().moodboardItems.length).toBe(1);

    await useWeddingStore.getState().deleteMoodboardItemOnline(created2.id);
    expect(deleteSpy).toHaveBeenCalledWith(created2.id, undefined);
    expect(useWeddingStore.getState().moodboardItems).toEqual([]);
  });
});
