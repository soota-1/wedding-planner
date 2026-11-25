import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { Badge } from '../../src/components/common/Badge';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { FilterChipBar } from '../../src/components/common/FilterChipBar';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { FadeInView } from '../../src/components/common/FadeInView';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GuestItem {
  id: string;
  name: string;
  side: 'groom' | 'bride' | 'both';
  groupTag: string;
  estimatedPax: number;
  actualPax: number;
  rsvpStatus: 'attending' | 'declined' | 'tentative' | 'pending';
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
  { id: 'g1', name: 'Budi Santoso & Pasangan', side: 'groom', groupTag: 'Keluarga Inti', estimatedPax: 2, actualPax: 2, rsvpStatus: 'attending' },
  { id: 'g2', name: 'Siti Rahma', side: 'groom', groupTag: 'Rekan Kerja', estimatedPax: 1, actualPax: 1, rsvpStatus: 'attending' },
  { id: 'g3', name: 'Kel. Besar Hartono', side: 'bride', groupTag: 'VIP Keluarga', estimatedPax: 4, actualPax: 4, rsvpStatus: 'attending' },
  { id: 'g4', name: 'Kevin & Fiona', side: 'bride', groupTag: 'Sahabat Kuliah', estimatedPax: 2, actualPax: 0, rsvpStatus: 'tentative' },
  { id: 'g5', name: 'Joko Widodo', side: 'groom', groupTag: 'Kolega', estimatedPax: 1, actualPax: 0, rsvpStatus: 'declined' },
  { id: 'g6', name: 'Alumni SMA Sanur', side: 'both', groupTag: 'Sahabat', estimatedPax: 5, actualPax: 0, rsvpStatus: 'pending' },
];

const initialGifts: GiftItem[] = [
  { id: 'gf1', senderName: 'Om Anton', giftType: 'cash', amount: 5000000, receivedBy: 'groom', thankYouSent: true },
  { id: 'gf2', senderName: 'Tante Rina', giftType: 'transfer', amount: 7500000, receivedBy: 'bride', thankYouSent: true },
  { id: 'gf3', senderName: 'Direksi Perusahaan Octa', giftType: 'transfer', amount: 10000000, receivedBy: 'both', thankYouSent: false },
  { id: 'gf4', senderName: 'Sahabat Kampus Jenesia', giftType: 'physical_gift', amount: 0, giftDescription: 'Espresso Coffee Machine DeLonghi', receivedBy: 'both', thankYouSent: true },
  { id: 'gf5', senderName: 'Tetangga Komplek Solo', giftType: 'cash', amount: 1000000, receivedBy: 'family_groom', thankYouSent: false },
];

const sideOptions = ['Semua Pihak', 'Pihak Octa', 'Pihak Jenesia'];
const sideKeys: ('all' | 'groom' | 'bride')[] = ['all', 'groom', 'bride'];

