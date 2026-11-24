import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { Badge } from '../../src/components/common/Badge';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';

interface GuestItem {
  id: string;
  name: string;
  side: 'groom' | 'bride' | 'both';
  groupTag: string;
  estimatedPax: number;
  actualPax: number;
  rsvpStatus: 'attending' | 'declined' | 'tentative' | 'pending';
  invitationSent: boolean;
}

interface GiftItem {
  id: string;
  senderName: string;
  giftType: 'cash' | 'transfer' | 'physical_gift';
  amount: number;
  giftDescription?: string;
  receivedBy: 'groom' | 'bride' | 'both' | 'family_groom' | 'family_bride';
  thankYouSent: boolean;
}

const initialGuests: GuestItem[] = [
  { id: 'g1', name: 'Budi Santoso & Pasangan', side: 'groom', groupTag: 'Keluarga Inti', estimatedPax: 2, actualPax: 2, rsvpStatus: 'attending', invitationSent: true },
  { id: 'g2', name: 'Siti Rahma (Rekan Kerja)', side: 'groom', groupTag: 'Rekan Kerja', estimatedPax: 1, actualPax: 1, rsvpStatus: 'attending', invitationSent: true },
  { id: 'g3', name: 'Kel. Besar Hartono (VIP)', side: 'bride', groupTag: 'VIP Keluarga', estimatedPax: 4, actualPax: 4, rsvpStatus: 'attending', invitationSent: true },
  { id: 'g4', name: 'Kevin & Fiona (Sahabat)', side: 'bride', groupTag: 'Sahabat Kuliah', estimatedPax: 2, actualPax: 0, rsvpStatus: 'tentative', invitationSent: true },
  { id: 'g5', name: 'Joko Widodo (Kolega Lama)', side: 'groom', groupTag: 'Rekan Kerja', estimatedPax: 1, actualPax: 0, rsvpStatus: 'declined', invitationSent: false },
  { id: 'g6', name: 'Alumni SMA Sanur', side: 'both', groupTag: 'Sahabat Sekolah', estimatedPax: 5, actualPax: 0, rsvpStatus: 'pending', invitationSent: true },
];

const initialGifts: GiftItem[] = [
  { id: 'gf1', senderName: 'Om Anton (Keluarga Groom)', giftType: 'cash', amount: 5000000, receivedBy: 'groom', thankYouSent: true },
  { id: 'gf2', senderName: 'Tante Rina (Keluarga Bride)', giftType: 'transfer', amount: 7500000, receivedBy: 'bride', thankYouSent: true },
  { id: 'gf3', senderName: 'Direksi Perusahaan Octa', giftType: 'transfer', amount: 10000000, receivedBy: 'both', thankYouSent: false },
  { id: 'gf4', senderName: 'Sahabat Kampus Jenesia', giftType: 'physical_gift', amount: 0, giftDescription: 'Espresso Coffee Machine DeLonghi', receivedBy: 'both', thankYouSent: true },
  { id: 'gf5', senderName: 'Tetangga Komplek Solo', giftType: 'cash', amount: 1000000, receivedBy: 'family_groom', thankYouSent: false },
];

