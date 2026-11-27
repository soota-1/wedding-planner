# Moodboard & Referensi Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fitur **Moodboard & Referensi** pernikahan yang sepenuhnya terintegrasi online ke Supabase Storage + PostgreSQL (`moodboard_items`), mendukung upload foto galeri & link referensi, penanda **★ Final**, akses dari Dashboard & Detail Vendor, serta fitur Kirim Cepat ke WhatsApp dan Ekspor Brief PDF.

**Architecture:** Menggunakan **Pendekatan A**: foto dari galeri dikompresi (`quality: 0.7`) lalu diunggah ke Supabase Storage bucket `moodboard-assets` pada path `{workspace_id}/{item_id}.jpg`, sementara metadata disinkronkan *real-time* melalui tabel `moodboard_items` dan `subscribeToWorkspaceChanges`. Seluruh mutasi data bersifat *online-first* (gagal + tampilkan notifikasi *"Nyalakan data seluler atau Wi-Fi"* bila offline/error tanpa menyimpan data lokal terpisah). Berbagi cepat menggunakan `expo-clipboard` + `expo-sharing`, dan ekspor Brief PDF menggunakan `expo-print` + `expo-sharing`.

**Tech Stack:** Expo SDK 58, React Native, Zustand + AsyncStorage, Supabase PostgreSQL + Storage + Realtime, `expo-image-picker`, `expo-sharing`, `expo-print`, `expo-file-system`, `expo-clipboard`, Jest + TypeScript.

**Spec:** [docs/superpowers/specs/2026-11-25-moodboard-references-design.md](../../specs/2026-11-25-moodboard-references-design.md)

## Global Constraints

- Integrasi online penuh tanpa mode penyimpanan lokal terpisah: semua operasi tambah, edit, hapus, upload gambar, dan toggle Final wajib berhasil ke Supabase; jika perangkat offline/gagal koneksi, batalkan aksi dan tampilkan notifikasi agar user menyalakan data seluler atau Wi-Fi.
- State awal `moodboardItems` dimulai kosong (`[]`) dengan empty-state CTA (tanpa gambar dummy bawaan).
- Setiap item moodboard wajib memiliki judul dan minimal salah satu dari **Foto Galeri** atau **Link Referensi**.
- Letak akses melalui kartu ringkasan di Dashboard (`app/(tabs)/index.tsx`) dan seksi referensi di Detail Vendor (`app/(tabs)/budget.tsx`); *bottom navigation bar* tetap 5 tab.
- Aturan Ekspor Brief PDF: jika dalam cakupan filter/vendor aktif terdapat >= 1 item bertanda `★ Final`, hanya item Final yang diekspor; jika 0 item bertanda Final, seluruh item dalam cakupan aktif diekspor.
- Seluruh perintah Expo & Git di Windows dijalankan dengan `BypassSandbox: true`.

## Review Focus

1. **Offline / error koneksi saat mutasi moodboard:** Memanggil `addMoodboardItemOnline`, `updateMoodboardItemOnline`, `toggleMoodboardFinalOnline`, atau `deleteMoodboardItemOnline` saat tidak terhubung / gagal Supabase harus melempar error dengan pesan koneksi dan membiarkan `moodboardItems` di store tidak berubah (diuji di Task 4).
2. **Validasi item tanpa foto dan tanpa link:** Mengirim data dengan judul terisi namun tanpa `imageUrl`/`localUri` dan tanpa `referenceUrl` harus ditolak validasinya sebelum memanggil API cloud (diuji di Task 4 & Task 6).
3. **Cloud deletion mengosongkan daftar (`[]`):** Ketika pasangan menghapus item terakhir di cloud sehingga `snapshot.moodboardItems` bernilai `[]`, `hydrateFromCloud()` harus mengosongkan `state.moodboardItems` menjadi `[]` (diuji di Task 4).
4. **Ekspor Brief PDF pada cakupan kosong:** Memanggil `exportMoodboardBriefPdf` saat ada 0 item pada filter/vendor aktif harus gagal terkendali / menampilkan alert informatif tanpa memanggil `Print.printToFileAsync` (diuji di Task 5).
5. **Kirim Cepat saat unduh foto remote gagal karena offline:** Jika `FileSystem.downloadAsync` gagal saat mengunduh `imageUrl` untuk dibagikan, `shareSingleMoodboardItem` harus melaporkan gagal koneksi yang meminta user menyalakan data/Wi-Fi tanpa melempar unhandled exception ke `Sharing.shareAsync` (diuji di Task 5).

