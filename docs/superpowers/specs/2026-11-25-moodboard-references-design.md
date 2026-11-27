# Design Spec: Moodboard & Referensi Visual Pernikahan

**Tanggal:** 2026-11-25  
**Status:** Disetujui User (Online-First Sync)  
**Target Aplikasi:** Wedding Tracker (`Octa & Jenesia`) — Expo SDK 58 / React Native / Supabase

---

## 1. Intent & Latar Belakang (Why)

Pasangan pengantin sering mengumpulkan inspirasi visual pernikahan (dekorasi gereja & resepsi, kebaya/jas, riasan MUA, referensi pose & *tone* foto) dari berbagai tempat seperti galeri HP, Instagram, dan Pinterest. Tanpa wadah terpusat di aplikasi, referensi tercecer di chat atau folder terpisah sehingga sulit disepakati berdua dan merepotkan saat harus dikirim ke vendor menjelang *meeting* atau *technical meeting*.

Fitur **Moodboard & Referensi** hadir agar Octa dan Jenesia dapat menyimpan inspirasi visual di satu tempat yang tersinkron *real-time* antar kedua HP, menandai mana pilihan **Favorit / Final**, mengaitkannya dengan vendor terkait, dan membagikannya langsung ke vendor (baik kirim cepat per referensi maupun ekspor ringkasan Brief PDF).

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
- Menyimpan referensi visual berupa **foto dari galeri HP** (diunggah ke cloud agar tampil di HP kedua mempelai) dan/atau **tautan referensi** (Pinterest, Instagram, Google Drive).
- Menyertakan metadata penting pada tiap item: kategori (`Dekorasi`, `Busana`, `MUA`, `Foto`, `Lainnya`), palet warna tema (*hex swatches*), catatan konsep, relasi opsional ke `vendorId`, dan status **Favorit / Final** (`isFinal`).
- Menyediakan dua cara berbagi ke vendor:
  1. **Kirim Cepat per Referensi** (gambar/link + catatan via Share Sheet HP / WhatsApp).
  2. **Ekspor Ringkasan Brief PDF** per vendor atau per kategori (berisi foto, palet warna, catatan, dan tautan referensi) yang siap dikirim via Share Sheet ke WhatsApp vendor.
- Terintegrasi ke alur aplikasi yang sudah ada: kartu akses di halaman **Ringkasan** (`app/(tabs)/index.tsx`) dan galeri referensi khusus di dalam **Detail Vendor** (`app/(tabs)/budget.tsx`) tanpa menambah tab baru di *bottom bar* (tetap 5 tab).

### Non-Goals
- Tidak membangun editor gambar (crop/filter/stiker) atau kanvas *drag-and-drop freeform* kolase.
- Tidak membangun *in-app web scraper* untuk mengambil gambar otomatis dari link Instagram/Pinterest yang terproteksi login/anti-bot.
- Tidak membangun portal login eksternal khusus untuk vendor.

### Anti-Goals (Hal yang Dihindari)
- **Data lokal terpisah / mode offline:** Tidak menyimpan foto atau item moodboard secara lokal saja tanpa cloud. Jika perangkat sedang offline/gagal koneksi, aplikasi harus memberi notifikasi/peringatan agar user menyalakan data/Wi-Fi daripada membuat data lokal yang tidak tersinkron.
- **Database membengkak & lambat:** Menyimpan gambar beresolusi penuh dalam bentuk string Base64 di tabel PostgreSQL/Zustand akan memperlambat *hydration* dan *Realtime sync*.
- **Bottom bar sesak:** Menambahkan tab ke-6 di *navigation bar* bawah akan mempersempit label tab pada layar HP berukuran kecil.

---

## 3. Constraints & Konteks Teknis Saat Ini

- **Stack Aplikasi:** Expo `~58.0.26`, React Native `^0.88.1`, `expo-router`, Zustand + `AsyncStorage` (cache sesi/state), `@supabase/supabase-js`, tema editorial (*Alabaster* `#F8F7F4`, *Dusty Rosewood* `#9E5A47`, *Champagne Gold* `#B89242`).
- **Online-Only Cloud Sync:** Semua operasi tulis Moodboard (tambah foto/link, ubah, tandai Final, hapus) langsung terintegrasi online ke Supabase Storage + `moodboard_items` dan disinkronkan *real-time* lewat `subscribeToWorkspaceChanges`. Jika perangkat terdeteksi offline atau koneksi ke Supabase gagal, operasi dibatalkan dengan notifikasi/alert jelas agar user menyalakan data/Wi-Fi.
- **Paket Baru yang Diperlukan:** `expo-image-picker`, `expo-sharing`, `expo-print`, `expo-file-system`, dan `expo-clipboard`.

