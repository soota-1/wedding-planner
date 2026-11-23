# Design Document: Wedding Tracker (Fase 2 - Ekspansi Modul Data Baru)

**Tanggal:** 23 November 2026  
**Status:** Approved by User  
**Target:** Modul Data Tamu & RSVP, Pencatatan Angpau/Kado (Gift Tracker), dan Document Compliance Center  
**Lokasi File:** `docs/superpowers/specs/2026-11-23-wedding-tracker-phase2-data-modules.md`

---

## 1. Intent & The Why

### Latar Belakang & Masalah
Setelah fondasi keuangan, direktori vendor, dan checklist kanonik Katolik Fase 1 berhasil dibangun, calon pengantin (Octa & Jenesia) menghadapi tiga kebutuhan operasional lanjutan yang sangat mendesak:
1. **Manajemen Tamu & Perhitungan Pax Resepsi:** Pasangan membutuhkan pendataan daftar undangan dari dua pihak (keluarga Groom vs Bride), memvalidasi status kehadiran (RSVP), dan menghitung estimasi kehadiran riil (*actual pax*) yang berdampak langsung pada pemesanan porsi katering.
2. **Pencatatan Angpau & Hadiah Fisik (Gift Tracking):** Pada saat dan pasca-resepsi, sirkulasi hadiah pernikahan (amplop tunai, transfer bank/QRIS, kado fisik barang) dicatat secara transparan dengan pemisahan peruntukan dana (*Groom, Bride, Keluarga*) dan pelacakan ucapan terima kasih (*thank you notes*).
3. **Pusat Kepatuhan Berkas Digital (Document Compliance):** Persiapan kanonik Katolik dan pencatatan sipil memiliki aturan berkas yang ketat. Surat Baptis Katolik memiliki masa berlaku maksimal 6 bulan (180 hari) sebelum hari H pernikahan. Diperlukan pencatatan digital status berkas dan pengecekan tanggal kedaluwarsa otomatis.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
1. **Modul Tamu & RSVP (`GuestService`):**
   - Pendataan tamu dengan pengelompokan pihak (*Groom, Bride, Both*), kategori (*Keluarga Inti, VIP, Sahabat, Rekan Kerja*), dan kontak.
   - Pelacakan status pengiriman undangan dan status konfirmasi RSVP (*pending, attending, declined, tentative*).
   - Agregasi otomatis metrik kehadiran (*total invited pax, confirmed attending pax, declined pax, tentative pax, attendanceRate 0–100%*).
2. **Modul Angpau & Hadiah Fisik (`GiftService` - Dedicated Ledger):**
   - Pencatatan amplop tunai, transfer bank/QRIS, dan kado fisik barang.
   - Penautan opsional ke data tamu terdaftar atau nama pengirim manual.
   - Penanda alokasi penerima (*Groom, Bride, Bersama, Keluarga Groom, Keluarga Bride*).
   - Metrik ringkasan: Total uang angpau terkumpul, rekap per pihak penerima, dan rekap barang fisik.
   - Penanda status pengiriman ucapan terima kasih (*thank you note status*).
3. **Modul Arsip Dokumen (`DocumentService`):**
   - Katalog dokumen kanonik gereja, berkas Disdukcapil sipil, dan kontrak vendor.
   - Kolom `document_type` eksplisit (`baptism_certificate`, `kpp_certificate`, `civil_n1_n4`, `other`).
   - Validasi kepatuhan masa berlaku dokumen gereja (surat baptis <= 180 hari dari `wedding_date`).
   - Status kelengkapan dokumen (*pending, verified, expired, rejected*).
4. **Keamanan & Multitenancy:**
   - Seluruh tabel baru (`guests`, `gifts`, `wedding_documents`) diproteksi dengan PostgreSQL Row Level Security (RLS) berbasis `workspace_id`.
   - Ditambahkan ke publikasi `supabase_realtime`.

### Non-Goals
- Bukan gateway pembayaran digital: Aplikasi tidak menerima transfer uang riil di dalam app, melainkan mencatat pembukuan hadiah/angpau yang diterima.
- Bukan layanan blast pesan WhatsApp otomatis (pengguna membagikan tautan undangan secara mandiri).
- Bukan integrasi langsung uang angpau ke dalam anggaran belanja pranikah pada tahap ini (angpau dikelola sebagai buku besar hadiah tersendiri, dengan opsi penggabungan di masa depan).

