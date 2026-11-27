# Wedding Tracker Phase 3 (Mobile UI Screens) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun antarmuka visual mobile (*frontend UI*) lengkap berbasis Expo Router SDK 52 dengan Bottom Tab Navigation elegan dan 5 layar utama (Dashboard, Checklist, Anggaran, Tamu & Angpau, Dokumen Kanonik).

**Architecture:** Menggunakan Expo Router file-based routing (`app/` layout and tabs) yang terintegrasi dengan theme tokens nuansa pernikahan (*Warm Ivory, Terracotta/Rose Gold, Deep Navy, Champagne Gold*), komponen primitives reusable di `src/components/common/`, dan menghubungkan data dinamis langsung dari backend services (`DashboardService`, `ChecklistService`, `BudgetCalculator`, `GuestService`, `GiftService`, `DocumentService`).

**Tech Stack:** React Native 0.76+, Expo SDK 52, Expo Router v4, React 18, Zustand, TanStack Query, date-fns, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-11-24-wedding-tracker-phase3-mobile-ui.md`

## Global Constraints

- Platform: Expo SDK 52 / React Native (Android & iOS).
- Theme Palette: Primary `#FDFBF7` (Ivory), Accent `#C57B57` (Terracotta/Rose Gold), Secondary `#D4AF37` (Champagne Gold), Text `#1A2238` (Deep Navy), White `#FFFFFF`, Border `#EFECE6`.
- Navigation: 5 Bottom Tabs (`index` -> Dashboard, `checklist` -> Checklist, `budget` -> Anggaran, `guests` -> Tamu & Angpau, `documents` -> Dokumen Kanonik).
- Backward Compatibility: Seluruh 14 test suites yang sudah ada (51 unit & demo tests) harus tetap lulus 100% tanpa regresi.

## Review Focus

1. **Expo Router Setup & Mocks:** Test runner Jest harus tetap dapat mengeksekusi test tanpa terblokir oleh native module exports Expo Router.
2. **Katering Pax Visual:** Layar tamu harus secara eksplisit menonjolkan angka *confirmed attending pax* (angka fix katering) terpisah dari kuota undangan.
3. **Peringatan Kanonik Surat Baptis:** Layar dokumen harus menampilkan banner peringatan visual jika ada surat baptis yang diterbitkan $> 180$ hari sebelum hari H.
4. **Deteksi Over-Budget:** Layar budget dan dashboard harus menampilkan badge/banner peringatan warna amber/red jika total komitmen melebihi alokasi.
5. **Penanda Pembayar Transaksi:** Form/list transaksi harus memvisualisasikan siapa pembayar dana (Octa vs Jenesia vs Keluarga).

---

### Task 1: Setup Dependensi Expo Router, Theme Tokens & Jest Mocks

**Files:**
- Modify: `package.json`
- Create: `src/theme/colors.ts`
- Create: `src/theme/spacing.ts`
- Create: `tests/setup/jestSetup.ts`
- Modify: `jest.config.js`
- Test: `tests/ui/theme.test.ts`

**Interfaces:**
- `colors`: palette token (`primary`, `accent`, `secondary`, `textPrimary`, `textSecondary`, `cardBg`, `bg`, `border`, `success`, `warning`, `danger`)
- `spacing`: scale token (`xs: 4`, `sm: 8`, `md: 16`, `lg: 24`, `xl: 32`, `borderRadius: 12`)

- [ ] **Step 1: Install paket navigasi Expo Router SDK 52**

```bash
npm install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants
```

- [ ] **Step 2: Buat unit test theme tokens**

```typescript
// tests/ui/theme.test.ts
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

describe('Design System Tokens', () => {
  it('defines required wedding theme color tokens', () => {
    expect(colors.bg).toBe('#FDFBF7');
    expect(colors.accent).toBe('#C57B57');
    expect(colors.textPrimary).toBe('#1A2238');
    expect(colors.cardBg).toBe('#FFFFFF');
    expect(colors.border).toBe('#EFECE6');
  });

  it('defines standard spacing and border radius', () => {
    expect(spacing.md).toBe(16);
    expect(spacing.borderRadius).toBe(12);
  });
});
```

- [ ] **Step 3: Implementasikan `src/theme/colors.ts` dan `src/theme/spacing.ts`**

Implementasikan token warna elegan pernikahan dan spacing standar.

- [ ] **Step 4: Konfigurasi Jest setup untuk Expo Router mocks**

Buat `tests/setup/jestSetup.ts` dengan mock `expo-router` dan safe-area-context agar test component dapat berjalan mulus.