---

## 4. Approaches (Alternatif & Pilihan)

### Pendekatan A — Supabase Storage Bucket + Tabel `moodboard_items` + Share Sheet & Brief PDF *(Dipilih)*
- **Cara Kerja:** Foto dari galeri HP dikompresi ringan (`quality: 0.7`), diunggah ke Supabase Storage bucket `moodboard-assets` di bawah folder `{workspace_id}/`, lalu URL & metadata disimpan di tabel `moodboard_items`. Share cepat memakai Share Sheet native (`expo-sharing` / `Share`), dan Brief Vendor memakai HTML-to-PDF (`expo-print`) + `expo-sharing`.
- **Trade-off:** Kualitas foto tetap tajam di kedua HP, ukuran tabel database tetap ringan, dan Brief PDF terlihat rapi/profesional untuk *technical meeting*. Memerlukan 1 bucket Storage + RLS policy baru serta instalasi paket Expo terkait.

### Pendekatan B — Simpan Base64 Kompresi Kecil di Kolom Database
- **Cara Kerja:** Mengonversi gambar menjadi string Base64 terkompresi dan menyimpannya langsung di kolom `TEXT` tabel database.
- **Trade-off:** Tidak perlu setup Supabase Storage bucket, tetapi membebani *payload* sinkronisasi JSON dan memaksa resolusi gambar diturunkan drastis.

### Pendekatan C — Simpan Foto Lokal + Link URL Manual *(Ditolak)*
- **Alasan Penolakan:** Bertentangan dengan kolaborasi pasangan karena foto galeri di satu HP tidak bisa dilihat dari HP pasangan.

---

## 5. Arsitektur & Spesifikasi Rinci

### 5.1 Model Data (`src/stores/useWeddingStore.ts`)
Menambahkan tipe dan state baru ke `WeddingState`:
```ts
export type MoodboardCategory = 'decor' | 'attire' | 'makeup' | 'photo' | 'other';

export interface MoodboardItem {
  id: string;
  title: string;
  category: MoodboardCategory;
  imageUrl?: string;       // Public URL dari Supabase Storage
  storagePath?: string;    // Path di bucket Supabase untuk keperluan hapus file
  referenceUrl?: string;   // Link Pinterest / Instagram / Web
  colorPalette: string[];  // Array hex color (maks 4 swatch)
  notes?: string;
  vendorId?: string;       // Relasi opsional ke VendorItem.id
  isFinal: boolean;        // Penanda Favorit / Final disepakati pasangan
  createdBy?: 'groom' | 'bride';
  createdAt: string;
}
```
Actions & Aturan Store *(Online-First Sync)*:
- **State Awal & Validasi Form:** `moodboardItems` dimulai kosong (`[]`) dengan tampilan *empty-state* + tombol CTA `"Tambah Inspirasi Pertama"` (tanpa *asset* demo statis). Setiap item wajib memiliki judul serta minimal salah satu dari **Foto Galeri** atau **Link Referensi**.
- **Wajib Online saat Mutasi Data:**
  - `addMoodboardItemOnline(input, pickedLocalUri?)`: mengunggah foto ke Supabase Storage (`moodboard-assets`) terlebih dahulu (jika ada foto), lalu menyimpan row ke `moodboard_items`, dan baru memperbarui state store setelah berhasil. Jika sedang offline / belum login cloud / gagal upload, operasi **dibatalkan** dan memunculkan alert: *"Koneksi Internet Diperlukan: Nyalakan data seluler atau Wi-Fi untuk menyimpan & menyinkronkan moodboard."*
  - `updateMoodboardItemOnline(id, patch, newLocalUri?)`: memperbarui Storage (bila foto diganti) + row DB terlebih dahulu, baru memperbarui store (gagal jika offline dengan alert notifikasi koneksi).
  - `toggleMoodboardFinalOnline(id)`: memperbarui `is_final` di DB terlebih dahulu, lalu memperbarui store (gagal jika offline dengan alert notifikasi koneksi).
  - `deleteMoodboardItemOnline(id)`: menghapus row DB + objek Storage, lalu menghapus dari store (gagal jika offline dengan alert notifikasi koneksi).
