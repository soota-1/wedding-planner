-- Enable pgcrypto for real bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed default users into auth.users (if not already existing)
-- Default password: 'Admin123@'
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        '11111111-1111-1111-1111-111111111111',
        'authenticated',
        'authenticated',
        'octaadsp@gmail.com',
        crypt('Admin123@', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"display_name":"Octa"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        '22222222-2222-2222-2222-222222222222',
        'authenticated',
        'authenticated',
        'jenesia23@gmail.com',
        crypt('Admin123@', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"display_name":"Jenesia"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now());

-- Seed auth.identities (required by Supabase GoTrue for email/password login)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        '{"sub":"11111111-1111-1111-1111-111111111111","email":"octaadsp@gmail.com"}',
        'email',
        '11111111-1111-1111-1111-111111111111',
        now(),
        now(),
        now()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        '{"sub":"22222222-2222-2222-2222-222222222222","email":"jenesia23@gmail.com"}',
        'email',
        '22222222-2222-2222-2222-222222222222',
        now(),
        now(),
        now()
    )
ON CONFLICT DO NOTHING;

-- Seed Workspace: Pernikahan Octa & Jenesia (Default Target Date: 2027-10-10)
INSERT INTO workspaces (id, name, wedding_date, religion_template)
VALUES ('33333333-3333-3333-3333-333333333333', 'Pernikahan Octa & Jenesia', '2027-10-10', 'catholic')
ON CONFLICT (id) DO NOTHING;

-- Link Members
INSERT INTO workspace_members (workspace_id, user_id, role, display_name)
VALUES
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'groom', 'Octa'),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'bride', 'Jenesia')
ON CONFLICT DO NOTHING;

-- Default Budget
INSERT INTO budgets (workspace_id, total_target_budget)
VALUES ('33333333-3333-3333-3333-333333333333', 150000000)
ON CONFLICT DO NOTHING;

-- Default Budget Categories
INSERT INTO budget_categories (id, workspace_id, name, allocated_amount)
VALUES
    ('44444444-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Gereja & Liturgi', 10000000),
    ('44444444-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Venue & Katering', 90000000),
    ('44444444-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Busana & MUA', 25000000),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Dokumentasi', 15000000),
    ('44444444-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Administrasi & Lain-lain', 10000000)
ON CONFLICT DO NOTHING;

-- Default Checklist Categories
INSERT INTO checklist_categories (id, workspace_id, name, icon, sort_order)
VALUES
    ('55555555-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Gereja & Persiapan Kanonik', 'church', 1),
    ('55555555-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Catatan Sipil', 'card-account-details', 2),
    ('55555555-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Venue & Resepsi', 'party-popper', 3)
ON CONFLICT DO NOTHING;

-- Template Tasks: Gereja & Kanonik Katolik
INSERT INTO tasks (workspace_id, category_id, title, description, status, priority, offset_days, due_date, is_template_item)
VALUES
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Menentukan gereja pemberkatan & booking jadwal misa', 'Hubungi sekretariat paroki gereja pilihan', 'todo', 'critical', -300, '2027-10-10'::DATE - INTERVAL '300 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Kursus Persiapan Perkawinan (KPP)', 'Wajib sertifikat KPP untuk penyelidikan kanonik', 'todo', 'critical', -180, '2027-10-10'::DATE - INTERVAL '180 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Pengurusan surat baptis terbaru (maks 6 bulan)', 'Minta dari paroki tempat dibaptis dengan tanggal berlaku terbaru', 'todo', 'high', -150, '2027-10-10'::DATE - INTERVAL '150 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Penyelidikan Kanonik', 'Wawancara kanonik bersama Pastor Paroki', 'todo', 'critical', -90, '2027-10-10'::DATE - INTERVAL '90 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Penentuan saksi perkawinan resmi gereja', 'Saksi Katolik yang sudah menerima sakramen krisma', 'todo', 'high', -60, '2027-10-10'::DATE - INTERVAL '60 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Penyiapan petugas liturgi: Lektor, Pemazmur, Misdinar, Koor', 'Koordinasi teks doa dan lagu liturgi', 'todo', 'medium', -45, '2027-10-10'::DATE - INTERVAL '45 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Penyusunan buku panduan misa perkawinan & konsultasi liturgi', 'Review teks misa bersama pastor pemberkat', 'todo', 'medium', -30, '2027-10-10'::DATE - INTERVAL '30 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Gladi bersih liturgi di gereja', 'Gladi bersama saksi, lektor, dan keluarga inti', 'todo', 'high', -5, '2027-10-10'::DATE - INTERVAL '5 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-1111-1111-1111-111111111111', 'Sakramen Tobat / Rekonsiliasi sebelum pemberkatan', 'Penerimaan sakramen tobat pribadi', 'todo', 'high', -2, '2027-10-10'::DATE - INTERVAL '2 days', true);

-- Template Tasks: Catatan Sipil
INSERT INTO tasks (workspace_id, category_id, title, description, status, priority, offset_days, due_date, is_template_item)
VALUES
    ('33333333-3333-3333-3333-333333333333', '55555555-2222-2222-2222-222222222222', 'Penyiapan berkas pribadi (KTP, KK, Akta Lahir, Ijazah)', 'Fotokopi legalisir dan scan PDF', 'todo', 'medium', -90, '2027-10-10'::DATE - INTERVAL '90 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-2222-2222-2222-222222222222', 'Pengurusan surat pengantar kelurahan (N1 - N4)', 'Dari RT/RW dan kelurahan masing-masing domisili', 'todo', 'high', -50, '2027-10-10'::DATE - INTERVAL '50 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-2222-2222-2222-222222222222', 'Pendaftaran pencatatan perkawinan ke Disdukcapil', 'Daftar jadwal pencatatan sipil di gereja / dinas', 'todo', 'critical', -30, '2027-10-10'::DATE - INTERVAL '30 days', true),
    ('33333333-3333-3333-3333-333333333333', '55555555-2222-2222-2222-222222222222', 'Penerbitan Kutipan Akta Perkawinan catatan sipil', 'Penandatanganan akta sipil pada hari H', 'todo', 'high', 0, '2027-10-10'::DATE, true);
