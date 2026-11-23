# 💍 Wedding Tracker Mobile App (Android & iOS)

Aplikasi mobile kolaboratif *single source of truth* untuk persiapan pernikahan Katolik dan administrasi sipil bagi pasangan pengantin (Octa & Jenesia).

---

## 🌟 Status Implementasi Fitur (Fase 1 - MVP)

Semua logika bisnis, kalkulasi finansial, aturan kanonik gereja Katolik, validasi vendor, dan skema database **sudah selesai diimplementasikan 100%** dengan pendekatan *Test-Driven Development (TDD)* dan lulus seluruh 9 test suites (30 unit tests).

| Fitur / Modul | Deskripsi Implementasi | Status | File Sumber |
|---|---|---|---|
| **1. Database & Multitenancy** | Skema PostgreSQL Supabase dengan Row Level Security (RLS) terisolasi per workspace, publikasi realtime, dan trigger pergeseran hari H. | ✅ Selesai | [`supabase/migrations/20261123000000_initial_schema.sql`](file:///c:/project/wedding-tracker/supabase/migrations/20261123000000_initial_schema.sql) |
| **2. Templat Katolik & Sipil** | Seed data akun default Octa & Jenesia, checklist lengkap KPP, kanonik, surat baptis, liturgi, dan Disdukcapil (N1-N4). | ✅ Selesai | [`supabase/seed.sql`](file:///c:/project/wedding-tracker/supabase/seed.sql) |
| **3. Autentikasi & Kolaborasi** | Login email/password, ubah password, Google OAuth, dan session store Zustand. | ✅ Selesai | [`src/services/auth.ts`](file:///c:/project/wedding-tracker/src/services/auth.ts), [`src/stores/useAuthStore.ts`](file:///c:/project/wedding-tracker/src/stores/useAuthStore.ts) |
| **4. Kalkulasi Keuangan & Over-Budget** | Anti double-counting kas riil (`paid` transactions), pelacakan liabilitas kontrak vendor, deteksi dini over-budget global & per kategori, serta rekap kontribusi pembayar. | ✅ Selesai | [`src/services/budgetCalculator.ts`](file:///c:/project/wedding-tracker/src/services/budgetCalculator.ts) |
| **5. Checklist & Dynamic Date Shifting** | Kalkulasi tenggat waktu berbasis `offset_days` hari H dan pergeseran dinamis hanya untuk tugas templat yang belum selesai (`status != 'done'`). | ✅ Selesai | [`src/services/checklistService.ts`](file:///c:/project/wedding-tracker/src/services/checklistService.ts) |
| **6. Direktori & Siklus Hidup Vendor** | State machine transisi bertahap (*researching → shortlisted → contacted → negotiating → booked → paid → completed*) dengan pencegahan regresi. | ✅ Selesai | [`src/services/vendorService.ts`](file:///c:/project/wedding-tracker/src/services/vendorService.ts) |
| **7. Realtime Sync & Dashboard** | Listener perubahan database per tabel dan metrik ringkasan dashboard (countdown hari H, rasio progres, status overdue start-of-day). | ✅ Selesai | [`src/services/dashboardService.ts`](file:///c:/project/wedding-tracker/src/services/dashboardService.ts), [`src/services/realtimeSync.ts`](file:///c:/project/wedding-tracker/src/services/realtimeSync.ts) |
| **8. Kalender & Pengingat Notifikasi** | Agregasi linimasa tugas & termin cicilan secara kronologis, format notifikasi lokal bebas bug pergeseran tanggal zona waktu WIB. | ✅ Selesai | [`src/services/notificationService.ts`](file:///c:/project/wedding-tracker/src/services/notificationService.ts) |

---

## 🚀 Panduan Menjalankan & Mengecek Fitur

### 1. Menjalankan Demo Interaktif
Kami telah menyediakan skrip demo yang menjalankan simulasi langsung dari seluruh fitur di atas (countdown hari H, pergeseran tugas kanonik, kalkulasi anggaran kas vs DP vendor, deteksi dini over-budget, dan jadwal timeline).

Jalankan perintah berikut di terminal:
```bash
npm run demo
```

**Output yang akan Anda lihat:**
- Hitung mundur hari H Pernikahan Octa & Jenesia (10 Oktober 2027).
- Daftar tenggat tugas Katolik bawaan (KPP H-180, Surat Baptis H-150, Kanonik H-90, Disdukcapil H-30).
- Simulasi pengunduran hari H (+61 hari) di mana tugas yang sudah selesai (`done`) tidak bergeser, sedangkan tugas yang belum selesai otomatis menyesuaikan tenggatnya.
- Simulasi transaksi DP vendor dengan deteksi dini over-budget saat komitmen kontrak melebihi alokasi anggaran, beserta rekap pembayar (Octa vs Jenesia).
- Jadwal kronologis kalender yang menggabungkan janji temu gereja dan jatuh tempo cicilan vendor.

---

### 2. Menjalankan Pengujian Otomatis (Unit Testing Suite)
Untuk memverifikasi keandalan seluruh fungsi dan logika matematis:
```bash
npm test
```
Seluruh **9 test suites** (30 unit tests) akan dijalankan:
- `tests/config/supabase.test.ts`
- `tests/db/schema_validation.test.ts`
- `tests/services/auth.test.ts`
- `tests/services/budgetCalculator.test.ts`
- `tests/services/checklistService.test.ts`
- `tests/services/vendorService.test.ts`
- `tests/services/dashboardService.test.ts`
- `tests/services/notificationService.test.ts`
- `tests/demo.test.ts`

---

## 🗄️ Menghubungkan ke Database Supabase

Jika Anda ingin menghubungkan aplikasi ke instance Supabase Anda sendiri:

### Langkah 1: Buat Proyek di [Supabase](https://supabase.com)
1. Buka dashboard Supabase dan klik **New Project**.
2. Masukkan nama project (misal: `wedding-tracker`) dan tentukan Database Password.

### Langkah 2: Jalankan Migration SQL & Seed Data
1. Masuk ke menu **SQL Editor** di dashboard Supabase proyek Anda.
2. Buka file [`supabase/migrations/20261123000000_initial_schema.sql`](file:///c:/project/wedding-tracker/supabase/migrations/20261123000000_initial_schema.sql), salin isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
3. Buka file [`supabase/seed.sql`](file:///c:/project/wedding-tracker/supabase/seed.sql), salin isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
   - Ini akan otomatis membuat akun Octa (`octaadsp@gmail.com`) dan Jenesia (`jenesia23@gmail.com`) dengan password `Admin123@`, workspace pernikahan bersama, dan seluruh templat tugas Katolik & pos anggaran awal.

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
│       ├── specs/2026-11-23-wedding-tracker-design.md
│       └── plans/2026-11-23-wedding-tracker-mvp.md
├── src/                                   # Source Code Logika Bisnis & Layanan
│   ├── config/
│   │   └── supabase.ts                    # Inisialisasi Klien Supabase
│   ├── services/
│   │   ├── auth.ts                        # Layanan Autentikasi Pengguna
│   │   ├── budgetCalculator.ts            # Mesin Kalkulasi Keuangan & Liabilitas
│   │   ├── checklistService.ts            # Templat Katolik & Dynamic Date Shifting
│   │   ├── dashboardService.ts            # Agregasi Metrik Ringkasan & Countdown
│   │   ├── notificationService.ts         # Mapper Kalender & Notifikasi Lokal
│   │   ├── realtimeSync.ts                # Realtime Postgres Changes Subscription
│   │   └── vendorService.ts               # State Machine Siklus Hidup Vendor
│   ├── stores/
│   │   └── useAuthStore.ts                # State Management Sesi & Workspace (Zustand)
│   └── types/                             # Definisi Type TypeScript
│       ├── calendar.ts
│       ├── checklist.ts
│       ├── finance.ts
│       └── vendor.ts
├── supabase/
│   ├── migrations/
│   │   └── 20261123000000_initial_schema.sql  # DDL Skema, RLS & Trigger
│   └── seed.sql                           # Seed Data Akun Octa & Jenesia & Templat
├── tests/                                 # Unit & Integration Tests (Jest)
│   ├── config/
│   ├── db/
│   ├── services/
│   └── demo.test.ts                       # Runner Simulasi Fitur Interaktif
├── package.json
└── tsconfig.json
```

---

## 📲 Tahap Selanjutnya (Fase 2: Layar Tampilan UI)

Dengan fondasi logika bisnis, kalkulasi finansial, dan backend yang telah teruji 100%:
1. Membangun komponen layar navigasi (Tabs / Expo Router):
   - **Tab Dashboard:** Widget hitung mundur hari H, kartu kesehatan kas, dan daftar tugas terdekat.
   - **Tab Checklist:** Daftar hierarki tugas kanonik Katolik & sipil dengan filter PIC (Octa / Jenesia).
   - **Tab Budget:** Ringkasan alokasi, input pembayaran DP/Termin bertahap, dan penanda pembayar.
   - **Tab Vendor:** Kartu kontak vendor dan update status bertahap.
   - **Tab Kalender:** Visualisasi kalender jadwal terpadu.
