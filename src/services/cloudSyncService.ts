import { format, parseISO, isValid } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../config/supabase';
import { useAuthStore, Workspace } from '../stores/useAuthStore';
import { subscribeToWorkspaceChanges } from './realtimeSync';
import type {
  ChecklistItem,
  TaskCategoryItem,
  CategoryItem,
  VendorItem,
  TransactionItem,
  GuestItem,
  GiftItem,
  DocumentItem,
  MoodboardItem,
} from '../stores/useWeddingStore';

const ONLINE_REQUIRED_MSG =
  'Koneksi Internet Diperlukan: Nyalakan data seluler atau Wi-Fi untuk mengakses & menyinkronkan moodboard online.';

function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const len = clean.length;
  let bufferLength = Math.floor((len * 3) / 4);
  if (clean[len - 1] === '=') bufferLength--;
  if (clean[len - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = chars.indexOf(clean[i]);
    const encoded2 = chars.indexOf(clean[i + 1]);
    const encoded3 = chars.indexOf(clean[i + 2]);
    const encoded4 = chars.indexOf(clean[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (encoded3 !== 64 && clean[i + 2] !== '=') {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (encoded4 !== 64 && clean[i + 3] !== '=') {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }
  return bytes;
}

export interface SyncResult {
  synced: boolean;
  reason?: 'not_configured' | 'not_authenticated' | 'no_workspace' | 'error';
  message: string;
  timestamp?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes('mock-project') &&
    !key.includes('mock-anon-key') &&
    !url.includes('offline-placeholder')
  );
}

function formatDbDate(dateStr?: string | null): string {
  if (!dateStr) return 'Segera';
  const parsed = parseISO(dateStr);
  if (isValid(parsed)) {
    return format(parsed, 'dd MMM yyyy');
  }
  return dateStr;
}

function toIsoDateOnly(displayOrIso?: string): string | null {
  if (!displayOrIso) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(displayOrIso)) {
    return displayOrIso.slice(0, 10);
  }
  const parsed = new Date(displayOrIso);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function getActiveSyncContext(): { workspaceId: string } | null {
  if (!isSupabaseConfigured()) return null;
  const { user, activeWorkspace } = useAuthStore.getState();
  if (!user || !activeWorkspace?.id) return null;
  return { workspaceId: activeWorkspace.id };
}

export class CloudSyncService {
  static async fetchWorkspaceForUser(userId: string): Promise<Workspace | null> {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(id, name, wedding_date, religion_template)')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const ws = (data as any).workspaces;
    if (!ws) return null;

    const workspace: Workspace = {
      id: ws.id,
      name: ws.name,
      wedding_date: ws.wedding_date,
      religion_template: ws.religion_template,
    };

    useAuthStore.getState().setActiveWorkspace(workspace);
    return workspace;
  }

  static async pullWorkspaceSnapshot(workspaceId: string) {
    const [
      wsRes,
      tasksRes,
      taskCatsRes,
      catsRes,
      vendorsRes,
      txRes,
      guestsRes,
      giftsRes,
      docsRes,
      moodboardRes,
    ] = await Promise.all([
      supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
      supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
      supabase
        .from('checklist_categories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true }),
      supabase.from('budget_categories').select('*').eq('workspace_id', workspaceId),
      supabase.from('vendors').select('*').eq('workspace_id', workspaceId),
      supabase.from('transactions').select('*').eq('workspace_id', workspaceId),
      supabase.from('guests').select('*').eq('workspace_id', workspaceId),
      supabase.from('gifts').select('*').eq('workspace_id', workspaceId),
      supabase.from('wedding_documents').select('*').eq('workspace_id', workspaceId),
      supabase
        .from('moodboard_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
    ]);

    const mappedTaskCategories: TaskCategoryItem[] = (taskCatsRes.data || []).map((c: any) => ({
      id: c.id,
      key: c.id,
      label: c.name,
      icon: c.icon || 'bookmark-outline',
    }));

    const mappedTasks: ChecklistItem[] = (tasksRes.data || []).map((t: any) => {
      let resolvedCategory = t.category_id || 'canonical';
      if (!t.category_id) {
        resolvedCategory =
          t.title?.toLowerCase().includes('sipil') || t.title?.toLowerCase().includes('disdukcapil')
            ? 'civil'
            : t.title?.toLowerCase().includes('liturgi') || t.title?.toLowerCase().includes('misa')
            ? 'liturgy'
            : t.title?.toLowerCase().includes('vendor') || t.title?.toLowerCase().includes('katering')
            ? 'vendor'
            : 'canonical';
      }
      return {
        id: t.id,
        title: t.title,
        category: resolvedCategory,
        dueDate: formatDbDate(t.due_date),
        offsetDays: typeof t.offset_days === 'number' ? t.offset_days : -30,
        priority: t.priority || 'medium',
        pic: 'both',
        completed: t.status === 'done',
      };
    });

    const mappedCategories: CategoryItem[] = (catsRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      allocated: Number(c.allocated_amount) || 0,
      committed: 0,
    }));

    const mappedVendors: VendorItem[] = (vendorsRes.data || []).map((v: any) => {
      let parsedSchedules: any[] = [];
      if (v.notes && v.notes.includes('__SCHEDULES__=')) {
        try {
          const parts = v.notes.split('__SCHEDULES__=');
          parsedSchedules = JSON.parse(parts[1] || '[]');
        } catch {
          parsedSchedules = [];
        }
      }
      const cleanNotes = v.notes ? v.notes.split('__SCHEDULES__=')[0].trim() : '';

      return {
        id: v.id,
        name: v.name,
        category: v.category || 'Lainnya',
        contractValue: Number(v.contract_value) || 0,
        status: v.status || 'researching',
        contactPerson: v.contact_person || 'PIC',
        phone: v.phone || undefined,
        email: v.email || undefined,
        socialMedia: v.social_media || undefined,
        notes: cleanNotes || undefined,
        schedules: parsedSchedules.length > 0 ? parsedSchedules : undefined,
      };
    });

    const mappedTransactions: TransactionItem[] = (txRes.data || []).map((tx: any) => ({
      id: tx.id,
      vendorName: tx.notes || 'Vendor',
      amount: Number(tx.amount) || 0,
      paidBy:
        tx.paid_by === 'groom'
          ? 'groom'
          : tx.paid_by === 'bride'
          ? 'bride'
          : 'family',
      status: tx.payment_status === 'paid' ? 'paid' : 'pending',
      date: formatDbDate(tx.payment_date || tx.due_date),
      notes: tx.title || 'Pembayaran',
    }));

    const mappedGuests: GuestItem[] = (guestsRes.data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      side: g.side || 'both',
      groupTag: g.group_tag || 'Umum',
      estimatedPax: Number(g.estimated_pax) || 1,
      actualPax: Number(g.actual_pax) || 0,
      rsvpStatus: g.rsvp_status || 'pending',
    }));

    const mappedGifts: GiftItem[] = (giftsRes.data || []).map((gf: any) => ({
      id: gf.id,
      senderName: gf.sender_name,
      giftType: gf.gift_type || 'transfer',
      amount: Number(gf.amount) || 0,
      giftDescription: gf.gift_description || undefined,
      receivedBy: gf.received_by || 'both',
      thankYouSent: !!gf.thank_you_sent,
    }));

    const mappedDocuments: DocumentItem[] = (docsRes.data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      documentType: d.document_type || 'other',
      category:
        d.category === 'civil_disdukcapil' ? 'civil_disdukcapil' : 'church_canonical',
      owner: d.owner || 'both',
      issueDate: d.issue_date ? formatDbDate(d.issue_date) : undefined,
      status: d.status === 'rejected' ? 'expired' : d.status || 'pending',
      notes: d.notes || undefined,
    }));

    const mappedMoodboard: MoodboardItem[] = (moodboardRes.data || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      category: m.category || 'other',
      imageUrl: m.image_url || undefined,
      storagePath: m.storage_path || undefined,
      referenceUrl: m.reference_url || undefined,
      colorPalette: Array.isArray(m.color_palette) ? m.color_palette : [],
      notes: m.notes || undefined,
      vendorId: m.vendor_id || undefined,
      isFinal: !!m.is_final,
      createdBy: m.created_by === 'groom' || m.created_by === 'bride' ? m.created_by : undefined,
      createdAt: m.created_at || new Date().toISOString(),
    }));

    return {
      workspace: wsRes.data || null,
      taskCategories: mappedTaskCategories,
      tasks: mappedTasks,
      categories: mappedCategories,
      vendors: mappedVendors,
      transactions: mappedTransactions,
      guests: mappedGuests,
      gifts: mappedGifts,
      documents: mappedDocuments,
      moodboardItems: mappedMoodboard,
    };
  }

  static async syncNow(
    onHydrate?: (snapshot: Awaited<ReturnType<typeof CloudSyncService.pullWorkspaceSnapshot>>) => void
  ): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
      return {
        synced: false,
        reason: 'not_configured',
        message: 'Mode Lokal Offline: variabel .env Supabase belum dikonfigurasi.',
      };
    }

    const { user, activeWorkspace } = useAuthStore.getState();
    if (!user) {
      return {
        synced: false,
        reason: 'not_authenticated',
        message: 'Silakan masuk dengan akun pasangan untuk menyinkronkan ke cloud.',
      };
    }

    let workspace = activeWorkspace;
    if (!workspace) {
      workspace = await this.fetchWorkspaceForUser(user.id);
    }

    if (!workspace) {
      return {
        synced: false,
        reason: 'no_workspace',
        message: 'Workspace pernikahan belum ditemukan untuk akun ini.',
      };
    }

    try {
      const snapshot = await this.pullWorkspaceSnapshot(workspace.id);
      if (onHydrate) {
        onHydrate(snapshot);
      }
      return {
        synced: true,
        message: `Tersinkron dengan workspace "${workspace.name}"`,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        synced: false,
        reason: 'error',
        message: err?.message || 'Gagal menyinkronkan data dengan Supabase.',
      };
    }
  }

  // =========================================================================
  // WRITE-THROUGH CLOUD SYNC HELPERS (Fire-and-forget when online)
  // =========================================================================

  static async pushTask(task: ChecklistItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(task.id)) return;
    const categoryId = isValidUuid(task.category) ? task.category : null;
    await supabase.from('tasks').upsert({
      id: task.id,
      workspace_id: ctx.workspaceId,
      category_id: categoryId,
      title: task.title,
      status: task.completed ? 'done' : 'todo',
      priority: task.priority,
      offset_days: task.offsetDays,
      due_date: toIsoDateOnly(task.dueDate),
      completed_at: task.completed ? new Date().toISOString() : null,
    });
  }

  static async deleteTask(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase.from('tasks').delete().eq('id', id).eq('workspace_id', ctx.workspaceId);
  }

  static async pushTaskCategory(cat: TaskCategoryItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(cat.id)) return;
    await supabase.from('checklist_categories').upsert({
      id: cat.id,
      workspace_id: ctx.workspaceId,
      name: cat.label,
      icon: cat.icon || 'bookmark-outline',
    });
  }

  static async deleteTaskCategory(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase
      .from('checklist_categories')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId);
  }

  static async pushCategory(cat: CategoryItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(cat.id)) return;
    await supabase.from('budget_categories').upsert({
      id: cat.id,
      workspace_id: ctx.workspaceId,
      name: cat.name,
      allocated_amount: cat.allocated,
    });
  }

  static async deleteCategory(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase
      .from('budget_categories')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId);
  }

  static async pushVendor(vendor: VendorItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(vendor.id)) return;
    const combinedNotes = vendor.schedules && vendor.schedules.length > 0
      ? `${vendor.notes || ''}\n__SCHEDULES__=${JSON.stringify(vendor.schedules)}`.trim()
      : vendor.notes || null;

    await supabase.from('vendors').upsert({
      id: vendor.id,
      workspace_id: ctx.workspaceId,
      name: vendor.name,
      category: vendor.category,
      contract_value: vendor.contractValue,
      status: vendor.status,
      contact_person: vendor.contactPerson,
      phone: vendor.phone || null,
      email: vendor.email || null,
      social_media: vendor.socialMedia || null,
      notes: combinedNotes,
    });
  }

  static async deleteVendor(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase.from('vendors').delete().eq('id', id).eq('workspace_id', ctx.workspaceId);
  }

  static async pushTransaction(tx: TransactionItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(tx.id)) return;
    await supabase.from('transactions').upsert({
      id: tx.id,
      workspace_id: ctx.workspaceId,
      title: tx.notes,
      amount: tx.amount,
      transaction_type: 'other',
      payment_status: tx.status,
      paid_by: tx.paidBy === 'family' ? 'family_groom' : tx.paidBy,
      payment_date: toIsoDateOnly(tx.date),
      notes: tx.vendorName,
    });
  }

  static async deleteTransaction(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase.from('transactions').delete().eq('id', id).eq('workspace_id', ctx.workspaceId);
  }

  static async pushGuest(guest: GuestItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(guest.id)) return;
    await supabase.from('guests').upsert({
      id: guest.id,
      workspace_id: ctx.workspaceId,
      name: guest.name,
      side: guest.side,
      group_tag: guest.groupTag,
      estimated_pax: guest.estimatedPax,
      actual_pax: guest.actualPax,
      rsvp_status: guest.rsvpStatus,
    });
  }

  static async deleteGuest(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase.from('guests').delete().eq('id', id).eq('workspace_id', ctx.workspaceId);
  }

  static async pushGift(gift: GiftItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(gift.id)) return;
    await supabase.from('gifts').upsert({
      id: gift.id,
      workspace_id: ctx.workspaceId,
      sender_name: gift.senderName,
      gift_type: gift.giftType,
      amount: gift.amount,
      gift_description: gift.giftDescription || null,
      received_by: gift.receivedBy,
      thank_you_sent: gift.thankYouSent,
    });
  }

  static async deleteGift(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase.from('gifts').delete().eq('id', id).eq('workspace_id', ctx.workspaceId);
  }

  static async pushDocument(doc: DocumentItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(doc.id)) return;
    const validDbType =
      doc.documentType === 'baptism_certificate' ||
      doc.documentType === 'kpp_certificate' ||
      doc.documentType === 'civil_n1_n4'
        ? doc.documentType
        : 'other';

    await supabase.from('wedding_documents').upsert({
      id: doc.id,
      workspace_id: ctx.workspaceId,
      title: doc.title,
      document_type: validDbType,
      category: doc.category,
      owner: doc.owner,
      issue_date: toIsoDateOnly(doc.issueDate),
      status: doc.status,
      notes: doc.notes || null,
    });
  }

  static async deleteDocument(id: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) return;
    await supabase
      .from('wedding_documents')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId);
  }

  static async uploadMoodboardImage(
    localUri: string,
    itemId: string
  ): Promise<{ imageUrl: string; storagePath: string }> {
    const ctx = getActiveSyncContext();
    if (!ctx) {
      throw new Error(ONLINE_REQUIRED_MSG);
    }

    const storagePath = `${ctx.workspaceId}/${itemId}.jpg`;
    try {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType?.Base64 || ('base64' as any),
      });
      const bytes = base64ToUint8Array(base64);

      const { error: uploadErr } = await supabase.storage
        .from('moodboard-assets')
        .upload(storagePath, bytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`${ONLINE_REQUIRED_MSG} (${uploadErr.message})`);
      }

      const { data: pubData } = supabase.storage
        .from('moodboard-assets')
        .getPublicUrl(storagePath);

      if (!pubData?.publicUrl) {
        throw new Error(ONLINE_REQUIRED_MSG);
      }

      return { imageUrl: pubData.publicUrl, storagePath };
    } catch (err: any) {
      if (err?.message?.includes('Nyalakan data seluler')) {
        throw err;
      }
      throw new Error(ONLINE_REQUIRED_MSG);
    }
  }

  static async pushMoodboardItem(item: MoodboardItem): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(item.id)) {
      throw new Error(ONLINE_REQUIRED_MSG);
    }

    const vendorId = item.vendorId && isValidUuid(item.vendorId) ? item.vendorId : null;
    const { error } = await supabase.from('moodboard_items').upsert({
      id: item.id,
      workspace_id: ctx.workspaceId,
      vendor_id: vendorId,
      title: item.title,
      category: item.category,
      image_url: item.imageUrl || null,
      storage_path: item.storagePath || null,
      reference_url: item.referenceUrl || null,
      color_palette: item.colorPalette || [],
      notes: item.notes || null,
      is_final: !!item.isFinal,
      created_by: item.createdBy || null,
      created_at: item.createdAt,
    });

    if (error) {
      throw new Error(`${ONLINE_REQUIRED_MSG} (${error.message})`);
    }
  }

  static async deleteMoodboardItem(id: string, storagePath?: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx || !isValidUuid(id)) {
      throw new Error(ONLINE_REQUIRED_MSG);
    }

    const { error } = await supabase
      .from('moodboard_items')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId);

    if (error) {
      throw new Error(`${ONLINE_REQUIRED_MSG} (${error.message})`);
    }

    if (storagePath) {
      await supabase.storage.from('moodboard-assets').remove([storagePath]).catch(() => {});
    }
  }

  static async updateWorkspaceWeddingDate(weddingDateIso: string): Promise<void> {
    const ctx = getActiveSyncContext();
    if (!ctx) return;
    const dateOnly = toIsoDateOnly(weddingDateIso);
    if (!dateOnly) return;
    await supabase
      .from('workspaces')
      .update({ wedding_date: dateOnly })
      .eq('id', ctx.workspaceId);
  }

  static startRealtimeSync(
    workspaceId: string,
    onRemoteChange: (table: string) => void
  ): () => void {
    if (!isSupabaseConfigured() || !workspaceId) {
      return () => {};
    }
    return subscribeToWorkspaceChanges(workspaceId, (payload) => {
      onRemoteChange(payload?.table || 'unknown');
    });
  }
}
