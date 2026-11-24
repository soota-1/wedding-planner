# Design Document: Wedding Tracker Mobile UI (Fase 3)

**Tanggal:** 24 November 2026  
**Status:** Pending Review  
**Pendekatan Terpilih:** Pendekatan 1 (Modern Expo Router SDK 52 - File-based Tabs & Layouts)  
**File Target:** `docs/superpowers/specs/2026-11-24-wedding-tracker-phase3-mobile-ui.md`

---

## 1. Ringkasan & Tujuan (Intent)

Fase 1 (Logika Bisnis & MVP Finansial/Checklist) dan Fase 2 (Modul Data Tamu, Buku Besar Angpau, dan Kepatuhan Dokumen Kanonik) telah tuntas 100% di level database, backend services, dan pengujian unit.

Tujuan **Fase 3** adalah membangun antarmuka visual mobile (*frontend UI*) yang elegan, responsif, dan mudah digunakan langsung di perangkat calon pengantin (Octa & Jenesia) menggunakan **Expo Router SDK 52**. Antarmuka ini mengintegrasikan seluruh data service yang telah dibangun ke dalam 5 layar utama melalui Bottom Tab Navigation.

---

## 2. Tema & Design System (Tokens)

Mengadopsi nuansa pernikahan elegan, sakral, dan modern:
- **Warna Utama (Brand & Accent):**
  - Background Utama: `#FDFBF7` (*Warm Ivory / Off-White*)
  - Background Kartu/Container: `#FFFFFF` (*Pure White*) dengan soft border `#EFECE6`
  - Warna Aksen Utama: `#C57B57` (*Terracotta / Warm Rose Gold*)
  - Warna Aksen Sekunder: `#D4AF37` (*Champagne Gold*)
  - Teks Primer: `#1A2238` (*Deep Midnight Navy*)
  - Teks Sekunder: `#6B7280` (*Muted Charcoal Slate*)
- **Status Semantic:**
  - Sukses / Sah / Verified: `#2E7D32` (Emerald Green)
  - Peringatan / Kedaluwarsa / Over-budget: `#D97706` (Warm Amber)
  - Bahaya / Ditolak: `#DC2626` (Ruby Red)
  - Info / Netral: `#2563EB` (Royal Blue)

---

## 3. Struktur Navigasi & Halaman (Expo Router)

```text
app/
├── _layout.tsx                     # Root Layout: QueryClientProvider, SafeArea, Theme
└── (tabs)/
    ├── _layout.tsx                 # Bottom Tab Bar: 5 Tabs dengan Ikon & Label Elegan
    ├── index.tsx                   # Tab 1: Dashboard Ringkasan & Countdown Hari H
    ├── checklist.tsx               # Tab 2: Checklist Katolik & Administrasi Sipil
    ├── budget.tsx                  # Tab 3: Anggaran Finansial & Direktori Vendor
    ├── guests.tsx                  # Tab 4: Tamu, RSVP & Buku Besar Angpau (Gift Ledger)
    └── documents.tsx               # Tab 5: Kepatuhan Dokumen Kanonik Katolik & Sipil
```

---

## 4. Spesifikasi 5 Layar Utama

### Layar 1: Dashboard (`app/(tabs)/index.tsx`)
- **Header:** Salam personal untuk Octa & Jenesia.
- **Wedding Countdown Widget:** Hitung mundur hari H (10 Oktober 2027) dengan angka hari, bulan, dan tanggal pernikahan.
- **Progress Ringkas:** Progress bar persentase tugas persiapan yang sudah rampung (`checklistService`).
- **Kartu Kesehatan Anggaran:**
  - Target Anggaran vs Kas Keluar Riil vs Total Komitmen Kontrak.
  - Sisa Dana & Banner Peringatan Over-budget jika komitmen melebihi alokasi.
- **Widget Kontribusi Finansial:** Bar komparasi pengeluaran Groom (Octa) vs Bride (Jenesia) vs Keluarga.
- **Jadwal Terdekat (Upcoming Deadlines):** 3 tugas atau cicilan termin vendor yang paling dekat jatuh tempo.

### Layar 2: Checklist Katolik & Sipil (`app/(tabs)/checklist.tsx`)
- **Filter Kategori (Pill Buttons):** *Semua, Kanonik Katolik & KPP, Liturgi Gereja, Administrasi Sipil (Disdukcapil), Resepsi & Vendor*.
- **Task List Card:**
  - Checkbox toggle status (`todo` -> `done`).
  - Judul tugas, badge prioritas (`critical`, `high`, `medium`, `low`), tenggat waktu jatuh tempo (otomatis bergeser jika hari H berubah).
  - Badge PIC penanggung jawab (`Groom`, `Bride`, `Both`).