---

### Task 1: Skema Database Supabase & Storage Bucket `moodboard-assets`

**Files:**
- Create: `supabase/migrations/20261125000000_moodboard_schema.sql`
- Test: `tests/db/moodboard_schema_validation.test.ts`

**Interfaces:**
- Produces SQL table `moodboard_items`, indexes `idx_moodboard_workspace_id` & `idx_moodboard_vendor_id`, RLS policy `is_workspace_member(workspace_id)`, Realtime publication entry, and Storage bucket `moodboard-assets` with workspace-scoped RLS policies.

- [ ] **Step 1: Write the failing schema validation test**

Create `tests/db/moodboard_schema_validation.test.ts`:
```ts
import { readFileSync } from 'fs';

describe('Moodboard Database & Storage Schema Validation', () => {
  it('contains moodboard_items table, RLS, realtime publication, and moodboard-assets bucket', () => {
    const migration = readFileSync('supabase/migrations/20261125000000_moodboard_schema.sql', 'utf8');
    expect(migration).toContain('CREATE TABLE moodboard_items');
    expect(migration).toContain('workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE');
    expect(migration).toContain('vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL');
    expect(migration).toContain("CHECK (category IN ('decor', 'attire', 'makeup', 'photo', 'other'))");
    expect(migration).toContain('idx_moodboard_workspace_id');
    expect(migration).toContain('ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE moodboard_items');
    expect(migration).toContain("INSERT INTO storage.buckets (id, name, public)");
    expect(migration).toContain("'moodboard-assets'");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/db/moodboard_schema_validation.test.ts`
Expected: FAIL (`ENOENT: no such file or directory, open 'supabase/migrations/20261125000000_moodboard_schema.sql'`).

- [ ] **Step 3: Create `supabase/migrations/20261125000000_moodboard_schema.sql`**

Include:
- `CREATE TABLE moodboard_items` with columns `id`, `workspace_id`, `vendor_id`, `title`, `category`, `image_url`, `storage_path`, `reference_url`, `color_palette TEXT[] DEFAULT '{}'`, `notes`, `is_final BOOLEAN DEFAULT false`, `created_by`, `created_at`.
- `CREATE INDEX idx_moodboard_workspace_id` and `idx_moodboard_vendor_id`.
- `ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY` and `CREATE POLICY "Users can access their moodboard items" ON moodboard_items FOR ALL USING (is_workspace_member(workspace_id));`.
- `ALTER TABLE moodboard_items REPLICA IDENTITY FULL;` and `DO $$ ... ALTER PUBLICATION supabase_realtime ADD TABLE moodboard_items; ... $$;`.
- `INSERT INTO storage.buckets (id, name, public) VALUES ('moodboard-assets', 'moodboard-assets', true) ON CONFLICT (id) DO NOTHING;` plus `storage.objects` policies allowing `SELECT` on `bucket_id = 'moodboard-assets'` and `INSERT`/`UPDATE`/`DELETE` when `is_workspace_member(((storage.foldername(name))[1])::uuid)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/db/moodboard_schema_validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261125000000_moodboard_schema.sql tests/db/moodboard_schema_validation.test.ts
git commit -m "feat(db): add moodboard_items table, realtime, and storage bucket migration"
```

