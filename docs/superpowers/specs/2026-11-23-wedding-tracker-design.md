# Design Document: Wedding Tracker Mobile App (Android & iOS)

**Tanggal:** 23 November 2026  
**Status:** Approved by User  
**Target:** Fase 1 (MVP Rilis Bertahap untuk Pasangan) -> Fase 2 (Publik & Ekspansi Modul Penuh)  
**Lokasi File:** `docs/superpowers/specs/2026-11-23-wedding-tracker-design.md`

---

## 1. Intent & The Why

### Latar Belakang & Masalah
Mempersiapkan pernikahan merupakan proyek kehidupan yang sangat kompleks dengan ratusan detail yang saling bergantung. Di Indonesia, khususnya dalam tradisi pernikahan Katolik, terdapat banyak tahapan administrasi gereja yang wajib dan terikat tenggat waktu ketat (seperti Kursus Persiapan Perkawinan/KPP, penyelidikan kanonik, pengurusan surat baptis terbaru paling lama 6 bulan sebelum hari H, penyiapan saksi, dan liturgi misa perkawinan). Pada saat yang sama, pasangan harus mengelola perizinan sipil (Disdukcapil), puluhan vendor (venue, katering, busana, dekorasi, dokumentasi), serta pengelolaan anggaran yang melibatkan pembayaran bertahap (booking fee, DP, termin, pelunasan) dari berbagai sumber dana.

Selama ini, pasangan mengandalkan kombinasi spreadsheet, chat WhatsApp, dan aplikasi catatan pribadi yang tidak sinkron. Dampaknya:
- Tenggat kanonik atau pembayaran vendor terlewat.
- Anggaran membengkak (*over-budget*) karena tidak ada visibilitas real-time terhadap total komitmen biaya vs realisasi.
- Miskomunikasi antar pasangan mengenai siapa yang bertanggung jawab atas suatu tugas atau pengeluaran.

### Visi Produk
Sebuah aplikasi mobile kolaboratif (*cross-platform* Android & iOS) yang menjadi *single source of truth* bagi pasangan calon pengantin. Dimulai dari kebutuhan pribadi calon pengantin Katolik dengan templat otomatis yang relevan, dibangun di atas arsitektur *multi-tenant* berbasis templat sehingga nantinya siap dipublikasikan untuk umum dengan kustomisasi multi-agama/adat.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals (Fase 1 - MVP Inti Persiapan Pernikahan)
1. **Onboarding & Templat Katolik:** Saat registrasi, pasangan memilih profil pernikahan Katolik dan secara otomatis mendapatkan *default checklist template* yang mencakup seluruh prosedur kanonik, liturgi, dan administrasi sipil Disdukcapil.
2. **Kolaborasi Pasangan (Shared Workspace):** Fitur undang pasangan (*invite partner via link/code*), di mana kedua pengguna tergabung dalam satu ruang kerja yang tersinkronisasi secara *real-time*.
3. **Dashboard Ringkasan:** Menampilkan hitung mundur hari H (*wedding countdown*), progres penyelesaian persiapan, kartu kesehatan anggaran (Total Budget, Terpakai, Sisa Dana, Status Over-budget), serta daftar tugas/pembayaran yang mendekati jatuh tempo (*upcoming deadlines*).
4. **Hierarchical Checklist Management:** Pengelolaan tugas bertingkat (Kategori -> Subkategori -> Task -> Subtask) lengkap dengan status (To Do, In Progress, Done, Blocked), prioritas, penanggung jawab (PIC: Saya / Pasangan), tenggat waktu, catatan, serta tautan opsional ke nominal biaya.
5. **Vendor Management & Lifecycle:** Pencatatan direktori vendor dengan pelacakan status bertahap (*Researching -> Shortlisted -> Contacted -> Negotiating -> Booked -> Paid -> Completed -> Cancelled*), nilai kontrak, kontak, dan riwayat penawaran.
6. **Financial & Budget Management (Dana Bersama + Penanda Pembayar):**
   - Menetapkan total anggaran global dan alokasi per pos kategori.
   - Pencatatan transaksi bertahap: DP, Termin/Cicilan, dan Pelunasan lengkap dengan tanggal jatuh tempo.
   - Penanda pembayar (*"Dibayar oleh: Pria / Wanita / Bersama / Keluarga"*).
   - Lampiran bukti transfer / struk pembayaran.
   - Widget ringkasan kontribusi masing-masing pihak.