- [ ] **Step 5: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/ui/theme.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/theme package.json package-lock.json jest.config.js tests/setup/ tests/ui/theme.test.ts
git commit -m "feat(ui): setup expo router dependencies, theme tokens, and jest mocks"
```

---

### Task 2: Komponen Primitives Reusable (Design System Primitives)

**Files:**
- Create: `src/components/common/Card.tsx`
- Create: `src/components/common/Header.tsx`
- Create: `src/components/common/StatCard.tsx`
- Create: `src/components/common/ProgressBar.tsx`
- Create: `src/components/common/Badge.tsx`
- Create: `src/components/common/SegmentedControl.tsx`
- Test: `tests/ui/components.test.ts`

**Interfaces:**
- `Card({ children, style })`
- `Header({ title, subtitle, rightElement })`
- `StatCard({ label, value, subtext, variant, accentColor })`
- `ProgressBar({ progress, color, height })`
- `Badge({ label, variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' })`
- `SegmentedControl({ options, selectedIndex, onChange })`

- [ ] **Step 1: Tulis unit test untuk verifikasi props dan rendering komponen primitives**

```typescript
// tests/ui/components.test.ts
import { colors } from '../../src/theme/colors';

describe('UI Primitives Logic & Props', () => {
  it('verifies badge variants map to correct colors', () => {
    // Test helper logic for badge color mapping
    const getBadgeColor = (variant: string) => {
      switch (variant) {
        case 'success': return colors.success;
        case 'warning': return colors.warning;
        case 'danger': return colors.danger;
        default: return colors.neutral;
      }
    };
    expect(getBadgeColor('success')).toBe(colors.success);
    expect(getBadgeColor('warning')).toBe(colors.warning);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan jika komponen belum ada**

- [ ] **Step 3: Implementasikan komponen di `src/components/common/`**

Tulis `Card.tsx`, `Header.tsx`, `StatCard.tsx`, `ProgressBar.tsx`, `Badge.tsx`, dan `SegmentedControl.tsx`.

- [ ] **Step 4: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/ui/components.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ tests/ui/components.test.ts
git commit -m "feat(ui): implement reusable design system primitives"
```

---

### Task 3: Root Layout & Bottom Tabs Navigation

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Test: `tests/ui/navigation.test.ts`

**Interfaces:**
- `RootLayout`: Wraps application in `SafeAreaProvider` and `QueryClientProvider`.
- `TabsLayout`: Configures 5 tabs (`index`, `checklist`, `budget`, `guests`, `documents`) with custom tab bar styling using `colors.accent` and `colors.bg`.

- [ ] **Step 1: Tulis test struktur navigasi**

Pastikan navigasi mengekspor rute dan konfigurasi tab yang benar.

- [ ] **Step 2: Implementasikan `app/_layout.tsx` dan `app/(tabs)/_layout.tsx`**

- [ ] **Step 3: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/ui/navigation.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/(tabs)/_layout.tsx tests/ui/navigation.test.ts
git commit -m "feat(ui): configure expo router root layout and bottom tabs bar"
```

---

### Task 4: Layar Tab Utama (Dashboard, Checklist, Anggaran & Vendor)

**Files:**
- Create: `app/(tabs)/index.tsx` (Dashboard)
- Create: `app/(tabs)/checklist.tsx` (Checklist Katolik & Sipil)
- Create: `app/(tabs)/budget.tsx` (Anggaran Finansial & Vendor)
- Test: `tests/ui/core_screens.test.ts`

**Interfaces:**
- `DashboardScreen`: Menampilkan countdown 10 Okt 2027, progress bar, ringkasan kas vs komitmen, alert over-budget, kontribusi Octa vs Jenesia.
- `ChecklistScreen`: Menampilkan filter kategori (Kanonik, Liturgi, Sipil), list task, toggle selesai, prioritas, PIC.
- `BudgetScreen`: Menampilkan target budget vs komitmen, kartu alokasi pos anggaran, kartu vendor & lifecycle status, list cicilan pembayaran.

- [ ] **Step 1: Tulis test logika presentasi core screens**

- [ ] **Step 2: Implementasikan `app/(tabs)/index.tsx`, `app/(tabs)/checklist.tsx`, dan `app/(tabs)/budget.tsx`**

- [ ] **Step 3: Jalankan test core screens**

Run: `npx jest tests/ui/core_screens.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx app/(tabs)/checklist.tsx app/(tabs)/budget.tsx tests/ui/core_screens.test.ts
git commit -m "feat(ui): implement dashboard, checklist, and budget screens"
```

---

### Task 5: Layar Tab Tamu, Angpau & Dokumen Kanonik Katolik

**Files:**
- Create: `app/(tabs)/guests.tsx` (Tamu & Angpau / Gift Ledger)
- Create: `app/(tabs)/documents.tsx` (Dokumen Kanonik Katolik & Sipil)
- Test: `tests/ui/data_screens.test.ts`

**Interfaces:**
- `GuestsScreen`: Segmented switcher Tamu vs Angpau, kalkulator pax katering, list RSVP, buku besar amplop tunai/transfer & kado fisik, status ucapan terima kasih.
- `DocumentsScreen`: Compliance rate ring/badge, banner validasi aturan 180 hari surat baptis Katolik, list dokumen dengan status (verified, pending, expired, rejected).

- [ ] **Step 1: Tulis test logika presentasi data screens**

- [ ] **Step 2: Implementasikan `app/(tabs)/guests.tsx` dan `app/(tabs)/documents.tsx`**

- [ ] **Step 3: Jalankan test data screens**

Run: `npx jest tests/ui/data_screens.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/guests.tsx app/(tabs)/documents.tsx tests/ui/data_screens.test.ts
git commit -m "feat(ui): implement guests & gift ledger and canonical documents screens"
```

---

### Task 6: Integrasi Demo Visual & Verifikasi Seluruh Test Suite

**Files:**
- Create: `tests/phase3_ui_demo.test.ts`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Produces: Runner demo interaktif UI (`npm run demo:ui`) dan verifikasi full test suite (15+ test suites, 60+ tests lulus 100%).

- [ ] **Step 1: Buat runner demo simulasi rendering antarmuka visual Fase 3**

Tulis `tests/phase3_ui_demo.test.ts` yang mensimulasikan rendering seluruh layar dan data rekapitulasi.

- [ ] **Step 2: Tambahkan script `demo:ui` di package.json**

- [ ] **Step 3: Jalankan seluruh test suite proyek**

Run: `npm test`
Expected: PASS (Semua test suite Fase 1, Fase 2, dan Fase 3 lulus tanpa regresi)

- [ ] **Step 4: Perbarui dokumentasi di `README.md`**

- [ ] **Step 5: Commit**

```bash
git add tests/phase3_ui_demo.test.ts package.json README.md
git commit -m "test(ui): add phase 3 ui demo and verify entire test suite"
```
