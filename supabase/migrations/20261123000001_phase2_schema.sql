-- =================================================================
-- PHASE 2 SCHEMA MIGRATION: GUESTS, GIFTS, & WEDDING DOCUMENTS
-- =================================================================

-- 1. Guests Table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    side VARCHAR(20) NOT NULL CHECK (side IN ('groom', 'bride', 'both')),
    group_tag VARCHAR(100) DEFAULT 'General',
    estimated_pax INT NOT NULL DEFAULT 1 CHECK (estimated_pax >= 1),
    actual_pax INT NOT NULL DEFAULT 0 CHECK (actual_pax >= 0),
    rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'attending', 'declined', 'tentative')),
    invitation_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Gifts Table (Angpau & Kado Fisik)
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    gift_type VARCHAR(20) NOT NULL CHECK (gift_type IN ('cash', 'transfer', 'physical_gift')),
    amount NUMERIC DEFAULT 0 CHECK (amount >= 0),
    gift_description TEXT,
    received_by VARCHAR(20) NOT NULL CHECK (received_by IN ('groom', 'bride', 'both', 'family_groom', 'family_bride')),
    received_at TIMESTAMPTZ DEFAULT now(),
    thank_you_sent BOOLEAN DEFAULT false,
    notes TEXT
);

-- 3. Wedding Documents Table (Berkas Kanonik & Sipil)
CREATE TABLE wedding_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'other' CHECK (document_type IN ('baptism_certificate', 'kpp_certificate', 'civil_n1_n4', 'other')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('church_canonical', 'civil_disdukcapil', 'vendor_contract', 'other')),
    owner VARCHAR(20) NOT NULL CHECK (owner IN ('groom', 'bride', 'both')),
    file_url VARCHAR(255),
    file_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'rejected')),
    issue_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Foreign Keys & Workspace Performance
CREATE INDEX idx_guests_workspace_id ON guests(workspace_id);
CREATE INDEX idx_gifts_workspace_id ON gifts(workspace_id);
CREATE INDEX idx_gifts_guest_id ON gifts(guest_id);
CREATE INDEX idx_wedding_documents_workspace_id ON wedding_documents(workspace_id);

-- Enable Row Level Security (RLS)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their guests" ON guests
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their gifts" ON gifts
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their wedding documents" ON wedding_documents
    FOR ALL USING (is_workspace_member(workspace_id));

-- Realtime Replica Identity & Publication
ALTER TABLE guests REPLICA IDENTITY FULL;
ALTER TABLE gifts REPLICA IDENTITY FULL;
ALTER TABLE wedding_documents REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE guests, gifts, wedding_documents;
    END IF;
END;
$$;