7. **Kalender & Timeline Terpadu:** Visualisasi kalender bulanan dan mingguan yang menggabungkan tenggat tugas, jadwal gereja (KPP, kanonik), janji temu vendor (fitting, technical meeting), dan jatuh tempo pembayaran.
8. **Pengingat & Notifikasi:** Pengingat otomatis untuk tugas kedaluwarsa (*overdue*), tenggat waktu dekat, dan jadwal pembayaran termin vendor.

### Goals (Fase 2 - Ekspansi Fitur & Publikasi Umum)
- Modul Manajemen Tamu, RSVP, dan *Seating Arrangement* (meja resepsi).
- *Document Center* terpusat dengan cloud preview dokumen legal & gereja.
- Modul *Honeymoon Planner* dan *After-Wedding Preparation* (perencanaan rumah tangga & keuangan pasca-nikah).
- *Dynamic Questionnaire & Multi-Religion Template Engine* untuk mendukung calon pengantin dengan agama/adat lain saat go-public.

### Non-Goals
- Bukan *payment gateway processor*: Aplikasi tidak memproses transaksi uang riil antar bank; pengguna melakukan transfer di luar aplikasi (m-banking) dan mencatat bukti pembayarannya di aplikasi.
- Bukan aplikasi web di Fase 1 (fokus penuh pada kenyamanan mobile app di genggaman tangan calon pengantin).
- Bukan marketplace vendor terbuka di Fase 1 (tidak ada transaksi komersial vendor publik di dalam aplikasi).

### Anti-Goals
- Bukan aplikasi generic to-do list (seperti Trello/Notion/Todoist) yang mengharuskan pasangan membuat kolom dan daftar dari nol; aplikasi ini harus langsung memberikan panduan kontekstual pernikahan yang terstruktur.
- Bukan aplikasi catatan lokal satu arah; data tidak boleh terisolasi di satu HP tanpa bisa diakses dan diedit oleh pasangan.

---

## 3. Constraints & Lingkungan Teknis

- **Platform Mobile:** React Native dengan Expo (TypeScript) untuk Android dan iOS.
- **Backend & Database:** Supabase (PostgreSQL 15+, Supabase Auth, Realtime Engine, Supabase Storage).
- **Keamanan & Multitenancy:** PostgreSQL *Row Level Security (RLS)* berbasis `workspace_id` untuk memastikan isolasi data setiap pasangan sangat aman dan siap pakai untuk publik.
- **Resiliensi Jaringan (Offline Tolerance):** Pasangan sering berada di lokasi minim sinyal (gereja tua, ruang bawah tanah venue, area tes katering). Aplikasi harus mengimplementasikan *local caching* (misal: TanStack Query + AsyncStorage/MMKV) agar data tetap bisa dibaca dan diedit tanpa crash saat offline.

---

## 4. Evaluasi Pendekatan Arsitektur

Tiga pendekatan arsitektur telah dipertimbangkan:

1. **Pendekatan 1: React Native (Expo) + Supabase (DIPILIH)**
   - *Alasan Pemilihan:* Data pernikahan bersifat sangat relasional (keuangan bertahap, relasi vendor ke transaksi, hierarki checklist bertingkat). PostgreSQL memberikan integritas matematis yang mutlak untuk kalkulasi keuangan tanpa risiko selisih angka. Supabase menyediakan Auth, RLS multitenant, Realtime sync, dan Storage dalam satu ekosistem. Expo memungkinkan instalasi instan pada HP fisik Android dan iPhone milik pasangan untuk pengujian cepat.
   - *Trade-off:* Memerlukan strategi local cache state yang disiplin untuk performa offline.

