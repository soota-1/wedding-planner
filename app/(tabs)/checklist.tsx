import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subDays, format } from 'date-fns';
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

type TaskCategory = 'canonical' | 'civil' | 'liturgy' | 'vendor';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
type TaskPic = 'groom' | 'bride' | 'both';

interface ChecklistItem {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  offsetDays: number;
  priority: TaskPriority;
  pic: TaskPic;
  completed: boolean;
}

const WEDDING_DATE = new Date('2027-10-10T00:00:00.000Z');

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

const priorityOptions: { key: TaskPriority; label: string }[] = [
  { key: 'critical', label: 'Kritis' },
  { key: 'high', label: 'Penting' },
  { key: 'medium', label: 'Normal' },
  { key: 'low', label: 'Rendah' },
];

const formCategoryOptions: { key: TaskCategory; label: string }[] = [
  { key: 'canonical', label: 'Kanonik' },
  { key: 'civil', label: 'Sipil' },
  { key: 'liturgy', label: 'Liturgi' },
  { key: 'vendor', label: 'Vendor' },
];

const picOptions: { key: TaskPic; label: string }[] = [
  { key: 'both', label: 'Berdua' },
  { key: 'groom', label: 'Octa' },
  { key: 'bride', label: 'Jenesia' },
];

const datePresets = [
  { label: 'H-180', offset: -180 },
  { label: 'H-90', offset: -90 },
  { label: 'H-30', offset: -30 },
  { label: 'H-7', offset: -7 },
];

export default function ChecklistScreen() {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<ChecklistItem[]>(initialTasks);

  // Modal Form State (supports both Add and Edit)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TaskCategory>('canonical');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formPic, setFormPic] = useState<TaskPic>('both');
  const [formDueDate, setFormDueDate] = useState('10 Sep 2027');
  const [formOffsetDays, setFormOffsetDays] = useState(-30);

  const openAddModal = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormCategory('canonical');
    setFormPriority('medium');
    setFormPic('both');
    setFormDueDate('10 Sep 2027');
    setFormOffsetDays(-30);
    setModalVisible(true);
  };

  const openEditModal = (item: ChecklistItem) => {
    setEditingTaskId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormPriority(item.priority);
    setFormPic(item.pic);
    setFormDueDate(item.dueDate);
    setFormOffsetDays(item.offsetDays);
    setModalVisible(true);
  };

  const applyDatePreset = (offset: number) => {
    const targetDate = subDays(WEDDING_DATE, Math.abs(offset));
    setFormOffsetDays(offset);
    setFormDueDate(format(targetDate, 'dd MMM yyyy'));
  };

  const toggleTask = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleSaveTask = () => {
    const trimmed = formTitle.trim();
    if (!trimmed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                title: trimmed,
                category: formCategory,
                priority: formPriority,
                pic: formPic,
                dueDate: formDueDate.trim() || t.dueDate,
                offsetDays: formOffsetDays,
              }
            : t
        )
      );
    } else {
      const created: ChecklistItem = {
        id: Date.now().toString(),
        title: trimmed,
        category: formCategory,
        dueDate: formDueDate.trim() || 'Segera',
        offsetDays: formOffsetDays,
        priority: formPriority,
        pic: formPic,
        completed: false,
      };
      setTasks((prev) => [created, ...prev]);
    }

    setModalVisible(false);
  };

  const handleDeleteTask = () => {
    if (!editingTaskId) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks((prev) => prev.filter((t) => t.id !== editingTaskId));
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
              onPress={openAddModal}
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
              <View
                key={t.id}
                style={[
                  styles.taskRow,
                  index === filteredTasks.length - 1 && styles.taskRowLast,
                ]}
              >
                {/* Checkbox Area (Toggle Complete) */}
                <TouchableOpacity
                  onPress={() => toggleTask(t.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.checkbox, t.completed && styles.checkboxChecked]}
                >
                  {t.completed ? (
                    <Ionicons name="checkmark" size={14} color={colors.textLight} />
                  ) : null}
                </TouchableOpacity>

                {/* Task Body Area (Tap to Edit / Delete) */}
                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={() => openEditModal(t)}
                  style={styles.taskInteractiveBody}
                >
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
                    ) : t.priority === 'medium' ? (
                      <Badge label="Normal" variant="neutral" />
                    ) : (
                      <Badge label="Rendah" variant="info" />
                    )}
                    <Ionicons name="create-outline" size={15} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Keyboard-Safe Bottom-Sheet Modal for Create & Edit Task */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTaskId ? 'Edit Tugas' : 'Tambah Tugas Baru'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Input Judul */}
              <Text style={styles.fieldLabel}>Nama Tugas</Text>
              <TextInput
                placeholder="Misal: Fitting jas pengantin Octa"
                placeholderTextColor={colors.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
                style={styles.modalInput}
                autoFocus={!editingTaskId}
              />

              {/* Prioritas Dropdown / Selector Chips */}
              <Text style={styles.fieldLabel}>Tingkat Prioritas</Text>
              <View style={styles.pillRow}>
                {priorityOptions.map((opt) => {
                  const active = formPriority === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setFormPriority(opt.key)}
                      style={[
                        styles.selectPill,
                        active && styles.selectPillActive,
                        active && opt.key === 'critical' && { backgroundColor: colors.danger, borderColor: colors.danger },
                        active && opt.key === 'high' && { backgroundColor: colors.warning, borderColor: colors.warning },
                      ]}
                    >
                      <Text style={[styles.selectPillText, active && styles.selectPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tanggal Jatuh Tempo + Quick Presets */}
              <Text style={styles.fieldLabel}>Tanggal Jatuh Tempo</Text>
              <TextInput
                placeholder="Misal: 15 Mei 2027"
                placeholderTextColor={colors.textMuted}
                value={formDueDate}
                onChangeText={setFormDueDate}
                style={styles.modalInput}
              />
              <View style={[styles.pillRow, { marginTop: -8, marginBottom: 14 }]}>
                {datePresets.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    onPress={() => applyDatePreset(p.offset)}
                    style={[
                      styles.presetChip,
                      formOffsetDays === p.offset && styles.presetChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        formOffsetDays === p.offset && styles.presetChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Kategori */}
              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.pillRow}>
                {formCategoryOptions.map((opt) => {
                  const active = formCategory === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setFormCategory(opt.key)}
                      style={[styles.selectPill, active && styles.selectPillActive]}
                    >
                      <Text style={[styles.selectPillText, active && styles.selectPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Penanggung Jawab (PIC) */}
              <Text style={styles.fieldLabel}>Penanggung Jawab (PIC)</Text>
              <View style={styles.pillRow}>
                {picOptions.map((opt) => {
                  const active = formPic === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setFormPic(opt.key)}
                      style={[styles.selectPill, active && styles.selectPillActive]}
                    >
                      <Text style={[styles.selectPillText, active && styles.selectPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {editingTaskId ? (
                  <TouchableOpacity
                    onPress={handleDeleteTask}
                    activeOpacity={0.8}
                    style={styles.modalDeleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    <Text style={styles.modalDeleteText}>Hapus</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={handleSaveTask}
                  activeOpacity={0.85}
                  style={[styles.modalSaveBtn, { flex: 1 }]}
                >
                  <Text style={styles.modalSaveText}>
                    {editingTaskId ? 'Simpan Perubahan' : 'Simpan Tugas'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  taskInteractiveBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusPill,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.cardBg,
  },
  selectPillActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectPillTextActive: {
    color: colors.textLight,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  presetChipActive: {
    backgroundColor: colors.accentLight,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: colors.accentDark,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  modalDeleteText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  modalSaveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
});
