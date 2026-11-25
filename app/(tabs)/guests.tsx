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
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { FilterChipBar } from '../../src/components/common/FilterChipBar';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { FadeInView } from '../../src/components/common/FadeInView';
import { useWeddingStore, GuestItem, GiftItem } from '../../src/stores/useWeddingStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sideOptions = ['Semua Pihak', 'Pihak Octa', 'Pihak Jenesia'];
const sideKeys: ('all' | 'groom' | 'bride')[] = ['all', 'groom', 'bride'];

export default function GuestsScreen() {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [sideIndex, setSideIndex] = useState(0);

  const guests = useWeddingStore((s) => s.guests);
  const gifts = useWeddingStore((s) => s.gifts);
  const cycleGuestRsvpStore = useWeddingStore((s) => s.cycleGuestRsvp);
  const addGuestStore = useWeddingStore((s) => s.addGuest);
  const updateGuestStore = useWeddingStore((s) => s.updateGuest);
  const deleteGuestStore = useWeddingStore((s) => s.deleteGuest);
  const toggleGiftThankYouStore = useWeddingStore((s) => s.toggleGiftThankYou);
  const addGiftStore = useWeddingStore((s) => s.addGift);
  const updateGiftStore = useWeddingStore((s) => s.updateGift);
  const deleteGiftStore = useWeddingStore((s) => s.deleteGift);

  // Modals state
  const [modalType, setModalType] = useState<'guest' | 'gift' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Guest form
  const [guestName, setGuestName] = useState('');
  const [guestSide, setGuestSide] = useState<GuestItem['side']>('groom');
  const [guestGroup, setGuestGroup] = useState('');
  const [guestPax, setGuestPax] = useState('2');
  const [guestRsvp, setGuestRsvp] = useState<GuestItem['rsvpStatus']>('pending');

  // Gift form
  const [giftSender, setGiftSender] = useState('');
  const [giftType, setGiftType] = useState<GiftItem['giftType']>('transfer');
  const [giftAmount, setGiftAmount] = useState('');
  const [giftDesc, setGiftDesc] = useState('');
  const [giftReceiver, setGiftReceiver] = useState<GiftItem['receivedBy']>('both');
  const [giftThankYou, setGiftThankYou] = useState(false);

  // Quick cycle RSVP on single tap
  const cycleRsvp = (guestId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    cycleGuestRsvpStore(guestId);
  };

  // Quick toggle thank you note on single tap
  const toggleThankYou = (giftId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleGiftThankYouStore(giftId);
  };

  // Open Add Modals
  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeSegmentIndex === 0) {
      setGuestName('');
      setGuestSide(sideKeys[sideIndex] === 'bride' ? 'bride' : 'groom');
      setGuestGroup('Sahabat');
      setGuestPax('2');
      setGuestRsvp('pending');
      setModalType('guest');
    } else {
      setGiftSender('');
      setGiftType('transfer');
      setGiftAmount('');
      setGiftDesc('');
      setGiftReceiver('both');
      setGiftThankYou(false);
      setModalType('gift');
    }
  };

  // Open Edit Modals on Long Press
  const openEditGuest = (g: GuestItem) => {
    setEditingId(g.id);
    setGuestName(g.name);
    setGuestSide(g.side);
    setGuestGroup(g.groupTag);
    setGuestPax(g.estimatedPax.toString());
    setGuestRsvp(g.rsvpStatus);
    setModalType('guest');
  };

  const openEditGift = (gf: GiftItem) => {
    setEditingId(gf.id);
    setGiftSender(gf.senderName);
    setGiftType(gf.giftType);
    setGiftAmount(gf.amount > 0 ? gf.amount.toString() : '');
    setGiftDesc(gf.giftDescription || '');
    setGiftReceiver(gf.receivedBy);
    setGiftThankYou(gf.thankYouSent);
    setModalType('gift');
  };

  // Save Handlers
  const handleSaveGuest = () => {
    if (!guestName.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const pax = parseInt(guestPax.replace(/[^0-9]/g, ''), 10) || 1;

    if (editingId) {
      updateGuestStore(editingId, {
        name: guestName.trim(),
        side: guestSide,
        groupTag: guestGroup.trim() || 'Umum',
        estimatedPax: pax,
        actualPax: guestRsvp === 'attending' ? pax : 0,
        rsvpStatus: guestRsvp,
      });
    } else {
      addGuestStore({
        name: guestName.trim(),
        side: guestSide,
        groupTag: guestGroup.trim() || 'Umum',
        estimatedPax: pax,
        actualPax: guestRsvp === 'attending' ? pax : 0,
        rsvpStatus: guestRsvp,
      });
    }
    setModalType(null);
  };

  const handleSaveGift = () => {
    if (!giftSender.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const amount = parseInt(giftAmount.replace(/[^0-9]/g, ''), 10) || 0;

    if (editingId) {
      updateGiftStore(editingId, {
        senderName: giftSender.trim(),
        giftType,
        amount: giftType === 'physical_gift' ? 0 : amount,
        giftDescription: giftType === 'physical_gift' ? giftDesc.trim() || 'Kado Fisik' : undefined,
        receivedBy: giftReceiver,
        thankYouSent: giftThankYou,
      });
    } else {
      addGiftStore({
        senderName: giftSender.trim(),
        giftType,
        amount: giftType === 'physical_gift' ? 0 : amount,
        giftDescription: giftType === 'physical_gift' ? giftDesc.trim() || 'Kado Fisik' : undefined,
        receivedBy: giftReceiver,
        thankYouSent: giftThankYou,
      });
    }
    setModalType(null);
  };

  // Delete Handler
  const handleDelete = () => {
    if (!editingId) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (modalType === 'guest') {
      deleteGuestStore(editingId);
    } else if (modalType === 'gift') {
      deleteGiftStore(editingId);
    }
    setModalType(null);
  };

  const selectedSideFilter = sideKeys[sideIndex];
  const totalInvitedPax = guests.reduce((acc, g) => acc + g.estimatedPax, 0);
  const confirmedAttendingPax = guests
    .filter((g) => g.rsvpStatus === 'attending')
    .reduce((acc, g) => acc + (g.actualPax > 0 ? g.actualPax : g.estimatedPax), 0);
  const attendanceRate = totalInvitedPax > 0 ? Math.round((confirmedAttendingPax / totalInvitedPax) * 100) : 0;

  const filteredGuests = guests.filter((g) => {
    if (selectedSideFilter === 'all') return true;
    return g.side === selectedSideFilter || g.side === 'both';
  });

  const totalCashCollected = gifts
    .filter((g) => g.giftType === 'cash' || g.giftType === 'transfer')
    .reduce((acc, g) => acc + g.amount, 0);
  const physicalGiftsCount = gifts.filter((g) => g.giftType === 'physical_gift').length;
  const thankYouSentCount = gifts.filter((g) => g.thankYouSent).length;
  const thankYouPendingCount = gifts.length - thankYouSentCount;

  const recipientTotals = gifts.reduce((acc, g) => {
    if (g.giftType === 'cash' || g.giftType === 'transfer') {
      acc[g.receivedBy] = (acc[g.receivedBy] || 0) + g.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          kicker="Resepsi & Hadiah"
          title="Tamu & Angpau"
          subtitle="Ketuk untuk ubah status • Tekan lama untuk edit/hapus"
          rightElement={
            <TouchableOpacity onPress={handleOpenAdd} activeOpacity={0.8} style={styles.addButton}>
              <Ionicons name="add" size={18} color={colors.textLight} />
              <Text style={styles.addButtonText}>
                {activeSegmentIndex === 0 ? 'Tamu' : 'Catat Hadiah'}
              </Text>
            </TouchableOpacity>
          }
        />

        <SegmentedControl
          options={['Tamu & RSVP', 'Angpau & Kado']}
          selectedIndex={activeSegmentIndex}
          onChange={setActiveSegmentIndex}
        />

        {/* Helper Hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
          <Text style={styles.hintText}>
            {activeSegmentIndex === 0
              ? 'Ketuk untuk ganti status RSVP • Tekan lama untuk edit / hapus'
              : 'Ketuk untuk ganti status ucapan • Tekan lama untuk edit / hapus'}
          </Text>
        </View>

        {activeSegmentIndex === 0 ? (
          <FadeInView delay={20}>
            {/* Hero Pax Card */}
            <Card variant="elevated" style={styles.heroCard}>
              <Text style={styles.heroKicker}>PAX KATERING TERKONFIRMASI</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroBigNum}>{confirmedAttendingPax}</Text>
                <Text style={styles.heroUnit}>Pax Hadir</Text>
              </View>
              <ProgressBar progress={attendanceRate} height={6} style={{ marginVertical: 10 }} />
              <Text style={styles.heroSub}>
                {attendanceRate}% konfirmasi dari total {totalInvitedPax} kuota undangan ({guests.length} nama)
              </Text>
            </Card>

            <FilterChipBar
              options={sideOptions}
              selectedIndex={sideIndex}
              onChange={setSideIndex}
            />

            <Card style={styles.listCard}>
              {filteredGuests.map((g, idx) => (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.7}
                  onPress={() => cycleRsvp(g.id)}
                  onLongPress={() => openEditGuest(g)}
                  delayLongPress={300}
                  style={[styles.rowItem, idx === filteredGuests.length - 1 && styles.rowLast]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {g.groupTag} • {g.estimatedPax} Pax •{' '}
                      {g.side === 'groom' ? 'Octa' : g.side === 'bride' ? 'Jenesia' : 'Berdua'}
                    </Text>
                  </View>
                  <Badge
                    label={
                      g.rsvpStatus === 'attending'
                        ? 'Hadir'
                        : g.rsvpStatus === 'tentative'
                        ? 'Ragu'
                        : g.rsvpStatus === 'declined'
                        ? 'Menolak'
                        : 'Pending'
                    }
                    variant={
                      g.rsvpStatus === 'attending'
                        ? 'success'
                        : g.rsvpStatus === 'tentative'
                        ? 'warning'
                        : g.rsvpStatus === 'declined'
                        ? 'danger'
                        : 'neutral'
                    }
                  />
                </TouchableOpacity>
              ))}
            </Card>
          </FadeInView>
        ) : (
          <FadeInView delay={20}>
            {/* Hero Angpau Card */}
            <Card variant="elevated" style={styles.heroCard}>
              <Text style={styles.heroKicker}>TOTAL DANA ANGPAU TERKUMPUL</Text>
              <Text style={styles.heroBigMoney}>
                Rp {totalCashCollected.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.heroSub}>
                Terpisah dari kas pra-nikah • {gifts.length} total pemberian tercatat
              </Text>
            </Card>

            <View style={styles.statGrid}>
              <StatCard
                label="Kado Fisik"
                value={`${physicalGiftsCount} Barang`}
                subtext="Tercatat di inventaris"
              />
              <StatCard
                label="Kartu Ucapan"
                value={`${thankYouSentCount} Terkirim`}
                subtext={`${thankYouPendingCount} menunggu`}
                variant="highlight"
              />
            </View>

            {/* Rekap Penerima */}
            <Card style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Penerima Dana</Text>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientLabel}>Khusus Octa (Groom)</Text>
                <Text style={styles.recipientValue}>
                  Rp {(recipientTotals['groom'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientLabel}>Khusus Jenesia (Bride)</Text>
                <Text style={styles.recipientValue}>
                  Rp {(recipientTotals['bride'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.recipientRow}>
                <Text style={styles.recipientLabel}>Keluarga Octa</Text>
                <Text style={styles.recipientValue}>
                  Rp {(recipientTotals['family_groom'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={[styles.recipientRow, styles.rowLast]}>
                <Text style={[styles.recipientLabel, styles.boldText]}>Kedua Mempelai</Text>
                <Text style={[styles.recipientValue, styles.boldText]}>
                  Rp {(recipientTotals['both'] || 0).toLocaleString('id-ID')}
                </Text>
              </View>
            </Card>

            {/* Rincian Hadiah */}
            <Card style={styles.listCard}>
              {gifts.map((gf, idx) => (
                <TouchableOpacity
                  key={gf.id}
                  activeOpacity={0.7}
                  onPress={() => toggleThankYou(gf.id)}
                  onLongPress={() => openEditGift(gf)}
                  delayLongPress={300}
                  style={[styles.rowItem, idx === gifts.length - 1 && styles.rowLast]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {gf.senderName}
                    </Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {gf.giftType === 'physical_gift'
                        ? gf.giftDescription
                        : `Rp ${gf.amount.toLocaleString('id-ID')} (${gf.giftType === 'cash' ? 'Tunai' : 'Transfer'})`}
                    </Text>
                  </View>
                  <Badge
                    label={gf.thankYouSent ? 'Ucapan Terkirim' : 'Kirim Ucapan'}
                    variant={gf.thankYouSent ? 'success' : 'warning'}
                  />
                </TouchableOpacity>
              ))}
            </Card>
          </FadeInView>
        )}
      </ScrollView>

      {/* Guest Modal */}
      <Modal visible={modalType === 'guest'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalType(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>{editingId ? 'Edit Data Tamu' : 'Tambah Undangan Tamu'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nama Tamu / Keluarga *</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Bapak H. Hendrawan & Partner" placeholderTextColor={colors.textMuted} value={guestName} onChangeText={setGuestName} />

              <Text style={styles.fieldLabel}>Pihak Pengundang</Text>
              <View style={styles.optionRow}>
                {(['groom', 'bride', 'both'] as GuestItem['side'][]).map((s) => (
                  <TouchableOpacity key={s} onPress={() => setGuestSide(s)} style={[styles.optionChip, guestSide === s && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, guestSide === s && styles.optionChipTextActive]}>
                      {s === 'groom' ? 'Octa' : s === 'bride' ? 'Jenesia' : 'Bersama'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Kategori / Circle Tamu</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Keluarga Besar, Sahabat Kuliah, Vendor" placeholderTextColor={colors.textMuted} value={guestGroup} onChangeText={setGuestGroup} />

              <Text style={styles.fieldLabel}>Estimasi Pax (Porsi Katering)</Text>
              <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Misal: 2" placeholderTextColor={colors.textMuted} value={guestPax} onChangeText={setGuestPax} />

              <Text style={styles.fieldLabel}>Status RSVP</Text>
              <View style={styles.optionRow}>
                {(['attending', 'tentative', 'declined', 'pending'] as GuestItem['rsvpStatus'][]).map((st) => (
                  <TouchableOpacity key={st} onPress={() => setGuestRsvp(st)} style={[styles.optionChip, guestRsvp === st && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, guestRsvp === st && styles.optionChipTextActive]}>
                      {st === 'attending' ? 'Hadir' : st === 'tentative' ? 'Ragu' : st === 'declined' ? 'Menolak' : 'Pending'}
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
                <TouchableOpacity onPress={handleSaveGuest} style={[styles.saveButton, !guestName.trim() && styles.saveButtonDisabled]} activeOpacity={0.8} disabled={!guestName.trim()}>
                  <Text style={styles.saveButtonText}>Simpan Tamu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Gift Modal */}
      <Modal visible={modalType === 'gift'} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalType(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>{editingId ? 'Edit Catatan Hadiah' : 'Catat Angpau / Hadiah'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nama Pemberi Hadiah *</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Tante Maria & Keluarga" placeholderTextColor={colors.textMuted} value={giftSender} onChangeText={setGiftSender} />

              <Text style={styles.fieldLabel}>Bentuk Hadiah</Text>
              <View style={styles.optionRow}>
                {(['transfer', 'cash', 'physical_gift'] as GiftItem['giftType'][]).map((gt) => (
                  <TouchableOpacity key={gt} onPress={() => setGiftType(gt)} style={[styles.optionChip, giftType === gt && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, giftType === gt && styles.optionChipTextActive]}>
                      {gt === 'transfer' ? 'Transfer Bank' : gt === 'cash' ? 'Amplop Tunai' : 'Kado Fisik'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {giftType !== 'physical_gift' ? (
                <>
                  <Text style={styles.fieldLabel}>Nominal Angpau (Rp)</Text>
                  <TextInput style={styles.textInput} keyboardType="numeric" placeholder="Misal: 5000000" placeholderTextColor={colors.textMuted} value={giftAmount} onChangeText={setGiftAmount} />
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Deskripsi Kado Fisik</Text>
                  <TextInput style={styles.textInput} placeholder="Misal: Microwave Panasonic 23L" placeholderTextColor={colors.textMuted} value={giftDesc} onChangeText={setGiftDesc} />
                </>
              )}

              <Text style={styles.fieldLabel}>Diberikan Untuk</Text>
              <View style={styles.optionRow}>
                {(['both', 'groom', 'bride', 'family_groom'] as GiftItem['receivedBy'][]).map((rc) => (
                  <TouchableOpacity key={rc} onPress={() => setGiftReceiver(rc)} style={[styles.optionChip, giftReceiver === rc && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, giftReceiver === rc && styles.optionChipTextActive]}>
                      {rc === 'both' ? 'Kedua Mempelai' : rc === 'groom' ? 'Octa' : rc === 'bride' ? 'Jenesia' : 'Keluarga'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Status Kartu Ucapan Terima Kasih</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity onPress={() => setGiftThankYou(false)} style={[styles.optionChip, !giftThankYou && styles.optionChipActive]}>
                  <Text style={[styles.optionChipText, !giftThankYou && styles.optionChipTextActive]}>Belum Terkirim</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGiftThankYou(true)} style={[styles.optionChip, giftThankYou && styles.optionChipActive]}>
                  <Text style={[styles.optionChipText, giftThankYou && styles.optionChipTextActive]}>Sudah Terkirim</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActionRow}>
                {editingId ? (
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleSaveGift} style={[styles.saveButton, !giftSender.trim() && styles.saveButtonDisabled]} activeOpacity={0.8} disabled={!giftSender.trim()}>
                  <Text style={styles.saveButtonText}>Simpan Hadiah</Text>
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
  heroCard: {
    padding: 18,
    marginBottom: spacing.xs,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.8,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 8,
  },
  heroBigNum: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heroBigMoney: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 6,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  summaryCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recipientLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recipientValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: spacing.sm,
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
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Modal Bottom-sheet styles
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
