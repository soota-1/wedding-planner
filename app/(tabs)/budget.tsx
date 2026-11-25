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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { FadeInView } from '../../src/components/common/FadeInView';
import {
  useWeddingStore,
  CategoryItem,
  VendorItem,
  TransactionItem,
} from '../../src/stores/useWeddingStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BudgetScreen() {
  const [activeTab, setActiveTab] = useState(0);

  // Store state & actions
  const categories = useWeddingStore((s) => s.categories);
  const vendors = useWeddingStore((s) => s.vendors);
  const transactions = useWeddingStore((s) => s.transactions);
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

    if (editingId) {
      updateVendor(editingId, {
        name: vendorName.trim(),
        category: vendorCategory.trim() || 'Lainnya',
        contractValue: contract,
        status: vendorStatus,
        contactPerson: vendorContact.trim() || 'PIC',
      });
    } else {
      addVendor({
        name: vendorName.trim(),
        category: vendorCategory.trim() || 'Lainnya',
        contractValue: contract,
        status: vendorStatus,
        contactPerson: vendorContact.trim() || 'PIC',
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

  // Delete Handlers
  const handleDelete = () => {
    if (!editingId) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (modalType === 'category') {
      deleteCategory(editingId);
    } else if (modalType === 'vendor') {
      deleteVendor(editingId);
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
            {vendors.map((v, idx) => (
              <FadeInView key={v.id} delay={Math.min(idx * 45, 220)}>
                <Card style={styles.itemCard}>
                  <TouchableOpacity
                    activeOpacity={0.7}
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
                        label={v.status === 'booked' ? 'Booked' : v.status === 'completed' ? 'Selesai' : 'Shortlist'}
                        variant={v.status === 'booked' ? 'success' : v.status === 'completed' ? 'neutral' : 'warning'}
                      />
                    </View>
                    <Text style={styles.contractAmount}>
                      Rp {v.contractValue.toLocaleString('id-ID')}
                    </Text>
                  </TouchableOpacity>
                </Card>
              </FadeInView>
            ))}
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
              <TextInput style={styles.textInput} placeholder="Misal: Mas Doni (0812...)" placeholderTextColor={colors.textMuted} value={vendorContact} onChangeText={setVendorContact} />

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
});
