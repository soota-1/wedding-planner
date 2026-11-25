import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { differenceInCalendarDays } from 'date-fns';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Badge } from '../../src/components/common/Badge';
import { FadeInView } from '../../src/components/common/FadeInView';

export default function DashboardScreen() {
  const router = useRouter();
  const weddingDate = new Date('2027-10-10T00:00:00.000Z');
  const daysRemaining = Math.max(0, differenceInCalendarDays(weddingDate, new Date()));

  const progressPercent = 68;
  const targetBudget = 150000000;
  const cashSpent = 35000000;
  const totalCommitted = 158000000;
  const overBudgetAmount = totalCommitted - targetBudget;
  const isOverBudget = overBudgetAmount > 0;

  const upcomingTasks = [
    { id: '1', title: 'Kursus Persiapan Perkawinan (KPP)', dueDate: '13 Apr 2027', priority: 'critical', daysLeft: 'H-180' },
    { id: '2', title: 'Cetak Surat Baptis Terbaru', dueDate: '13 Mei 2027', priority: 'high', daysLeft: 'H-150' },
    { id: '3', title: 'Penyelidikan Kanonik Pastor', dueDate: '12 Jul 2027', priority: 'critical', daysLeft: 'H-90' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          kicker="Sakramen & Resepsi"
          title="Octa & Jenesia"
          subtitle="10 Oktober 2027 • Paroki St. Perawan Maria"
        />

        {/* 1. Minimalist Hero Countdown Card */}
        <FadeInView delay={40}>
          <Card variant="elevated" style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.countdownBlock}>
                <Text style={styles.countdownNumber}>{daysRemaining}</Text>
                <Text style={styles.countdownLabel}>Hari Menuju Hari H</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.heroMetricsColumn}>
                <View style={styles.heroMiniMetric}>
                  <Text style={styles.heroMiniLabel}>Checklist</Text>
                  <Text style={styles.heroMiniValue}>{progressPercent}% Siap</Text>
                </View>
                <View style={styles.heroMiniMetric}>
                  <Text style={styles.heroMiniLabel}>Tamu Hadir</Text>
                  <Text style={styles.heroMiniValue}>7 Pax Fix</Text>
                </View>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* 2. Smooth Progress Card */}
        <FadeInView delay={100}>
          <Card onPress={() => router.push('/checklist')}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowTitleGroup}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>Progres Persiapan</Text>
              </View>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>
            <ProgressBar progress={progressPercent} height={7} style={styles.progressBar} />
            <View style={styles.cardFooterLinkRow}>
              <Text style={styles.mutedSubtext}>18 dari 26 tugas utama selesai</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </Card>
        </FadeInView>

        {/* 3. Financial Health Card */}
        <FadeInView delay={160}>
          <Card onPress={() => router.push('/budget')}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowTitleGroup}>
                <Ionicons name="wallet-outline" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>Ringkasan Anggaran</Text>
              </View>
              <Badge
                label={isOverBudget ? `Over Rp ${(overBudgetAmount / 1000000).toFixed(0)} Jt` : 'Sesuai Target'}
                variant={isOverBudget ? 'warning' : 'success'}
              />
            </View>

            <View style={styles.statGrid}>
              <StatCard
                label="Target Anggaran"
                value={`Rp ${(targetBudget / 1000000).toFixed(0)} Jt`}
              />
              <StatCard
                label="Kas Terbayar"
                value={`Rp ${(cashSpent / 1000000).toFixed(0)} Jt`}
                variant="highlight"
              />
            </View>

            <View style={styles.ledgerList}>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Total Komitmen Kontrak</Text>
                <Text style={[styles.ledgerValue, isOverBudget && { color: colors.warning }]}>
                  Rp {totalCommitted.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Kontribusi Octa</Text>
                <Text style={styles.ledgerValue}>Rp 10.000.000</Text>
              </View>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Kontribusi Jenesia</Text>
                <Text style={styles.ledgerValue}>Rp 20.000.000</Text>
              </View>
              <View style={[styles.ledgerRow, styles.ledgerRowLast]}>
                <Text style={styles.ledgerLabel}>Dukungan Keluarga</Text>
                <Text style={styles.ledgerValue}>Rp 5.000.000</Text>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* 4. Upcoming Deadlines */}
        <FadeInView delay={220}>
          <Card>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowTitleGroup}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>Agenda Terdekat</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/checklist')} activeOpacity={0.7}>
                <Text style={styles.linkText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {upcomingTasks.map((t, idx) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => router.push('/checklist')}
                activeOpacity={0.7}
                style={[styles.agendaRow, idx === upcomingTasks.length - 1 && styles.agendaRowLast]}
              >
                <View style={styles.agendaLeft}>
                  <Text style={styles.agendaTitle} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Text style={styles.agendaDate}>{t.dueDate}</Text>
                </View>
                <View style={styles.agendaRight}>
                  <Badge
                    label={t.daysLeft}
                    variant={t.priority === 'critical' ? 'danger' : 'warning'}
                  />
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </FadeInView>
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
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownBlock: {
    flex: 1.2,
    paddingRight: spacing.md,
  },
  countdownNumber: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 46,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 54,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  heroMetricsColumn: {
    flex: 1,
    gap: 10,
  },
  heroMiniMetric: {
    justifyContent: 'center',
  },
  heroMiniLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  heroMiniValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  percentText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    marginBottom: 10,
  },
  cardFooterLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mutedSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  ledgerList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ledgerRowLast: {
    paddingBottom: 0,
  },
  ledgerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    paddingRight: 8,
  },
  ledgerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  agendaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  agendaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  agendaLeft: {
    flex: 1,
    paddingRight: 10,
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  agendaDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  agendaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
