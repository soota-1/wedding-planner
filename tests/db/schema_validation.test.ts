import { readFileSync } from 'fs';

describe('Database Schema & Seed Files', () => {
  it('contains essential tables and foreign keys', () => {
    const migration = readFileSync('supabase/migrations/20261123000000_initial_schema.sql', 'utf8');
    expect(migration).toContain('CREATE TABLE workspaces');
    expect(migration).toContain('CREATE TABLE workspace_members');
    expect(migration).toContain('CREATE TABLE checklist_categories');
    expect(migration).toContain('CREATE TABLE tasks');
    expect(migration).toContain('CREATE TABLE vendors');
    expect(migration).toContain('CREATE TABLE budget_categories');
    expect(migration).toContain('CREATE TABLE transactions');
    expect(migration).toContain('budget_category_id UUID REFERENCES budget_categories');
  });

  it('contains RLS policies for creation and realtime publication', () => {
    const migration = readFileSync('supabase/migrations/20261123000000_initial_schema.sql', 'utf8');
    expect(migration).toContain('CREATE POLICY "Users can create workspaces"');
    expect(migration).toContain('CREATE POLICY "Users can insert workspace members"');
    expect(migration).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE');
  });

  it('contains seed data for Octa and Jenesia accounts and Catholic checklist', () => {
    const seed = readFileSync('supabase/seed.sql', 'utf8');
    expect(seed).toContain('octaadsp@gmail.com');
    expect(seed).toContain('jenesia23@gmail.com');
    expect(seed).toContain('Kursus Persiapan Perkawinan');
    expect(seed).toContain('Penyelidikan Kanonik');
  });
});
