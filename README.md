# 💍 Wedding Tracker Mobile App (Android & iOS)

Aplikasi mobile kolaboratif *single source of truth* untuk persiapan pernikahan Katolik dan administrasi sipil bagi pasangan pengantin (Octa & Jenesia).

---

## 🌟 Status Implementasi Fitur

Aplikasi berjalan di Android dan iOS dengan **Expo SDK 58 dan Expo Router**. Modul yang tersedia mencakup checklist pernikahan, anggaran, vendor, tamu, angpau, dokumen, dan Moodboard.

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
| **12. Design System & UI Primitives** | Palet krem, hijau, dan cokelat dengan komponen seperti `Card`, `Header`, `ProgressBar`, `Badge`, dan `SegmentedControl`. | ✅ Selesai (Fase 3) | [`src/theme/`](src/theme/), [`src/components/common/`](src/components/common/) |
| **13. Mobile UI Navigation (Expo Router)** | Lima tab utama untuk Ringkasan, Checklist, Anggaran, Tamu, dan Dokumen. | ✅ Selesai (Fase 3) | [`app/`](app/) |
| **14. Moodboard & Referensi** | Galeri online untuk foto dan tautan inspirasi, palet warna, referensi vendor, dan ekspor brief PDF. | ✅ Terimplementasi | [`app/moodboard.tsx`](app/moodboard.tsx) |

---

## 🚀 Panduan Menjalankan & Mengecek Fitur

### Menjalankan aplikasi

```bash
npm ci
npm start
```

Buka proyek dengan Expo Go yang kompatibel dengan SDK 58. Gunakan `a` untuk membuka emulator Android atau `i` untuk membuka simulator iOS di macOS. Mode lokal tersedia tanpa akun Supabase. Moodboard memerlukan koneksi internet dan akun anggota workspace.

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

### 3. Menjalankan Demo Simulasi Mobile UI Fase 3 (Expo Router)
Menjalankan simulasi tampilan dan navigasi lima layar utama aplikasi mobile.
```bash
npm run demo:ui
```

**Output yang akan Anda lihat pada Demo Fase 3 (Mobile UI):**
- **Tema** menggunakan latar krem (`#F7F4ED`), teks gelap (`#222B24`), dan aksen hijau (`#365B47`).
- **Tab 1 (Dashboard)**: Countdown hari H (10 Okt 2027), bar kemajuan, kartu anggaran & peringatan over-budget, rekap kontribusi Octa vs Jenesia.
- **Tab 2 (Checklist)**: Filter kategori kanonik/KPP/sipil/liturgi, status tugas todo/done, prioritas, dan penanggung jawab (PIC).
- **Tab 3 (Anggaran & Vendor)**: Pos anggaran per kategori, direktori vendor dengan status lifecycle, dan transaksi pembayaran dengan label pembayar.
- **Tab 4 (Tamu & Angpau)**: Segmented switcher antara kalkulator konfirmasi pax katering resepsi vs buku besar angpau tunai/transfer & kado fisik serta status ucapan terima kasih.
- **Tab 5 (Dokumen Kanonik)**: Indikator kelengkapan dokumen pernikahan, banner aturan kanonik Katolik surat baptis $\le$ 180 hari, dan status verifikasi berkas.

---

### 4. Menjalankan pengujian dan pemeriksaan TypeScript

```bash
npm test
npm exec -- tsc --noEmit
```

Verifikasi terakhir mencakup **28 suite dan 104 tes**, termasuk skema database, sinkronisasi cloud, dan Moodboard.

---

## 🗄️ Menghubungkan ke Database Supabase

Jika Anda ingin menghubungkan aplikasi ke instance Supabase Anda sendiri:

### Langkah 1: Buat Proyek di [Supabase](https://supabase.com)
1. Buka dashboard Supabase dan klik **New Project**.
2. Masukkan nama project (misal: `wedding-tracker`) dan tentukan Database Password.

### Langkah 2. Terapkan migrasi database

Untuk database baru, jalankan file berikut secara berurutan di **SQL Editor** Supabase. Untuk database yang sudah berjalan, terapkan hanya migrasi yang masih kurang.

1. [Skema inti](supabase/migrations/20261123000000_initial_schema.sql)
2. [Skema tamu, angpau, dan dokumen](supabase/migrations/20261123000001_phase2_schema.sql)
3. [Skema Moodboard dan bucket `moodboard-assets`](supabase/migrations/20261125000000_moodboard_schema.sql)

`supabase/seed.sql` menyediakan akun demo dengan kata sandi bawaan, workspace contoh, serta data checklist dan anggaran. Gunakan seed hanya pada database pengembangan yang terisolasi.

### Langkah 3: Konfigurasi Environment Variables
Buat file `.env` di direktori utama proyek.
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
│   │   ├── 20261123000001_phase2_schema.sql   # DDL Tamu, Hadiah, Dokumen & Indeks
│   │   └── 20261125000000_moodboard_schema.sql # Moodboard dan Storage
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
