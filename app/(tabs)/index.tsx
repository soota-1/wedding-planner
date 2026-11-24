import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Badge } from '../../src/components/common/Badge';

export default function DashboardScreen() {
  const weddingDate = new Date('2027-10-10T00:00:00.000Z');
  const today = new Date();
  const diffTime = weddingDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Mock initial dashboard state representing active workspace
  const workspaceName = 'Pernikahan Octa & Jenesia';
  const progressPercent = 68;
  const targetBudget = 150000000;
  const cashSpent = 35000000;
  const totalCommitted = 158000000;
  const remainingCash = targetBudget - cashSpent;
  const isOverBudget = totalCommitted > targetBudget;
  const overBudgetAmount = totalCommitted - targetBudget;

  const contributions = {
    groom: 10000000,
    bride: 20000000,
    family: 5000000,
  };

  const upcomingTasks = [
    { id: '1', title: 'Kursus Persiapan Perkawinan (KPP)', dueDate: '13 Apr 2027', priority: 'critical', daysLeft: 'H-180' },
    { id: '2', title: 'Cetak Surat Baptis Terbaru di Paroki Asal', dueDate: '13 Mei 2027', priority: 'high', daysLeft: 'H-150' },
    { id: '3', title: 'Penyelidikan Kanonik dengan Pastor Paroki', dueDate: '12 Jul 2027', priority: 'critical', daysLeft: 'H-90' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header Profil Pasangan */}
      <Header
        title={workspaceName}
        subtitle="Sakramen Perkawinan Katolik & Administrasi Sipil"
        style={styles.header}
      />

      {/* 2. Kartu Countdown Sakral */}
      <Card variant="elevated" style={styles.countdownCard}>
        <View style={styles.countdownRow}>
          <View style={styles.countdownBadgeContainer}>
            <Text style={styles.countdownNumber}>{daysRemaining}</Text>
            <Text style={styles.countdownUnit}>HARI LAGI</Text>
          </View>
          <View style={styles.countdownDetails}>
            <Text style={styles.countdownHeading}>Menuju Janji Suci</Text>
            <Text style={styles.countdownDate}>Minggu, 10 Oktober 2027</Text>
            <Text style={styles.countdownLocation}>📍 Gereja St. Perawan Maria Diangkat ke Surga</Text>
          </View>
        </View>
      </Card>

      {/* 3. Progress Bar Kesiapan */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kesiapan Persiapan</Text>
          <Text style={styles.progressValueText}>{progressPercent}% Rampung</Text>
        </View>
        <ProgressBar progress={progressPercent} color={colors.accent} height={10} />
        <Text style={styles.progressSubtext}>
          18 dari 26 tugas persiapan telah diselesaikan bersama.
        </Text>
      </Card>

      {/* 4. Kartu Kesehatan Keuangan & Over-Budget Warning */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kesehatan Anggaran</Text>
          {isOverBudget ? (
            <Badge label="Peringatan Over-Budget" variant="warning" />
          ) : (
            <Badge label="Anggaran Aman" variant="success" />
          )}
        </View>

        {isOverBudget ? (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              ⚠️ Total komitmen deal vendor (Rp {totalCommitted.toLocaleString('id-ID')}) melebihi
              target anggaran sebesar{' '}
              <Text style={styles.alertHighlight}>
                Rp {overBudgetAmount.toLocaleString('id-ID')}
              </Text>
              . Evaluasi kembali pos dekorasi atau suvenir.
            </Text>
          </View>
        ) : null}

        <View style={styles.statGrid}>
          <StatCard
            label="Target Anggaran"
            value={`Rp ${(targetBudget / 1000000).toFixed(0)} Jt`}
            subtext="Batas alokasi awal"
          />
          <StatCard
            label="Kas Keluar (DP/Lunas)"
            value={`Rp ${(cashSpent / 1000000).toFixed(0)} Jt`}
            subtext="Realisasi kas dibayar"
            variant="highlight"
          />
        </View>

        <View style={[styles.statGrid, { marginTop: spacing.sm }]}>
          <StatCard
            label="Sisa Kas Tersedia"
            value={`Rp ${(remainingCash / 1000000).toFixed(0)} Jt`}
            subtext="Dana kas belum terpakai"
            variant="success"
          />
          <StatCard
            label="Total Komitmen Kontrak"
            value={`Rp ${(totalCommitted / 1000000).toFixed(0)} Jt`}
            subtext="Total nilai kontrak deal"
            variant={isOverBudget ? 'warning' : 'default'}
          />
        </View>

        {/* Kontribusi Pembayar */}
        <View style={styles.contributionSection}>
          <Text style={styles.contributionTitle}>Rekap Pembayar Kas Riil:</Text>
          <View style={styles.contributionRow}>
            <Text style={styles.contributionText}>
              🤵 Octa (Groom):{' '}
              <Text style={styles.boldText}>Rp {contributions.groom.toLocaleString('id-ID')}</Text>
            </Text>
            <Text style={styles.contributionText}>
              👰 Jenesia (Bride):{' '}
              <Text style={styles.boldText}>Rp {contributions.bride.toLocaleString('id-ID')}</Text>
            </Text>
          </View>
          <Text style={styles.contributionSub}>
            Keluarga / Bantuan: Rp {contributions.family.toLocaleString('id-ID')}
          </Text>
        </View>
      </Card>

      {/* 5. Agenda Terdekat */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda & Tenggat Terdekat</Text>
          <Text style={styles.viewAllText}>Semua Checklist →</Text>
        </View>
        {upcomingTasks.map((t) => (
          <View key={t.id} style={styles.taskItem}>
            <View style={styles.taskItemLeft}>
              <Text style={styles.taskDaysBadge}>{t.daysLeft}</Text>
              <View style={styles.taskItemTextContainer}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskDueDate}>Jatuh tempo: {t.dueDate}</Text>
              </View>
            </View>
            <Badge
              label={t.priority.toUpperCase()}
              variant={t.priority === 'critical' ? 'danger' : 'warning'}
            />
          </View>
        ))}
      </Card>
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
  countdownCard: {
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    padding: spacing.md,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownBadgeContainer: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    lineHeight: 32,
  },
  countdownUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accentDark,
    letterSpacing: 0.5,
  },
  countdownDetails: {
    flex: 1,
  },
  countdownHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countdownDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countdownLocation: {
    fontSize: 12,
    color: colors.accentDark,
    marginTop: 4,
  },
  sectionCard: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  progressSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  alertBanner: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  alertText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  alertHighlight: {
    fontWeight: '700',
    color: colors.warning,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contributionSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contributionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contributionText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  contributionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  taskDaysBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  taskItemTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  taskDueDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