- `hydrateFromCloud(snapshot)`: langsung memperbarui `moodboardItems` mengikuti snapshot cloud secara penuh (termasuk array kosong `[]` saat semua item dihapus di cloud).

### 5.2 Skema Database & Storage (`supabase/migrations/20261125000000_moodboard_schema.sql`)
1. **Tabel `moodboard_items`:**
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`
   - `vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL`
   - `title VARCHAR(255) NOT NULL`
   - `category VARCHAR(30) NOT NULL CHECK (category IN ('decor', 'attire', 'makeup', 'photo', 'other'))`
   - `image_url TEXT`
   - `storage_path TEXT`
   - `reference_url TEXT`
   - `color_palette TEXT[] DEFAULT '{}'`
   - `notes TEXT`
   - `is_final BOOLEAN DEFAULT false`
   - `created_by VARCHAR(20)`
   - `created_at TIMESTAMPTZ DEFAULT now()`
   - Index `idx_moodboard_workspace_id` & `idx_moodboard_vendor_id`.
   - RLS: `FOR ALL USING (is_workspace_member(workspace_id))`.
   - Realtime: `REPLICA IDENTITY FULL` dan `ALTER PUBLICATION supabase_realtime ADD TABLE moodboard_items`.
2. **Supabase Storage Bucket (`moodboard-assets`):**
   - Bucket dibuat via migration (`INSERT INTO storage.buckets (id, name, public) VALUES ('moodboard-assets', 'moodboard-assets', true) ON CONFLICT DO NOTHING`).
   - Storage RLS policy pada `storage.objects`: anggota workspace (`is_workspace_member(...)` atau folder prefix `workspace_id`) berhak mengunggah, memperbarui, dan menghapus objek pada folder workspace mereka, dan membaca URL publik untuk rendering gambar lintas perangkat & PDF.

### 5.3 Alur Layar & UI
1. **Kartu Akses di Dashboard (`app/(tabs)/index.tsx`):**
   - Kartu editorial *"Moodboard & Referensi"* menampilkan jumlah total inspirasi, jumlah item berstatus **Final**, serta pratinjau warna tema/thumbnail singkat. Mengetuk kartu mengarahkan ke `/moodboard`.
2. **Layar Khusus Moodboard (`app/moodboard.tsx`):**
   - Didaftarkan di Root Stack (`app/_layout.tsx`), mendukung query param opsional `vendorId` agar bisa terbuka langsung terfilter untuk vendor tertentu.
   - Bar filter kategori (`Semua`, `Dekorasi`, `Busana`, `MUA`, `Foto`, `Lainnya`) + filter toggle `"★ Final Saja"`.
   - Tombol **"Ekspor Brief PDF"** di header/sub-header: jika pada cakupan filter/vendor aktif terdapat item bertanda `★ Final`, otomatis hanya mengekspor item `★ Final`; jika belum ada yang bertanda `★ Final`, otomatis mengekspor seluruh item pada cakupan aktif tersebut.
   - Grid 2 kolom kartu visual menampilkan foto (atau kartu tautan bergaya editorial jika hanya berisi link), badge `★ Final`, judul, nama vendor tertaut, dan titik palet warna.
   - Jika terdeteksi offline saat membuka/menyinkronkan atau saat mencoba menambah/mengedit/menghapus/menandai Final, tampilkan banner peringatan + alert **"Nyalakan data seluler atau Wi-Fi untuk mengakses & menyinkronkan moodboard online."**
   - **Modal Tambah / Edit:**
     - Pilih Foto dari Galeri (`expo-image-picker`, kompresi `0.7`).
     - Input opsional Link Referensi (Pinterest / Instagram) — minimal salah satu dari Foto atau Link Referensi harus diisi.
     - Judul inspirasi, Kategori, Dropdown/Chip pilih Vendor terkait (dari `vendors`), Pemilih Palet Warna (preset editorial + input hex opsional), Catatan Konsep, dan Toggle *Favorit / Final*.
   - **Modal Detail Item:**
     - Pratinjau foto besar, tautan klikable (`Linking.openURL`), daftar swatch warna + kode hex, catatan lengkap, tombol toggle **Final**, Edit/Hapus, dan tombol **"Bagikan Cepat ke Vendor"**.
3. **Integrasi di Detail Vendor (`app/(tabs)/budget.tsx`):**
   - Di dalam *Vendor Management Sheet*, ditambahkan bagian **"Moodboard & Referensi Vendor Ini"** menampilkan thumbnail item yang tertaut ke `vendor.id`, tombol `"+ Tambah"` (buka `/moodboard?vendorId=${vendor.id}`), dan tombol **"Kirim Brief PDF"** khusus untuk vendor tersebut (otomatis memilih item `★ Final` milik vendor itu jika ada, atau seluruh item milik vendor itu jika belum ada yang ditandai Final).

### 5.4 Mekanisme Berbagi & Ekspor Brief (`src/services/moodboardShareService.ts`)
- **Kirim Cepat (`shareSingleMoodboardItem`):**
  - **Jika item memiliki foto (`imageUrl`):** salin otomatis teks terformat (`Judul`, `Kategori`, `Palet Warna`, `Catatan Konsep`, `Link Referensi`) ke clipboard via `expo-clipboard` (`Clipboard.setStringAsync`), unduh foto dari `imageUrl` ke cache lokal (`expo-file-system`), tampilkan alert/konfirmasi bahwa keterangan sudah disalin agar tinggal *Paste*, lalu buka Share Sheet via `expo-sharing` (`Sharing.shareAsync`) untuk mengirim foto ke WhatsApp vendor. (Jika download foto gagal karena offline, tampilkan notif nyalakan data/Wi-Fi).
  - **Jika item hanya berupa link & catatan (tanpa foto):** langsung buka WhatsApp ke nomor vendor terkait (`https://wa.me/{phone}?text=...`) bila vendor memiliki nomor HP, atau buka `Share.share` teks+link sistem jika belum terhubung ke vendor bernomor HP.
