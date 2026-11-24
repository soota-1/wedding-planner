import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { Badge } from '../../src/components/common/Badge';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  offsetDays: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  pic: 'groom' | 'bride' | 'both';
  completed: boolean;
}

const initialTasks: ChecklistItem[] = [
  { id: '1', title: 'Pendaftaran Kursus Persiapan Perkawinan (KPP)', category: 'canonical', dueDate: '13 Apr 2027', offsetDays: -180, priority: 'critical', pic: 'both', completed: true },
  { id: '2', title: 'Pengurusan Surat Baptis Terbaru di Paroki Asal', category: 'canonical', dueDate: '13 Mei 2027', offsetDays: -150, priority: 'high', pic: 'both', completed: false },
  { id: '3', title: 'Penyelidikan Kanonik dengan Pastor Paroki', category: 'canonical', dueDate: '12 Jul 2027', offsetDays: -90, priority: 'critical', pic: 'both', completed: false },
  { id: '4', title: 'Penyiapan Berkas Disdukcapil & Formulir N1-N4', category: 'civil', dueDate: '11 Agu 2027', offsetDays: -60, priority: 'high', pic: 'both', completed: false },
  { id: '5', title: 'Penentuan Saksi Nikah Resmi Gereja', category: 'canonical', dueDate: '11 Agu 2027', offsetDays: -60, priority: 'medium', pic: 'both', completed: false },
  { id: '6', title: 'Penyusunan Teks Liturgi & Buku Panduan Misa', category: 'liturgy', dueDate: '10 Sep 2027', offsetDays: -30, priority: 'medium', pic: 'groom', completed: false },
  { id: '7', title: 'Technical Meeting & Gladi Bersih Gereja', category: 'liturgy', dueDate: '05 Okt 2027', offsetDays: -5, priority: 'high', pic: 'both', completed: false },
  { id: '8', title: 'Sakramen Tobat / Rekonsiliasi Calon Mempelai', category: 'canonical', dueDate: '08 Okt 2027', offsetDays: -2, priority: 'critical', pic: 'both', completed: false },
  { id: '9', title: 'Finalisasi Porsi Katering Resepsi & Rundown', category: 'vendor', dueDate: '26 Sep 2027', offsetDays: -14, priority: 'high', pic: 'bride', completed: false },
];

const categoryLabels = ['Semua', 'Kanonik & KPP', 'Sipil Disdukcapil', 'Liturgi', 'Vendor'];
const categoryKeys = ['all', 'canonical', 'civil', 'liturgy', 'vendor'];

export default function ChecklistScreen() {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<ChecklistItem[]>(initialTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const activeCategoryKey = categoryKeys[selectedCategoryIndex];
  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = activeCategoryKey === 'all' || t.category === activeCategoryKey;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Checklist Persiapan"
        subtitle={`${completedCount} dari ${tasks.length} langkah pernikahan telah selesai`}
        style={styles.header}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Cari tugas persiapan..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Category Pills */}
      <SegmentedControl
        options={categoryLabels}
        selectedIndex={selectedCategoryIndex}
        onChange={setSelectedCategoryIndex}
      />

      {/* Task List Cards */}
      {filteredTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Tidak ada tugas dalam kategori ini.</Text>
        </Card>
      ) : (
        filteredTasks.map((t) => (
          <Card
            key={t.id}
            variant="default"
            style={[styles.taskCard, t.completed && styles.taskCardCompleted]}
            onPress={() => toggleTask(t.id)}
          >
            <View style={styles.cardHeaderRow}>
              {/* Checkbox Indicator */}
              <View
                style={[styles.checkbox, t.completed && styles.checkboxChecked]}
              >
                {t.completed ? <Text style={styles.checkIcon}>✓</Text> : null}
              </View>

              <View style={styles.taskTextContainer}>
                <Text
                  style={[
                    styles.taskTitle,
                    t.completed && styles.taskTitleCompleted,
                  ]}
                >
                  {t.title}
                </Text>
                <Text style={styles.taskDueInfo}>
                  Jatuh tempo: {t.dueDate} (H{t.offsetDays})
                </Text>
              </View>

              <Badge
                label={t.priority.toUpperCase()}
                variant={
                  t.priority === 'critical'
                    ? 'danger'
                    : t.priority === 'high'
                    ? 'warning'
                    : 'neutral'
                }
              />
            </View>

            <View style={styles.cardFooterRow}>
              <View style={styles.picContainer}>
                <Text style={styles.picLabel}>PIC:</Text>
                <Badge
                  label={
                    t.pic === 'groom'
                      ? '🤵 Octa'
                      : t.pic === 'bride'
                      ? '👰 Jenesia'
                      : '👫 Berdua'
                  }
                  variant="accent"
                  size="sm"
                />
              </View>
              <Text style={styles.statusIndicator}>
                {t.completed ? '✅ Selesai' : '⏳ Belum Selesai'}
              </Text>
            </View>
          </Card>
        ))
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
  searchContainer: {
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusPill,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    height: 42,
    fontSize: 13,
    color: colors.textPrimary,
  },
  taskCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: colors.neutral,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkIcon: {
    color: colors.textLight,
    fontWeight: '800',
    fontSize: 12,
  },
  taskTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskDueInfo: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  picContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  picLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusIndicator: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
