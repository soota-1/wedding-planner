import { supabase } from '../config/supabase';

export function subscribeToWorkspaceChanges(
  workspaceId: string,
  onUpdate: (payload: any) => void
): () => void {
  const channelName = `workspace-${workspaceId}`;

  let channel = supabase.channel(channelName);

  // 1. Subscribe to workspace record changes (id = workspaceId)
  channel = channel.on(
    'postgres_changes' as any,
    {
      event: '*',
      schema: 'public',
      table: 'workspaces',
      filter: `id=eq.${workspaceId}`,
    },
    (payload: any) => onUpdate({ ...payload, table: 'workspaces' })
  );

  // 2. Subscribe to child tables filtered by workspace_id
  const childTables = [
    'tasks',
    'transactions',
    'vendors',
    'checklist_categories',
    'budget_categories',
    'budgets',
    'guests',
    'gifts',
    'wedding_documents',
    'moodboard_items',
  ];

  childTables.forEach((table) => {
    channel = channel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload: any) => onUpdate({ ...payload, table })
    );
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
