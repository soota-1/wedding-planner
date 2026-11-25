import { supabase } from '../config/supabase';
import { useAuthStore, Workspace } from '../stores/useAuthStore';
import { subscribeToWorkspaceChanges } from './realtimeSync';

export interface SyncResult {
  synced: boolean;
  reason?: 'not_configured' | 'not_authenticated' | 'no_workspace' | 'error';
  message: string;
  timestamp?: string;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes('mock-project') &&
    !key.includes('mock-anon-key')
  );
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
    const [tasksRes, catsRes, vendorsRes, txRes, guestsRes, giftsRes, docsRes] =
      await Promise.all([
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId),
        supabase.from('budget_categories').select('*').eq('workspace_id', workspaceId),
        supabase.from('vendors').select('*').eq('workspace_id', workspaceId),
        supabase.from('transactions').select('*').eq('workspace_id', workspaceId),
        supabase.from('guests').select('*').eq('workspace_id', workspaceId),
        supabase.from('gifts').select('*').eq('workspace_id', workspaceId),
        supabase.from('wedding_documents').select('*').eq('workspace_id', workspaceId),
      ]);

    return {
      tasks: tasksRes.data || [],
      categories: catsRes.data || [],
      vendors: vendorsRes.data || [],
      transactions: txRes.data || [],
      guests: guestsRes.data || [],
      gifts: giftsRes.data || [],
      documents: docsRes.data || [],
    };
  }

  static async syncNow(): Promise<SyncResult> {
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
      await this.pullWorkspaceSnapshot(workspace.id);
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

  static startRealtimeSync(workspaceId: string, onRemoteChange: (table: string) => void): () => void {
    if (!isSupabaseConfigured() || !workspaceId) {
      return () => {};
    }
    return subscribeToWorkspaceChanges(workspaceId, (payload) => {
      onRemoteChange(payload?.table || 'unknown');
    });
  }
}
