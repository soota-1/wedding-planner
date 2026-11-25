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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { Card } from '../src/components/common/Card';
import { Badge } from '../src/components/common/Badge';
import { FilterChipBar } from '../src/components/common/FilterChipBar';
import { FadeInView } from '../src/components/common/FadeInView';
import { useWeddingStore } from '../src/stores/useWeddingStore';
import { NotificationService } from '../src/services/notificationService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TimelineEntry {
  id: string;
  sourceId: string;
  kind: 'task' | 'payment' | 'appointment';
  title: string;
  subtitle: string;
  dateLabel: string;
  sortWeight: number;
  isCompleted: boolean;
  badgeLabel: string;
  badgeVariant: 'danger' | 'warning' | 'success' | 'neutral';
  amount?: number;
}

const filterOptions = ['Semua', 'Tugas Persiapan', 'Jadwal Vendor', 'Cicilan Vendor', 'Selesai'];

export default function TimelineScreen() {
  const router = useRouter();
  const [filterIndex, setFilterIndex] = useState(0);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const tasks = useWeddingStore((s) => s.tasks);
  const vendors = useWeddingStore((s) => s.vendors);
  const transactions = useWeddingStore((s) => s.transactions);
  const weddingDate = useWeddingStore((s) => s.profile.weddingDate);
  const toggleTask = useWeddingStore((s) => s.toggleTask);

  const baseWedding = new Date(weddingDate);
  const safeWeddingMs = isNaN(baseWedding.getTime())
    ? new Date('2027-10-10T00:00:00.000Z').getTime()
    : baseWedding.getTime();

  const vendorAppointments: TimelineEntry[] = vendors.flatMap((v) =>
    (v.schedules || []).map((sc) => {
      const parsedApt = sc.isoDateTime ? new Date(sc.isoDateTime) : new Date(sc.date);
      const offsetFromWedding = !isNaN(parsedApt.getTime())
        ? Math.round((parsedApt.getTime() - safeWeddingMs) / (24 * 60 * 60 * 1000))
        : -30;
      return {
        id: `apt-${v.id}-${sc.id}`,
        sourceId: sc.id,
        kind: 'appointment' as const,
        title: sc.title,
        subtitle: `${v.name} • ${v.contactPerson}${sc.reminderEnabled ? ' • 🔔 Pengingat Aktif' : ''}`,
        dateLabel: `${sc.date}${sc.time ? ` • ${sc.time} WIB` : ''}`,
        sortWeight: offsetFromWedding,
        isCompleted: !!sc.completed,
        badgeLabel: sc.completed ? 'Selesai' : 'Fitting/Meeting',
        badgeVariant: (sc.completed ? 'success' : 'warning') as TimelineEntry['badgeVariant'],
      };
    })
  );

  // Build unified chronological timeline
  const entries: TimelineEntry[] = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      sourceId: t.id,
      kind: 'task' as const,
      title: t.title,
      subtitle: `${t.pic === 'groom' ? 'Octa' : t.pic === 'bride' ? 'Jenesia' : 'Berdua'} • ${t.category.toUpperCase()}`,
      dateLabel: t.dueDate,
      sortWeight: t.offsetDays,
      isCompleted: t.completed,
      badgeLabel: t.completed ? 'Selesai' : `H${t.offsetDays}`,
      badgeVariant: (t.completed
        ? 'success'
        : t.priority === 'critical'
        ? 'danger'
        : 'warning') as TimelineEntry['badgeVariant'],
    })),
    ...vendorAppointments,
    ...transactions.map((tx, idx) => ({
      id: `tx-${tx.id}`,
      sourceId: tx.id,
      kind: 'payment' as const,
      title: tx.notes,
      subtitle: `${tx.vendorName} • Rp ${tx.amount.toLocaleString('id-ID')}`,
      dateLabel: tx.date,
      sortWeight: -40 + idx * 5,
      isCompleted: tx.status === 'paid',
      badgeLabel: tx.status === 'paid' ? 'Lunas' : 'Termin',
      badgeVariant: (tx.status === 'paid' ? 'success' : 'warning') as TimelineEntry['badgeVariant'],
      amount: tx.amount,
    })),
  ].sort((a, b) => a.sortWeight - b.sortWeight);

  const filteredEntries = entries.filter((item) => {
    if (filterIndex === 1) return item.kind === 'task' && !item.isCompleted;
    if (filterIndex === 2) return item.kind === 'appointment' && !item.isCompleted;
    if (filterIndex === 3) return item.kind === 'payment' && !item.isCompleted;
    if (filterIndex === 4) return item.isCompleted;
    return true;
  });

  const pendingCount = entries.filter((e) => !e.isCompleted).length;

  const handleScheduleReminders = async () => {
    const baseWedding = new Date(weddingDate);
    const safeWedding = isNaN(baseWedding.getTime())
      ? new Date('2027-10-10T00:00:00.000Z')
      : baseWedding;

    const calendarEvents = entries
      .filter((e) => !e.isCompleted)
      .map((e) => ({
        id: e.sourceId,
        title: e.title,
        date: new Date(safeWedding.getTime() + e.sortWeight * 24 * 60 * 60 * 1000),
        type: (e.kind === 'payment'
          ? 'payment_deadline'
          : e.kind === 'appointment'
          ? 'appointment'
          : 'task_deadline') as 'payment_deadline' | 'appointment' | 'task_deadline',
        amount: e.amount,
        isCompleted: e.isCompleted,
      }));

    try {
      const scheduled = await NotificationService.scheduleUpcomingReminders(
        calendarEvents,
        (payload) => NotificationService.scheduleLocalNotification(payload)
      );

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setReminderStatus(
        `${scheduled.length} pengingat agenda & termin cicilan berhasil dijadwalkan di perangkat Anda.`
      );
    } catch (err: any) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setReminderStatus(err?.message || 'Gagal menjadwalkan pengingat di perangkat.');
    }
  };

  const handleTestNotification = async () => {
    const res = await NotificationService.sendTestNotification(3);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setReminderStatus(res.message);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.75}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>KALENDER GABUNGAN</Text>
            <Text style={styles.heading}>Linimasa & Pengingat</Text>
          </View>
        </View>

        {/* Smart Reminder Banner */}
        <FadeInView delay={30}>
          <Card variant="elevated" style={styles.reminderCard}>
            <View style={styles.reminderRow}>
              <View style={styles.reminderIconWrap}>
                <Ionicons name="notifications-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.reminderTextCol}>
                <Text style={styles.reminderTitle}>
                  {pendingCount} Agenda & Cicilan Mendatang
                </Text>
                <Text style={styles.reminderSub}>
                  {reminderStatus ||
                    'Gabungan tenggat kanonik, catatan sipil, dan termin pembayaran vendor.'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleScheduleReminders}
                activeOpacity={0.8}
                style={[styles.reminderButton, { flex: 1 }]}
              >
                <Ionicons name="alarm-outline" size={15} color={colors.textLight} />
                <Text style={styles.reminderButtonText}>Aktifkan Semua Pengingat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTestNotification}
                activeOpacity={0.8}
                style={[
                  styles.reminderButton,
                  { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.accent },
                ]}
              >
                <Ionicons name="notifications-outline" size={15} color={colors.accent} />
                <Text style={[styles.reminderButtonText, { color: colors.accent }]}>
                  Tes 3 dtk
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </FadeInView>

        <FilterChipBar
          options={filterOptions}
          selectedIndex={filterIndex}
          onChange={setFilterIndex}
        />

        {/* Timeline List */}
        <Card style={styles.listCard}>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-clear-outline" size={26} color={colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada agenda pada filter ini.</Text>
            </View>
          ) : (
            filteredEntries.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={item.kind === 'task' ? 0.7 : 1}
                onPress={() => {
                  if (item.kind === 'task') {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    toggleTask(item.sourceId);
                  }
                }}
                style={[styles.timelineRow, idx === filteredEntries.length - 1 && styles.rowLast]}
              >
                <View style={styles.timelineDotCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      item.isCompleted
                        ? styles.dotCompleted
                        : item.kind === 'payment'
                        ? styles.dotPayment
                        : styles.dotTask,
                    ]}
                  />
                  {idx < filteredEntries.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>

                <View style={styles.timelineBody}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.dateText}>{item.dateLabel}</Text>
                    <Badge label={item.badgeLabel} variant={item.badgeVariant} />
                  </View>
                  <Text
                    style={[styles.itemTitle, item.isCompleted && styles.itemTitleCompleted]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.accent,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  reminderCard: {
    padding: 16,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reminderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTextCol: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reminderSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  reminderButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reminderButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  listCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  rowLast: {
    paddingBottom: 4,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 16,
    paddingTop: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotTask: {
    backgroundColor: colors.accent,
  },
  dotPayment: {
    backgroundColor: colors.warning,
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.border,
    marginTop: 6,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
