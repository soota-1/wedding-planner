# Wedding Tracker (Fase 2 - Ekspansi Modul Data Baru) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul data lanjutan Fase 2 untuk Wedding Tracker yang mencakup Skema Database Supabase dengan RLS untuk Tamu, Angpau/Kado, dan Dokumen, Manajemen Tamu & Kalkulator Pax Resepsi (`GuestService`), Buku Besar Angpau & Hadiah Fisik (`GiftService`), serta Pusat Kepatuhan Dokumen Kanonik Katolik (`DocumentService`).

**Architecture:** Memperluas skema PostgreSQL Supabase dengan Row Level Security (RLS) terisolasi per `workspace_id`. Di sisi mobile/TypeScript, setiap modul dibangun sebagai domain service independen yang menyediakan fungsi kalkulasi murni (*pure calculation functions*) untuk toleransi offline dan sinkronisasi Supabase client.

**Tech Stack:** TypeScript, PostgreSQL / Supabase (@supabase/supabase-js), date-fns, Jest (Testing).

**Spec:** `docs/superpowers/specs/2026-11-23-wedding-tracker-phase2-data-modules.md`

## Global Constraints

- Platform: React Native Expo (TypeScript) & Supabase PostgreSQL.
- Database Security: Seluruh tabel baru (`guests`, `gifts`, `wedding_documents`) wajib menerapkan RLS dengan proteksi `is_workspace_member(workspace_id)`.
- Aturan Kanonik Katolik: Surat Baptis Katolik (`baptism_certificate`) wajib memiliki masa berlaku maksimal 180 hari (6 bulan) sebelum `wedding_date`.
- Kalkulasi Tamu: Metrik kehadiran (`attendanceRate`) dihitung berdasarkan rasio pax riil (`confirmedAttendingPax / totalInvitedPax`), bukan sekadar jumlah entri undangan.
- Model Angpau: Dikelola sebagai buku besar terpisah (*Dedicated Gift Ledger*) yang memisahkan peruntukan dana (*groom, bride, both, family*) dan inventaris kado fisik.

## Review Focus

1. **Perhitungan Pax Tamu vs Undangan Keluarga:** Tamu dengan 1 undangan yang membawa 3 pax harus menyumbang 3 ke `totalInvitedPax` dan `confirmedAttendingPax`, bukan 1.
2. **Kepatuhan Surat Baptis Batas 180 Hari:** Dokumen surat baptis dengan tanggal terbit 181 hari sebelum hari H harus dinyatakan tidak valid / kedaluwarsa (`expired`), sedangkan tepat 180 hari harus dinyatakan valid.
3. **Pemisahan Angpau Tunai vs Barang Fisik:** Total dana tunai hanya menjumlahkan `gift_type IN ('cash', 'transfer')`, sedangkan `physical_gift` tidak boleh menggelembungkan total nominal uang.
4. **Isolasi RLS Tamu & Hadiah Antar Workspace:** Tidak boleh ada kebocoran data tamu atau nominal angpau antar `workspace_id` yang berbeda.
5. **Penanganan Zona Waktu Tanggal Dokumen:** Perbandingan tanggal terbit dokumen terhadap tanggal pernikahan tidak boleh terpengaruh selisih jam timezone UTC.

---

### Task 1: Skema Database PostgreSQL Supabase, RLS Policies, dan Realtime Publication

**Files:**
- Create: `supabase/migrations/20261123000001_phase2_schema.sql`
- Test: `tests/db/phase2_schema_validation.test.ts`

**Interfaces:**
- Produces: DDL tabel `guests`, `gifts`, `wedding_documents`, RLS policies, dan pendaftaran ke `supabase_realtime`.

- [ ] **Step 1: Tulis unit test validasi skema DDL Fase 2**

```typescript
// tests/db/phase2_schema_validation.test.ts
import { readFileSync } from 'fs';

describe('Phase 2 Database Schema Validation', () => {
  it('contains guests, gifts, and wedding_documents tables with RLS and realtime publication', () => {
    const migration = readFileSync('supabase/migrations/20261123000001_phase2_schema.sql', 'utf8');
    expect(migration).toContain('CREATE TABLE guests');
    expect(migration).toContain('CREATE TABLE gifts');
    expect(migration).toContain('CREATE TABLE wedding_documents');
    expect(migration).toContain('ALTER TABLE guests ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER TABLE gifts ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER TABLE wedding_documents ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE guests, gifts, wedding_documents');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/db/phase2_schema_validation.test.ts`
Expected: FAIL (File not found)

- [ ] **Step 3: Buat file migration SQL Fase 2**

Implementasikan `supabase/migrations/20261123000001_phase2_schema.sql` sesuai spesifikasi DDL di spec dokumen Bagian 4.