export default function GuestsScreen() {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [sideIndex, setSideIndex] = useState(0);
  const [guests, setGuests] = useState<GuestItem[]>(initialGuests);
  const [gifts, setGifts] = useState<GiftItem[]>(initialGifts);

  const cycleRsvp = (guestId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGuests((prev) =>
      prev.map((g) => {
        if (g.id !== guestId) return g;
        const order: GuestItem['rsvpStatus'][] = ['attending', 'tentative', 'declined', 'pending'];
        const nextStatus = order[(order.indexOf(g.rsvpStatus) + 1) % order.length];
        return {
          ...g,
          rsvpStatus: nextStatus,
          actualPax: nextStatus === 'attending' ? g.estimatedPax : 0,
        };
      })
    );
  };

  const toggleThankYou = (giftId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setGifts((prev) =>
      prev.map((gf) => (gf.id === giftId ? { ...gf, thankYouSent: !gf.thankYouSent } : gf))
    );
  };

  const selectedSideFilter = sideKeys[sideIndex];
  const totalInvitedPax = guests.reduce((acc, g) => acc + g.estimatedPax, 0);
  const confirmedAttendingPax = guests
    .filter((g) => g.rsvpStatus === 'attending')
    .reduce((acc, g) => acc + (g.actualPax > 0 ? g.actualPax : g.estimatedPax), 0);
  const attendanceRate = totalInvitedPax > 0 ? Math.round((confirmedAttendingPax / totalInvitedPax) * 100) : 0;

  const filteredGuests = guests.filter((g) => {
    if (selectedSideFilter === 'all') return true;
    return g.side === selectedSideFilter || g.side === 'both';
  });

  const totalCashCollected = gifts
    .filter((g) => g.giftType === 'cash' || g.giftType === 'transfer')
    .reduce((acc, g) => acc + g.amount, 0);
  const physicalGiftsCount = gifts.filter((g) => g.giftType === 'physical_gift').length;
  const thankYouSentCount = gifts.filter((g) => g.thankYouSent).length;
  const thankYouPendingCount = gifts.length - thankYouSentCount;

  const recipientTotals = gifts.reduce((acc, g) => {
    if (g.giftType === 'cash' || g.giftType === 'transfer') {
      acc[g.receivedBy] = (acc[g.receivedBy] || 0) + g.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          kicker="Resepsi & Hadiah"
          title="Tamu & Angpau"
          subtitle="Ketuk status tamu atau ucapan untuk memperbarui"
        />

        <SegmentedControl
          options={['Tamu & RSVP', 'Angpau & Kado']}
          selectedIndex={activeSegmentIndex}
          onChange={setActiveSegmentIndex}
        />

        {activeSegmentIndex === 0 ? (
          <FadeInView delay={20}>
            {/* Hero Pax Card */}
            <Card variant="elevated" style={styles.heroCard}>
              <Text style={styles.heroKicker}>PAX KATERING TERKONFIRMASI</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroBigNum}>{confirmedAttendingPax}</Text>
                <Text style={styles.heroUnit}>Pax Hadir</Text>
              </View>
              <ProgressBar progress={attendanceRate} height={6} style={{ marginVertical: 10 }} />
              <Text style={styles.heroSub}>
                {attendanceRate}% konfirmasi dari total {totalInvitedPax} kuota undangan ({guests.length} nama)
              </Text>
            </Card>

            <FilterChipBar
              options={sideOptions}
              selectedIndex={sideIndex}
              onChange={setSideIndex}
            />

            <Card style={styles.listCard}>
              {filteredGuests.map((g, idx) => (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.7}
                  onPress={() => cycleRsvp(g.id)}
                  style={[styles.rowItem, idx === filteredGuests.length - 1 && styles.rowLast]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {g.groupTag} • {g.estimatedPax} Pax •{' '}
                      {g.side === 'groom' ? 'Octa' : g.side === 'bride' ? 'Jenesia' : 'Berdua'}
                    </Text>
                  </View>
                  <Badge
                    label={
                      g.rsvpStatus === 'attending'
                        ? 'Hadir'
                        : g.rsvpStatus === 'tentative'
                        ? 'Ragu'
                        : g.rsvpStatus === 'declined'
                        ? 'Menolak'
                        : 'Pending'
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
                </TouchableOpacity>
              ))}
            </Card>
          </FadeInView>
        ) : (
          <FadeInView delay={20}>
            {/* Hero Angpau Card */}
            <Card variant="elevated" style={styles.heroCard}>
              <Text style={styles.heroKicker}>TOTAL DANA ANGPAU TERKUMPUL</Text>
              <Text style={styles.heroBigMoney}>
                Rp {totalCashCollected.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.heroSub}>
                Terpisah dari kas pra-nikah • {gifts.length} total pemberian tercatat
              </Text>
            </Card>

            <View style={styles.statGrid}>
              <StatCard
                label="Kado Fisik"
                value={`${physicalGiftsCount} Barang`}
                subtext="Tercatat di inventaris"
              />
              <StatCard
                label="Kartu Ucapan"
                value={`${thankYouSentCount} Terkirim`}
                subtext={`${thankYouPendingCount} menunggu`}
                variant="highlight"
              />
            </View>

            {/* Rekap Penerima */}
            <Card style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Penerima Dana</Text>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientLabel}>Khusus Octa (Groom)</Text>
                <Text style={styles.recipientValue}>
                  Rp {(recipientTotals['groom'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientLabel}>Khusus Jenesia (Bride)</Text>
                <Text style={styles.recipientValue}>
                  Rp {(recipientTotals['bride'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientLabel}>Keluarga Octa</Text>
                <Text style={styles.recipientValue}>
                  Rp {(recipientTotals['family_groom'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={[styles.recipientRow, styles.rowLast]}>
                <Text style={[styles.recipientLabel, styles.boldText]}>Kedua Mempelai</Text>
                <Text style={[styles.recipientValue, styles.boldText]}>
                  Rp {(recipientTotals['both'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
            </Card>

            {/* Rincian Hadiah */}
            <Card style={styles.listCard}>
              {gifts.map((gf, idx) => (
                <TouchableOpacity
                  key={gf.id}
                  activeOpacity={0.7}
                  onPress={() => toggleThankYou(gf.id)}
                  style={[styles.rowItem, idx === gifts.length - 1 && styles.rowLast]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {gf.senderName}
                    </Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {gf.giftType === 'physical_gift'
                        ? gf.giftDescription
                        : `Rp ${gf.amount.toLocaleString('id-ID')} (${gf.giftType === 'cash' ? 'Tunai' : 'Transfer'})`}
                    </Text>
                  </View>
                  <Badge
                    label={gf.thankYouSent ? 'Ucapan Terkirim' : 'Kirim Ucapan'}
                    variant={gf.thankYouSent ? 'success' : 'warning'}
                  />
                </TouchableOpacity>
              ))}
            </Card>
          </FadeInView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroCard: {
    padding: 18,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.8,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 8,
  },
  heroBigNum: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heroBigMoney: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 6,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  summaryCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recipientLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recipientValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listCard: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
