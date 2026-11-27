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

const availableCategoryIcons: { name: string; label: string }[] = [
  { name: 'ribbon-outline', label: 'Pita' },
  { name: 'document-text-outline', label: 'Dokumen' },
  { name: 'musical-notes-outline', label: 'Musik' },
  { name: 'storefront-outline', label: 'Vendor' },
  { name: 'heart-outline', label: 'Cinta' },
  { name: 'sparkles-outline', label: 'MUA/Rias' },
  { name: 'camera-outline', label: 'Foto' },
  { name: 'restaurant-outline', label: 'Katering' },
  { name: 'gift-outline', label: 'Hadiah' },
  { name: 'car-sport-outline', label: 'Mobil' },
  { name: 'flower-outline', label: 'Dekorasi' },
  { name: 'bookmark-outline', label: 'Lainnya' },
];

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
  const [modalStep, setModalStep] = useState<'category' | 'form'>('category');
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
  const [inlineCatIcon, setInlineCatIcon] = useState<string>('ribbon-outline');
  const [showInlineCatInput, setShowInlineCatInput] = useState(false);

  // Category Management Modal State
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catInputName, setCatInputName] = useState('');
  const [catInputIcon, setCatInputIcon] = useState<string>('ribbon-outline');

  // Confirmation Toggle Modal State
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [taskToToggle, setTaskToToggle] = useState<ChecklistItem | null>(null);

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
    setModalStep('category');
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
    setInlineCatIcon('ribbon-outline');
    setModalVisible(true);
  };

  const openEditModal = (item: ChecklistItem) => {
    const derivedDate = subDays(safeWeddingDate, Math.abs(item.offsetDays));
    setEditingTaskId(item.id);
    setModalStep('form');
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
    const created = addTaskCategory(trimmed, inlineCatIcon);
    setFormCategory(created.key);
    setInlineNewCat('');
    setInlineCatIcon('ribbon-outline');
    setShowInlineCatInput(false);
  };

  const requestToggleTask = (task: ChecklistItem) => {
    setTaskToToggle(task);
    setConfirmModalVisible(true);
  };

  const confirmToggleTask = () => {
    if (!taskToToggle) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTaskStore(taskToToggle.id);
    setConfirmModalVisible(false);
    setTaskToToggle(null);
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
    setCatInputIcon('ribbon-outline');
    setCatModalVisible(true);
  };

  const handleSaveCategory = () => {
    const trimmed = catInputName.trim();
    if (!trimmed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (editingCatId) {
      updateTaskCategory(editingCatId, trimmed, catInputIcon);
      setEditingCatId(null);
    } else {
      addTaskCategory(trimmed, catInputIcon);
    }
    setCatInputName('');
    setCatInputIcon('ribbon-outline');
  };

  const startEditCategory = (cat: TaskCategoryItem) => {
    setEditingCatId(cat.id);
    setCatInputName(cat.label);
    setCatInputIcon(cat.icon || 'ribbon-outline');
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
    const activeCat = taskCategories[safeCategoryIndex - 1]; // because index 0 is 'all'
    const matchesCategory =
      activeCategoryKey === 'all' ||
      t.category === activeCategoryKey ||
      (activeCat && (t.category === activeCat.id || t.category === activeCat.key));
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

        <View
          style={styles.progressSummary}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Progres checklist"
          accessibilityValue={{ min: 0, max: 100, now: progressRatio }}
        >
          <View style={styles.progressTrack}>
            <ProgressBar progress={progressRatio} height={5} />
          </View>
          <Text style={styles.progressPercent}>{progressRatio}%</Text>
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
                      onPress={() => requestToggleTask(t)}
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
              <View style={styles.modalTitleRow}>
                {modalStep === 'form' && !editingTaskId ? (
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setModalStep('category');
                    }}
                    style={styles.stepBackBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.modalTitle}>
                  {editingTaskId
                    ? 'Edit Tugas'
                    : modalStep === 'category'
                    ? 'Pilih Kategori Tugas'
                    : 'Detail Tugas Baru'}
                </Text>
              </View>
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
              {modalStep === 'category' ? (
                /* STEP 1 POPUP: Grid Card Pilihan Kategori */
                <View>
                  <Text style={styles.catStepSubtitle}>
                    Pilih kategori terlebih dahulu sebelum mengisi tugas baru:
                  </Text>

                  <View style={styles.catGrid}>
                    {taskCategories.map((cat) => {
                      const count = tasks.filter((t) => t.category === cat.key || t.category === cat.id).length;
                      const iconName =
                        cat.icon ||
                        (cat.key === 'canonical'
                          ? 'ribbon-outline'
                          : cat.key === 'civil'
                          ? 'document-text-outline'
                          : cat.key === 'liturgy'
                          ? 'musical-notes-outline'
                          : cat.key === 'vendor'
                          ? 'storefront-outline'
                          : 'bookmark-outline');

                      return (
                        <TouchableOpacity
                          key={cat.id}
                          activeOpacity={0.75}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setFormCategory(cat.key);
                            setModalStep('form');
                          }}
                          style={styles.catPickCard}
                        >
                          <View style={styles.catPickIconCircle}>
                            <Ionicons name={iconName as any} size={20} color={colors.accent} />
                          </View>
                          <Text style={styles.catPickLabel} numberOfLines={2}>
                            {cat.label}
                          </Text>
                          <Text style={styles.catPickCount}>{count} tugas</Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Add New Category Card */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setShowInlineCatInput((v) => !v);
                      }}
                      style={[styles.catPickCard, styles.catPickAddCard]}
                    >
                      <View style={[styles.catPickIconCircle, { backgroundColor: colors.cardBg }]}>
                        <Ionicons name="add" size={22} color={colors.accent} />
                      </View>
                      <Text style={[styles.catPickLabel, { color: colors.accent }]}>
                        Kategori Baru
                      </Text>
                      <Text style={styles.catPickCount}>Buat custom</Text>
                    </TouchableOpacity>
                  </View>

                  {showInlineCatInput ? (
                    <View style={styles.inlineCatContainer}>
                      <Text style={styles.iconPickerHeader}>Pilih Ikon Kategori:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.iconPickerScroll}
                      >
                        {availableCategoryIcons.map((ic) => {
                          const isSelected = inlineCatIcon === ic.name;
                          return (
                            <TouchableOpacity
                              key={ic.name}
                              onPress={() => setInlineCatIcon(ic.name)}
                              style={[
                                styles.iconChoiceBtn,
                                isSelected && styles.iconChoiceBtnActive,
                              ]}
                            >
                              <Ionicons
                                name={ic.name}
                                size={20}
                                color={isSelected ? colors.textLight : colors.accent}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      <View style={[styles.inlineCatRow, { marginTop: 8 }]}>
                        <TextInput
                          placeholder="Nama kategori baru..."
                          placeholderTextColor={colors.textMuted}
                          value={inlineNewCat}
                          onChangeText={setInlineNewCat}
                          style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            handleInlineAddCategory();
                            setModalStep('form');
                          }}
                          style={styles.inlineCatSaveBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.inlineCatSaveText}>Lanjut</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : (
                /* STEP 2 POPUP: Form Input Tugas */
                <View>
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setModalStep('category');
                    }}
                    activeOpacity={0.75}
                    style={styles.selectedCatBanner}
                  >
                    <View style={styles.selectedCatLeft}>
                      <Ionicons name="folder-open-outline" size={16} color={colors.accent} />
                      <Text style={styles.selectedCatText}>
                        Kategori:{' '}
                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                          {taskCategories.find((c) => c.key === formCategory)?.label || formCategory}
                        </Text>
                      </Text>
                    </View>
                    <Text style={styles.inlineAddLink}>Ganti</Text>
                  </TouchableOpacity>

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

                  {/* Tanggal Jatuh Tempo (Calendar Picker, auto H-) */}
                  <Text style={styles.fieldLabel}>Tanggal Jatuh Tempo (Otomatis Hitung H-)</Text>
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

              {/* Prioritas */}
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
                </View>
              )}
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

            <View style={styles.catInputBlock}>
              <Text style={styles.iconPickerHeader}>Pilih Ikon:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconPickerScroll}
              >
                {availableCategoryIcons.map((ic) => {
                  const isSelected = catInputIcon === ic.name;
                  return (
                    <TouchableOpacity
                      key={ic.name}
                      onPress={() => setCatInputIcon(ic.name)}
                      style={[
                        styles.iconChoiceBtn,
                        isSelected && styles.iconChoiceBtnActive,
                      ]}
                    >
                      <Ionicons
                        name={ic.name}
                        size={20}
                        color={isSelected ? colors.textLight : colors.accent}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={[styles.inlineCatRow, { marginTop: 10 }]}>
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
            </View>

            <ScrollView style={{ maxHeight: 280, marginTop: 14 }}>
              {taskCategories.map((cat) => {
                const iconName = cat.icon || 'bookmark-outline';
                return (
                  <View key={cat.id} style={styles.catManageRow}>
                    <View style={styles.catManageLeft}>
                      <View style={styles.catManageIconCircle}>
                        <Ionicons name={iconName as any} size={16} color={colors.accent} />
                      </View>
                      <Text style={styles.catManageLabel}>{cat.label}</Text>
                    </View>
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
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmation Alert Dialog for Task Toggle */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View
              style={[
                styles.alertIconCircle,
                {
                  backgroundColor: taskToToggle?.completed
                    ? `${colors.warning}18`
                    : `${colors.success}18`,
                },
              ]}
            >
              <Ionicons
                name={taskToToggle?.completed ? 'arrow-undo-outline' : 'checkmark-done-outline'}
                size={28}
                color={taskToToggle?.completed ? colors.warning : colors.success}
              />
            </View>

            <Text style={styles.alertTitle}>
              {taskToToggle?.completed ? 'Ubah Menjadi Belum Selesai?' : 'Tandai Tugas Selesai?'}
            </Text>

            <Text style={styles.alertMessage}>
              {taskToToggle?.completed
                ? `Apakah kamu yakin ingin mengembalikan tugas "${taskToToggle?.title}" menjadi belum selesai?`
                : `Apakah tugas "${taskToToggle?.title}" sudah selesai dilaksanakan?`}
            </Text>

            <View style={styles.alertActions}>
              <TouchableOpacity
                onPress={() => {
                  setConfirmModalVisible(false);
                  setTaskToToggle(null);
                }}
                activeOpacity={0.75}
                style={styles.alertCancelBtn}
              >
                <Text style={styles.alertCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmToggleTask}
                activeOpacity={0.85}
                style={[
                  styles.alertConfirmBtn,
                  {
                    backgroundColor: taskToToggle?.completed ? colors.warning : colors.accent,
                  },
                ]}
              >
                <Text style={styles.alertConfirmText}>
                  {taskToToggle?.completed ? 'Ya, Ubah' : 'Ya, Selesai'}
                </Text>
              </TouchableOpacity>
            </View>
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
  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: colors.accent,
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
    minHeight: 48,
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
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catStepSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  catPickCard: {
    width: '48%',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
  },
  catPickAddCard: {
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  catPickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  catPickLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  catPickCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  selectedCatBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  selectedCatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCatText: {
    fontSize: 13,
    color: colors.textSecondary,
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
  catManageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  catManageIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
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
  inlineCatContainer: {
    marginTop: 12,
    backgroundColor: colors.cardBg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catInputBlock: {
    backgroundColor: colors.cardBg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconPickerHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  iconPickerScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  iconChoiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  alertIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  alertCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  alertConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
});