- **Pencarian Cepat:** Input filter nama tugas.

### Layar 3: Anggaran Finansial & Vendor (`app/(tabs)/budget.tsx`)
- **Ringkasan Finansial:** Total Anggaran Global, Kas Terbayar, dan Sisa Utang Liabilitas Vendor.
- **Daftar Kategori Anggaran:** Kartu per pos (Venue & Katering, Busana, Foto/Video, Dekorasi, dll) dengan bar alokasi vs komitmen riil.
- **Direktori Vendor & Lifecycle:** Status vendor (*Researching*, *Shortlisted*, *Booked*, *Completed*), nilai kontrak, dan catatan.
- **Riwayat Transaksi & Pembayar:** Riwayat cicilan dengan badge pembayar ("Dibayar oleh Octa", "Dibayar oleh Jenesia", atau "Keluarga").

### Layar 4: Tamu, RSVP & Buku Besar Angpau (`app/(tabs)/guests.tsx`)
- **Segmented Control:** Switcher antara `[Daftar Tamu & RSVP]` dan `[Buku Besar Angpau]`.
- **Sub-tampilan Tamu & RSVP:**
  - Kartu Ringkasan Pax Katering: Total Undangan, Estimasi Pax, dan **Realisasi Pax Hadir Terkonfirmasi** (angka fix untuk vendor katering).
  - Breakdown Sisi Keluarga: Pihak Groom vs Pihak Bride.
  - List Tamu: Nama tamu, kategori (Keluarga, Sahabat, Rekan Kerja, VIP), jumlah pax, status RSVP (Hadir, Menolak, Ragu/Pending).
- **Sub-tampilan Buku Besar Angpau (Gift Ledger):**
  - Total Dana Terkumpul (Tunai & Transfer).
  - Rekap per Penerima: Khusus Octa, Khusus Jenesia, Bersama, Keluarga.
  - Daftar Kado Fisik (misal peralatan rumah tangga / mesin kopi).
  - Pelacakan Kartu Ucapan Terima Kasih: Jumlah pengirim yang belum dikirim ucapan (*thank you notes pending*).

### Layar 5: Kepatuhan Dokumen Kanonik Katolik (`app/(tabs)/documents.tsx`)
- **Indikator Kesiapan Dokumen:** Persentase kelengkapan berkas (`ComplianceSummary`).
- **Highlight Aturan Kanonik Katolik:**
  - Banner peringatan syarat surat baptis: maksimal berusia 180 hari (6 bulan) sebelum hari H.
  - Validasi status otomatis surat baptis Groom & Bride (Sah vs Kedaluwarsa).
- **Daftar Dokumen Gereja & Sipil:**
  - Surat Baptis Octa & Jenesia, Sertifikat KPP, Formulir N1-N4 Kelurahan, KTP/KK.
  - Status verifikasi (`verified`, `pending`, `expired`, `rejected`).

---

## 5. Komponen UI Reusable (`src/components/common/`)

1. `Header.tsx`: Header terpadu dengan judul, subtitle, dan avatar pasangan.
2. `Card.tsx`: Wadah kartu rounded dengan border halus dan elevation subtle.
3. `StatCard.tsx`: Kartu metrik dengan angka tebal, label, dan aksen warna.
4. `ProgressBar.tsx`: Bar persentase responsif dengan warna transisi dinamis.
5. `Badge.tsx`: Label pil status dengan variasi semantic (success, warning, danger, neutral).
6. `SegmentedControl.tsx`: Switcher tab horizontal untuk beralih konteks tanpa pindah halaman.

---

## 6. Kebutuhan Dependensi Tambahan

Untuk mendukung navigasi Expo Router SDK 52:
- `expo-router` (~4.0.x)
- `react-native-safe-area-context`
- `react-native-screens`
- `expo-linking`
- `expo-constants`

---

## 7. Verifikasi & Kriteria Keberhasilan

- [ ] Seluruh dependensi Expo Router terpasang bersih tanpa konflik peer-dependencies.
- [ ] Root Layout dan Tabs Layout terkonfigurasi dengan safe area dan tema warna elegan.
- [ ] Kelima tab (Dashboard, Checklist, Anggaran, Tamu, Dokumen) merender data dari service layer secara akurat.
- [ ] Komponen UI common lulus unit test rendering via Jest.
- [ ] Integrasi screen dengan data service layer lulus pengujian tanpa error.
- [ ] Seluruh test suite yang ada (14 test suites sebelumnya) tetap lulus 100% tanpa regresi.