- [ ] **Step 4: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/db/phase2_schema_validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261123000001_phase2_schema.sql tests/db/phase2_schema_validation.test.ts
git commit -m "feat(db): add phase 2 schema for guests, gifts, and documents"
```

---

### Task 2: Modul Manajemen Tamu, RSVP & Kalkulator Pax Resepsi

**Files:**
- Create: `src/types/guest.ts`
- Create: `src/services/guestService.ts`
- Test: `tests/services/guestService.test.ts`

**Interfaces:**
- Produces:
  - `calculateGuestMetrics(guests: Guest[]): GuestMetrics`
  - `GuestService.getGuestsByWorkspace(workspaceId: string, filterSide?: GuestSide)`
  - `GuestService.addGuest(workspaceId: string, guest: Partial<Guest>)`
  - `GuestService.updateRsvpStatus(guestId: string, status: RsvpStatus, actualPax?: number)`

- [ ] **Step 1: Tulis unit test untuk kalkulasi metrik tamu dan operasi guestService**

```typescript
// tests/services/guestService.test.ts
import { calculateGuestMetrics, GuestService } from '../../src/services/guestService';
import { Guest } from '../../src/types/guest';
import { supabase } from '../../src/config/supabase';

jest.mock('../../src/config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

describe('calculateGuestMetrics', () => {
  it('calculates pax aggregation and attendance rate correctly', () => {
    const guests: Guest[] = [
      { id: 'g1', workspaceId: 'w1', name: 'Keluarga Budi', side: 'groom', estimatedPax: 4, actualPax: 3, rsvpStatus: 'attending' },
      { id: 'g2', workspaceId: 'w1', name: 'Siti', side: 'bride', estimatedPax: 1, actualPax: 1, rsvpStatus: 'attending' },
      { id: 'g3', workspaceId: 'w1', name: 'Andi', side: 'groom', estimatedPax: 2, actualPax: 0, rsvpStatus: 'declined' },
      { id: 'g4', workspaceId: 'w1', name: 'Rina', side: 'both', estimatedPax: 2, actualPax: 0, rsvpStatus: 'pending' },
    ];

    const metrics = calculateGuestMetrics(guests);
    expect(metrics.totalGuests).toBe(4);
    expect(metrics.totalInvitedPax).toBe(9); // 4 + 1 + 2 + 2
    expect(metrics.confirmedAttendingPax).toBe(4); // 3 (Budi) + 1 (Siti)
    expect(metrics.declinedPax).toBe(2);
    expect(metrics.tentativePax).toBe(2);
    expect(metrics.attendanceRate).toBe(44); // Math.round((4/9)*100) = 44%
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/guestService.test.ts`
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implementasikan `src/types/guest.ts` dan `src/services/guestService.ts`**

Implementasikan tipe data tamu, fungsi kalkulasi metrik pax resepsi, serta CRUD tamu via Supabase.

- [ ] **Step 4: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/services/guestService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/guest.ts src/services/guestService.ts tests/services/guestService.test.ts
git commit -m "feat(guest): implement guest management and reception pax calculator"
```

---

### Task 3: Modul Buku Besar Angpau & Hadiah Fisik (Gift Tracker)

**Files:**
- Create: `src/types/gift.ts`
- Create: `src/services/giftService.ts`
- Test: `tests/services/giftService.test.ts`

**Interfaces:**
- Produces:
  - `calculateGiftSummary(gifts: Gift[]): GiftSummary`
  - `GiftService.getGiftsByWorkspace(workspaceId: string)`
  - `GiftService.recordGift(workspaceId: string, gift: Partial<Gift>)`
  - `GiftService.updateThankYouStatus(giftId: string, sent: boolean)`

- [ ] **Step 1: Tulis unit test untuk rekapitulasi angpau dan hadiah fisik**

```typescript
// tests/services/giftService.test.ts
import { calculateGiftSummary, GiftService } from '../../src/services/giftService';
import { Gift } from '../../src/types/gift';

describe('calculateGiftSummary', () => {
  it('separates cash and transfer from physical gifts and computes recipient breakdown', () => {
    const gifts: Gift[] = [
      { id: '1', workspaceId: 'w1', senderName: 'Om Anton', giftType: 'cash', amount: 2000000, receivedBy: 'groom' },
      { id: '2', workspaceId: 'w1', senderName: 'Tante Rina', giftType: 'transfer', amount: 3000000, receivedBy: 'bride' },
      { id: '3', workspaceId: 'w1', senderName: 'Keluarga Solo', giftType: 'cash', amount: 5000000, receivedBy: 'family_groom' },
      { id: '4', workspaceId: 'w1', senderName: 'Sahabat Kuliah', giftType: 'physical_gift', amount: 0, giftDescription: 'Coffee Maker', receivedBy: 'both' },
    ];

    const summary = calculateGiftSummary(gifts);
    expect(summary.totalCashCollected).toBe(10000000); // 2M + 3M + 5M
    expect(summary.byRecipient.groom).toBe(2000000);
    expect(summary.byRecipient.bride).toBe(3000000);
    expect(summary.byRecipient.family_groom).toBe(5000000);
    expect(summary.physicalGiftsCount).toBe(1);
    expect(summary.physicalGifts[0].giftDescription).toBe('Coffee Maker');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/giftService.test.ts`
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implementasikan `src/types/gift.ts` dan `src/services/giftService.ts`**

Implementasikan tipe data kado, kalkulasi rekapitulasi angpau, pemisahan pihak penerima, dan pencatatan via Supabase.

- [ ] **Step 4: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/services/giftService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/gift.ts src/services/giftService.ts tests/services/giftService.test.ts
git commit -m "feat(gift): implement wedding gift and angpau tracking ledger"
```

---

### Task 4: Modul Kepatuhan Dokumen Kanonik Katolik & Sipil (Document Compliance)

**Files:**
- Create: `src/types/document.ts`
- Create: `src/services/documentService.ts`
- Test: `tests/services/documentService.test.ts`

**Interfaces:**
- Produces:
  - `isBaptismCertificateValid(issueDate: Date, weddingDate: Date): boolean`
  - `calculateDocumentCompliance(documents: WeddingDocument[], weddingDate: Date): ComplianceSummary`
  - `DocumentService.getDocumentsByWorkspace(workspaceId: string)`
  - `DocumentService.registerDocument(workspaceId: string, doc: Partial<WeddingDocument>)`
  - `DocumentService.verifyDocument(documentId: string, status: DocumentStatus)`

- [ ] **Step 1: Tulis unit test untuk validasi kepatuhan surat baptis dan ringkasan dokumen**

```typescript
// tests/services/documentService.test.ts
import { isBaptismCertificateValid, calculateDocumentCompliance } from '../../src/services/documentService';
import { WeddingDocument } from '../../src/types/document';

describe('Document Compliance & Baptism Validation', () => {
  const weddingDate = new Date('2027-10-10T00:00:00.000Z');

  it('validates baptism certificate within 180 days limit', () => {
    // 90 days before wedding -> Valid
    const validIssueDate = new Date('2027-07-12T00:00:00.000Z');
    expect(isBaptismCertificateValid(validIssueDate, weddingDate)).toBe(true);

    // 181 days before wedding -> Expired / Invalid
    const expiredIssueDate = new Date('2027-04-11T00:00:00.000Z');
    expect(isBaptismCertificateValid(expiredIssueDate, weddingDate)).toBe(false);

    // Future date after wedding -> Invalid
    const futureDate = new Date('2027-10-11T00:00:00.000Z');
    expect(isBaptismCertificateValid(futureDate, weddingDate)).toBe(false);
  });

  it('aggregates document compliance summary correctly', () => {
    const docs: WeddingDocument[] = [
      { id: 'd1', workspaceId: 'w1', title: 'Surat Baptis Octa', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'groom', status: 'verified', issueDate: '2027-07-12' },
      { id: 'd2', workspaceId: 'w1', title: 'Surat Baptis Jenesia', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'bride', status: 'pending', issueDate: '2027-02-01' }, // Expired (>180 days)
      { id: 'd3', workspaceId: 'w1', title: 'Sertifikat KPP', documentType: 'kpp_certificate', category: 'church_canonical', owner: 'both', status: 'verified' },
    ];

    const summary = calculateDocumentCompliance(docs, weddingDate);
    expect(summary.totalDocuments).toBe(3);
    expect(summary.verifiedCount).toBe(2);
    expect(summary.expiredCount).toBe(1); // Surat Baptis Jenesia is expired
    expect(summary.complianceRate).toBe(67); // 2 of 3 = 67%
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan**

Run: `npx jest tests/services/documentService.test.ts`
Expected: FAIL (Cannot find module)

- [ ] **Step 3: Implementasikan `src/types/document.ts` dan `src/services/documentService.ts`**

Implementasikan logika aturan kanonik surat baptis Katolik, verifikasi dokumen, dan query Supabase.

- [ ] **Step 4: Jalankan test untuk memastikan kelulusan**

Run: `npx jest tests/services/documentService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/document.ts src/services/documentService.ts tests/services/documentService.test.ts
git commit -m "feat(document): implement catholic canonical compliance and document center"
```

---

### Task 5: Integrasi Demo & Verifikasi End-to-End Suite Fase 2

**Files:**
- Create: `tests/phase2_demo.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: Script demo interaktif Fase 2 (`npm run demo:phase2`) dan memastikan seluruh 10+ test suite lulus 100%.

- [ ] **Step 1: Buat runner demo simulasi interaktif Fase 2**

Tulis `tests/phase2_demo.test.ts` yang mensimulasikan registrasi tamu, kalkulasi pax katering, pencatatan angpau/kado fisik, dan verifikasi surat baptis.

- [ ] **Step 2: Daftarkan script `demo:phase2` di package.json**

Tambah `"demo:phase2": "jest tests/phase2_demo.test.ts"` pada `scripts` di `package.json`.

- [ ] **Step 3: Jalankan demo Fase 2 dan seluruh test suite**

Run: `npm test`
Expected: PASS (Semua test suite Fase 1 dan Fase 2 lulus tanpa regresi)

- [ ] **Step 4: Commit**

```bash
git add tests/phase2_demo.test.ts package.json
git commit -m "test: add phase 2 end-to-end demo and verify full test suite"
```
