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
import {
  useWeddingStore,
  ChecklistItem,
  TaskCategory,
  TaskPriority,
  TaskPic,
} from '../../src/stores/useWeddingStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const weddingDateIso = useWeddingStore((s) => s.profile.weddingDate);
  const tasks = useWeddingStore((s) => s.tasks);
  const toggleTaskStore = useWeddingStore((s) => s.toggleTask);
  const addTaskStore = useWeddingStore((s) => s.addTask);
  const updateTaskStore = useWeddingStore((s) => s.updateTask);
  const deleteTaskStore = useWeddingStore((s) => s.deleteTask);

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
    const baseDate = new Date(weddingDateIso);
    const defaultDate = !isNaN(baseDate.getTime()) ? format(subDays(baseDate, 30), 'dd MMM yyyy') : '10 Sep 2027';
    setFormDueDate(defaultDate);
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
    const baseDate = new Date(weddingDateIso);
    const safeDate = !isNaN(baseDate.getTime()) ? baseDate : new Date('2027-10-10T00:00:00.000Z');
    const targetDate = subDays(safeDate, Math.abs(offset));
    setFormOffsetDays(offset);
    setFormDueDate(format(targetDate, 'dd MMM yyyy'));
  };

  const toggleTask = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTaskStore(id);
  };

  const handleSaveTask = () => {
    const trimmed = formTitle.trim();
    if (!trimmed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingTaskId) {
      updateTaskStore(editingTaskId, {
        title: trimmed,
        category: formCategory,
        priority: formPriority,
        pic: formPic,
        dueDate: formDueDate.trim() || 'Segera',
        offsetDays: formOffsetDays,
      });
    } else {
      addTaskStore({
        title: trimmed,
        category: formCategory,
        dueDate: formDueDate.trim() || 'Segera',
        offsetDays: formOffsetDays,
        priority: formPriority,
        pic: formPic,
        completed: false,
      });
    }

    setModalVisible(false);
  };

  const handleDeleteTask = () => {
    if (!editingTaskId) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    deleteTaskStore(editingTaskId);
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

        {/* Helper Cue */}
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
          <Text style={styles.hintText}>Ketuk baris untuk centang • Tekan lama untuk edit / hapus</Text>
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
                onLongPress={() => openEditModal(t)}
                delayLongPress={300}
                style={[
                  styles.taskRow,
                  index === filteredTasks.length - 1 && styles.taskRowLast,
                ]}
              >
                {/* Visual Checkbox */}
                <View style={[styles.checkbox, t.completed && styles.checkboxChecked]}>
                  {t.completed ? (
                    <Ionicons name="checkmark" size={14} color={colors.textLight} />
                  ) : null}
                </View>

                {/* Task Details */}
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

                {/* Priority Badge */}
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
                </View>
              </TouchableOpacity>
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
    marginBottom: spacing.xs,
    gap: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
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