---

### Task 2: Instalasi Paket Expo & Konfigurasi Jest Mock

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `tests/setup.ts`

**Interfaces:**
- Produces available native modules + Node Jest mocks for `expo-image-picker`, `expo-sharing`, `expo-print`, `expo-file-system`, and `expo-clipboard`.

- [ ] **Step 1: Install required Expo SDK 58 packages**

Run (with `BypassSandbox: true`):
`npx expo install expo-image-picker expo-sharing expo-print expo-file-system expo-clipboard`

- [ ] **Step 2: Add Jest mocks in `tests/setup.ts`**

Add clean mocks for:
- `expo-image-picker`: `requestMediaLibraryPermissionsAsync`, `launchImageLibraryAsync`, `MediaTypeOptions: { Images: 'Images' }`
- `expo-sharing`: `isAvailableAsync`, `shareAsync`
- `expo-print`: `printToFileAsync`
- `expo-file-system`: `cacheDirectory: 'file:///mock-cache/'`, `downloadAsync`, `readAsStringAsync`, `EncodingType: { Base64: 'base64' }`
- `expo-clipboard`: `setStringAsync`
- Ensure `Share` is mocked on `react-native` inside `tests/setup.ts` (and exported in `src/types/react-native.d.ts`).

- [ ] **Step 3: Run existing test suite to confirm no regressions**

Run: `npm test`
Expected: PASS across all 25 test suites.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tests/setup.ts src/types/react-native.d.ts
git commit -m "chore(deps): install moodboard image, share, print, and clipboard packages with mocks"
```

---

### Task 3: Integrasi Supabase Storage, `CloudSyncService`, dan `RealtimeSync`

**Files:**
- Modify: `src/services/realtimeSync.ts:24-35`
- Modify: `src/services/cloudSyncService.ts`
- Test: `tests/services/cloudSyncService.test.ts`

**Interfaces:**
- Consumes `MoodboardItem` type from `src/stores/useWeddingStore.ts`.
- Produces on `CloudSyncService`:
  - `static async uploadMoodboardImage(localUri: string, itemId: string): Promise<{ imageUrl: string; storagePath: string }>`
  - `static async pushMoodboardItem(item: MoodboardItem): Promise<void>` (throws informative connection error when offline/unconfigured/Supabase error)
  - `static async deleteMoodboardItem(id: string, storagePath?: string): Promise<void>` (throws informative connection error when offline/error)
  - `pullWorkspaceSnapshot(workspaceId)` returns `moodboardItems: MoodboardItem[]`.

- [ ] **Step 1: Write failing tests in `tests/services/cloudSyncService.test.ts`**

Add tests:
- `pulls moodboard_items in pullWorkspaceSnapshot`: mocks `supabase.from('moodboard_items')` returning row `{ id: 'm1', title: 'Pelaminan Minimalis', category: 'decor', color_palette: ['#F8F7F4'], is_final: true }` and asserts `snapshot.moodboardItems[0].isFinal === true`.
- `throws clear online-required error when pushing or deleting moodboard item without active cloud session`: asserts `CloudSyncService.pushMoodboardItem(...)` and `deleteMoodboardItem(...)` reject with message containing `'Nyalakan data seluler atau Wi-Fi'`.
- `uploads moodboard image to Supabase Storage bucket moodboard-assets and returns publicUrl` (with mocked `supabase.storage.from('moodboard-assets')` and `fetch` / base64 upload).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/services/cloudSyncService.test.ts`
Expected: FAIL (`pushMoodboardItem` / `uploadMoodboardImage` not defined).

- [ ] **Step 3: Implement Storage upload, DB push/delete/pull in `src/services/cloudSyncService.ts` and add `'moodboard_items'` to `src/services/realtimeSync.ts`**

