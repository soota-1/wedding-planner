import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { FadeInView } from '../../src/components/common/FadeInView';

interface CategoryItem {
  id: string;
  name: string;
  allocated: number;
  committed: number;
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

const categories: CategoryItem[] = [
  { id: '1', name: 'Venue & Gedung Resepsi', allocated: 50000000, committed: 50000000 },
  { id: '2', name: 'Katering Mawar (800 Porsi)', allocated: 70000000, committed: 80000000 },
  { id: '3', name: 'Dokumentasi Foto & Video', allocated: 20000000, committed: 28000000 },
  { id: '4', name: 'Busana Pengantin & MUA', allocated: 10000000, committed: 0 },
];

const vendors: VendorItem[] = [
  { id: 'v1', name: 'Gedung Paroki St. Perawan Maria', category: 'Venue', contractValue: 50000000, status: 'booked', contactPerson: 'Ibu Marta' },
  { id: 'v2', name: 'Katering Selera Nusantara', category: 'Katering', contractValue: 80000000, status: 'booked', contactPerson: 'Pak Hendra' },
  { id: 'v3', name: 'Atelier Wedding Photography', category: 'Dokumentasi', contractValue: 28000000, status: 'booked', contactPerson: 'David' },
  { id: 'v4', name: 'Sanggar Rias & Gaun Pengantin', category: 'Busana', contractValue: 15000000, status: 'shortlisted', contactPerson: 'Cindy' },
];

const transactions: TransactionItem[] = [
  { id: 'tx1', vendorName: 'Gedung Paroki St. Perawan Maria', amount: 10000000, paidBy: 'groom', status: 'paid', date: '10 Feb 2027', notes: 'Booking Fee Gedung' },
  { id: 'tx2', vendorName: 'Katering Selera Nusantara', amount: 20000000, paidBy: 'bride', status: 'paid', date: '01 Mar 2027', notes: 'DP 25% Prasmanan' },
  { id: 'tx3', vendorName: 'Atelier Wedding Photography', amount: 5000000, paidBy: 'family', status: 'paid', date: '15 Mar 2027', notes: 'DP Liputan Misa' },
  { id: 'tx4', vendorName: 'Katering Selera Nusantara', amount: 30000000, paidBy: 'bride', status: 'pending', date: '01 Sep 2027', notes: 'Termin Cicilan 2' },
];

export default function BudgetScreen() {
  const [activeTab, setActiveTab] = useState(0);

  const targetBudget = 150000000;
  const cashSpent = 35000000;
  const totalCommitted = 158000000;
  const remainingCash = targetBudget - cashSpent;
  const remainingLiability = totalCommitted - cashSpent;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          kicker="Finansial Pasangan"
          title="Anggaran & Vendor"
          subtitle={`Sisa liabilitas kontrak Rp ${(remainingLiability / 1000000).toFixed(0)} Jt`}
        />

        {/* 2x2 Minimalist Stat Grid */}
        <View style={styles.statGrid}>
          <StatCard
            label="Target Anggaran"
            value={`Rp ${(targetBudget / 1000000).toFixed(0)} Jt`}
            subtext="Alokasi awal"
          />
          <StatCard
            label="Sisa Kas Tersedia"
            value={`Rp ${(remainingCash / 1000000).toFixed(0)} Jt`}
            subtext={`Terbayar Rp ${(cashSpent / 1000000).toFixed(0)} Jt`}
            variant="highlight"
          />
        </View>

        <SegmentedControl
          options={['Pos Biaya', 'Vendor', 'Transaksi']}
          selectedIndex={activeTab}
          onChange={setActiveTab}
          style={styles.segmented}
        />

        {activeTab === 0 ? (
          <FadeInView delay={20}>
            <Card style={styles.listCard}>
              {categories.map((c, idx) => {
                const isOver = c.committed > c.allocated;
                const ratio = c.allocated > 0 ? Math.round((c.committed / c.allocated) * 100) : 0;
                return (
                  <View
                    key={c.id}
                    style={[styles.itemBlock, idx === categories.length - 1 && styles.itemLast]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Badge
                        label={isOver ? `Over Rp ${((c.committed - c.allocated) / 1000000).toFixed(0)} Jt` : 'Aman'}
                        variant={isOver ? 'warning' : 'success'}
                      />
                    </View>
                    <ProgressBar
                      progress={Math.min(100, ratio)}
                      color={isOver ? colors.warning : colors.accent}
                      height={6}
                      style={{ marginVertical: 10 }}
                    />
                    <View style={styles.rowBetween}>
                      <Text style={styles.subValue}>
                        Komitmen: Rp {c.committed.toLocaleString('id-ID')}
                      </Text>
                      <Text style={styles.subLabel}>
                        Alokasi: Rp {(c.allocated / 1000000).toFixed(0)} Jt
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </FadeInView>
        ) : activeTab === 1 ? (
          <FadeInView delay={20}>
            <Card style={styles.listCard}>
              {vendors.map((v, idx) => (
                <View
                  key={v.id}
                  style={[styles.itemBlock, idx === vendors.length - 1 && styles.itemLast]}
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.flexInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {v.name}
                      </Text>
                      <Text style={styles.subLabel}>
                        {v.category} • {v.contactPerson}
                      </Text>
                    </View>
                    <Badge
                      label={v.status === 'booked' ? 'Booked' : 'Shortlist'}
                      variant={v.status === 'booked' ? 'success' : 'neutral'}
                    />
                  </View>
                  <Text style={styles.contractAmount}>
                    Rp {v.contractValue.toLocaleString('id-ID')}
                  </Text>
                </View>
              ))}
            </Card>
          </FadeInView>
        ) : (
          <FadeInView delay={20}>
            <Card style={styles.listCard}>
              {transactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[styles.itemBlock, idx === transactions.length - 1 && styles.itemLast]}
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.flexInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {tx.notes}
                      </Text>
                      <Text style={styles.subLabel} numberOfLines={1}>
                        {tx.vendorName} • {tx.date}
                      </Text>
                    </View>
                    <Text style={styles.amountText}>
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <View style={styles.txBadgeRow}>
                    <Badge
                      label={
                        tx.paidBy === 'groom'
                          ? 'Octa'
                          : tx.paidBy === 'bride'
                          ? 'Jenesia'
                          : 'Keluarga'
                      }
                      variant="accent"
                    />
                    <Badge
                      label={tx.status === 'paid' ? 'Lunas' : 'Pending'}
                      variant={tx.status === 'paid' ? 'success' : 'neutral'}
                    />
                  </View>
                </View>
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
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  segmented: {
    marginBottom: spacing.md,
  },
  listCard: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  itemBlock: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  flexInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  subValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  subLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contractAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  txBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
});
