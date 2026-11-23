import { supabase } from '../config/supabase';

export function subscribeToWorkspaceChanges(
  workspaceId: string,
  onUpdate: (payload: any) => void
): () => void {
  const channelName = `workspace-${workspaceId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload: any) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
