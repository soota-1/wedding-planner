import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { FadeInView } from '../../src/components/common/FadeInView';
import { CalendarPicker } from '../../src/components/common/CalendarPicker';
import { NotificationService, formatReminderLeadTime } from '../../src/services/notificationService';
import { exportMoodboardBriefPdf } from '../../src/services/moodboardShareService';
import {
  useWeddingStore,
  CategoryItem,
  VendorItem,
  TransactionItem,
  VendorSchedule,
} from '../../src/stores/useWeddingStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BudgetScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  // Store state & actions
  const categories = useWeddingStore((s) => s.categories);
  const vendors = useWeddingStore((s) => s.vendors);
  const transactions = useWeddingStore((s) => s.transactions);
  const moodboardItems = useWeddingStore((s) => s.moodboardItems);
  const profile = useWeddingStore((s) => s.profile);
  const weddingDateIso = profile.weddingDate;

  const parsedWedding = new Date(weddingDateIso);
  const safeWeddingDate = isNaN(parsedWedding.getTime())
    ? new Date('2027-10-10T00:00:00.000Z')
    : parsedWedding;
  const addCategory = useWeddingStore((s) => s.addCategory);
  const updateCategory = useWeddingStore((s) => s.updateCategory);
  const deleteCategory = useWeddingStore((s) => s.deleteCategory);
  const addVendor = useWeddingStore((s) => s.addVendor);
  const updateVendor = useWeddingStore((s) => s.updateVendor);
  const deleteVendor = useWeddingStore((s) => s.deleteVendor);
  const addTransaction = useWeddingStore((s) => s.addTransaction);
  const updateTransaction = useWeddingStore((s) => s.updateTransaction);
  const deleteTransaction = useWeddingStore((s) => s.deleteTransaction);

  // Modals state
  const [modalType, setModalType] = useState<'category' | 'vendor' | 'transaction' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Category form state
  const [catName, setCatName] = useState('');
  const [catAllocated, setCatAllocated] = useState('');
  const [catCommitted, setCatCommitted] = useState('');

  // Vendor form state
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('');
  const [vendorContract, setVendorContract] = useState('');
  const [vendorStatus, setVendorStatus] = useState<VendorItem['status']>('booked');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorSocialMedia, setVendorSocialMedia] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');

  // Vendor Detail Sheet state
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<VendorItem | null>(null);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleSelectedDate, setNewScheduleSelectedDate] = useState<Date>(() =>
    subDays(safeWeddingDate, 30)
  );
  const [newScheduleDate, setNewScheduleDate] = useState<string>(() =>
    format(subDays(safeWeddingDate, 30), 'dd MMM yyyy')
  );
  const [newScheduleHour, setNewScheduleHour] = useState<number>(14);
  const [newScheduleMinute, setNewScheduleMinute] = useState<number>(0);
  const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);
  const [newScheduleReminderEnabled, setNewScheduleReminderEnabled] = useState(true);
  const [newScheduleReminderMinutes, setNewScheduleReminderMinutes] = useState<number>(60);
  const [showAddScheduleRow, setShowAddScheduleRow] = useState(false);

  // Transaction form state
  const [txNotes, setTxNotes] = useState('');
  const [txVendor, setTxVendor] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txPaidBy, setTxPaidBy] = useState<TransactionItem['paidBy']>('groom');
  const [txStatus, setTxStatus] = useState<TransactionItem['status']>('paid');
  const [txDate, setTxDate] = useState('');

  // Open Add Modals
  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeTab === 0) {
      setCatName('');
      setCatAllocated('');
      setCatCommitted('');
      setModalType('category');
    } else if (activeTab === 1) {
      setVendorName('');
      setVendorCategory('');
      setVendorContract('');
      setVendorStatus('booked');
      setVendorContact('');
      setVendorPhone('');
      setVendorEmail('');
      setVendorSocialMedia('');
      setVendorNotes('');
      setModalType('vendor');
    } else {
      setTxNotes('');
      setTxVendor('');
      setTxAmount('');
      setTxPaidBy('groom');
      setTxStatus('paid');
      setTxDate('Hari ini');
      setModalType('transaction');
    }
  };

  // Open Edit Modals
  const openEditCategory = (item: CategoryItem) => {
    setEditingId(item.id);
    setCatName(item.name);
    setCatAllocated(item.allocated.toString());
    setCatCommitted(item.committed.toString());
    setModalType('category');
  };

  const openEditVendor = (item: VendorItem) => {
    setEditingId(item.id);
    setVendorName(item.name);
    setVendorCategory(item.category);
    setVendorContract(item.contractValue.toString());
    setVendorStatus(item.status);
    setVendorContact(item.contactPerson);
    setVendorPhone(item.phone || '');
    setVendorEmail(item.email || '');
    setVendorSocialMedia(item.socialMedia || '');
    setVendorNotes(item.notes || '');
    setModalType('vendor');
  };

  const openEditTx = (item: TransactionItem) => {
    setEditingId(item.id);
    setTxNotes(item.notes);
    setTxVendor(item.vendorName);
    setTxAmount(item.amount.toString());
    setTxPaidBy(item.paidBy);
    setTxStatus(item.status);
    setTxDate(item.date);
    setModalType('transaction');
  };

  // Save Handlers
  const handleSaveCategory = () => {
    if (!catName.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const alloc = parseInt(catAllocated.replace(/[^0-9]/g, ''), 10) || 0;
    const comm = parseInt(catCommitted.replace(/[^0-9]/g, ''), 10) || 0;

    if (editingId) {
      updateCategory(editingId, { name: catName.trim(), allocated: alloc, committed: comm });
    } else {
      addCategory({ name: catName.trim(), allocated: alloc, committed: comm });
    }
    setModalType(null);
  };

  const handleSaveVendor = () => {
    if (!vendorName.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const contract = parseInt(vendorContract.replace(/[^0-9]/g, ''), 10) || 0;
    const existing = editingId ? vendors.find((v) => v.id === editingId) : null;

    if (editingId) {
      updateVendor(editingId, {
        name: vendorName.trim(),
        category: vendorCategory.trim() || 'Lainnya',
        contractValue: contract,
        status: vendorStatus,
        contactPerson: vendorContact.trim() || 'PIC',
        phone: vendorPhone.trim() || undefined,
        email: vendorEmail.trim() || undefined,
        socialMedia: vendorSocialMedia.trim() || undefined,
        notes: vendorNotes.trim() || undefined,
        schedules: existing?.schedules || undefined,
      });
      if (selectedVendorForDetail && selectedVendorForDetail.id === editingId) {
        setSelectedVendorForDetail((prev) =>
          prev
            ? {
                ...prev,
                name: vendorName.trim(),
                category: vendorCategory.trim() || 'Lainnya',
                contractValue: contract,
                status: vendorStatus,
                contactPerson: vendorContact.trim() || 'PIC',
                phone: vendorPhone.trim() || undefined,
                email: vendorEmail.trim() || undefined,
                socialMedia: vendorSocialMedia.trim() || undefined,
                notes: vendorNotes.trim() || undefined,
              }
            : null
        );
      }
    } else {
      addVendor({
        name: vendorName.trim(),
        category: vendorCategory.trim() || 'Lainnya',
        contractValue: contract,
        status: vendorStatus,
        contactPerson: vendorContact.trim() || 'PIC',
        phone: vendorPhone.trim() || undefined,
        email: vendorEmail.trim() || undefined,
        socialMedia: vendorSocialMedia.trim() || undefined,
        notes: vendorNotes.trim() || undefined,
      });
    }
    setModalType(null);
  };

  const handleSaveTx = () => {
    if (!txNotes.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const amount = parseInt(txAmount.replace(/[^0-9]/g, ''), 10) || 0;

    if (editingId) {
      updateTransaction(editingId, {
        notes: txNotes.trim(),
        vendorName: txVendor.trim() || 'Vendor',
        amount,
        paidBy: txPaidBy,
        status: txStatus,
        date: txDate.trim() || 'Hari ini',
      });
    } else {
      addTransaction({
        notes: txNotes.trim(),
        vendorName: txVendor.trim() || 'Vendor',
        amount,
        paidBy: txPaidBy,
        status: txStatus,
        date: txDate.trim() || 'Hari ini',
      });
    }
    setModalType(null);
  };

  // Vendor Schedule Handlers inside Detail Sheet
  const handleToggleSchedule = (scheduleId: string) => {
    if (!selectedVendorForDetail) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedSchedules = (selectedVendorForDetail.schedules || []).map((sc) =>
      sc.id === scheduleId ? { ...sc, completed: !sc.completed } : sc
    );
    const updatedVendor = { ...selectedVendorForDetail, schedules: updatedSchedules };
    updateVendor(selectedVendorForDetail.id, { schedules: updatedSchedules });
    setSelectedVendorForDetail(updatedVendor);
  };

  const handleScheduleDatePicked = (date: Date, _offsetDays: number, formattedLabel: string) => {
    setNewScheduleSelectedDate(date);
    setNewScheduleDate(formattedLabel);
    setShowScheduleCalendar(false);
  };

  const handleAddSchedule = async () => {
    if (!selectedVendorForDetail || !newScheduleTitle.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const timeStr = `${String(newScheduleHour).padStart(2, '0')}:${String(newScheduleMinute).padStart(2, '0')}`;
    const combinedDate = new Date(newScheduleSelectedDate);
    combinedDate.setHours(newScheduleHour, newScheduleMinute, 0, 0);

    const newEntry: VendorSchedule = {
      id: `vs_${Date.now()}`,
      title: newScheduleTitle.trim(),
      date: newScheduleDate || format(combinedDate, 'dd MMM yyyy'),
      time: timeStr,
      isoDateTime: combinedDate.toISOString(),
      reminderEnabled: newScheduleReminderEnabled,
      reminderMinutesBefore: newScheduleReminderEnabled ? newScheduleReminderMinutes : undefined,
      completed: false,
    };

    const nextList = [...(selectedVendorForDetail.schedules || []), newEntry];
    const updatedVendor = { ...selectedVendorForDetail, schedules: nextList };
    updateVendor(selectedVendorForDetail.id, { schedules: nextList });
    setSelectedVendorForDetail(updatedVendor);

    if (newScheduleReminderEnabled) {
      const res = await NotificationService.scheduleVendorReminder(
        newEntry,
        selectedVendorForDetail.name
      );
      Alert.alert('Jadwal & Pengingat Aktif', res.message);
    }

    setNewScheduleTitle('');
    setShowScheduleCalendar(false);
    setShowAddScheduleRow(false);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (!selectedVendorForDetail) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextList = (selectedVendorForDetail.schedules || []).filter((s) => s.id !== scheduleId);
    const updatedVendor = { ...selectedVendorForDetail, schedules: nextList };
    updateVendor(selectedVendorForDetail.id, { schedules: nextList });
    setSelectedVendorForDetail(updatedVendor);
  };

  // Delete Handlers
  const handleDelete = () => {
    if (!editingId) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (modalType === 'category') {
      deleteCategory(editingId);
    } else if (modalType === 'vendor') {
      deleteVendor(editingId);
      if (selectedVendorForDetail && selectedVendorForDetail.id === editingId) {
        setSelectedVendorForDetail(null);
      }
    } else if (modalType === 'transaction') {
      deleteTransaction(editingId);
    }
    setModalType(null);
  };

  // Computed Financials
  const targetBudget = categories.reduce((acc, c) => acc + c.allocated, 0) || 150000000;
  const cashSpent = transactions
    .filter((tx) => tx.status === 'paid')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const totalCommitted = categories.reduce((acc, c) => acc + c.committed, 0) || 158000000;
  const remainingCash = targetBudget - cashSpent;
  const remainingLiability = Math.max(0, totalCommitted - cashSpent);

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
          rightElement={
            <TouchableOpacity onPress={handleOpenAdd} activeOpacity={0.8} style={styles.addButton}>
              <Ionicons name="add" size={18} color={colors.textLight} />
              <Text style={styles.addButtonText}>
                {activeTab === 0 ? 'Pos Biaya' : activeTab === 1 ? 'Vendor' : 'Transaksi'}
              </Text>
            </TouchableOpacity>
          }
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

        {/* Helper Hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
          <Text style={styles.hintText}>Tekan lama baris untuk Edit atau Hapus</Text>
        </View>

        {activeTab === 0 ? (
          <View style={styles.cardStack}>
            {categories.map((c, idx) => {
              const isOver = c.committed > c.allocated;
              const ratio = c.allocated > 0 ? Math.round((c.committed / c.allocated) * 100) : 0;
              return (
                <FadeInView key={c.id} delay={Math.min(idx * 45, 220)}>
                  <Card style={styles.itemCard}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onLongPress={() => openEditCategory(c)}
                      delayLongPress={300}
                    >
                      <View style={styles.rowBetween}>
                        <View style={styles.titleWithIcon}>
                          <View style={styles.iconCircle}>
                            <Ionicons name="layers-outline" size={16} color={colors.accent} />
                          </View>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {c.name}
                          </Text>
                        </View>
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
                    </TouchableOpacity>
                  </Card>
                </FadeInView>
              );
            })}
          </View>
        ) : activeTab === 1 ? (
          <View style={styles.cardStack}>
            {vendors.map((v, idx) => {
              const vendorTxs = transactions.filter(
                (tx) => tx.vendorName?.toLowerCase() === v.name.toLowerCase()
              );
              const paidAmount = vendorTxs
                .filter((tx) => tx.status === 'paid')
                .reduce((sum, tx) => sum + tx.amount, 0);
              const progressPct =
                v.contractValue > 0 ? Math.min(100, Math.round((paidAmount / v.contractValue) * 100)) : 0;
              const nextSchedule = (v.schedules || []).find((s) => !s.completed);

              return (
                <FadeInView key={v.id} delay={Math.min(idx * 45, 220)}>
                  <Card style={styles.itemCard}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setSelectedVendorForDetail(v)}
                      onLongPress={() => openEditVendor(v)}
                      delayLongPress={300}
                    >
                      <View style={styles.rowBetween}>
                        <View style={styles.titleWithIcon}>
                          <View style={styles.iconCircle}>
                            <Ionicons name="storefront-outline" size={16} color={colors.accent} />
                          </View>
                          <View style={styles.flexInfo}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {v.name}
                            </Text>
                            <Text style={styles.subLabel}>
                              {v.category} • {v.contactPerson}
                            </Text>
                          </View>
                        </View>
                        <Badge
                          label={
                            v.status === 'booked'
                              ? 'Booked'
                              : v.status === 'completed'
                              ? 'Selesai'
                              : 'Shortlist'
                          }
                          variant={
                            v.status === 'booked'
                              ? 'success'
                              : v.status === 'completed'
                              ? 'neutral'
                              : 'warning'
                          }
                        />
                      </View>

                      {/* Payment progress mini-bar */}
                      <View style={{ marginTop: 10 }}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.subLabel}>
                            Terbayar: Rp {(paidAmount / 1000000).toFixed(1)} Jt ({progressPct}%)
                          </Text>
                          <Text style={styles.contractAmount}>
                            Rp {v.contractValue.toLocaleString('id-ID')}
                          </Text>
                        </View>
                        <ProgressBar progress={progressPct} height={5} style={{ marginTop: 4 }} />
                      </View>

                      {/* Next upcoming schedule preview if any */}
                      {nextSchedule ? (
                        <View style={styles.vendorNextScheduleRow}>
                          <Ionicons name="time-outline" size={12} color={colors.accent} />
                          <Text style={styles.vendorNextScheduleText} numberOfLines={1}>
                            Agenda: {nextSchedule.title} ({nextSchedule.date}
                            {nextSchedule.time ? ` • ${nextSchedule.time}` : ''})
                          </Text>
                          {nextSchedule.reminderEnabled ? (
                            <Ionicons name="notifications-outline" size={12} color={colors.accent} />
                          ) : null}
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  </Card>
                </FadeInView>
              );
            })}
          </View>
        ) : (
          <View style={styles.cardStack}>
            {transactions.map((tx, idx) => (
              <FadeInView key={tx.id} delay={Math.min(idx * 45, 220)}>
                <Card style={styles.itemCard}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onLongPress={() => openEditTx(tx)}
                    delayLongPress={300}
                  >
                    <View style={styles.rowBetween}>
                      <View style={styles.titleWithIcon}>
                        <View style={styles.iconCircle}>
                          <Ionicons name="receipt-outline" size={16} color={colors.accent} />
                        </View>
                        <View style={styles.flexInfo}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {tx.notes}
                          </Text>
                          <Text style={styles.subLabel} numberOfLines={1}>
                            {tx.vendorName} • {tx.date}
                          </Text>
                        </View>
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
                  </TouchableOpacity>
                </Card>
              </FadeInView>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={modalType === 'category'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalType(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>{editingId ? 'Edit Pos Anggaran' : 'Tambah Pos Anggaran'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nama Pos Biaya *</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Dekorasi & Bunga Altar" placeholderTextColor={colors.textMuted} value={catName} onChangeText={setCatName} />

              <Text style={styles.fieldLabel}>Target Alokasi (Rp)</Text>
              <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Misal: 25000000" placeholderTextColor={colors.textMuted} value={catAllocated} onChangeText={setCatAllocated} />

              <Text style={styles.fieldLabel}>Realisasi Komitmen (Rp)</Text>
              <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Misal: 28000000" placeholderTextColor={colors.textMuted} value={catCommitted} onChangeText={setCatCommitted} />

              <View style={styles.modalActionRow}>
                {editingId ? (
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleSaveCategory} style={[styles.saveButton, !catName.trim() && styles.saveButtonDisabled]} activeOpacity={0.8} disabled={!catName.trim()}>
                  <Text style={styles.saveButtonText}>Simpan Pos</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Vendor Modal */}
      <Modal visible={modalType === 'vendor'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalType(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>{editingId ? 'Edit Data Vendor' : 'Tambah Vendor Baru'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nama Vendor *</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Sound System Pro" placeholderTextColor={colors.textMuted} value={vendorName} onChangeText={setVendorName} />

              <Text style={styles.fieldLabel}>Kategori Vendor</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Audio / Lighting" placeholderTextColor={colors.textMuted} value={vendorCategory} onChangeText={setVendorCategory} />

              <Text style={styles.fieldLabel}>Nilai Kontrak Deal (Rp)</Text>
              <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Misal: 15000000" placeholderTextColor={colors.textMuted} value={vendorContract} onChangeText={setVendorContract} />

              <Text style={styles.fieldLabel}>Kontak Person (PIC)</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Mas Doni (Manager)" placeholderTextColor={colors.textMuted} value={vendorContact} onChangeText={setVendorContact} />

              <Text style={styles.fieldLabel}>Nomor WhatsApp / Telepon</Text>
              <TextInput style={styles.textInput} keyboardType="phone-pad" placeholder="Misal: 08123456789" placeholderTextColor={colors.textMuted} value={vendorPhone} onChangeText={setVendorPhone} />

              <Text style={styles.fieldLabel}>Email Vendor</Text>
              <TextInput style={styles.textInput} keyboardType="email-address" autoCapitalize="none" placeholder="Misal: vendor@wedding.com" placeholderTextColor={colors.textMuted} value={vendorEmail} onChangeText={setVendorEmail} />

              <Text style={styles.fieldLabel}>Instagram / Akun Sosmed</Text>
              <TextInput style={styles.textInput} autoCapitalize="none" placeholder="Misal: @vendor_official" placeholderTextColor={colors.textMuted} value={vendorSocialMedia} onChangeText={setVendorSocialMedia} />

              <Text style={styles.fieldLabel}>Catatan Kesepakatan & Klausul</Text>
              <TextInput style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]} multiline placeholder="Misal: Bonus 2 pondokan, serah terima H+7" placeholderTextColor={colors.textMuted} value={vendorNotes} onChangeText={setVendorNotes} />

              <Text style={styles.fieldLabel}>Status Kerjasama</Text>
              <View style={styles.optionRow}>
                {(['booked', 'shortlisted', 'completed'] as VendorItem['status'][]).map((st) => (
                  <TouchableOpacity key={st} onPress={() => setVendorStatus(st)} style={[styles.optionChip, vendorStatus === st && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, vendorStatus === st && styles.optionChipTextActive]}>
                      {st === 'booked' ? 'Booked' : st === 'completed' ? 'Selesai' : 'Shortlist'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActionRow}>
                {editingId ? (
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleSaveVendor} style={[styles.saveButton, !vendorName.trim() && styles.saveButtonDisabled]} activeOpacity={0.8} disabled={!vendorName.trim()}>
                  <Text style={styles.saveButtonText}>Simpan Vendor</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transaction Modal */}
      <Modal visible={modalType === 'transaction'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalType(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>{editingId ? 'Edit Transaksi' : 'Catat Transaksi Pengeluaran'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Keterangan Pembayaran *</Text>
              <TextInput style={styles.textInput} placeholder="Misal: DP 30% Katering Resepsi" placeholderTextColor={colors.textMuted} value={txNotes} onChangeText={setTxNotes} />

              <Text style={styles.fieldLabel}>Nama Vendor Terkait</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Katering Selera Nusantara" placeholderTextColor={colors.textMuted} value={txVendor} onChangeText={setTxVendor} />

              <Text style={styles.fieldLabel}>Nominal Pembayaran (Rp)</Text>
              <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Misal: 10000000" placeholderTextColor={colors.textMuted} value={txAmount} onChangeText={setTxAmount} />

              <Text style={styles.fieldLabel}>Tanggal Transaksi</Text>
              <TextInput style={styles.textInput} placeholder="Misal: 15 Apr 2027" placeholderTextColor={colors.textMuted} value={txDate} onChangeText={setTxDate} />

              <Text style={styles.fieldLabel}>Dibayar Oleh</Text>
              <View style={styles.optionRow}>
                {(['groom', 'bride', 'family'] as TransactionItem['paidBy'][]).map((p) => (
                  <TouchableOpacity key={p} onPress={() => setTxPaidBy(p)} style={[styles.optionChip, txPaidBy === p && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, txPaidBy === p && styles.optionChipTextActive]}>
                      {p === 'groom' ? 'Octa' : p === 'bride' ? 'Jenesia' : 'Keluarga'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Status Pembayaran</Text>
              <View style={styles.optionRow}>
                {(['paid', 'pending'] as TransactionItem['status'][]).map((st) => (
                  <TouchableOpacity key={st} onPress={() => setTxStatus(st)} style={[styles.optionChip, txStatus === st && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, txStatus === st && styles.optionChipTextActive]}>
                      {st === 'paid' ? 'Lunas' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActionRow}>
                {editingId ? (
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleSaveTx} style={[styles.saveButton, !txNotes.trim() && styles.saveButtonDisabled]} activeOpacity={0.8} disabled={!txNotes.trim()}>
                  <Text style={styles.saveButtonText}>Simpan Transaksi</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dedicated Vendor Management & Detail Sheet */}
      <Modal
        visible={!!selectedVendorForDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVendorForDetail(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedVendorForDetail(null)}
          />
          {selectedVendorForDetail ? (
            <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
              <View style={styles.sheetHandle} />

              {/* Vendor Sheet Header */}
              <View style={styles.vendorSheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorSheetCategory}>
                    {selectedVendorForDetail.category}
                  </Text>
                  <Text style={styles.vendorSheetTitle}>
                    {selectedVendorForDetail.name}
                  </Text>
                  <Text style={styles.vendorSheetPic}>
                    PIC: {selectedVendorForDetail.contactPerson}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const target = selectedVendorForDetail;
                    setSelectedVendorForDetail(null);
                    openEditVendor(target);
                  }}
                  style={styles.vendorEditIconBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={18} color={colors.accent} />
                  <Text style={styles.vendorEditIconText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {/* 1. Quick Communication Actions */}
                <Text style={styles.detailSectionTitle}>Kontak & Komunikasi</Text>
                <View style={styles.contactRow}>
                  {selectedVendorForDetail.phone ? (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          const cleanPhone = selectedVendorForDetail.phone!.replace(/[^0-9]/g, '');
                          const waPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
                          Linking.openURL(`https://wa.me/${waPhone}`).catch(() => {
                            Alert.alert('Gagal', 'Tidak dapat membuka WhatsApp.');
                          });
                        }}
                        style={[styles.contactActionBtn, { backgroundColor: '#25D366' }]}
                      >
                        <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                        <Text style={styles.contactActionText}>WhatsApp</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          Linking.openURL(`tel:${selectedVendorForDetail.phone}`).catch(() => {
                            Alert.alert('Gagal', 'Tidak dapat melakukan panggilan telepon.');
                          });
                        }}
                        style={[styles.contactActionBtn, { backgroundColor: colors.accent }]}
                      >
                        <Ionicons name="call-outline" size={16} color="#FFF" />
                        <Text style={styles.contactActionText}>Telepon</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {selectedVendorForDetail.email ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        Linking.openURL(`mailto:${selectedVendorForDetail.email}`).catch(() => {});
                      }}
                      style={[styles.contactActionBtn, { backgroundColor: '#4285F4' }]}
                    >
                      <Ionicons name="mail-outline" size={16} color="#FFF" />
                      <Text style={styles.contactActionText}>Email</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedVendorForDetail.socialMedia ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        const igHandle = selectedVendorForDetail.socialMedia!.replace('@', '');
                        Linking.openURL(`https://instagram.com/${igHandle}`).catch(() => {});
                      }}
                      style={[styles.contactActionBtn, { backgroundColor: '#E1306C' }]}
                    >
                      <Ionicons name="logo-instagram" size={16} color="#FFF" />
                      <Text style={styles.contactActionText}>Instagram</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* 2. Contract & Payment Status Tracker */}
                {(() => {
                  const vendorTxs = transactions.filter(
                    (tx) => tx.vendorName?.toLowerCase() === selectedVendorForDetail.name.toLowerCase()
                  );
                  const paid = vendorTxs
                    .filter((tx) => tx.status === 'paid')
                    .reduce((sum, tx) => sum + tx.amount, 0);
                  const remaining = Math.max(0, selectedVendorForDetail.contractValue - paid);
                  const pct =
                    selectedVendorForDetail.contractValue > 0
                      ? Math.min(100, Math.round((paid / selectedVendorForDetail.contractValue) * 100))
                      : 0;

                  return (
                    <View style={styles.detailCardBox}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.detailCardLabel}>Status Kontrak & Pembayaran</Text>
                        <Badge
                          label={
                            pct === 100
                              ? 'Lunas 100%'
                              : selectedVendorForDetail.status === 'booked'
                              ? 'Deal Kontrak'
                              : 'Tahap Penjajakan'
                          }
                          variant={pct === 100 ? 'success' : 'accent'}
                        />
                      </View>

                      <View style={[styles.rowBetween, { marginTop: 12 }]}>
                        <View>
                          <Text style={styles.subLabel}>Total Kontrak</Text>
                          <Text style={styles.detailValuePrimary}>
                            Rp {selectedVendorForDetail.contractValue.toLocaleString('id-ID')}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.subLabel}>Sisa Tagihan</Text>
                          <Text
                            style={[
                              styles.detailValuePrimary,
                              { color: remaining > 0 ? colors.warning : colors.success },
                            ]}
                          >
                            Rp {remaining.toLocaleString('id-ID')}
                          </Text>
                        </View>
                      </View>

                      <ProgressBar progress={pct} height={8} style={{ marginVertical: 12 }} />

                      <Text style={styles.subLabel}>
                        Realisasi Pembayaran: Rp {paid.toLocaleString('id-ID')} ({pct}% lunas)
                      </Text>

                      {/* Riwayat termin transaksi vendor ini */}
                      {vendorTxs.length > 0 ? (
                        <View style={styles.vendorTxList}>
                          <Text style={[styles.subLabel, { fontWeight: '700', marginBottom: 6 }]}>
                            Riwayat Pembayaran Termin:
                          </Text>
                          {vendorTxs.map((t) => (
                            <View key={t.id} style={styles.vendorTxRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.vendorTxTitle}>{t.notes}</Text>
                                <Text style={styles.subLabel}>{t.date}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.vendorTxAmount}>
                                  Rp {t.amount.toLocaleString('id-ID')}
                                </Text>
                                <Badge
                                  label={t.status === 'paid' ? 'Lunas' : 'Pending'}
                                  variant={t.status === 'paid' ? 'success' : 'neutral'}
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={[styles.subLabel, { fontStyle: 'italic', marginTop: 8 }]}>
                          Belum ada pembayaran yang dicatat untuk vendor ini.
                        </Text>
                      )}
                    </View>
                  );
                })()}

                {/* 3. Jadwal Meeting, Fitting & Agenda */}
                <View style={styles.detailCardBox}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.detailCardLabel}>Jadwal Meeting & Fitting</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity
                        onPress={async () => {
                          const res = await NotificationService.sendTestNotification(3);
                          Alert.alert(res.ok ? 'Tes Notifikasi' : 'Izin Diperlukan', res.message);
                        }}
                        style={styles.testNotifPill}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="notifications-outline" size={13} color={colors.accent} />
                        <Text style={styles.testNotifPillText}>Tes Notif</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setShowAddScheduleRow((v) => !v)}
                        style={styles.addScheduleLink}
                      >
                        <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                        <Text style={styles.addScheduleLinkText}>Tambah</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Inline Form Tambah Jadwal (Kalender + Jam + Pengingat) */}
                  {showAddScheduleRow ? (
                    <View style={styles.inlineAddScheduleBox}>
                      <Text style={styles.scheduleFormLabel}>Nama Agenda</Text>
                      <TextInput
                        placeholder="Misal: Fitting Perdana / Food Tasting"
                        placeholderTextColor={colors.textMuted}
                        value={newScheduleTitle}
                        onChangeText={setNewScheduleTitle}
                        style={styles.textInput}
                      />

                      {/* Date Picker Trigger */}
                      <Text style={styles.scheduleFormLabel}>Tanggal Pertemuan</Text>
                      <TouchableOpacity
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setShowScheduleCalendar((v) => !v);
                        }}
                        activeOpacity={0.75}
                        style={styles.scheduleDateTrigger}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                          <Text style={styles.scheduleDateTriggerText}>{newScheduleDate}</Text>
                        </View>
                        <Ionicons
                          name={showScheduleCalendar ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>

                      {showScheduleCalendar ? (
                        <View style={{ marginTop: 4 }}>
                          <CalendarPicker
                            selectedDate={newScheduleSelectedDate}
                            weddingDate={safeWeddingDate}
                            onSelectDate={handleScheduleDatePicked}
                          />
                        </View>
                      ) : null}

                      {/* Time Picker (Jam & Menit) */}
                      <Text style={styles.scheduleFormLabel}>Waktu (Jam & Menit)</Text>
                      <View style={styles.timePickerRow}>
                        <View style={styles.timeSpinnerBox}>
                          <TouchableOpacity
                            onPress={() => setNewScheduleHour((h) => (h + 23) % 24)}
                            style={styles.timeStepBtn}
                          >
                            <Ionicons name="remove" size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={styles.timeValueText}>
                            {String(newScheduleHour).padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setNewScheduleHour((h) => (h + 1) % 24)}
                            style={styles.timeStepBtn}
                          >
                            <Ionicons name="add" size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.timeColon}>:</Text>

                        <View style={styles.timeSpinnerBox}>
                          <TouchableOpacity
                            onPress={() => setNewScheduleMinute((m) => (m + 45) % 60)}
                            style={styles.timeStepBtn}
                          >
                            <Ionicons name="remove" size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={styles.timeValueText}>
                            {String(newScheduleMinute).padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setNewScheduleMinute((m) => (m + 15) % 60)}
                            style={styles.timeStepBtn}
                          >
                            <Ionicons name="add" size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.timeZoneLabel}>WIB</Text>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickTimeChipsRow}
                      >
                        {[
                          { h: 9, m: 0, label: '09:00' },
                          { h: 10, m: 0, label: '10:00' },
                          { h: 13, m: 0, label: '13:00' },
                          { h: 14, m: 0, label: '14:00' },
                          { h: 16, m: 0, label: '16:00' },
                          { h: 19, m: 0, label: '19:00' },
                        ].map((preset) => {
                          const active =
                            newScheduleHour === preset.h && newScheduleMinute === preset.m;
                          return (
                            <TouchableOpacity
                              key={preset.label}
                              onPress={() => {
                                setNewScheduleHour(preset.h);
                                setNewScheduleMinute(preset.m);
                              }}
                              style={[
                                styles.quickTimeChip,
                                active && styles.quickTimeChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.quickTimeChipText,
                                  active && styles.quickTimeChipTextActive,
                                ]}
                              >
                                {preset.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      {/* Reminder / Pengingat Toggle */}
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setNewScheduleReminderEnabled((v) => !v);
                        }}
                        style={styles.reminderToggleRow}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name={
                              newScheduleReminderEnabled
                                ? 'notifications'
                                : 'notifications-off-outline'
                            }
                            size={16}
                            color={
                              newScheduleReminderEnabled ? colors.accent : colors.textMuted
                            }
                          />
                          <Text style={styles.reminderToggleLabel}>
                            Aktifkan Pengingat (Reminder)
                          </Text>
                        </View>
                        <Badge
                          label={newScheduleReminderEnabled ? 'Aktif' : 'Nonaktif'}
                          variant={newScheduleReminderEnabled ? 'success' : 'neutral'}
                        />
                      </TouchableOpacity>

                      {newScheduleReminderEnabled ? (
                        <View style={styles.reminderLeadRow}>
                          {[
                            { mins: 30, label: '30 Mnt Sebelum' },
                            { mins: 60, label: '1 Jam Sebelum' },
                            { mins: 1440, label: 'H-1' },
                          ].map((opt) => {
                            const active = newScheduleReminderMinutes === opt.mins;
                            return (
                              <TouchableOpacity
                                key={opt.mins}
                                onPress={() => setNewScheduleReminderMinutes(opt.mins)}
                                style={[
                                  styles.quickTimeChip,
                                  active && styles.quickTimeChipActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.quickTimeChipText,
                                    active && styles.quickTimeChipTextActive,
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : null}

                      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setShowScheduleCalendar(false);
                            setShowAddScheduleRow(false);
                          }}
                          style={[styles.contactActionBtn, { backgroundColor: colors.border }]}
                        >
                          <Text style={[styles.contactActionText, { color: colors.textSecondary }]}>
                            Batal
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleAddSchedule}
                          style={[styles.contactActionBtn, { backgroundColor: colors.accent }]}
                        >
                          <Text style={styles.contactActionText}>Simpan Jadwal</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  {/* List of Schedules */}
                  {(selectedVendorForDetail.schedules || []).length > 0 ? (
                    <View style={{ marginTop: 10 }}>
                      {(selectedVendorForDetail.schedules || []).map((sc) => (
                        <View key={sc.id} style={styles.scheduleItemRow}>
                          <TouchableOpacity
                            onPress={() => handleToggleSchedule(sc.id)}
                            style={[
                              styles.scheduleCheckSquare,
                              sc.completed && styles.scheduleCheckSquareChecked,
                            ]}
                          >
                            {sc.completed ? (
                              <Ionicons name="checkmark" size={12} color="#FFF" />
                            ) : null}
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.scheduleItemTitle,
                                sc.completed && styles.scheduleItemCompleted,
                              ]}
                            >
                              {sc.title}
                            </Text>
                            <Text style={styles.scheduleItemDate}>
                              {sc.date}
                              {sc.time ? ` • ${sc.time} WIB` : ''}
                            </Text>
                            {sc.reminderEnabled && !sc.completed ? (
                              <View style={styles.scheduleReminderPill}>
                                <Ionicons name="notifications-outline" size={11} color={colors.accent} />
                                <Text style={styles.scheduleReminderPillText}>
                                  Pengingat: {formatReminderLeadTime(sc.reminderMinutesBefore)}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteSchedule(sc.id)}
                            style={{ padding: 4 }}
                          >
                            <Ionicons name="close" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.subLabel, { fontStyle: 'italic', marginTop: 8 }]}>
                      Belum ada jadwal meeting/fitting yang diagendakan.
                    </Text>
                  )}
                </View>

                {/* 4. Catatan Kesepakatan & Klausul Penting */}
                <View style={styles.detailCardBox}>
                  <Text style={styles.detailCardLabel}>Catatan Kesepakatan & Klausul</Text>
                  <Text style={styles.vendorNotesBody}>
                    {selectedVendorForDetail.notes ||
                      'Belum ada catatan kesepakatan tertulis. Tekan Edit untuk menambahkan klausul atau bonus vendor.'}
                  </Text>
                </View>

                {/* 5. Moodboard & Referensi Vendor Ini */}
                {(() => {
                  const vendorMoodboard = moodboardItems.filter(
                    (m) => m.vendorId === selectedVendorForDetail.id
                  );
                  return (
                    <View style={styles.detailCardBox}>
                      <View style={[styles.rowBetween, { flexWrap: 'wrap', rowGap: 8 }]}>
                        <Text style={[styles.detailCardLabel, { flexShrink: 1 }]}>
                          Moodboard & Referensi ({vendorMoodboard.length})
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <TouchableOpacity
                            onPress={async () => {
                              const res = await exportMoodboardBriefPdf({
                                items: vendorMoodboard,
                                scopeTitle: selectedVendorForDetail.name,
                                profile,
                                vendor: selectedVendorForDetail,
                              });
                              if (!res.ok) {
                                Alert.alert('Info Brief PDF', res.message);
                              }
                            }}
                            style={styles.testNotifPill}
                            activeOpacity={0.75}
                          >
                            <Ionicons name="document-attach-outline" size={13} color={colors.accent} />
                            <Text style={styles.testNotifPillText}>Kirim Brief PDF</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              const vid = selectedVendorForDetail.id;
                              setSelectedVendorForDetail(null);
                              router.push(`/moodboard?vendorId=${vid}` as any);
                            }}
                            style={styles.addScheduleLink}
                          >
                            <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                            <Text style={styles.addScheduleLinkText}>+ Tambah</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {vendorMoodboard.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ gap: 8, marginTop: 10 }}
                        >
                          {vendorMoodboard.map((m) => (
                            <TouchableOpacity
                              key={m.id}
                              activeOpacity={0.8}
                              onPress={() => {
                                const vid = selectedVendorForDetail.id;
                                setSelectedVendorForDetail(null);
                                router.push(`/moodboard?vendorId=${vid}` as any);
                              }}
                              style={styles.vendorMoodThumbCard}
                            >
                              {m.imageUrl ? (
                                <Image
                                  source={{ uri: m.imageUrl }}
                                  style={styles.vendorMoodThumbImg}
                                />
                              ) : (
                                <View style={styles.vendorMoodThumbLink}>
                                  <Ionicons name="link-outline" size={18} color={colors.accent} />
                                </View>
                              )}
                              <Text style={styles.vendorMoodThumbTitle} numberOfLines={1}>
                                {m.isFinal ? '★ ' : ''}
                                {m.title}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : (
                        <Text style={[styles.subLabel, { fontStyle: 'italic', marginTop: 8 }]}>
                          Belum ada referensi visual yang ditautkan ke vendor ini. Ketuk Kelola untuk menambahkan.
                        </Text>
                      )}
                    </View>
                  );
                })()}
              </ScrollView>
            </View>
          ) : null}
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
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  segmented: {
    marginBottom: spacing.xs,
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
  listCard: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cardStack: {
    gap: 10,
  },
  itemCard: {
    padding: 15,
    marginBottom: 0,
  },
  titleWithIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Bottom-sheet Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: colors.borderDark,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  optionChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionChipTextActive: {
    color: colors.textLight,
    fontWeight: '600',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    marginBottom: 10,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  // Dedicated Vendor Sheet Styles
  vendorNextScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: `${colors.accent}12`,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  vendorNextScheduleText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  vendorSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 14,
    marginBottom: 16,
  },
  vendorSheetCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vendorSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  vendorSheetPic: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vendorEditIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vendorEditIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  contactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  contactActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  detailCardBox: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  detailCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailValuePrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  vendorTxList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  vendorTxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  vendorTxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vendorTxAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  addScheduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addScheduleLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  inlineAddScheduleBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  scheduleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleCheckSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCheckSquareChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  scheduleItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scheduleItemCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  scheduleItemDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  vendorNotesBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 8,
  },
  scheduleFormLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 4,
  },
  scheduleDateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scheduleDateTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  timeSpinnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  timeStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    minWidth: 22,
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeZoneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginLeft: 4,
  },
  quickTimeChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 6,
  },
  quickTimeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickTimeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  quickTimeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickTimeChipTextActive: {
    color: '#FFF',
  },
  reminderToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 4,
  },
  reminderToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reminderLeadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  scheduleReminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  scheduleReminderPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent,
  },
  testNotifPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: `${colors.accent}15`,
  },
  testNotifPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  vendorMoodThumbCard: {
    width: 92,
    borderRadius: 10,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  vendorMoodThumbImg: {
    width: 92,
    height: 70,
    backgroundColor: colors.surfaceMuted,
  },
  vendorMoodThumbLink: {
    width: 92,
    height: 70,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorMoodThumbTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
});
