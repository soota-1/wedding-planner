import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking, Share } from 'react-native';
import {
  selectItemsForBrief,
  formatMoodboardCaption,
  shareSingleMoodboardItem,
  exportMoodboardBriefPdf,
} from '../../src/services/moodboardShareService';
import type { MoodboardItem, VendorItem, WeddingProfile } from '../../src/stores/useWeddingStore';

const sampleProfile: WeddingProfile = {
  groomName: 'Octa',
  brideName: 'Jenesia',
  weddingDate: '2027-10-10T00:00:00.000Z',
  parishName: 'Paroki St. Perawan Maria',
};

const sampleVendor: VendorItem = {
  id: 'v4',
  name: 'Sanggar Rias & Gaun Pengantin',
  category: 'Busana',
  contractValue: 15000000,
  status: 'booked',
  contactPerson: 'Cindy',
  phone: '087788990011',
};

describe('MoodboardShareService (Task 5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects only Final items when >= 1 Final exists, otherwise all items', () => {
    const items: MoodboardItem[] = [
      {
        id: 'm1',
        title: 'Draft 1',
        category: 'decor',
        referenceUrl: 'https://pin.it/1',
        colorPalette: ['#F8F7F4'],
        isFinal: false,
        createdAt: '2026-11-25T10:00:00Z',
      },
      {
        id: 'm2',
        title: 'Final 1',
        category: 'decor',
        referenceUrl: 'https://pin.it/2',
        colorPalette: ['#9E5A47'],
        isFinal: true,
        createdAt: '2026-11-25T10:01:00Z',
      },
    ];

    expect(selectItemsForBrief(items).map((i) => i.id)).toEqual(['m2']);
    expect(selectItemsForBrief([{ ...items[0], isFinal: false }]).length).toBe(1);
  });

  it('shares image via Sharing.shareAsync after copying formatted caption to clipboard', async () => {
    const item: MoodboardItem = {
      id: 'm1',
      title: 'Pelaminan Minimalis',
      category: 'decor',
      imageUrl: 'https://cdn.example.com/decor.jpg',
      referenceUrl: 'https://pinterest.com/pin/1',
      colorPalette: ['#F8F7F4', '#9E5A47'],
      notes: 'Nuansa putih hangat & terracotta',
      isFinal: true,
      createdAt: '2026-11-25T10:00:00Z',
    };

    const res = await shareSingleMoodboardItem(item, sampleVendor);
    expect(res.ok).toBe(true);
    expect(res.mode).toBe('image_with_clipboard');
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('Pelaminan Minimalis')
    );
    expect(FileSystem.downloadAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///mock-cache/downloaded.jpg',
      expect.any(Object)
    );
  });

  it('handles offline download error gracefully without calling Sharing.shareAsync', async () => {
    (FileSystem.downloadAsync as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const item: MoodboardItem = {
      id: 'm1',
      title: 'Dekorasi Altar',
      category: 'decor',
      imageUrl: 'https://cdn.example.com/decor.jpg',
      colorPalette: ['#F8F7F4'],
      isFinal: false,
      createdAt: '2026-11-25T10:00:00Z',
    };

    const res = await shareSingleMoodboardItem(item);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/Nyalakan data seluler atau Wi-Fi/i);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('opens WhatsApp link when sharing link-only item with vendor phone, or Share sheet otherwise', async () => {
    const linkItem: MoodboardItem = {
      id: 'm2',
      title: 'Referensi Kebaya',
      category: 'attire',
      referenceUrl: 'https://instagram.com/p/kebaya',
      colorPalette: ['#B89242'],
      isFinal: true,
      createdAt: '2026-11-25T10:00:00Z',
    };

    const waRes = await shareSingleMoodboardItem(linkItem, sampleVendor);
    expect(waRes.ok).toBe(true);
    expect(waRes.mode).toBe('whatsapp_text');
    expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/6287788990011'));

    const textRes = await shareSingleMoodboardItem(linkItem);
    expect(textRes.ok).toBe(true);
    expect(textRes.mode).toBe('text_share');
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Referensi Kebaya') })
    );
  });

  it('aborts PDF export cleanly when 0 items match without invoking Print', async () => {
    const res = await exportMoodboardBriefPdf({
      items: [],
      scopeTitle: 'Dekorasi',
      profile: sampleProfile,
    });
    expect(res.ok).toBe(false);
    expect(res.exportedCount).toBe(0);
    expect(Print.printToFileAsync).not.toHaveBeenCalled();
  });

  it('generates and shares editorial Brief PDF prioritizing Final items', async () => {
    const items: MoodboardItem[] = [
      {
        id: 'm1',
        title: 'Gaun Draft',
        category: 'attire',
        referenceUrl: 'https://pin.it/draft',
        colorPalette: ['#F8F7F4'],
        isFinal: false,
        createdAt: '2026-11-25T10:00:00Z',
      },
      {
        id: 'm2',
        title: 'Gaun Pemberkatan Final',
        category: 'attire',
        imageUrl: 'https://cdn.example.com/gaun.jpg',
        colorPalette: ['#F8F7F4', '#B89242'],
        notes: 'Veil panjang 2 meter',
        isFinal: true,
        createdAt: '2026-11-25T10:01:00Z',
      },
    ];

    const res = await exportMoodboardBriefPdf({
      items,
      scopeTitle: 'Sanggar Rias & Gaun Pengantin',
      profile: sampleProfile,
      vendor: sampleVendor,
    });

    expect(res.ok).toBe(true);
    expect(res.exportedCount).toBe(1);
    expect(Print.printToFileAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Gaun Pemberkatan Final'),
      })
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///mock-print/brief.pdf',
      expect.any(Object)
    );
  });
});
