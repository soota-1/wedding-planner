import { readFileSync } from 'fs';

describe('Moodboard Database & Storage Schema Validation', () => {
  it('contains moodboard_items table, RLS, realtime publication, and moodboard-assets bucket', () => {
    const migration = readFileSync('supabase/migrations/20261125000000_moodboard_schema.sql', 'utf8');
    expect(migration).toContain('CREATE TABLE moodboard_items');
    expect(migration).toContain('workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE');
    expect(migration).toContain('vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL');
    expect(migration).toContain("CHECK (category IN ('decor', 'attire', 'makeup', 'photo', 'other'))");
    expect(migration).toContain('idx_moodboard_workspace_id');
    expect(migration).toContain('ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE moodboard_items');
    expect(migration).toContain('INSERT INTO storage.buckets (id, name, public)');
    expect(migration).toContain("'moodboard-assets'");
  });
});
