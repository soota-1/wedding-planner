# Wedding Tracker (Mobile App - iOS & Android) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi mobile kolaboratif (Android & iOS) Fase 1 (MVP) untuk calon pengantin Katolik (Octa & Jenesia) yang mencakup autentikasi berpasangan, dashboard progres & countdown, checklist kanonik/liturgi/sipil otomatis dengan kalkulasi tanggal dinamis, manajemen siklus hidup vendor, serta budgeting kas bersama dengan pelacakan termin/DP dan penanda pembayar.

**Architecture:** Frontend mobile berbasis React Native dengan Expo (TypeScript) terhubung ke Supabase (PostgreSQL, Auth, Realtime, Storage). Data pernikahan diisolasi per workspace dengan Row Level Security (RLS). State dan caching di sisi mobile menggunakan TanStack Query + Zustand untuk toleransi offline.

**Tech Stack:** React Native (Expo SDK), TypeScript, Supabase (@supabase/supabase-js), TanStack Query, Zustand, date-fns, Jest (Testing).

**Spec:** `docs/superpowers/specs/2026-11-23-wedding-tracker-design.md`

## Global Constraints

- Platform: Android & iOS melalui React Native Expo.
- Database & Backend: Supabase PostgreSQL dengan Row Level Security (RLS) aktif pada seluruh tabel.
- Akun Default Pengujian: Groom (`octaadsp@gmail.com`) dan Bride (`jenesia23@gmail.com`), default password `Admin123@`, dengan fitur ganti password.
- Desain Data Keuangan: Tabel `transactions` berstatus `paid` adalah satu-satunya sumber kas keluar riil; `vendors.contract_value` mewakili komitmen kewajiban; tidak boleh ada double counting antara task cost dan transaksi.
- Templat Katolik: Seluruh tugas bawaan gereja dan sipil memiliki `offset_days` relatif terhadap `wedding_date` dan otomatis bergeser jika tanggal pernikahan diubah.

## Review Focus

1. **Kalkulasi Over-Budget & Saldo Semu:** Saat nilai kontrak vendor melebihi target anggaran kategori atau total budget, sistem harus langsung mendeteksi over-budget meskipun kas yang dibayarkan baru sebatas DP 10-20%.
2. **Double Counting Pengeluaran:** Biaya yang tercatat di task (`tasks.actual_cost`) tidak boleh dijumlahkan ulang dengan `transactions.amount` pada kalkulasi kas global.
3. **Sinkronisasi Realtime Kolaborasi:** Perubahan status checklist atau pencatatan DP oleh Groom harus langsung ter-update di layar Bride tanpa perlu refresh manual.
4. **Pergeseran Tanggal Pernikahan (Date Shifting):** Saat pengguna mengubah `wedding_date`, hanya tugas templat yang belum selesai (`status != 'done'`) yang tenggat waktunya bergeser; tugas yang sudah selesai tidak boleh diubah.
5. **Akses Data Offline:** Saat perangkat tidak memiliki koneksi internet di gereja/venue, data checklist dan budget terakhir harus tetap bisa dibaca dari cache lokal tanpa crash.

---

### Task 1: Scaffolding Proyek Expo & Konfigurasi TypeScript / Jest

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `jest.config.js`
- Create: `src/config/supabase.ts`
- Test: `tests/config/supabase.test.ts`

**Interfaces:**
- Produces: `supabase` client instance bertipe dari `@supabase/supabase-js`.

- [ ] **Step 1: Tulis unit test untuk inisialisasi Supabase client**

```typescript
// tests/config/supabase.test.ts
import { supabase } from '../../src/config/supabase';

describe('Supabase Client Configuration', () => {
  it('should initialize supabase client with valid url and anon key', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
```

- [ ] **Step 2: Jalankan test untuk memastikan test gagal (fail)**

Run: `npx jest tests/config/supabase.test.ts`
Expected: FAIL ("Cannot find module '../../src/config/supabase'")

- [ ] **Step 3: Setup konfigurasi project, dependencies, dan inisialisasi client**

Buat `src/config/supabase.ts` mengekspor instance client Supabase menggunakan env variables `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 4: Jalankan test untuk memastikan test lulus (pass)**

Run: `npx jest tests/config/supabase.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json app.json tsconfig.json jest.config.js src/config/supabase.ts tests/config/supabase.test.ts
git commit -m "chore: scaffold expo project and configure supabase client"
```

---

### Task 2: Supabase Schema, RLS, & Catholic Template Seed Data

**Files:**
- Create: `supabase/migrations/20261123000000_initial_schema.sql`
- Create: `supabase/seed.sql`
- Test: `tests/db/schema_validation.test.ts`

**Interfaces:**
- Consumes: PostgreSQL schema definitions dari `docs/superpowers/specs/2026-11-23-wedding-tracker-design.md`.
- Produces: Struktur tabel lengkap (`workspaces`, `workspace_members`, `checklist_categories`, `tasks`, `vendors`, `budget_categories`, `transactions`), RLS policies, dan akun default Octa & Jenesia.

- [ ] **Step 1: Tulis test validasi DDL schema & seed**

```typescript
// tests/db/schema_validation.test.ts
import { readFileSync } from 'fs';