2. **Pendekatan 2: Flutter + Supabase (Ditolak)**
   - *Alasan Ditolak:* Kompilasi ke perangkat iPhone pasangan memerlukan ekosistem Mac dan konfigurasi sertifikat iOS lokal di awal pengembangan, yang memperlambat siklus iterasi dan pengujian langsung oleh calon pengantin.

3. **Pendekatan 3: React Native (Expo) + Firebase NoSQL Firestore (Ditolak)**
   - *Alasan Ditolak:* Struktur NoSQL menyulitkan agregasi finansial (penjumlahan cicilan, pelacakan sisa utang vendor, filtering multi-kategori) dan rentan terhadap inkonsistensi kalkulasi budget saat terjadi banyak update bersamaan.

---

## 5. Spesifikasi Fungsional & Model Data (Fase 1)

### A. Entitas Workspace, Akun Pengguna & Autentikasi
- **Autentikasi (Supabase Auth):**
  - **Metode Login:** Email & Password + Google Sign-In (OAuth).
  - **Fitur Pengaturan:** Ganti password (*Change Password*).
  - **Akun Bawaan (Seeded Accounts untuk Pengujian Awal):**
    - Groom (Pria): `octaadsp@gmail.com` (Password awal: `Admin123@`)
    - Bride (Wanita): `jenesia23@gmail.com` (Password awal: `Admin123@`)
    - Kedua akun ini otomatis terhubung sebagai co-admin ke ruang kerja pernikahan yang sama.
- **`workspaces`**:
  - `id` (UUID, PK)
  - `name` (misal: "Pernikahan Octa & Jenesia")
  - `wedding_date` (DATE)
  - `religion_template` (VARCHAR, default: 'catholic')
  - `created_at`, `updated_at`
- **`workspace_members`**:
  - `workspace_id` (FK -> workspaces)
  - `user_id` (FK -> auth.users)
  - `role` (VARCHAR: 'groom', 'bride') — Akses co-admin simetris untuk kedua akun.
  - `display_name` (VARCHAR)
  - `joined_at` (TIMESTAMP)
- **`workspace_invites`**:
  - `id` (UUID)
  - `workspace_id` (FK)
  - `invite_code` (VARCHAR, unik 6-8 karakter)
  - `target_role` (VARCHAR: 'groom' atau 'bride')
  - `status` ('pending', 'accepted', 'expired')

### B. Entitas Checklist & Tugas
- **`checklist_categories`**:
  - `id` (UUID, PK), `workspace_id` (FK)
  - `name` (VARCHAR, misal: "Gereja & Persiapan Kanonik", "Catatan Sipil", "Venue & Katering")
  - `icon` (VARCHAR), `sort_order` (INT)
- **`tasks`**:
  - `id` (UUID, PK), `workspace_id` (FK), `category_id` (FK)
  - `parent_task_id` (UUID, FK self-referencing untuk subtask)
  - `title` (VARCHAR)
  - `description` (TEXT)
  - `status` (ENUM: 'todo', 'in_progress', 'done', 'blocked')
  - `priority` (ENUM: 'critical', 'high', 'medium', 'low')
  - `assigned_to` (FK -> auth.users, nullable)
  - `start_date` (DATE, nullable)
  - `due_date` (DATE, nullable)
  - `estimated_cost` (NUMERIC, default 0)
  - `actual_cost` (NUMERIC, default 0)
  - `is_template_item` (BOOLEAN)
  - `completed_at` (TIMESTAMP)
- **`task_notes`**:
  - `id` (UUID), `task_id` (FK), `author_id` (FK), `content` (TEXT), `created_at`

