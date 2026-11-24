# 💍 Wedding Tracker Mobile App (Android & iOS)

Aplikasi mobile kolaboratif *single source of truth* untuk persiapan pernikahan Katolik dan administrasi sipil bagi pasangan pengantin (Octa & Jenesia).

---

## 🌟 Status Implementasi Fitur

Semua logika bisnis, kalkulasi finansial, modul data tamu & katering, pencatatan angpau/hadiah fisik, aturan kanonik gereja Katolik, validasi vendor, dan skema database **sudah selesai diimplementasikan 100%** dengan pendekatan *Test-Driven Development (TDD)* dan lulus seluruh **14 test suites (51 tests)**.

### 📋 Ringkasan Modul Terimplementasi

| Modul | Deskripsi Implementasi | Status | File Sumber |
|---|---|---|---|
| **1. Database & Multitenancy** | Skema PostgreSQL Supabase dengan Row Level Security (RLS) terisolasi per workspace, publikasi realtime, indeks performa, dan trigger pergeseran hari H. | ✅ Selesai | [`supabase/migrations/`](file:///c:/project/wedding-tracker/supabase/migrations/) |
| **2. Templat Katolik & Sipil** | Seed data akun default Octa & Jenesia, checklist lengkap KPP, kanonik, surat baptis, liturgi, dan Disdukcapil (N1-N4). | ✅ Selesai | [`supabase/seed.sql`](file:///c:/project/wedding-tracker/supabase/seed.sql) |
| **3. Autentikasi & Kolaborasi** | Login email/password, ubah password, Google OAuth, dan session store Zustand. | ✅ Selesai | [`src/services/auth.ts`](file:///c:/project/wedding-tracker/src/services/auth.ts), [`src/stores/useAuthStore.ts`](file:///c:/project/wedding-tracker/src/stores/useAuthStore.ts) |
| **4. Keuangan Pra-Nikah & Over-Budget** | Anti double-counting kas riil (`paid` transactions), pelacakan liabilitas kontrak vendor, deteksi dini over-budget global & per kategori, serta rekap kontribusi pembayar. | ✅ Selesai | [`src/services/budgetCalculator.ts`](file:///c:/project/wedding-tracker/src/services/budgetCalculator.ts) |
| **5. Checklist & Dynamic Date Shifting** | Kalkulasi tenggat waktu berbasis `offset_days` hari H dan pergeseran dinamis hanya untuk tugas templat yang belum selesai (`status != 'done'`). | ✅ Selesai | [`src/services/checklistService.ts`](file:///c:/project/wedding-tracker/src/services/checklistService.ts) |
| **6. Direktori & Siklus Hidup Vendor** | State machine transisi bertahap (*researching → shortlisted → contacted → negotiating → booked → paid → completed*) dengan pencegahan regresi. | ✅ Selesai | [`src/services/vendorService.ts`](file:///c:/project/wedding-tracker/src/services/vendorService.ts) |
| **7. Realtime Sync & Dashboard** | Listener perubahan database per tabel (termasuk modul tamu, hadiah, dan dokumen) dan ringkasan metrik dashboard (countdown hari H, rasio progres, status overdue). | ✅ Selesai | [`src/services/dashboardService.ts`](file:///c:/project/wedding-tracker/src/services/dashboardService.ts), [`src/services/realtimeSync.ts`](file:///c:/project/wedding-tracker/src/services/realtimeSync.ts) |
| **8. Kalender & Pengingat Notifikasi** | Agregasi linimasa tugas & termin cicilan secara kronologis, format notifikasi lokal bebas bug pergeseran tanggal zona waktu WIB. | ✅ Selesai | [`src/services/notificationService.ts`](file:///c:/project/wedding-tracker/src/services/notificationService.ts) |
| **9. Manajemen Tamu, RSVP & Pax Katering** | Pengelompokan tamu (pria, wanita, bersama), pelacakan status RSVP, dan kalkulator konfirmasi pax katering akurat (*confirmed attending pax*). | ✅ Selesai (Fase 2) | [`src/services/guestService.ts`](file:///c:/project/wedding-tracker/src/services/guestService.ts), [`src/types/guest.ts`](file:///c:/project/wedding-tracker/src/types/guest.ts) |
| **10. Buku Besar Angpau & Hadiah Fisik** | Dedicated Gift Ledger memisahkan dana tunai/transfer dari kado fisik, rekap per penerima (Octa, Jenesia, keluarga), dan pelacakan status ucapan terima kasih. | ✅ Selesai (Fase 2) | [`src/services/giftService.ts`](file:///c:/project/wedding-tracker/src/services/giftService.ts), [`src/types/gift.ts`](file:///c:/project/wedding-tracker/src/types/gift.ts) |
| **11. Kepatuhan Dokumen Kanonik Katolik** | Validasi aturan kanonik surat baptis terbaru (maksimal 180 hari / 6 bulan sebelum hari H), pelacakan berkas KPP & sipil, serta indikator kesiapan kepatuhan. | ✅ Selesai (Fase 2) | [`src/services/documentService.ts`](file:///c:/project/wedding-tracker/src/services/documentService.ts), [`src/types/document.ts`](file:///c:/project/wedding-tracker/src/types/document.ts) |

---

## 🚀 Panduan Menjalankan & Mengecek Fitur

### 1. Menjalankan Demo Interaktif Fase 1 (MVP Inti)
Menjalankan simulasi countdown hari H, pergeseran tugas kanonik, kalkulasi anggaran kas vs DP vendor, deteksi dini over-budget, dan jadwal timeline:
```bash
npm run demo
```

### 2. Menjalankan Demo Interaktif Fase 2 (Modul Data Baru)
Menjalankan simulasi manajemen tamu & RSVP, kalkulasi pax katering resepsi, rekapitulasi buku besar angpau/hadiah fisik, dan verifikasi kepatuhan surat baptis kanonik Katolik:
```bash
npm run demo:phase2
```

**Output yang akan Anda lihat pada Demo Fase 2:**
- **Manajemen Tamu & RSVP**: Estimasi kuota pax undangan vs realisasi pax hadir terkonfirmasi (angka pasti untuk konfirmasi porsi katering), serta pembagian sisi keluarga.
- **Buku Besar Angpau (Gift Ledger)**: Total nominal uang tunai & transfer terkumpul, rekap penerimaan per mempelai/keluarga, daftar hadiah fisik (misal mesin kopi), dan pelacakan kartu ucapan terima kasih (*thank you notes*).
- **Kepatuhan Dokumen Kanonik Katolik**: Pengecekan otomatis surat baptis (surat baptis terbit $\le$ 180 hari sebelum hari H dinyatakan sah; surat baptis $> 180$ hari otomatis ditandai kedaluwarsa dan wajib dicetak ulang di paroki asal), serta persentase kesiapan dokumen pernikahan.

---

### 3. Menjalankan Seluruh Pengujian Otomatis (Full Test Suite)
Untuk memverifikasi keandalan seluruh fungsi dan logika matematis proyek:
```bash
npm test
```
Seluruh **14 test suites** (51 tests) akan dijalankan:
- `tests/config/supabase.test.ts`
- `tests/db/schema_validation.test.ts`
- `tests/db/phase2_schema_validation.test.ts`
- `tests/services/auth.test.ts`
- `tests/services/budgetCalculator.test.ts`
- `tests/services/checklistService.test.ts`
- `tests/services/vendorService.test.ts`
- `tests/services/dashboardService.test.ts`
- `tests/services/notificationService.test.ts`
- `tests/services/guestService.test.ts`
- `tests/services/giftService.test.ts`
- `tests/services/documentService.test.ts`
- `tests/demo.test.ts`
- `tests/phase2_demo.test.ts`

---

## 🗄️ Menghubungkan ke Database Supabase

Jika Anda ingin menghubungkan aplikasi ke instance Supabase Anda sendiri:

### Langkah 1: Buat Proyek di [Supabase](https://supabase.com)
1. Buka dashboard Supabase dan klik **New Project**.
2. Masukkan nama project (misal: `wedding-tracker`) dan tentukan Database Password.

### Langkah 2: Jalankan Migration SQL & Seed Data
1. Masuk ke menu **SQL Editor** di dashboard Supabase proyek Anda.
2. Buka file [`supabase/migrations/20261123000000_initial_schema.sql`](file:///c:/project/wedding-tracker/supabase/migrations/20261123000000_initial_schema.sql), salin isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
3. Buka file [`supabase/migrations/20261123000001_phase2_schema.sql`](file:///c:/project/wedding-tracker/supabase/migrations/20261123000001_phase2_schema.sql), salin isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
4. Buka file [`supabase/seed.sql`](file:///c:/project/wedding-tracker/supabase/seed.sql), salin isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
   - Ini akan otomatis membuat akun Octa (`octaadsp@gmail.com`) dan Jenesia (`jenesia23@gmail.com`) dengan password `Admin123@`, workspace pernikahan bersama, seluruh templat tugas Katolik & pos anggaran awal.

### Langkah 3: Konfigurasi Environment Variables
Buat file `.env` di root direktori proyek:
```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```
*(Nilai URL dan Anon Key dapat disalin dari menu **Project Settings > API** di Supabase).*

---

## 📁 Struktur Proyek

```text
wedding-tracker/
├── docs/                                  # Dokumentasi Desain & Rencana Eksekusi
│   └── superpowers/
│       ├── specs/
│       │   ├── 2026-11-23-wedding-tracker-design.md
│       │   └── 2026-11-23-wedding-tracker-phase2-data-modules.md
│       └── plans/
│           ├── 2026-11-23-wedding-tracker-mvp.md
│           └── 2026-11-23-wedding-tracker-phase2-data-modules.md
├── src/                                   # Source Code Logika Bisnis & Layanan
│   ├── config/
│   │   └── supabase.ts                    # Inisialisasi Klien Supabase
│   ├── services/
│   │   ├── auth.ts                        # Layanan Autentikasi Pengguna
│   │   ├── budgetCalculator.ts            # Mesin Kalkulasi Keuangan & Liabilitas
│   │   ├── checklistService.ts            # Templat Katolik & Dynamic Date Shifting
│   │   ├── dashboardService.ts            # Agregasi Metrik Ringkasan & Countdown
│   │   ├── documentService.ts             # Validasi Kanonik Surat Baptis & Kepatuhan Berkas
│   │   ├── giftService.ts                 # Buku Besar Angpau & Hadiah Fisik
│   │   ├── guestService.ts                # Manajemen Tamu, RSVP & Pax Katering
│   │   ├── notificationService.ts         # Mapper Kalender & Notifikasi Lokal
│   │   ├── realtimeSync.ts                # Realtime Postgres Changes Subscription
│   │   └── vendorService.ts               # State Machine Siklus Hidup Vendor
│   ├── stores/
│   │   └── useAuthStore.ts                # State Management Sesi & Workspace (Zustand)
│   └── types/                             # Definisi Type TypeScript
│       ├── calendar.ts
│       ├── checklist.ts
│       ├── document.ts                    # Tipe Dokumen Kanonik & Sipil
│       ├── finance.ts
│       ├── gift.ts                        # Tipe Angpau & Hadiah
│       ├── guest.ts                       # Tipe Tamu & RSVP
│       └── vendor.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20261123000000_initial_schema.sql  # DDL Skema MVP, RLS & Trigger
│   │   └── 20261123000001_phase2_schema.sql   # DDL Tamu, Hadiah, Dokumen & Indeks
│   └── seed.sql                           # Seed Data Akun Octa & Jenesia & Templat
├── tests/                                 # Unit & Integration Tests (Jest)
│   ├── config/
│   ├── db/
│   ├── services/
│   ├── demo.test.ts                       # Runner Simulasi Fitur MVP
│   └── phase2_demo.test.ts                # Runner Simulasi Fitur Fase 2
├── package.json
└── README.md
```
