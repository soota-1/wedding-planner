-- =================================================================
-- MOODBOARD & REFERENSI SCHEMA: TABLE, RLS, REALTIME, & STORAGE
-- =================================================================

-- 1. Moodboard Items Table
CREATE TABLE moodboard_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('decor', 'attire', 'makeup', 'photo', 'other')),
    image_url TEXT,
    storage_path TEXT,
    reference_url TEXT,
    color_palette TEXT[] DEFAULT '{}',
    notes TEXT,
    is_final BOOLEAN DEFAULT false,
    created_by VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for Workspace & Vendor Queries
CREATE INDEX idx_moodboard_workspace_id ON moodboard_items(workspace_id);
CREATE INDEX idx_moodboard_vendor_id ON moodboard_items(vendor_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their moodboard items" ON moodboard_items
    FOR ALL USING (is_workspace_member(workspace_id));

-- 4. Realtime Publication & Replica Identity
ALTER TABLE moodboard_items REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE moodboard_items;
    END IF;
END;
$$;

-- 5. Storage Bucket for Moodboard Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('moodboard-assets', 'moodboard-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage RLS Policies scoped by workspace_id folder prefix
CREATE POLICY "Public read access for moodboard assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'moodboard-assets');

CREATE POLICY "Workspace members can upload moodboard assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'moodboard-assets'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND is_workspace_member(((storage.foldername(name))[1])::uuid)
    );

CREATE POLICY "Workspace members can update moodboard assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'moodboard-assets'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND is_workspace_member(((storage.foldername(name))[1])::uuid)
    );

CREATE POLICY "Workspace members can delete moodboard assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'moodboard-assets'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND is_workspace_member(((storage.foldername(name))[1])::uuid)
    );