### C. Entitas Vendor Lifecycle
- **`vendors`**:
  - `id` (UUID, PK), `workspace_id` (FK)
  - `budget_category_id` (FK -> budget_categories, nullable - menghubungkan vendor ke pos anggaran)
  - `category` (VARCHAR, misal: 'Venue', 'Catering', 'Fotografi', 'MUA', 'WO', dll.)
  - `name` (VARCHAR)
  - `contact_person` (VARCHAR), `phone` (VARCHAR), `email` (VARCHAR), `social_media` (VARCHAR)
  - `status` (ENUM: 'researching', 'shortlisted', 'contacted', 'negotiating', 'booked', 'paid', 'completed', 'cancelled')
  - `quotation_price` (NUMERIC)
  - `negotiated_price` (NUMERIC)
  - `contract_value` (NUMERIC)
  - `booking_date` (DATE)
  - `rating` (INT 1-5), `notes` (TEXT)

### D. Entitas Budgeting & Pembayaran
- **`budgets`**:
  - `workspace_id` (FK, PK)
  - `total_target_budget` (NUMERIC)
- **`budget_categories`**:
  - `id` (UUID, PK), `workspace_id` (FK)
  - `name` (VARCHAR)
  - `allocated_amount` (NUMERIC)
- **`transactions`**:
  - `id` (UUID, PK), `workspace_id` (FK)
  - `budget_category_id` (FK -> budget_categories)
  - `vendor_id` (FK -> vendors, nullable)
  - `task_id` (FK -> tasks, nullable)
  - `title` (VARCHAR, misal: "DP Gedung 30%")
  - `amount` (NUMERIC)
  - `transaction_type` (ENUM: 'booking_fee', 'dp', 'installment', 'settlement', 'other')
  - `payment_status` (ENUM: 'pending', 'paid')
  - `due_date` (DATE, nullable - untuk pengingat termin berikutnya)
  - `payment_date` (DATE, nullable)
  - `payment_method` (VARCHAR: 'transfer_bca', 'cash', dll.)
  - `paid_by` (VARCHAR: 'groom', 'bride', 'both', 'family_groom', 'family_bride')
  - `receipt_url` (VARCHAR - file di Supabase Storage)
  - `notes` (TEXT)

#### Aturan Kalkulasi Finansial & Pencegahan Double-Counting (Builder Call):
1. **Sumber Kebenaran Arus Kas (Cash Outflow):** Tabel `transactions` dengan `payment_status = 'paid'` adalah satu-satunya sumber data untuk kas keluar riil (**Kas Terbayar**).
2. **Total Komitmen Biaya (Liabilities):** Total komitmen dihitung dari `SUM(vendors.contract_value)` untuk vendor yang sudah deal/booked + transaksi mandiri yang tidak terhubung ke vendor.
3. **Metrik Dashboard:**
   - **Target Anggaran:** `budgets.total_target_budget`
   - **Kas Terbayar:** `SUM(transactions.amount WHERE payment_status = 'paid')`
   - **Sisa Kas Tersedia:** `total_target_budget - Kas Terbayar`
   - **Total Komitmen:** Nilai kontrak vendor yang disepakati + pengeluaran terencana
   - **Sisa Komitmen Belum Lunas:** `Total Komitmen - Kas Terbayar`
   - **Status Over-budget:** Terjadi jika `Total Komitmen > total_target_budget` (peringatan dini sebelum uang kas habis).
4. **Pencegahan Double Counting:** `tasks.estimated_cost` dan `tasks.actual_cost` murni referensi lokal pada task. Nilai keuangan agregat global dan kategori hanya dihitung dari `transactions` dan `vendors.contract_value`.

### E. Seed Data Templat Katolik & Legalitas (Bawaan)
Templat tugas diinisialisasi menggunakan `offset_days` relatif terhadap `wedding_date` (Hari H). Jika pasangan mengubah tanggal pernikahan di kemudian hari, sistem secara otomatis menggeser tenggat waktu tugas-tugas templat yang belum selesai (*uncompleted tasks*).