Details:
- Add `'moodboard_items'` to `childTables` in `subscribeToWorkspaceChanges`.
- In `uploadMoodboardImage(localUri, itemId)`: read file via `FileSystem.readAsStringAsync(localUri, { encoding: 'base64' })` -> decode base64 to `Uint8Array` -> upload to `supabase.storage.from('moodboard-assets').upload(`${ctx.workspaceId}/${itemId}.jpg`, bytes, { contentType: 'image/jpeg', upsert: true })` -> `getPublicUrl` -> return `{ imageUrl, storagePath }`. Throw clear connection/auth error if `!ctx` or upload returns `{ error }`.
- In `pushMoodboardItem(item)`: require `ctx` & `isValidUuid(item.id)`; throw `'Koneksi Internet Diperlukan: Nyalakan data seluler atau Wi-Fi untuk menyimpan moodboard secara online.'` if `!ctx` or if `supabase.from('moodboard_items').upsert(...)` returns `{ error }` or throws network error.
- In `deleteMoodboardItem(id, storagePath)`: require `ctx`, delete row from `moodboard_items` (throw on error), and remove file from `storage.from('moodboard-assets').remove([storagePath])` if `storagePath` exists.
- In `pullWorkspaceSnapshot`: query `moodboard_items` ordered by `created_at` descending and map to `MoodboardItem[]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/services/cloudSyncService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/realtimeSync.ts src/services/cloudSyncService.ts tests/services/cloudSyncService.test.ts
git commit -m "feat(sync): add online-first Supabase Storage and moodboard_items sync"
```

---

### Task 4: Slice `moodboardItems` Online-First di `useWeddingStore`

**Files:**
- Modify: `src/stores/useWeddingStore.ts`
- Test: `tests/stores/useWeddingStore.test.ts`

**Interfaces:**
- Consumes `CloudSyncService.uploadMoodboardImage`, `pushMoodboardItem`, `deleteMoodboardItem`.
- Produces on `useWeddingStore`:
  - `MoodboardCategory`, `MoodboardItem` types
  - `moodboardItems: MoodboardItem[]` (initial: `[]`)
  - `addMoodboardItemOnline(input: Omit<MoodboardItem, 'id' | 'createdAt' | 'imageUrl' | 'storagePath'>, localImageUri?: string): Promise<MoodboardItem>`
  - `updateMoodboardItemOnline(id: string, patch: Partial<MoodboardItem>, newLocalImageUri?: string): Promise<void>`
  - `toggleMoodboardFinalOnline(id: string): Promise<void>`
  - `deleteMoodboardItemOnline(id: string): Promise<void>`
  - Updated `hydrateFromCloud` (`moodboardItems: snapshot.moodboardItems !== undefined ? snapshot.moodboardItems : state.moodboardItems`).

- [ ] **Step 1: Write failing tests in `tests/stores/useWeddingStore.test.ts`**