export default function GuestsScreen() {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0); // 0: Tamu & RSVP, 1: Buku Besar Angpau
  const [selectedSideFilter, setSelectedSideFilter] = useState<'all' | 'groom' | 'bride'>('all');

  // Metrik Tamu
  const totalInvitations = initialGuests.length;
  const totalInvitedPax = initialGuests.reduce((acc, g) => acc + g.estimatedPax, 0);
  const confirmedAttendingPax = initialGuests
    .filter((g) => g.rsvpStatus === 'attending')
    .reduce((acc, g) => acc + (g.actualPax > 0 ? g.actualPax : g.estimatedPax), 0);
  const declinedPax = initialGuests
    .filter((g) => g.rsvpStatus === 'declined')
    .reduce((acc, g) => acc + g.estimatedPax, 0);
  const attendanceRate = totalInvitedPax > 0 ? Math.round((confirmedAttendingPax / totalInvitedPax) * 100) : 0;

  const filteredGuests = initialGuests.filter((g) => {
    if (selectedSideFilter === 'all') return true;
    return g.side === selectedSideFilter || g.side === 'both';
  });

  // Metrik Angpau
  const totalCashCollected = initialGifts
    .filter((g) => g.giftType === 'cash' || g.giftType === 'transfer')
    .reduce((acc, g) => acc + g.amount, 0);
  const physicalGifts = initialGifts.filter((g) => g.giftType === 'physical_gift');
  const thankYouPendingCount = initialGifts.filter((g) => !g.thankYouSent).length;
  const thankYouSentCount = initialGifts.filter((g) => g.thankYouSent).length;

  const recipientTotals = initialGifts.reduce((acc, g) => {
    if (g.giftType === 'cash' || g.giftType === 'transfer') {
      acc[g.receivedBy] = (acc[g.receivedBy] || 0) + g.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Tamu, RSVP & Angpau"
        subtitle="Single Source of Truth untuk Katering & Hadiah"
        style={styles.header}
      />

      {/* Switcher Tab Antara Tamu vs Angpau */}
      <SegmentedControl
        options={['👥 Daftar Tamu & RSVP', '🎁 Buku Besar Angpau & Kado']}
        selectedIndex={activeSegmentIndex}
        onChange={setActiveSegmentIndex}
      />

      {activeSegmentIndex === 0 ? (
        // ==========================================
        // SUB-VIEW 1: MANAJEMEN TAMU & RSVP
        // ==========================================
        <View>
          {/* Highlight Pax Katering Resepsi */}
          <Card variant="highlight" style={styles.paxHighlightCard}>
            <Text style={styles.paxHighlightLabel}>ANGKA PASTI KATERING RESEPSI</Text>
            <View style={styles.paxNumberRow}>
              <Text style={styles.paxBigNumber}>{confirmedAttendingPax}</Text>
              <Text style={styles.paxBigUnit}>Pax Terkonfirmasi Hadir</Text>
            </View>
            <Text style={styles.paxSubtext}>
              Dari total {totalInvitedPax} kuota pax yang diundang ({attendanceRate}% rasio konfirmasi hadir).
            </Text>
          </Card>

          {/* StatGrid Ringkasan */}
          <View style={styles.statGrid}>
            <StatCard
              label="Undangan Terdaftar"
              value={`${totalInvitations} Nama`}
              subtext="Total entri kontak"
            />
            <StatCard
              label="Pax Menolak (Declined)"
              value={`${declinedPax} Pax`}
              subtext="Porsi katering terselamatkan"
              variant="warning"
            />
          </View>

          {/* Filter Sisi Keluarga */}
          <View style={styles.sideFilterRow}>
            {(['all', 'groom', 'bride'] as const).map((sideKey) => (
              <TouchableOpacity
                key={sideKey}
                style={[
                  styles.sideFilterPill,
                  selectedSideFilter === sideKey && styles.sideFilterPillActive,
                ]}
                onPress={() => setSelectedSideFilter(sideKey)}
              >
                <Text
                  style={[
                    styles.sideFilterText,
                    selectedSideFilter === sideKey && styles.sideFilterTextActive,
                  ]}
                >
                  {sideKey === 'all'
                    ? 'Semua Pihak'
                    : sideKey === 'groom'
                    ? '🤵 Pihak Octa'
                    : '👰 Pihak Jenesia'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List Tamu Undangan */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daftar Tamu Undangan</Text>
              <Text style={styles.subtextCount}>{filteredGuests.length} Entri</Text>
            </View>

            {filteredGuests.map((g) => (
              <View key={g.id} style={styles.guestItem}>
                <View style={styles.guestItemLeft}>
                  <Text style={styles.guestName}>{g.name}</Text>
                  <Text style={styles.guestGroupTag}>
                    {g.groupTag} • Kuota: {g.estimatedPax} Pax (Realisasi: {g.actualPax} Pax)
                  </Text>
                </View>
                <View style={styles.guestItemRight}>
                  <Badge
                    label={
                      g.rsvpStatus === 'attending'
                        ? '✅ Hadir'
                        : g.rsvpStatus === 'tentative'
                        ? '⏳ Ragu/Maybe'
                        : g.rsvpStatus === 'declined'
                        ? '❌ Menolak'
                        : 'Belum Respon'
                    }
                    variant={
                      g.rsvpStatus === 'attending'
                        ? 'success'
                        : g.rsvpStatus === 'tentative'
                        ? 'warning'
                        : g.rsvpStatus === 'declined'
                        ? 'danger'
                        : 'neutral'
                    }
                  />
                  <Text style={styles.guestSideLabel}>
                    {g.side === 'groom' ? 'Pihak Octa' : g.side === 'bride' ? 'Pihak Jenesia' : 'Kedua Pihak'}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : (
        // ==========================================
        // SUB-VIEW 2: BUKU BESAR ANGPAU & HADIAH FISIK
        // ==========================================
        <View>
          {/* Highlight Dana Angpau */}
          <Card variant="highlight" style={styles.paxHighlightCard}>
            <Text style={styles.paxHighlightLabel}>TOTAL ANGPAU & DANA HADIAH</Text>
            <View style={styles.paxNumberRow}>
              <Text style={styles.paxBigNumber}>
                Rp {(totalCashCollected / 1000000).toFixed(1)} Jt
              </Text>
            </View>
            <Text style={styles.paxSubtext}>
              Rp {totalCashCollected.toLocaleString('id-ID')} terkumpul dari transfer m-banking & amplop tunai resepsi.
            </Text>
          </Card>

          {/* StatGrid Ringkasan Angpau */}
          <View style={styles.statGrid}>
            <StatCard
              label="Kado Fisik Diterima"
              value={`${physicalGifts.length} Barang`}
              subtext="Kado pernikahan fisik"
            />
            <StatCard
              label="Kartu Ucapan Terima Kasih"
              value={`${thankYouSentCount} Terkirim`}
              subtext={`${thankYouPendingCount} pengirim belum dikirim`}
              variant="highlight"
            />
          </View>

          {/* Rekap Peruntukan Penerima */}
          <Card style={[styles.sectionCard, { marginTop: spacing.md }]}>
            <Text style={styles.sectionTitle}>Pemberian Berdasarkan Penerima</Text>
            <View style={styles.recipientRow}>
              <Text style={styles.recipientText}>🤵 Khusus Groom (Octa):</Text>
              <Text style={styles.recipientValue}>
                Rp {(recipientTotals['groom'] || 0).toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.recipientRow}>
              <Text style={styles.recipientText}>👰 Khusus Bride (Jenesia):</Text>
              <Text style={styles.recipientValue}>
                Rp {(recipientTotals['bride'] || 0).toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.recipientRow}>
              <Text style={styles.recipientText}>👨‍👩‍👧 Keluarga Groom:</Text>
              <Text style={styles.recipientValue}>
                Rp {(recipientTotals['family_groom'] || 0).toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={[styles.recipientRow, styles.recipientRowTotal]}>
              <Text style={[styles.recipientText, styles.boldText]}>👫 Kedua Mempelai (Bersama):</Text>
              <Text style={[styles.recipientValue, styles.boldText]}>
                Rp {(recipientTotals['both'] || 0).toLocaleString('id-ID')}
              </Text>
            </View>
          </Card>

          {/* Daftar Hadiah & Amplop */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rincian Buku Besar Hadiah</Text>
              <Text style={styles.subtextCount}>{initialGifts.length} Pemberian</Text>
            </View>

            {initialGifts.map((gf) => (
              <View key={gf.id} style={styles.giftItem}>
                <View style={styles.giftLeft}>
                  <Text style={styles.giftSender}>{gf.senderName}</Text>
                  {gf.giftType === 'physical_gift' ? (
                    <Text style={styles.giftDesc}>📦 Barang: {gf.giftDescription}</Text>
                  ) : (
                    <Text style={styles.giftAmount}>
                      Nominal: Rp {gf.amount.toLocaleString('id-ID')} ({gf.giftType.toUpperCase()})
                    </Text>
                  )}
                  <Text style={styles.giftRecipient}>Penerima: {gf.receivedBy.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={styles.giftRight}>
                  <Badge
                    label={gf.thankYouSent ? '💌 Ucapan TQ Terkirim' : '⏳ Belum Kirim TQ'}
                    variant={gf.thankYouSent ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: 0,
    marginBottom: spacing.xs,
  },
  paxHighlightCard: {
    padding: spacing.md,
    borderColor: colors.accent,
    marginBottom: spacing.sm,
  },
  paxHighlightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentDark,
    letterSpacing: 0.5,
  },
  paxNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  paxBigNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
    marginRight: spacing.sm,
  },
  paxBigUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paxSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sideFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  sideFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusPill,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sideFilterPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sideFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sideFilterTextActive: {
    color: colors.textLight,
  },
  sectionCard: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtextCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  guestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  guestItemLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  guestName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guestGroupTag: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  guestItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  guestSideLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recipientRowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 6,
    paddingTop: 6,
  },
  recipientText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recipientValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  giftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  giftLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  giftSender: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  giftDesc: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  giftAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  giftRecipient: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  giftRight: {
    alignItems: 'flex-end',
  },
});
