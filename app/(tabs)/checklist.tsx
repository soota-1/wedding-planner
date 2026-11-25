import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
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
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { FilterChipBar } from '../../src/components/common/FilterChipBar';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ChecklistItem {
  id: string;
  title: string;
  category: 'canonical' | 'civil' | 'liturgy' | 'vendor';
  dueDate: string;
  offsetDays: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  pic: 'groom' | 'bride' | 'both';
  completed: boolean;
}

const initialTasks: ChecklistItem[] = [
  { id: '1', title: 'Kursus Persiapan Perkawinan (KPP)', category: 'canonical', dueDate: '13 Apr 2027', offsetDays: -180, priority: 'critical', pic: 'both', completed: true },
  { id: '2', title: 'Pengurusan Surat Baptis Terbaru', category: 'canonical', dueDate: '13 Mei 2027', offsetDays: -150, priority: 'high', pic: 'both', completed: false },
  { id: '3', title: 'Penyelidikan Kanonik Pastor Paroki', category: 'canonical', dueDate: '12 Jul 2027', offsetDays: -90, priority: 'critical', pic: 'both', completed: false },
  { id: '4', title: 'Berkas Disdukcapil & Formulir N1-N4', category: 'civil', dueDate: '11 Agu 2027', offsetDays: -60, priority: 'high', pic: 'both', completed: false },
  { id: '5', title: 'Penentuan Saksi Nikah Resmi Gereja', category: 'canonical', dueDate: '11 Agu 2027', offsetDays: -60, priority: 'medium', pic: 'both', completed: false },
  { id: '6', title: 'Teks Liturgi & Buku Panduan Misa', category: 'liturgy', dueDate: '10 Sep 2027', offsetDays: -30, priority: 'medium', pic: 'groom', completed: false },
  { id: '7', title: 'Finalisasi Porsi Katering & Rundown', category: 'vendor', dueDate: '26 Sep 2027', offsetDays: -14, priority: 'high', pic: 'bride', completed: false },
  { id: '8', title: 'Gladi Bersih Liturgi Gereja', category: 'liturgy', dueDate: '05 Okt 2027', offsetDays: -5, priority: 'high', pic: 'both', completed: false },
  { id: '9', title: 'Sakramen Tobat Calon Mempelai', category: 'canonical', dueDate: '08 Okt 2027', offsetDays: -2, priority: 'critical', pic: 'both', completed: false },
];

const categoryLabels = ['Semua', 'Kanonik & KPP', 'Sipil', 'Liturgi', 'Vendor'];
const categoryKeys = ['all', 'canonical', 'civil', 'liturgy', 'vendor'];

export default function ChecklistScreen() {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<ChecklistItem[]>(initialTasks);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleTask = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const created: ChecklistItem = {
      id: Date.now().toString(),
      title: trimmed,
      category: 'canonical',
      dueDate: 'Segera',
      offsetDays: -30,
      priority: 'medium',
      pic: 'both',
      completed: false,
    };
    setTasks((prev) => [created, ...prev]);
    setNewTaskTitle('');
    setModalVisible(false);
  };

  const activeCategoryKey = categoryKeys[selectedCategoryIndex];
  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = activeCategoryKey === 'all' || t.category === activeCategoryKey;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressRatio = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          kicker="Persiapan Nikah"
          title="Checklist"
          subtitle={`${completedCount} dari ${tasks.length} langkah selesai`}
          rightElement={
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
              style={styles.addButton}
            >
              <Ionicons name="add" size={18} color={colors.textLight} />
              <Text style={styles.addButtonText}>Tugas</Text>
            </TouchableOpacity>
          }
        />

        {/* Live Progress */}
        <View style={styles.progressWrapper}>
          <ProgressBar progress={progressRatio} height={6} />
        </View>

        {/* Minimalist Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            placeholder="Cari tugas kanonik, sipil, atau vendor..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Scrollable Category Pills */}
        <FilterChipBar
          options={categoryLabels}
          selectedIndex={selectedCategoryIndex}
          onChange={setSelectedCategoryIndex}
        />

        {/* Clean Single List Card */}
        {filteredTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-done-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>Tidak ada tugas dalam kategori ini.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {filteredTasks.map((t, index) => (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.7}
                onPress={() => toggleTask(t.id)}
                style={[
                  styles.taskRow,
                  index === filteredTasks.length - 1 && styles.taskRowLast,
                ]}
              >
                <View style={[styles.checkbox, t.completed && styles.checkboxChecked]}>
                  {t.completed ? (
                    <Ionicons name="checkmark" size={14} color={colors.textLight} />
                  ) : null}
                </View>

                <View style={styles.taskBody}>
                  <Text
                    style={[styles.taskTitle, t.completed && styles.taskTitleCompleted]}
                    numberOfLines={2}
                  >
                    {t.title}
                  </Text>
                  <Text style={styles.taskMeta} numberOfLines={1}>
                    {t.dueDate} • H{t.offsetDays} •{' '}
                    {t.pic === 'groom' ? 'Octa' : t.pic === 'bride' ? 'Jenesia' : 'Berdua'}
                  </Text>
                </View>

                <View style={styles.taskBadgeCol}>
                  {t.priority === 'critical' ? (
                    <Badge label="Kritis" variant="danger" />
                  ) : t.priority === 'high' ? (
                    <Badge label="Penting" variant="warning" />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Bottom-Sheet Modal Tambah Tugas */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Tugas Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Misal: Fitting jas pengantin Octa"
              placeholderTextColor={colors.textMuted}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              style={styles.modalInput}
              autoFocus
            />
            <TouchableOpacity
              onPress={handleAddTask}
              activeOpacity={0.85}
              style={styles.modalSaveBtn}
            >
              <Text style={styles.modalSaveText}>Simpan ke Checklist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusPill,
    gap: 4,
  },
  addButtonText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  progressWrapper: {
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: colors.textPrimary,
  },
  listCard: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taskRowLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  taskBody: {
    flex: 1,
    paddingRight: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 19,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  taskBadgeCol: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 19, 24, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalSaveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
});
