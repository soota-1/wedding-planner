import { calculateGuestMetrics } from '../src/services/guestService';
import { calculateGiftSummary } from '../src/services/giftService';
import { calculateDocumentCompliance, isBaptismCertificateValid } from '../src/services/documentService';
import { Guest } from '../src/types/guest';
import { Gift } from '../src/types/gift';
import { WeddingDocument } from '../src/types/document';

describe('Interactive Feature Demonstration - Phase 2 Data Modules', () => {
  it('demonstrates all Phase 2 core capabilities successfully', () => {
    console.log('\n================================================================');
    console.log('🎉 WEDDING TRACKER FASE 2 - SIMULASI MODUL DATA BARU 🎉');
    console.log('================================================================');

    const weddingDate = new Date('2027-10-10T00:00:00.000Z');
    console.log(`\n📅 Tanggal Pernikahan : 10 Oktober 2027`);

    // -------------------------------------------------------------
    // 1. MODUL TAMU, RSVP & KALKULATOR PAX RESEPSI
    // -------------------------------------------------------------
    console.log('\n👥 1. MANAJEMEN TAMU, RSVP & KALKULATOR PAX KATERING');
    const guestList: Guest[] = [
      { id: 'g1', workspaceId: 'w1', name: 'Budi Santoso & Pasangan', side: 'groom', groupTag: 'family', rsvpStatus: 'attending', estimatedPax: 2, actualPax: 2 },
      { id: 'g2', workspaceId: 'w1', name: 'Siti Rahma', side: 'groom', groupTag: 'colleague', rsvpStatus: 'attending', estimatedPax: 1, actualPax: 1 },
      { id: 'g3', workspaceId: 'w1', name: 'Kel. Hartono', side: 'bride', groupTag: 'vip', rsvpStatus: 'attending', estimatedPax: 4, actualPax: 4 },
      { id: 'g4', workspaceId: 'w1', name: 'Kevin & Fiona', side: 'bride', groupTag: 'friend', rsvpStatus: 'tentative', estimatedPax: 2, actualPax: 0 },
      { id: 'g5', workspaceId: 'w1', name: 'Joko Widodo (Rekan Kerja)', side: 'groom', groupTag: 'colleague', rsvpStatus: 'declined', estimatedPax: 1, actualPax: 0 },
      { id: 'g6', workspaceId: 'w1', name: 'Alumni SMA', side: 'both', groupTag: 'friend', rsvpStatus: 'pending', estimatedPax: 5, actualPax: 0 },
    ];

    const guestMetrics = calculateGuestMetrics(guestList);
    console.log(`  - Total Tamu Terdaftar     : ${guestMetrics.totalGuests} entri`);
    console.log(`  - Total Estimasi Kuota Pax : ${guestMetrics.totalInvitedPax} pax`);
    console.log(`  - Realisasi Pax Hadir      : ${guestMetrics.confirmedAttendingPax} pax (Fix untuk Vendor Katering)`);
    console.log(`  - Pax Menolak (Declined)   : ${guestMetrics.declinedPax} pax`);
    console.log(`  - Pax Belum Pasti/Pending  : ${guestMetrics.tentativePax} pax`);
    console.log(`  - Rasio Kehadiran (Rate)   : ${guestMetrics.attendanceRate}%`);

    expect(guestMetrics.totalGuests).toBe(6);
    expect(guestMetrics.totalInvitedPax).toBe(15);
    expect(guestMetrics.confirmedAttendingPax).toBe(7);
    expect(guestMetrics.attendanceRate).toBe(47); // 7 / 15 = 46.66% -> 47%

    // -------------------------------------------------------------
    // 2. BUKU BESAR ANGPAU & HADIAH FISIK (GIFT TRACKER)
    // -------------------------------------------------------------
    console.log('\n🎁 2. BUKU BESAR ANGPAU & PENCATATAN KADO FISIK');
    const gifts: Gift[] = [
      { id: 'gf1', workspaceId: 'w1', senderName: 'Om Anton (Keluarga Groom)', giftType: 'cash', amount: 5000000, receivedBy: 'groom', thankYouSent: true },
      { id: 'gf2', workspaceId: 'w1', senderName: 'Tante Rina (Keluarga Bride)', giftType: 'transfer', amount: 7500000, receivedBy: 'bride', thankYouSent: true },
      { id: 'gf3', workspaceId: 'w1', senderName: 'Direksi Perusahaan', giftType: 'transfer', amount: 10000000, receivedBy: 'both', thankYouSent: false },
      { id: 'gf4', workspaceId: 'w1', senderName: 'Sahabat Kampus', giftType: 'physical_gift', amount: 0, giftDescription: 'Espresso Coffee Machine DeLonghi', receivedBy: 'both', thankYouSent: true },
      { id: 'gf5', workspaceId: 'w1', senderName: 'Tetangga Komplek', giftType: 'cash', amount: 1000000, receivedBy: 'family_groom', thankYouSent: false },
    ];

    const giftSummary = calculateGiftSummary(gifts);
    console.log(`  - Total Angpau Terkumpul   : Rp ${giftSummary.totalCashCollected.toLocaleString('id-ID')}`);
    console.log(`  - Jumlah Kado Fisik        : ${giftSummary.physicalGiftsCount} barang`);
    console.log(`  - Belum Kirim Ucapan TQ    : ${giftSummary.thankYouPendingCount} pengirim`);
    console.log('  Pemberian Berdasarkan Penerima:');
    console.log(`    • Khusus Groom (Octa)    : Rp ${giftSummary.byRecipient.groom.toLocaleString('id-ID')}`);
    console.log(`    • Khusus Bride (Jenesia) : Rp ${giftSummary.byRecipient.bride.toLocaleString('id-ID')}`);
    console.log(`    • Keluarga Groom         : Rp ${giftSummary.byRecipient.family_groom.toLocaleString('id-ID')}`);
    console.log(`    • Kedua Mempelai Bersama : Rp ${giftSummary.byRecipient.both.toLocaleString('id-ID')}`);
    console.log('  Daftar Hadiah Fisik:');
    giftSummary.physicalGifts.forEach((g) => {
      console.log(`    📦 Dari: ${g.senderName} -> "${g.giftDescription}" [Penerima: ${g.receivedBy}]`);
    });

    expect(giftSummary.totalCashCollected).toBe(23500000);
    expect(giftSummary.physicalGiftsCount).toBe(1);
    expect(giftSummary.thankYouPendingCount).toBe(2);

    // -------------------------------------------------------------
    // 3. KEPATUHAN DOKUMEN KANONIK KATOLIK & SIPIL
    // -------------------------------------------------------------
    console.log('\n📜 3. VERIFIKASI DOKUMEN KANONIK KATOLIK & DOKUMEN SIPIL');
    console.log('Aturan Kanonik Gereja Katolik: Surat Baptis harus diterbitkan maksimal 6 bulan (180 hari) sebelum Hari H.');

    // Surat Baptis Groom: Diterbitkan 12 Juli 2027 (90 hari sebelum Hari H -> Valid)
    const groomBaptismIssueDate = new Date('2027-07-12T00:00:00.000Z');
    const isGroomBaptismValid = isBaptismCertificateValid(groomBaptismIssueDate, weddingDate);
    console.log(`  - Surat Baptis Groom (Terbit 12 Jul 2027): ${isGroomBaptismValid ? '✅ Memenuhi Syarat (Umur <= 180 hari)' : '❌ Kedaluwarsa'}`);

    // Surat Baptis Bride: Diterbitkan 10 Januari 2027 (273 hari sebelum Hari H -> Kedaluwarsa)
    const brideBaptismIssueDate = new Date('2027-01-10T00:00:00.000Z');
    const isBrideBaptismValid = isBaptismCertificateValid(brideBaptismIssueDate, weddingDate);
    console.log(`  - Surat Baptis Bride (Terbit 10 Jan 2027): ${isBrideBaptismValid ? '✅ Memenuhi Syarat' : '⚠️ KEDALUWARSA (Harus cetak ulang di paroki baptis!)'}`);

    const docList: WeddingDocument[] = [
      { id: 'd1', workspaceId: 'w1', title: 'Surat Baptis Octa (Terbaru)', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'groom', status: 'verified', issueDate: '2027-07-12' },
      { id: 'd2', workspaceId: 'w1', title: 'Surat Baptis Jenesia (Perlu Pembaruan)', documentType: 'baptism_certificate', category: 'church_canonical', owner: 'bride', status: 'pending', issueDate: '2027-01-10' },
      { id: 'd3', workspaceId: 'w1', title: 'Sertifikat Kursus Persiapan Perkawinan (KPP)', documentType: 'kpp_certificate', category: 'church_canonical', owner: 'both', status: 'verified' },
      { id: 'd4', workspaceId: 'w1', title: 'Surat Pengantar RT/RW & Kelurahan (N1-N4)', documentType: 'civil_n1_n4', category: 'civil_disdukcapil', owner: 'both', status: 'verified' },
      { id: 'd5', workspaceId: 'w1', title: 'KTP & Kartu Keluarga Mempelai', documentType: 'other', category: 'civil_disdukcapil', owner: 'both', status: 'verified' },
    ];

    const compliance = calculateDocumentCompliance(docList, weddingDate);
    console.log(`  - Total Dokumen Terdaftar  : ${compliance.totalDocuments}`);
    console.log(`  - Dokumen Terverifikasi    : ${compliance.verifiedCount}`);
    console.log(`  - Dokumen Kedaluwarsa      : ${compliance.expiredCount} (Perlu tindakan segera)`);
    console.log(`  - Tingkat Kesiapan Berkas  : ${compliance.complianceRate}%`);

    expect(compliance.totalDocuments).toBe(5);
    expect(compliance.verifiedCount).toBe(4);
    expect(compliance.expiredCount).toBe(1);
    expect(compliance.complianceRate).toBe(80);

    console.log('\n================================================================');
    console.log('✅ SELURUH SIMULASI FITUR FASE 2 BERHASIL DIVERIFIKASI LULUS ✅');
    console.log('================================================================\n');
  });
});
