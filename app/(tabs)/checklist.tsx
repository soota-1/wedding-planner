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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subDays, format, differenceInCalendarDays } from 'date-fns';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { FilterChipBar } from '../../src/components/common/FilterChipBar';
import { FadeInView } from '../../src/components/common/FadeInView';
import { CalendarPicker } from '../../src/components/common/CalendarPicker';
import {
  useWeddingStore,
  ChecklistItem,
  TaskCategoryItem,
  TaskPriority,
  TaskPic,
} from '../../src/stores/useWeddingStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const priorityOptions: { key: TaskPriority; label: string }[] = [
  { key: 'critical', label: 'Kritis' },
  { key: 'high', label: 'Penting' },
  { key: 'medium', label: 'Normal' },
  { key: 'low', label: 'Rendah' },
];

const picOptions: { key: TaskPic; label: string }[] = [
  { key: 'both', label: 'Berdua' },
  { key: 'groom', label: 'Octa' },
  { key: 'bride', label: 'Jenesia' },
];

function formatOffsetLabel(offsetDays: number): string {
  if (offsetDays === 0) return 'Hari H';
  return offsetDays < 0 ? `H${offsetDays}` : `H+${offsetDays}`;
}

export default function ChecklistScreen() {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const weddingDateIso = useWeddingStore((s) => s.profile.weddingDate);
  const taskCategories = useWeddingStore((s) => s.taskCategories);
  const tasks = useWeddingStore((s) => s.tasks);

  const addTaskCategory = useWeddingStore((s) => s.addTaskCategory);
  const updateTaskCategory = useWeddingStore((s) => s.updateTaskCategory);
  const deleteTaskCategory = useWeddingStore((s) => s.deleteTaskCategory);

  const toggleTaskStore = useWeddingStore((s) => s.toggleTask);
  const addTaskStore = useWeddingStore((s) => s.addTask);
  const updateTaskStore = useWeddingStore((s) => s.updateTask);
  const deleteTaskStore = useWeddingStore((s) => s.deleteTask);

  const parsedWedding = new Date(weddingDateIso);
  const safeWeddingDate = isNaN(parsedWedding.getTime())
    ? new Date('2027-10-10T00:00:00.000Z')
    : parsedWedding;

  // Task Modal Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<string>(taskCategories[0]?.key || 'canonical');
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formPic, setFormPic] = useState<TaskPic>('both');
  const [formSelectedDate, setFormSelectedDate] = useState<Date>(subDays(safeWeddingDate, 30));
  const [formDueDate, setFormDueDate] = useState(format(subDays(safeWeddingDate, 30), 'dd MMM yyyy'));
  const [formOffsetDays, setFormOffsetDays] = useState(-30);
  const [showCalendar, setShowCalendar] = useState(false);

  // Quick inline category add inside task modal
  const [inlineNewCat, setInlineNewCat] = useState('');
  const [showInlineCatInput, setShowInlineCatInput] = useState(false);

  // Category Management Modal State
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catInputName, setCatInputName] = useState('');

  const categoryLabels = ['Semua', ...taskCategories.map((c) => c.label)];
  const categoryKeys = ['all', ...taskCategories.map((c) => c.key)];

  const openAddModal = () => {
    const activeCatKey = categoryKeys[selectedCategoryIndex];
    const defaultCat =
      activeCatKey && activeCatKey !== 'all'
        ? activeCatKey
        : taskCategories[0]?.key || 'canonical';
    const defaultDate = subDays(safeWeddingDate, 30);

    setEditingTaskId(null);
    setFormCategory(defaultCat);
    setFormTitle('');
    setFormPriority('medium');
    setFormPic('both');
    setFormSelectedDate(defaultDate);
    setFormDueDate(format(defaultDate, 'dd MMM yyyy'));
    setFormOffsetDays(differenceInCalendarDays(defaultDate, safeWeddingDate));
    setShowCalendar(false);
    setShowInlineCatInput(false);
    setInlineNewCat('');
    setModalVisible(true);
  };

  const openEditModal = (item: ChecklistItem) => {
    const derivedDate = subDays(safeWeddingDate, Math.abs(item.offsetDays));
    setEditingTaskId(item.id);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormPriority(item.priority);
    setFormPic(item.pic);
    setFormSelectedDate(derivedDate);
    setFormDueDate(item.dueDate);
    setFormOffsetDays(item.offsetDays);
    setShowCalendar(false);
    setShowInlineCatInput(false);
    setInlineNewCat('');
    setModalVisible(true);
  };

  const handleDatePicked = (date: Date, offsetDays: number, formattedLabel: string) => {
    setFormSelectedDate(date);
    setFormOffsetDays(offsetDays);
    setFormDueDate(formattedLabel);
  };

  const handleInlineAddCategory = () => {
    const trimmed = inlineNewCat.trim();
    if (!trimmed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const created = addTaskCategory(trimmed);
    setFormCategory(created.key);
    setInlineNewCat('');
    setShowInlineCatInput(false);
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
        dueDate: formDueDate,
        offsetDays: formOffsetDays,
      });
    } else {
      addTaskStore({
        title: trimmed,
        category: formCategory,
        dueDate: formDueDate,
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

  // Category CRUD Handlers
  const openCategoryManager = () => {
    setEditingCatId(null);
    setCatInputName('');
    setCatModalVisible(true);
  };

  const handleSaveCategory = () => {
    const trimmed = catInputName.trim();
    if (!trimmed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (editingCatId) {
      updateTaskCategory(editingCatId, trimmed);
      setEditingCatId(null);
    } else {
      addTaskCategory(trimmed);
    }
    setCatInputName('');
  };

  const startEditCategory = (cat: TaskCategoryItem) => {
    setEditingCatId(cat.id);
    setCatInputName(cat.label);
  };

  const handleDeleteCategory = (id: string) => {
    if (taskCategories.length <= 1) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    deleteTaskCategory(id);
    setSelectedCategoryIndex(0);
    if (editingCatId === id) {
      setEditingCatId(null);
      setCatInputName('');
    }
  };

  const safeCategoryIndex =
    selectedCategoryIndex < categoryKeys.length ? selectedCategoryIndex : 0;
  const activeCategoryKey = categoryKeys[safeCategoryIndex];
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

        {/* Visual Progress Hero Card */}
        <FadeInView delay={20}>
          <Card variant="elevated" style={styles.progressHeroCard}>
            <View style={styles.progressHeroRow}>
              <Image
                source={require('../../assets/images/onboarding-1.jpg')}
                style={styles.heroThumb}
                resizeMode="cover"
              />
              <View style={styles.progressHeroInfo}>
                <View style={styles.progressHeroTop}>
                  <Text style={styles.progressHeroTitle}>Kesiapan Langkah</Text>
                  <Text style={styles.progressHeroPercent}>{progressRatio}%</Text>
                </View>
                <ProgressBar progress={progressRatio} height={7} style={{ marginVertical: 8 }} />
                <Text style={styles.progressHeroSub}>
                  {completedCount} dari {tasks.length} langkah selesai
                </Text>
              </View>
            </View>
          </Card>
        </FadeInView>

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

        {/* Helper Cue + Kelola Kategori */}
        <View style={styles.hintRowBetween}>
          <View style={styles.hintLeft}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
            <Text style={styles.hintText}>Ketuk centang • Tekan lama edit/hapus</Text>
          </View>
          <TouchableOpacity
            onPress={openCategoryManager}
            activeOpacity={0.75}
            style={styles.manageCatBtn}
          >
            <Ionicons name="folder-outline" size={13} color={colors.accent} />
            <Text style={styles.manageCatText}>Kelola Kategori</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Dynamic Category Pills */}
        <FilterChipBar
          options={categoryLabels}
          selectedIndex={safeCategoryIndex}
          onChange={setSelectedCategoryIndex}
        />

        {/* Individual Task Cards */}
        {filteredTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-done-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>Tidak ada tugas dalam kategori ini.</Text>
          </Card>
        ) : (
          <View style={styles.cardStack}>
            {filteredTasks.map((t, index) => {
              const catLabel =
                taskCategories.find((c) => c.key === t.category)?.label || t.category;
              return (
                <FadeInView key={t.id} delay={Math.min(index * 40, 220)}>
                  <Card style={[styles.taskCard, t.completed && styles.taskCardCompleted]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleTask(t.id)}
                      onLongPress={() => openEditModal(t)}
                      delayLongPress={300}
                      style={styles.taskCardInner}
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
                        <View style={styles.taskMetaRow}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                          <Text style={styles.taskMeta} numberOfLines={1}>
                            {t.dueDate} ({formatOffsetLabel(t.offsetDays)}) • {catLabel} •{' '}
                            {t.pic === 'groom' ? 'Octa' : t.pic === 'bride' ? 'Jenesia' : 'Berdua'}
                          </Text>
                        </View>
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
                      </View>
                    </TouchableOpacity>
                  </Card>
                </FadeInView>
              );
            })}
          </View>
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
              {/* STEP 1: Pilih Kategori Terlebih Dahulu */}
              <View style={styles.labelRowBetween}>
                <Text style={styles.fieldLabel}>1. Pilih Kategori Tugas</Text>
                <TouchableOpacity
                  onPress={() => setShowInlineCatInput((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inlineAddLink}>
                    {showInlineCatInput ? 'Tutup' : '+ Kategori Baru'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showInlineCatInput ? (
                <View style={styles.inlineCatRow}>
                  <TextInput
                    placeholder="Nama kategori baru..."
                    placeholderTextColor={colors.textMuted}
                    value={inlineNewCat}
                    onChangeText={setInlineNewCat}
                    style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  />
                  <TouchableOpacity
                    onPress={handleInlineAddCategory}
                    style={styles.inlineCatSaveBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inlineCatSaveText}>Tambah</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View style={styles.pillRow}>
                {taskCategories.map((cat) => {
                  const active = formCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setFormCategory(cat.key)}
                      style={[styles.selectPill, active && styles.selectPillActive]}
                    >
                      <Text style={[styles.selectPillText, active && styles.selectPillTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* STEP 2: Input Judul */}
              <Text style={styles.fieldLabel}>2. Nama Tugas</Text>
              <TextInput
                placeholder="Misal: Fitting jas pengantin Octa"
                placeholderTextColor={colors.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
                style={styles.modalInput}
                autoFocus={!editingTaskId}
              />

              {/* STEP 3: Tanggal Jatuh Tempo (Calendar Picker, auto H-) */}
              <Text style={styles.fieldLabel}>3. Tanggal Jatuh Tempo (Otomatis Hitung H-)</Text>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowCalendar((v) => !v);
                }}
                activeOpacity={0.75}
                style={styles.datePickerTrigger}
              >
                <View style={styles.dateTriggerLeft}>
                  <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                  <Text style={styles.dateTriggerText}>{formDueDate}</Text>
                </View>
                <View style={styles.dateTriggerRight}>
                  <Badge label={formatOffsetLabel(formOffsetDays)} variant="accent" />
                  <Ionicons
                    name={showCalendar ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>

              {showCalendar ? (
                <CalendarPicker
                  selectedDate={formSelectedDate}
                  weddingDate={safeWeddingDate}
                  onSelectDate={handleDatePicked}
                />
              ) : null}

              {/* STEP 4: Prioritas */}
              <Text style={styles.fieldLabel}>4. Tingkat Prioritas</Text>
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
                        active &&
                          opt.key === 'critical' && {
                            backgroundColor: colors.danger,
                            borderColor: colors.danger,
                          },
                        active &&
                          opt.key === 'high' && {
                            backgroundColor: colors.warning,
                            borderColor: colors.warning,
                          },
                      ]}
                    >
                      <Text style={[styles.selectPillText, active && styles.selectPillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* STEP 5: Penanggung Jawab (PIC) */}
              <Text style={styles.fieldLabel}>5. Penanggung Jawab (PIC)</Text>
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

      {/* Modal Kelola Kategori (Add, Edit, Delete Categories) */}
      <Modal
        visible={catModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCatModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kelola Kategori Checklist</Text>
              <TouchableOpacity
                onPress={() => setCatModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inlineCatRow}>
              <TextInput
                placeholder={editingCatId ? 'Ubah nama kategori...' : 'Tambah kategori baru...'}
                placeholderTextColor={colors.textMuted}
                value={catInputName}
                onChangeText={setCatInputName}
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity
                onPress={handleSaveCategory}
                style={styles.inlineCatSaveBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineCatSaveText}>
                  {editingCatId ? 'Simpan' : 'Tambah'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280, marginTop: 12 }}>
              {taskCategories.map((cat) => (
                <View key={cat.id} style={styles.catManageRow}>
                  <Text style={styles.catManageLabel}>{cat.label}</Text>
                  <View style={styles.catManageActions}>
                    <TouchableOpacity
                      onPress={() => startEditCategory(cat)}
                      style={styles.catIconBtn}
                    >
                      <Ionicons name="create-outline" size={17} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {taskCategories.length > 1 ? (
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(cat.id)}
                        style={styles.catIconBtn}
                      >
                        <Ionicons name="trash-outline" size={17} color={colors.danger} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))}
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
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  progressHeroCard: {
    padding: 14,
    marginBottom: spacing.md,
  },
  progressHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroThumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeroInfo: {
    flex: 1,
  },
  progressHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressHeroTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressHeroPercent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  progressHeroSub: {
    fontSize: 11,
    color: colors.textSecondary,
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
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: colors.textPrimary,
  },
  hintRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  hintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  manageCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.accentLight,
  },
  manageCatText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  cardStack: {
    gap: 10,
  },
  taskCard: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 0,
  },
  taskCardCompleted: {
    opacity: 0.72,
  },
  taskCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
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
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  taskMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  taskBadgeCol: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 19, 24, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  labelRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inlineAddLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  inlineCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inlineCatSaveBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineCatSaveText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  modalInput: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  dateTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dateTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  selectPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  selectPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectPillTextActive: {
    color: colors.textLight,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  modalDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  modalSaveBtn: {
    backgroundColor: colors.accent,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  catManageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catManageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  catManageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  catIconBtn: {
    padding: 4,
  },
});
