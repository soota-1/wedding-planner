import { readFileSync } from 'fs';

describe('Phase 2 Database Schema Validation', () => {
  it('contains guests, gifts, and wedding_documents tables with RLS and realtime publication', () => {
    const migration = readFileSync('supabase/migrations/20261123000001_phase2_schema.sql', 'utf8');
    expect(migration).toContain('CREATE TABLE guests');
    expect(migration).toContain('CREATE TABLE gifts');
    expect(migration).toContain('CREATE TABLE wedding_documents');
    expect(migration).toContain('workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE');
    expect(migration).toContain('idx_guests_workspace_id');
    expect(migration).toContain('idx_gifts_workspace_id');
    expect(migration).toContain('idx_wedding_documents_workspace_id');
    expect(migration).toContain('ALTER TABLE guests ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER TABLE gifts ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER TABLE wedding_documents ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE guests, gifts, wedding_documents');
  });
});