### Anti-Goals
- Data tamu, angpau, dan dokumen tidak boleh bocor lintas ruang kerja pernikahan (*zero cross-tenant leak*).
- Penghitungan pax katering tidak boleh mendasarkan pada jumlah undangan fisik (1 undangan keluarga dapat bernilai 2-4 pax).

---

## 3. Model Data & Skema PostgreSQL (DDL)

### A. Tabel `guests`
```sql
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    side VARCHAR(20) NOT NULL CHECK (side IN ('groom', 'bride', 'both')),
    group_tag VARCHAR(100) DEFAULT 'General',
    estimated_pax INT NOT NULL DEFAULT 1,
    actual_pax INT NOT NULL DEFAULT 0,
    rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'attending', 'declined', 'tentative')),
    invitation_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### B. Tabel `gifts`
```sql
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    gift_type VARCHAR(20) NOT NULL CHECK (gift_type IN ('cash', 'transfer', 'physical_gift')),
    amount NUMERIC DEFAULT 0,
    gift_description TEXT,
    received_by VARCHAR(20) NOT NULL CHECK (received_by IN ('groom', 'bride', 'both', 'family_groom', 'family_bride')),
    received_at TIMESTAMPTZ DEFAULT now(),
    thank_you_sent BOOLEAN DEFAULT false,
    notes TEXT
);
```

### C. Tabel `wedding_documents`
```sql
CREATE TABLE wedding_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
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
```

---

## 4. Logika Bisnis & Spesifikasi Layanan (Service Layer)

### 1. `GuestService` & Kalkulator Pax Resepsi
- **Metrik Tamu (`calculateGuestMetrics`):**
  - `totalGuests`: Jumlah total entri tamu terdaftar.
  - `totalInvitedPax`: `SUM(estimated_pax)`.
  - `confirmedAttendingPax`: `SUM(actual_pax > 0 ? actual_pax : estimated_pax)` untuk tamu berstatus `attending`.
  - `declinedPax`: `SUM(estimated_pax)` untuk tamu berstatus `declined`.
  - `tentativePax`: `SUM(estimated_pax)` untuk tamu berstatus `tentative` atau `pending`.
  - `attendanceRate`: `totalInvitedPax > 0 ? Math.round((confirmedAttendingPax / totalInvitedPax) * 100) : 0` (0–100%).
- **Filter Berdasarkan Pihak:** Memisahkan tamu Pihak Octa (`groom`) vs Pihak Jenesia (`bride`) vs Bersama (`both`).

### 2. `GiftService` & Rekap Angpau / Hadiah (Dedicated Ledger)
- **Total Uang Angpau Terkumpul:** `SUM(amount WHERE gift_type IN ('cash', 'transfer'))`.
- **Rekap per Pihak Penerima (`GiftSummary`):**
  - `groom`: Total uang diterima Octa.
  - `bride`: Total uang diterima Jenesia.
  - `both`: Total uang bersama.
  - `family_groom`: Total uang keluarga Groom.
  - `family_bride`: Total uang keluarga Bride.
- **Daftar Hadiah Fisik:** Filter kado barang fisik beserta status ucapan terima kasih (`thank_you_sent`).

### 3. `DocumentService` & Validasi Kepatuhan Kanonik
- **Validasi Masa Berlaku Surat Baptis (`isBaptismCertificateValid`):**
  - Valid jika `issueDate >= weddingDate - 180 hari` dan `issueDate <= weddingDate`.
  - Menghasilkan boolean `true` jika valid. Jika `false`, status dokumen diklasifikasikan sebagai `expired`.

---

## 5. Kriteria Keberhasilan (Acceptance Criteria)

- [ ] Skema database `guests`, `gifts`, dan `wedding_documents` memiliki RLS aktif dan masuk publikasi realtime.
- [ ] Unit test validasi DDL skema database lulus.
- [ ] Layanan `GuestService` mampu menambah, menyaring tamu per pihak, dan menghitung total pax resepsi secara akurat.
- [ ] Layanan `GiftService` mampu merekap angpau tunai/transfer, memisahkan peruntukan penerima, dan mendata kado fisik.
- [ ] Layanan `DocumentService` mampu memvalidasi masa berlaku berkas kanonik (surat baptis 6 bulan).
- [ ] Seluruh unit test suite (Fase 1 dan Fase 2) lulus 100% tanpa regresi.