- **Ekspor Brief PDF (`exportMoodboardBriefPdf`):**
  - Menyeleksi item sesuai aturan cakupan: ambil item `isFinal === true` dalam filter/vendor aktif bila jumlahnya `>= 1`, atau ambil semua item dalam filter/vendor aktif bila belum ada yang `isFinal`. Bila 0 item tersedia, tampilkan pesan bahwa belum ada referensi untuk diekspor.
  - Merangkai dokumen HTML bergaya editorial minimalis (header pasangan *Octa & Jenesia*, nama vendor/kategori target, tanggal acara, daftar kartu inspirasi dengan `<img>`, blok warna hex, link referensi, dan catatan).
  - Mengonversi ke file PDF melalui `Print.printToFileAsync({ html })` dari `expo-print`, lalu memanggil `Sharing.shareAsync(uri)` agar langsung bisa dikirim ke WhatsApp vendor.

---

## 6. Ringkasan Keputusan & Yang Diserahkan ke Builder

### Keputusan Teknis yang Telah Disepakati
1. **Integrasi Online Penuh (Tanpa Mode Lokal):** Semua aksi tambah/edit/hapus/upload gambar & sinkronisasi moodboard wajib online ke Supabase Storage + `moodboard_items`. Bila offline atau koneksi gagal, operasi tidak disimpan lokal melainkan memunculkan notifikasi agar user menyalakan data/Wi-Fi.
2. **State Awal & Validasi Form:** `moodboardItems` dimulai kosong (`[]`) dengan *empty-state* CTA (tanpa gambar dummy bawaan), dan form mewajibkan minimal salah satu dari **Foto Galeri** atau **Link Referensi**.

### Yang Diserahkan ke Builder (Implementation Calls)
- Ukuran dimensi grid thumbnail, gaya placeholder untuk item tanpa foto, serta daftar palet warna preset default.
- Penamaan helper konversi file sementara untuk gambar remote saat berbagi maupun saat menyematkan ke HTML PDF.
- Struktur unit test (Jest mocks untuk `expo-image-picker`, `expo-sharing`, `expo-print`, `expo-file-system`, `expo-clipboard`, serta test sinkronisasi `CloudSyncService` & store).
