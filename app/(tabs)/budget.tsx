import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';

interface CategoryItem {
  id: string;
  name: string;
  allocated: number;
  committed: number;
  spent: number;
}

interface VendorItem {
  id: string;
  name: string;
  category: string;
  contractValue: number;
  status: 'researching' | 'shortlisted' | 'booked' | 'completed';
  contactPerson: string;
}

interface TransactionItem {
  id: string;
  vendorName: string;
  amount: number;
  paidBy: 'groom' | 'bride' | 'family';
  status: 'paid' | 'pending';
  date: string;
  notes: string;
}

export default function BudgetScreen() {
  const targetBudget = 150000000;
  const cashSpent = 35000000;
  const totalCommitted = 158000000;
  const remainingCash = targetBudget - cashSpent;
  const remainingLiability = totalCommitted - cashSpent;
  const isOverBudget = totalCommitted > targetBudget;

  const categories: CategoryItem[] = [
    { id: '1', name: 'Venue & Gedung Resepsi', allocated: 50000000, committed: 50000000, spent: 10000000 },
    { id: '2', name: 'Katering Mawar (800 Porsi)', allocated: 70000000, committed: 80000000, spent: 20000000 }, // Over 10M
    { id: '3', name: 'Dokumentasi Foto & Video', allocated: 20000000, committed: 28000000, spent: 5000000 }, // Over 8M
    { id: '4', name: 'Busana Pengantin & MUA', allocated: 10000000, committed: 0, spent: 0 },
  ];

  const vendors: VendorItem[] = [
    { id: 'v1', name: 'Gedung Paroki St. Perawan Maria', category: 'Venue', contractValue: 50000000, status: 'booked', contactPerson: 'Ibu Marta (Sekretariat)' },
    { id: 'v2', name: 'Katering Selera Nusantara', category: 'Katering', contractValue: 80000000, status: 'booked', contactPerson: 'Pak Hendra' },
    { id: 'v3', name: 'Atelier Wedding Photography', category: 'Foto/Video', contractValue: 28000000, status: 'booked', contactPerson: 'Mas David' },
    { id: 'v4', name: 'Sanggar Rias & Gaun Pengantin', category: 'Busana', contractValue: 15000000, status: 'shortlisted', contactPerson: 'Mbak Cindy' },
  ];

  const transactions: TransactionItem[] = [
    { id: 'tx1', vendorName: 'Gedung Paroki St. Perawan Maria', amount: 10000000, paidBy: 'groom', status: 'paid', date: '10 Feb 2027', notes: 'Booking Fee & Uang Muka Gedung' },
    { id: 'tx2', vendorName: 'Katering Selera Nusantara', amount: 20000000, paidBy: 'bride', status: 'paid', date: '01 Mar 2027', notes: 'DP 25% Menu Prasmanan' },
    { id: 'tx3', vendorName: 'Atelier Wedding Photography', amount: 5000000, paidBy: 'family', status: 'paid', date: '15 Mar 2027', notes: 'DP Prewedding & Liputan Misa' },
    { id: 'tx4', vendorName: 'Katering Selera Nusantara', amount: 30000000, paidBy: 'bride', status: 'pending', date: '01 Sep 2027', notes: 'Termin Cicilan 2' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Anggaran & Vendor"
        subtitle="Kelola Arus Kas & Liabilitas Kontrak Pasangan"
        style={styles.header}
      />

      {/* 1. Ringkasan Finansial Utama */}
      <View style={styles.statGrid}>
        <StatCard
          label="Target Anggaran"
          value={`Rp ${(targetBudget / 1000000).toFixed(0)} Jt`}
          subtext="Batas alokasi"
        />
        <StatCard
          label="Kas Terbayar"
          value={`Rp ${(cashSpent / 1000000).toFixed(0)} Jt`}
          subtext="Keluar riil (paid)"
          variant="highlight"
        />
      </View>

      <View style={[styles.statGrid, { marginTop: spacing.sm }]}>
        <StatCard
          label="Sisa Kas Tersedia"
          value={`Rp ${(remainingCash / 1000000).toFixed(0)} Jt`}
          subtext="Kas belum cair"
          variant="success"
        />
        <StatCard
          label="Sisa Liabilitas Utang"
          value={`Rp ${(remainingLiability / 1000000).toFixed(0)} Jt`}
          subtext="Kewajiban kontrak"
          variant={isOverBudget ? 'warning' : 'default'}
        />
      </View>

      {/* 2. Breakdown per Kategori Pos Anggaran */}
      <Card style={[styles.sectionCard, { marginTop: spacing.md }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alokasi Pos Anggaran</Text>
          <Text style={styles.subtextCount}>{categories.length} Kategori</Text>
        </View>

        {categories.map((c) => {
          const catOver = c.committed > c.allocated;
          const ratio = c.allocated > 0 ? Math.round((c.committed / c.allocated) * 100) : 0;
          return (
            <View key={c.id} style={styles.categoryItem}>
              <View style={styles.categoryHeaderRow}>
                <Text style={styles.categoryName}>{c.name}</Text>
                <Badge
                  label={catOver ? `⚠️ Over Rp ${((c.committed - c.allocated) / 1000000).toFixed(0)} Jt` : 'Aman'}
                  variant={catOver ? 'warning' : 'success'}
                  size="sm"
                />
              </View>
              <ProgressBar
                progress={Math.min(100, ratio)}
                color={catOver ? colors.warning : colors.accent}
                height={6}
                style={{ marginVertical: 6 }}
              />
              <View style={styles.categoryDetailRow}>
                <Text style={styles.categoryDetailText}>
                  Komitmen: Rp {c.committed.toLocaleString('id-ID')}
                </Text>
                <Text style={styles.categoryDetailText}>
                  Alokasi: Rp {c.allocated.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>

      {/* 3. Direktori Vendor & Siklus Hidup */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Direktori & Status Vendor</Text>
          <Text style={styles.subtextCount}>{vendors.length} Vendor</Text>
        </View>

        {vendors.map((v) => (
          <View key={v.id} style={styles.vendorItem}>
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{v.name}</Text>
              <Text style={styles.vendorCategory}>
                {v.category} • Kontak: {v.contactPerson}
              </Text>
              <Text style={styles.vendorContract}>
                Nilai Kontrak: Rp {v.contractValue.toLocaleString('id-ID')}
              </Text>
            </View>
            <Badge
              label={
                v.status === 'booked'
                  ? '🤝 DEAL / BOOKED'
                  : v.status === 'shortlisted'
                  ? '⭐ SHORTLIST'
                  : v.status.toUpperCase()
              }
              variant={v.status === 'booked' ? 'success' : 'neutral'}
            />
          </View>
        ))}
      </Card>

      {/* 4. Riwayat Transaksi & Penanda Pembayar */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Transaksi & Pembayaran</Text>
          <Text style={styles.subtextCount}>{transactions.length} Transaksi</Text>
        </View>

        {transactions.map((tx) => (
          <View key={tx.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionVendor}>{tx.vendorName}</Text>
              <Text style={styles.transactionNotes}>{tx.notes}</Text>
              <Text style={styles.transactionDate}>
                Tanggal: {tx.date} • Status: {tx.status === 'paid' ? 'Lunas (Paid)' : 'Pending'}
              </Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>
                Rp {tx.amount.toLocaleString('id-ID')}
              </Text>
              <Badge
                label={
                  tx.paidBy === 'groom'
                    ? '🤵 Octa'
                    : tx.paidBy === 'bride'
                    ? '👰 Jenesia'
                    : '👨‍👩‍👧 Keluarga'
                }
                variant={tx.paidBy === 'groom' ? 'accent' : 'secondary'}
                size="sm"
              />
            </View>
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
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  categoryItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryDetailText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  vendorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  vendorInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vendorCategory: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vendorContract: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  transactionVendor: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  transactionNotes: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
