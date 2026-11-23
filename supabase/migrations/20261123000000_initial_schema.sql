-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    wedding_date DATE NOT NULL,
    religion_template VARCHAR(50) DEFAULT 'catholic',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace Members
CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('groom', 'bride')),
    display_name VARCHAR(100),
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);

-- Workspace Invites
CREATE TABLE workspace_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    invite_code VARCHAR(8) UNIQUE NOT NULL,
    target_role VARCHAR(20) CHECK (target_role IN ('groom', 'bride')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Budgets
CREATE TABLE budgets (
    workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    total_target_budget NUMERIC NOT NULL DEFAULT 0
);

-- Budget Categories
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    allocated_amount NUMERIC DEFAULT 0
);

-- Checklist Categories
CREATE TABLE checklist_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    category_id UUID REFERENCES checklist_categories(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_date DATE,
    due_date DATE,
    offset_days INT,
    estimated_cost NUMERIC DEFAULT 0,
    actual_cost NUMERIC DEFAULT 0,
    is_template_item BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ
);

-- Task Notes
CREATE TABLE task_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendors
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    budget_category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    social_media VARCHAR(100),
    status VARCHAR(20) DEFAULT 'researching' CHECK (status IN ('researching', 'shortlisted', 'contacted', 'negotiating', 'booked', 'paid', 'completed', 'cancelled')),
    quotation_price NUMERIC DEFAULT 0,
    negotiated_price NUMERIC DEFAULT 0,
    contract_value NUMERIC DEFAULT 0,
    booking_date DATE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    notes TEXT
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    budget_category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('booking_fee', 'dp', 'installment', 'settlement', 'other')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
    due_date DATE,
    payment_date DATE,
    payment_method VARCHAR(50),
    paid_by VARCHAR(20) CHECK (paid_by IN ('groom', 'bride', 'both', 'family_groom', 'family_bride')),
    receipt_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to check workspace membership
CREATE OR REPLACE FUNCTION is_workspace_member(w_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = w_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Workspace Policies
CREATE POLICY "Users can access their workspaces" ON workspaces
    FOR ALL USING (is_workspace_member(id));

CREATE POLICY "Users can access their workspace members" ON workspace_members
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their workspace invites" ON workspace_invites
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their budgets" ON budgets
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their budget categories" ON budget_categories
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their checklist categories" ON checklist_categories
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their tasks" ON tasks
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access task notes" ON task_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_notes.task_id AND is_workspace_member(tasks.workspace_id)
        )
    );

CREATE POLICY "Users can access their vendors" ON vendors
    FOR ALL USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can access their transactions" ON transactions
    FOR ALL USING (is_workspace_member(workspace_id));

-- Trigger: Dynamic Date Shifting on Wedding Date Update
CREATE OR REPLACE FUNCTION shift_template_task_due_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.wedding_date IS DISTINCT FROM OLD.wedding_date THEN
        UPDATE tasks
        SET due_date = NEW.wedding_date + (offset_days || ' days')::INTERVAL
        WHERE workspace_id = NEW.id
          AND is_template_item = true
          AND status != 'done'
          AND offset_days IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_shift_template_task_due_dates
AFTER UPDATE OF wedding_date ON workspaces
FOR EACH ROW
EXECUTE FUNCTION shift_template_task_due_dates();