describe('Database Schema & Seed Files', () => {
  it('contains essential tables and foreign keys', () => {
    const migration = readFileSync('supabase/migrations/20261123000000_initial_schema.sql', 'utf8');
    expect(migration).toContain('CREATE TABLE workspaces');
    expect(migration).toContain('CREATE TABLE workspace_members');
    expect(migration).toContain('CREATE TABLE checklist_categories');
    expect(migration).toContain('CREATE TABLE tasks');
    expect(migration).toContain('CREATE TABLE vendors');
    expect(migration).toContain('CREATE TABLE budget_categories');
    expect(migration).toContain('CREATE TABLE transactions');
    expect(migration).toContain('budget_category_id UUID REFERENCES budget_categories');
  });

  it('contains seed data for Octa and Jenesia accounts and Catholic checklist', () => {
    const seed = readFileSync('supabase/seed.sql', 'utf8');
    expect(seed).toContain('octaadsp@gmail.com');
    expect(seed).toContain('jenesia23@gmail.com');
    expect(seed).toContain('Kursus Persiapan Perkawinan');
    expect(seed).toContain('Penyelidikan Kanonik');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/db/schema_validation.test.ts`
Expected: FAIL (File not found)

- [ ] **Step 3: Buat file migration SQL & file seed**

Implementasikan DDL PostgreSQL lengkap dengan:
- RLS policies untuk isolasi `workspace_id`.
- Foreign key `vendors.budget_category_id -> budget_categories.id`.
- Trigger untuk update `tasks.due_date` berdasarkan `offset_days` saat `workspaces.wedding_date` diperbarui.
- Seed data akun `octaadsp@gmail.com` dan `jenesia23@gmail.com` dengan password hash `Admin123@`, workspace "Pernikahan Octa & Jenesia", serta daftar tugas gereja dan sipil lengkap beserta `offset_days`.

- [ ] **Step 4: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/db/schema_validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/ tests/db/
git commit -m "feat(db): add initial schema, rls policies, and catholic template seed"
```

---

### Task 3: Modul Autentikasi & State Kolaborasi Pasangan

**Files:**
- Create: `src/services/auth.ts`
- Create: `src/stores/useAuthStore.ts`
- Test: `tests/services/auth.test.ts`

**Interfaces:**
- Consumes: `supabase.auth`
- Produces: `loginWithEmail(email, password)`, `changePassword(newPassword)`, `signInWithGoogle()`, `activeWorkspace` di Zustand store.

- [ ] **Step 1: Tulis unit test untuk fungsi auth dan change password**

```typescript
// tests/services/auth.test.ts
import { AuthService } from '../../src/services/auth';

describe('AuthService', () => {
  it('validates default credentials format', () => {
    expect(AuthService.isValidEmail('octaadsp@gmail.com')).toBe(true);
    expect(AuthService.isValidEmail('invalid-email')).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/auth.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasikan AuthService & useAuthStore**

Implementasikan logika login email/password, session persistence, dan fungsi `changePassword(newPassword)`.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx jest tests/services/auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/auth.ts src/stores/useAuthStore.ts tests/services/auth.test.ts
git commit -m "feat(auth): implement auth service and session store"
```

---

### Task 4: Modul Kalkulasi Finansial & Manajemen Transaksi DP/Termin

**Files:**
- Create: `src/services/budgetCalculator.ts`
- Create: `src/types/finance.ts`
- Test: `tests/services/budgetCalculator.test.ts`

**Interfaces:**
- Produces: `calculateBudgetSummary(budget, categories, vendors, transactions): BudgetSummary`

- [ ] **Step 1: Tulis unit test untuk kalkulasi finansial anti double-counting & over-budget**

```typescript
// tests/services/budgetCalculator.test.ts
import { calculateBudgetSummary } from '../../src/services/budgetCalculator';
import { Budget, Vendor, Transaction } from '../../src/types/finance';

describe('calculateBudgetSummary', () => {
  it('correctly separates paid cash from committed liabilities without double counting', () => {
    const budget: Budget = { targetBudget: 150000000 };
    const vendors: Vendor[] = [
      { id: 'v1', name: 'Gedung Paroki', contractValue: 50000000, status: 'booked' }
    ];
    const transactions: Transaction[] = [
      { id: 't1', vendorId: 'v1', amount: 10000000, paymentStatus: 'paid', paidBy: 'groom' },
      { id: 't2', vendorId: 'v1', amount: 20000000, paymentStatus: 'pending', paidBy: 'groom' }
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions);

    expect(result.targetBudget).toBe(150000000);
    expect(result.cashSpent).toBe(10000000); // Only paid
    expect(result.totalCommitted).toBe(50000000); // Vendor contract
    expect(result.remainingCash).toBe(140000000); // Target - CashSpent
    expect(result.remainingCommittedLiability).toBe(40000000); // 50M - 10M
    expect(result.isOverBudget).toBe(false);
  });

  it('detects over-budget when total commitment exceeds target budget even if paid cash is low', () => {
    const budget: Budget = { targetBudget: 100000000 };
    const vendors: Vendor[] = [
      { id: 'v1', name: 'Vendor A', contractValue: 120000000, status: 'booked' }
    ];
    const transactions: Transaction[] = [
      { id: 't1', vendorId: 'v1', amount: 10000000, paymentStatus: 'paid', paidBy: 'groom' }
    ];

    const result = calculateBudgetSummary(budget, vendors, transactions);
    expect(result.isOverBudget).toBe(true);
    expect(result.overBudgetAmount).toBe(20000000);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/budgetCalculator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasikan `calculateBudgetSummary` dan tipe data keuangan**

Implementasikan kalkulasi kas keluar, rekap kontribusi pembayar (`groom` vs `bride`), dan perhitungan komitmen kontrak.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx jest tests/services/budgetCalculator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/budgetCalculator.ts src/types/finance.ts tests/services/budgetCalculator.test.ts
git commit -m "feat(budget): implement budget calculation and liability tracking"
```

---

### Task 5: Modul Checklist Katolik & Dynamic Date Shifting

**Files:**
- Create: `src/services/checklistService.ts`
- Create: `src/types/checklist.ts`
- Test: `tests/services/checklistService.test.ts`

**Interfaces:**
- Produces: `generateTaskDueDates(weddingDate: Date, tasks: TemplateTask[]): TaskWithDueDate[]`, `shiftUncompletedDueDates(newWeddingDate: Date, currentTasks: Task[]): Task[]`.

- [ ] **Step 1: Tulis unit test untuk kalkulasi tenggat waktu dan pergeseran hari H**

```typescript
// tests/services/checklistService.test.ts
import { generateTaskDueDates, shiftUncompletedDueDates } from '../../src/services/checklistService';

describe('checklistService date calculations', () => {
  it('calculates due dates based on offset_days from wedding date', () => {
    const weddingDate = new Date('2027-10-10');
    const tasks = [
      { id: 't1', title: 'Kursus Persiapan Perkawinan (KPP)', offsetDays: -180 },
      { id: 't2', title: 'Penyelidikan Kanonik', offsetDays: -90 }
    ];

    const result = generateTaskDueDates(weddingDate, tasks);
    expect(result[0].dueDate).toEqual(new Date('2027-04-13'));
    expect(result[1].dueDate).toEqual(new Date('2027-07-12'));
  });

  it('only shifts uncompleted tasks when wedding date is changed', () => {
    const oldWeddingDate = new Date('2027-10-10');
    const newWeddingDate = new Date('2027-12-10'); // +61 days
    const currentTasks = [
      { id: 't1', title: 'KPP Selesai', status: 'done', dueDate: new Date('2027-04-13'), offsetDays: -180 },
      { id: 't2', title: 'Kanonik Belum', status: 'todo', dueDate: new Date('2027-07-12'), offsetDays: -90 }
    ];

    const shifted = shiftUncompletedDueDates(newWeddingDate, currentTasks);
    expect(shifted[0].dueDate).toEqual(new Date('2027-04-13')); // Unchanged because status == 'done'
    expect(shifted[1].dueDate).toEqual(new Date('2027-09-11')); // Shifted
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/checklistService.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasikan checklistService**

Implementasikan kalkulasi tanggal menggunakan `date-fns` (menambah/mengurangi hari dengan akurat).

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx jest tests/services/checklistService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/checklistService.ts src/types/checklist.ts tests/services/checklistService.test.ts
git commit -m "feat(checklist): implement catholic template date generation and shifting"
```

---

### Task 6: Integrasi Direktori Vendor & Siklus Hidup Pembayaran

**Files:**
- Create: `src/services/vendorService.ts`
- Create: `src/types/vendor.ts`
- Test: `tests/services/vendorService.test.ts`

**Interfaces:**
- Produces: `getVendorsByWorkspace(workspaceId)`, `updateVendorStatus(vendorId, status)`, `linkVendorToCategory(vendorId, categoryId)`.

- [ ] **Step 1: Tulis unit test untuk validasi alur siklus hidup vendor**

```typescript
// tests/services/vendorService.test.ts
import { isValidStatusTransition } from '../../src/services/vendorService';

describe('Vendor Lifecycle Transitions', () => {
  it('allows valid progressive transitions', () => {
    expect(isValidStatusTransition('researching', 'shortlisted')).toBe(true);
    expect(isValidStatusTransition('shortlisted', 'negotiating')).toBe(true);
    expect(isValidStatusTransition('negotiating', 'booked')).toBe(true);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/vendorService.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasikan vendorService**

Implementasikan fungsi manajemen vendor, validasi transisi status, dan integrasi dengan kategori anggaran.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx jest tests/services/vendorService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/vendorService.ts src/types/vendor.ts tests/services/vendorService.test.ts
git commit -m "feat(vendor): implement vendor lifecycle service and category linking"
```

---

### Task 7: Sinkronisasi Real-Time Supabase & Dashboard Metrics

**Files:**
- Create: `src/services/realtimeSync.ts`
- Create: `src/services/dashboardService.ts`
- Test: `tests/services/dashboardService.test.ts`

**Interfaces:**
- Produces: `subscribeToWorkspaceChanges(workspaceId, onUpdate)`, `getDashboardSummary(workspaceId): DashboardMetrics`.

- [ ] **Step 1: Tulis unit test untuk agregasi metrik dashboard (countdown & task progress)**

```typescript
// tests/services/dashboardService.test.ts
import { calculateDashboardMetrics } from '../../src/services/dashboardService';

describe('calculateDashboardMetrics', () => {
  it('calculates countdown and task completion percentage correctly', () => {
    const today = new Date('2027-01-01');
    const weddingDate = new Date('2027-01-11');
    const tasks = [
      { id: '1', status: 'done', dueDate: new Date('2027-01-05') },
      { id: '2', status: 'todo', dueDate: new Date('2027-01-08') },
      { id: '3', status: 'todo', dueDate: new Date('2026-12-31') } // overdue
    ];

    const metrics = calculateDashboardMetrics(today, weddingDate, tasks);
    expect(metrics.daysRemaining).toBe(10);
    expect(metrics.completionRate).toBe(33); // 1 of 3
    expect(metrics.overdueCount).toBe(1);
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/dashboardService.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasikan dashboardService dan realtime channel listener**

Implementasikan kalkulasi metrik dashboard dan handler listener Supabase postgres changes channel.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx jest tests/services/dashboardService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/realtimeSync.ts src/services/dashboardService.ts tests/services/dashboardService.test.ts
git commit -m "feat(dashboard): implement dashboard metrics and realtime sync handler"
```

---

### Task 8: Tampilan Kalender & Jadwal Pengingat Notifikasi Lokal

**Files:**
- Create: `src/services/notificationService.ts`
- Create: `src/types/calendar.ts`
- Test: `tests/services/notificationService.test.ts`

**Interfaces:**
- Produces: `formatTimelineEvents(tasks, transactions): CalendarEvent[]`, `scheduleUpcomingReminders(events): Promise<void>`.

- [ ] **Step 1: Tulis unit test untuk agregasi event kalender dari tugas & termin pembayaran**

```typescript
// tests/services/notificationService.test.ts
import { mapEventsForTimeline } from '../../src/services/notificationService';

describe('mapEventsForTimeline', () => {
  it('combines task deadlines and payment due dates into sorted timeline events', () => {
    const tasks = [{ id: 't1', title: 'Penyelidikan Kanonik', dueDate: new Date('2027-07-12') }];
    const transactions = [{ id: 'tr1', title: 'Pelunasan Katering', dueDate: new Date('2027-09-01'), amount: 40000000 }];

    const events = mapEventsForTimeline(tasks, transactions);
    expect(events.length).toBe(2);
    expect(events[0].type).toBe('task_deadline');
    expect(events[1].type).toBe('payment_deadline');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/notificationService.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementasikan notificationService dan mapper kalender**

Implementasikan mapping event kalender dan integrasi scheduling notifikasi lokal menggunakan `expo-notifications`.

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npx jest tests/services/notificationService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/notificationService.ts src/types/calendar.ts tests/services/notificationService.test.ts
git commit -m "feat(calendar): implement timeline event mapping and local notifications"
```