1. **Gereja & Kanonik:**
   - Menentukan gereja pemberkatan & jadwal misa (Offset: H-360 s/d H-240).
   - Menghubungi sekretariat paroki & konsultasi pastor (Offset: H-240).
   - Pendaftaran Kursus Persiapan Perkawinan / KPP (Offset: H-180 s/d H-120).
   - Pengurusan surat baptis terbaru (maksimal 6 bulan sebelum hari H) (Offset: H-150 s/d H-90).
   - Penyiapan surat krisma / kelengkapan kanonik (Offset: H-120).
   - Penyelidikan Kanonik dengan Pastor Paroki (Offset: H-90).
   - Surat izin/pengantar menikah ke paroki lain jika menikah di luar paroki asal (Offset: H-90).
   - Penentuan saksi perkawinan resmi gereja (Offset: H-60).
   - Penyiapan petugas liturgi: Lektor, Pemazmur, Misdinar, Koor (Offset: H-45).
   - Penyusunan buku panduan misa perkawinan & konsultasi teks liturgi (Offset: H-30).
   - Gladi bersih liturgi di gereja (Offset: H-7 s/d H-3).
   - Sakramen Tobat / Rekonsiliasi sebelum pemberkatan (Offset: H-3 s/d H-1).
2. **Administrasi Sipil (Disdukcapil):**
   - Penyiapan berkas pribadi (KTP, KK, Akta Lahir, Ijazah) (Offset: H-90).
   - Pengurusan formulir kelurahan (N1 - N4) (Offset: H-60 s/d H-45).
   - Pendaftaran pencatatan sipil perkawinan ke Disdukcapil (Offset: H-30).
   - Penerbitan Kutipan Akta Perkawinan catatan sipil (Offset: H+0 / Hari H).
   - Pembaruan Kartu Keluarga & KTP status kawin pasca-pemberkatan (Offset: H+14).

---

## 6. What's Left to the Builder (Keputusan Teknis Builder)

Hal-hal berikut diserahkan sepenuhnya kepada tim builder pengembang:
1. **UI Component System & Styling:** Pemilihan UI library (misal: Tamagui, NativeWind/Tailwind, atau React Native Paper) dengan palet tema warna pernikahan elegan (warm neutral / soft rose / ivory).
2. **State Management & Caching:** Pemilihan antara TanStack Query (React Query) + Zustand atau Redux Toolkit untuk sinkronisasi client-server dan offline persistence.
3. **Penyimpanan Lokal:** Pilihan MMKV atau AsyncStorage untuk menyimpan auth token dan offline cache.
4. **Push Notifications Engine:** Integrasi `expo-notifications` dengan jadwal lokal (*local scheduled notifications*) untuk jatuh tempo tugas dan pembayaran.
5. **Format Validasi Form:** Implementasi format mask mata uang Rupiah (`Rp xxx.xxx.xxx`) dan validasi input formulir menggunakan Zod / React Hook Form.

---

## 7. Verifikasi & Kriteria Keberhasilan (Acceptance Criteria)

- [ ] Pengguna baru dapat mendaftar dan membuat ruang kerja pernikahan dengan tanggal hari H.
- [ ] Checklist Katolik otomatis terisi lengkap dengan kategori, task kanonik, dan prioritas.
- [ ] Pengguna dapat mengundang pasangan via kode/link, dan pasangan dapat bergabung ke workspace yang sama.
- [ ] Perubahan task atau checklist yang dilakukan pengguna A langsung muncul di layar pengguna B secara real-time.
- [ ] Dasbor menampilkan countdown yang akurat, rasio progress task selesai vs tertunda, serta ringkasan kas (Total Anggaran, Terpakai, Sisa, Over-budget).
- [ ] Transaksi pembayaran dapat dicatat bertahap (DP/Termin), mencantumkan siapa pembayar, dan otomatis memperbarui sisa kontrak vendor serta sisa budget global.
- [ ] Kalender menampilkan jadwal jatuh tempo tugas dan cicilan vendor secara tepat.
- [ ] Aplikasi tetap dapat dibuka dan menampilkan data saat koneksi internet dimatikan (offline cache aktif).
