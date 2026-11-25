import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking, Share } from 'react-native';
import type {
  MoodboardCategory,
  MoodboardItem,
  VendorItem,
  WeddingProfile,
} from '../stores/useWeddingStore';

const CATEGORY_LABELS: Record<MoodboardCategory, string> = {
  decor: 'Dekorasi',
  attire: 'Busana',
  makeup: 'MUA & Rias',
  photo: 'Foto & Video',
  other: 'Lainnya',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function selectItemsForBrief(items: MoodboardItem[]): MoodboardItem[] {
  const finalItems = items.filter((item) => item.isFinal);
  return finalItems.length > 0 ? finalItems : items;
}

export function formatMoodboardCaption(item: MoodboardItem, vendorName?: string): string {
  const lines: string[] = [
    `*${item.title}* (${CATEGORY_LABELS[item.category] || item.category})`,
  ];
  if (vendorName) {
    lines.push(`Vendor: ${vendorName}`);
  }
  if (item.colorPalette && item.colorPalette.length > 0) {
    lines.push(`Palet Warna: ${item.colorPalette.join(', ')}`);
  }
  if (item.notes?.trim()) {
    lines.push(`Catatan: ${item.notes.trim()}`);
  }
  if (item.referenceUrl?.trim()) {
    lines.push(`Link Referensi: ${item.referenceUrl.trim()}`);
  }
  if (item.isFinal) {
    lines.push('Status: ★ Final Disepakati');
  }
  return lines.join('\n');
}

export async function shareSingleMoodboardItem(
  item: MoodboardItem,
  vendor?: VendorItem
): Promise<{
  ok: boolean;
  mode: 'image_with_clipboard' | 'whatsapp_text' | 'text_share';
  message: string;
}> {
  const caption = formatMoodboardCaption(item, vendor?.name);

  if (item.imageUrl) {
    try {
      const targetUri = `${FileSystem.cacheDirectory || ''}moodboard-${item.id}.jpg`;
      const downloaded = await FileSystem.downloadAsync(item.imageUrl, targetUri);
      await Clipboard.setStringAsync(caption);
      await Sharing.shareAsync(downloaded.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Bagikan "${item.title}" ke Vendor`,
      });
      return {
        ok: true,
        mode: 'image_with_clipboard',
        message: 'Catatan & link sudah disalin ke clipboard — tinggal Paste saat kirim foto di WhatsApp vendor.',
      };
    } catch {
      return {
        ok: false,
        mode: 'image_with_clipboard',
        message:
          'Gagal mengunduh foto referensi. Nyalakan data seluler atau Wi-Fi untuk membagikan gambar online.',
      };
    }
  }

  if (vendor?.phone) {
    const cleanPhone = vendor.phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(caption)}`;
    await Linking.openURL(url);
    return {
      ok: true,
      mode: 'whatsapp_text',
      message: `Membuka chat WhatsApp ${vendor.name} dengan catatan & link referensi.`,
    };
  }

  await Share.share({ message: caption });
  return {
    ok: true,
    mode: 'text_share',
    message: 'Referensi siap dibagikan.',
  };
}

export async function exportMoodboardBriefPdf(params: {
  items: MoodboardItem[];
  scopeTitle: string;
  profile: WeddingProfile;
  vendor?: VendorItem;
}): Promise<{ ok: boolean; uri?: string; exportedCount: number; message: string }> {
  const selected = selectItemsForBrief(params.items);
  if (selected.length === 0) {
    return {
      ok: false,
      exportedCount: 0,
      message: 'Belum ada referensi moodboard pada pilihan ini untuk diekspor ke PDF.',
    };
  }

  const coupleTitle = `${escapeHtml(params.profile.groomName)} & ${escapeHtml(
    params.profile.brideName
  )}`;
  const scopeLabel = escapeHtml(params.scopeTitle);
  const weddingDateLabel = params.profile.weddingDate.slice(0, 10);

  const cardsHtml = selected
    .map((item) => {
      const catLabel = escapeHtml(CATEGORY_LABELS[item.category] || item.category);
      const swatchesHtml = (item.colorPalette || [])
        .map(
          (hex) =>
            `<span style="display:inline-flex;align-items:center;margin-right:8px;font-size:11px;color:#444;">
              <span style="display:inline-block;width:12px;height:12px;border-radius:6px;background:${escapeHtml(
                hex
              )};border:1px solid #d6d1c7;margin-right:4px;"></span>
              ${escapeHtml(hex)}
            </span>`
        )
        .join('');

      const imageHtml = item.imageUrl
        ? `<img src="${escapeHtml(
            item.imageUrl
          )}" style="width:100%;max-height:240px;object-fit:cover;border-radius:10px;margin-bottom:10px;" />`
        : '';

      const refHtml = item.referenceUrl
        ? `<p style="font-size:11px;color:#9E5A47;margin:6px 0 0;word-break:break-all;">Link Referensi: ${escapeHtml(
            item.referenceUrl
          )}</p>`
        : '';

      const notesHtml = item.notes
        ? `<p style="font-size:12px;color:#333;line-height:1.5;margin:6px 0 0;">${escapeHtml(
            item.notes
          )}</p>`
        : '';

      return `
        <div style="border:1px solid #E9E6DF;border-radius:14px;padding:14px;margin-bottom:14px;background:#FFFFFF;page-break-inside:avoid;">
          ${imageHtml}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="font-size:15px;color:#111318;">${escapeHtml(item.title)}</strong>
            <span style="font-size:11px;padding:3px 8px;border-radius:999px;background:${
              item.isFinal ? '#F6ECE9' : '#F1EFEA'
            };color:${item.isFinal ? '#9E5A47' : '#646873'};font-weight:600;">
              ${item.isFinal ? '★ Final • ' : ''}${catLabel}
            </span>
          </div>
          ${swatchesHtml ? `<div style="margin:6px 0;">${swatchesHtml}</div>` : ''}
          ${notesHtml}
          ${refHtml}
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8F7F4; color: #111318; padding: 24px; }
        </style>
      </head>
      <body>
        <div style="border-bottom:2px solid #9E5A47;padding-bottom:12px;margin-bottom:18px;">
          <div style="font-size:11px;letter-spacing:1.2px;color:#9E5A47;font-weight:700;text-transform:uppercase;">
            Brief Referensi Visual Pernikahan
          </div>
          <h1 style="margin:4px 0 4px;font-size:22px;color:#111318;">${scopeLabel}</h1>
          <div style="font-size:12px;color:#646873;">
            Pasangan: ${coupleTitle} • Target Hari H: ${escapeHtml(weddingDateLabel)} • Total Referensi: ${
    selected.length
  }
          </div>
        </div>
        ${cardsHtml}
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Kirim Brief PDF — ${params.scopeTitle}`,
    });
    return {
      ok: true,
      uri,
      exportedCount: selected.length,
      message: `Brief PDF (${selected.length} referensi) siap dikirim ke vendor.`,
    };
  } catch {
    return {
      ok: false,
      exportedCount: 0,
      message:
        'Gagal menyusun Brief PDF. Pastikan koneksi internet aktif agar gambar referensi dapat dimuat.',
    };
  }
}