Add tests covering Review Focus #1, #2, #3:
- Starts `moodboardItems` empty (`[]`).
- Rejects when offline / `CloudSyncService.pushMoodboardItem` fails, leaving `moodboardItems` unchanged (Review Focus #1).
- Rejects validation when neither `localImageUri` nor `referenceUrl` is provided (Review Focus #2).
- Adds, toggles `isFinal`, updates, and deletes moodboard item when `CloudSyncService` succeeds.
- `hydrateFromCloud({ moodboardItems: [] })` clears `moodboardItems` to `[]` (Review Focus #3).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/stores/useWeddingStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `MoodboardItem` types, online-first actions, and `hydrateFromCloud` update in `src/stores/useWeddingStore.ts`**

- Validate `(localImageUri || input.referenceUrl?.trim())` before network calls; throw descriptive error if missing.
- For add/update/toggle/delete: perform `CloudSyncService` upload/upsert/delete first, and only mutate Zustand `set(...)` after cloud call succeeds.
- Update `resetAllData` to reset `moodboardItems: []`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/stores/useWeddingStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/useWeddingStore.ts tests/stores/useWeddingStore.test.ts
git commit -m "feat(store): add online-first moodboard state and cloud mutations"
```

---

### Task 5: Service Kirim Cepat & Ekspor Brief PDF (`moodboardShareService.ts`)

**Files:**
- Create: `src/services/moodboardShareService.ts`
- Test: `tests/services/moodboardShareService.test.ts`

**Interfaces:**
- Consumes `MoodboardItem`, `VendorItem`, `WeddingProfile` from `src/stores/useWeddingStore.ts`.
- Produces:
  - `selectItemsForBrief(items: MoodboardItem[]): MoodboardItem[]` (returns `items.filter(i => i.isFinal)` if >= 1 exists, otherwise all `items`).
  - `formatMoodboardCaption(item: MoodboardItem, vendorName?: string): string`
  - `shareSingleMoodboardItem(item: MoodboardItem, vendor?: VendorItem): Promise<{ ok: boolean; mode: 'image_with_clipboard' | 'whatsapp_text' | 'text_share'; message: string }>`
  - `exportMoodboardBriefPdf(params: { items: MoodboardItem[]; scopeTitle: string; profile: WeddingProfile; vendor?: VendorItem }): Promise<{ ok: boolean; uri?: string; exportedCount: number; message: string }>`

- [ ] **Step 1: Write failing tests in `tests/services/moodboardShareService.test.ts`**

Add tests covering Review Focus #4 & #5:
- `selectItemsForBrief` selects only `isFinal` items when >= 1 Final item exists, and selects all items when 0 Final items exist.
- `shareSingleMoodboardItem` with `imageUrl` copies formatted caption via `Clipboard.setStringAsync`, downloads image via `FileSystem.downloadAsync`, and calls `Sharing.shareAsync`.
- `shareSingleMoodboardItem` returns `{ ok: false, message: ...'Nyalakan data seluler atau Wi-Fi'... }` gracefully when `FileSystem.downloadAsync` throws (Review Focus #5).
- `shareSingleMoodboardItem` without photo opens `Linking.openURL('https://wa.me/...')` when linked vendor has a phone number.
- `exportMoodboardBriefPdf` returns `{ ok: false, exportedCount: 0 }` without calling `Print.printToFileAsync` when items array is empty (Review Focus #4).
- `exportMoodboardBriefPdf` generates HTML PDF via `Print.printToFileAsync` and shares via `Sharing.shareAsync` for matching items.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/services/moodboardShareService.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/services/moodboardShareService.ts`**

- Implement `selectItemsForBrief`, `formatMoodboardCaption`, `shareSingleMoodboardItem`, and `exportMoodboardBriefPdf` cleanly with editorial HTML styling (`#F8F7F4`, `#9E5A47`, `#B89242`) and online-error handling.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/services/moodboardShareService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/moodboardShareService.ts tests/services/moodboardShareService.test.ts
git commit -m "feat(share): add quick vendor share and PDF brief export service"
```

---

### Task 6: Layar `Moodboard & Referensi` (`app/moodboard.tsx`) & Registrasi Route

**Files:**
- Create: `app/moodboard.tsx`
- Modify: `app/_layout.tsx:101-106`
- Test: `tests/ui/moodboard_screen.test.ts`

**Interfaces:**
- Consumes `useWeddingStore` (`moodboardItems`, `vendors`, `profile`, `addMoodboardItemOnline`, `updateMoodboardItemOnline`, `toggleMoodboardFinalOnline`, `deleteMoodboardItemOnline`), `MoodboardShareService` (`shareSingleMoodboardItem`, `exportMoodboardBriefPdf`).
- Supports route param `vendorId?: string` via `useLocalSearchParams`.

- [ ] **Step 1: Write failing UI test `tests/ui/moodboard_screen.test.ts`**

Test rendering `MoodboardScreen` in both empty state (`moodboardItems: []`, verifies empty-state CTA `"Tambah Inspirasi Pertama"` renders) and populated state (verifies category chips, `★ Final` filter toggle, 2-column visual cards, and `"Ekspor Brief PDF"` trigger render without errors).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/ui/moodboard_screen.test.ts`
Expected: FAIL (`Cannot find module '../../app/moodboard'`).

- [ ] **Step 3: Register `<Stack.Screen name="moodboard" />` in `app/_layout.tsx` and build `app/moodboard.tsx`**

Implement `app/moodboard.tsx` with:
- Header (`"Moodboard & Referensi"`, tombol kembali, tombol `"+ Tambah"`, dan banner peringatan bila offline/belum login cloud).
- Filter chip kategori (`Semua`, `Dekorasi`, `Busana`, `MUA`, `Foto`, `Lainnya`), chip toggle `"★ Final"`, serta chip filter vendor aktif bila dibuka dari `vendorId` param.
- Action bar `"Ekspor Brief PDF"` di atas grid.
- Grid 2 kolom kartu visual (foto/link preview, badge `★ Final`, judul, badge nama vendor, titik palet warna).
- Modal Tambah / Edit (tombol `"Pilih Foto Galeri"` via `ImagePicker.launchImageLibraryAsync`, input Link Referensi, input Judul, pilih Kategori, pilih Vendor terkait, palet warna preset + hex custom, Catatan, Toggle `★ Final`, loading indicator selama upload online, dan validasi Alert jika offline atau jika foto & link sama-sama kosong).
- Modal Detail Item (pratinjau foto besar, link klikable, swatch warna + hex, catatan, toggle Final, Edit/Hapus, tombol `"Bagikan Cepat ke Vendor"`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/ui/moodboard_screen.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/moodboard.tsx app/_layout.tsx tests/ui/moodboard_screen.test.ts
git commit -m "feat(ui): build Moodboard & Referensi screen with upload, palette, and vendor brief export"
```

---

### Task 7: Integrasi Dashboard (`index.tsx`) & Detail Vendor (`budget.tsx`) + Verifikasi Penuh

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/budget.tsx`
- Modify: `tests/ui/core_screens.test.ts` (verify Dashboard & Budget render cleanly with Moodboard integration)

**Interfaces:**
- Consumes `moodboardItems` from `useWeddingStore` and `exportMoodboardBriefPdf` from `src/services/moodboardShareService.ts`.

- [ ] **Step 1: Add Moodboard summary card to `app/(tabs)/index.tsx`**

Add a warm editorial card *"Moodboard & Referensi"* below the Financial / Upcoming cards showing total saved items, `★ Final` count, and color swatch/thumbnail preview; tapping navigates to `/moodboard`.

- [ ] **Step 2: Add "Moodboard & Referensi Vendor Ini" section inside `selectedVendorForDetail` modal in `app/(tabs)/budget.tsx`**

Inside Vendor Management Sheet:
- Filter `moodboardItems` by `vendorId === selectedVendorForDetail.id`.
- Display horizontal strip of linked thumbnails/cards (tapping opens `/moodboard?vendorId=${selectedVendorForDetail.id}`).
- Add `"+ Tambah"` button routing to `/moodboard?vendorId=${selectedVendorForDetail.id}` (closing the modal cleanly first).
- Add **"Kirim Brief PDF"** button calling `exportMoodboardBriefPdf` for that vendor's items.

- [ ] **Step 3: Run full Jest test suite and Expo iOS bundle check**

Run: `npm test` (Expected: all 27+ test suites PASS).
Run (with `BypassSandbox: true`): `npx expo export --platform ios --output-dir .expo-test-export` (Expected: bundles cleanly with exit code 0).

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx app/(tabs)/budget.tsx tests/ui/core_screens.test.ts
git commit -m "feat(ui): integrate Moodboard summary on Dashboard and vendor references in Vendor Detail"
```
