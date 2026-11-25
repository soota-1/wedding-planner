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
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { FilterChipBar } from '../../src/components/common/FilterChipBar';
import { FadeInView } from '../../src/components/common/FadeInView';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DocumentItem {
  id: string;
  title: string;
  documentType: string;
  category: 'church_canonical' | 'civil_disdukcapil';
  owner: 'groom' | 'bride' | 'both';
  issueDate?: string;
  ageDays?: number;
  status: 'verified' | 'pending' | 'expired';
  notes?: string;
}

const initialDocuments: DocumentItem[] = [
  {
    id: 'd1',
    title: 'Surat Baptis Octa',
    documentType: 'Surat Baptis Katolik',
    category: 'church_canonical',
    owner: 'groom',
    issueDate: '12 Jul 2027',
    ageDays: 90,
    status: 'verified',
    notes: 'Umur berkas 90 hari (memenuhi syarat maks. 180 hari).',
  },
  {
    id: 'd2',
    title: 'Surat Baptis Jenesia',
    documentType: 'Surat Baptis Katolik',
    category: 'church_canonical',
    owner: 'bride',
    issueDate: '10 Jan 2027',
    ageDays: 273,
    status: 'expired',
    notes: 'Berusia 273 hari (>180 hari). Mohon cetak ulang di paroki asal.',
  },
  {
    id: 'd3',
    title: 'Sertifikat KPP',
    documentType: 'Kursus Perkawinan',
    category: 'church_canonical',
    owner: 'both',
    status: 'verified',
    notes: 'Komisi Kerasulan Keluarga Dekenat (berlaku seumur hidup).',
  },
  {
    id: 'd4',
    title: 'Formulir N1 - N4 Kelurahan',
    documentType: 'Dokumen Sipil',
    category: 'civil_disdukcapil',
    owner: 'both',
    status: 'verified',
    notes: 'Surat pengantar RT/RW dan Kelurahan untuk Disdukcapil.',
  },
  {
    id: 'd5',
    title: 'KTP & Kartu Keluarga',
    documentType: 'Identitas Kependudukan',
    category: 'civil_disdukcapil',
    owner: 'both',
    status: 'verified',
    notes: 'Scan legalisir dan arsip digital kedua mempelai.',
  },
];

const docCategories = ['Semua', 'Gereja Katolik', 'Sipil Disdukcapil'];

export default function DocumentsScreen() {
  const [docs, setDocs] = useState<DocumentItem[]>(initialDocuments);
  const [catIndex, setCatIndex] = useState(0);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentItem['category']>('church_canonical');
  const [docOwner, setDocOwner] = useState<DocumentItem['owner']>('both');
  const [docIssueDate, setDocIssueDate] = useState('');
  const [docStatus, setDocStatus] = useState<DocumentItem['status']>('verified');
  const [docNotes, setDocNotes] = useState('');

  // Single tap: cycle status
  const toggleDocStatus = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const order: DocumentItem['status'][] = ['verified', 'pending', 'expired'];
        const nextStatus = order[(order.indexOf(d.status) + 1) % order.length];
        return { ...d, status: nextStatus };
      })
    );
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingId(null);
    setDocTitle('');
    setDocType('Kanonik Katolik');
    setDocCategory(catIndex === 2 ? 'civil_disdukcapil' : 'church_canonical');
    setDocOwner('both');
    setDocIssueDate('');
    setDocStatus('verified');
    setDocNotes('');
    setModalVisible(true);
  };

  // Open Edit Modal on Long Press
  const openEditModal = (d: DocumentItem) => {
    setEditingId(d.id);
    setDocTitle(d.title);
    setDocType(d.documentType);
    setDocCategory(d.category);
    setDocOwner(d.owner);
    setDocIssueDate(d.issueDate || '');
    setDocStatus(d.status);
    setDocNotes(d.notes || '');
    setModalVisible(true);
  };

  // Save Document
  const handleSaveDoc = () => {
    if (!docTitle.trim()) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingId) {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                title: docTitle.trim(),
                documentType: docType.trim() || 'Dokumen Persyaratan',
                category: docCategory,
                owner: docOwner,
                issueDate: docIssueDate.trim() || undefined,
                status: docStatus,
                notes: docNotes.trim() || undefined,
              }
            : d
        )
      );
    } else {
      const newDoc: DocumentItem = {
        id: Date.now().toString(),
        title: docTitle.trim(),
        documentType: docType.trim() || 'Dokumen Persyaratan',
        category: docCategory,
        owner: docOwner,
        issueDate: docIssueDate.trim() || undefined,
        status: docStatus,
        notes: docNotes.trim() || undefined,
      };
      setDocs((prev) => [newDoc, ...prev]);
    }
    setModalVisible(false);
  };

  // Delete Document
  const handleDeleteDoc = () => {
    if (!editingId) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDocs((prev) => prev.filter((d) => d.id !== editingId));
    setModalVisible(false);
  };

  const verifiedCount = docs.filter((d) => d.status === 'verified').length;
  const expiredCount = docs.filter((d) => d.status === 'expired').length;
  const complianceRate = docs.length > 0 ? Math.round((verifiedCount / docs.length) * 100) : 0;

  const filteredDocs = docs.filter((d) => {
    if (catIndex === 1) return d.category === 'church_canonical';
    if (catIndex === 2) return d.category === 'civil_disdukcapil';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          kicker="Kanonik & Legal"
          title="Dokumen"
          subtitle={`${verifiedCount} dari ${docs.length} berkas siap`}
          rightElement={
            <TouchableOpacity onPress={openAddModal} activeOpacity={0.8} style={styles.addButton}>
              <Ionicons name="add" size={18} color={colors.textLight} />
              <Text style={styles.addButtonText}>Dokumen</Text>
            </TouchableOpacity>
          }
        />

        {/* Compliance Hero */}
        <FadeInView delay={30}>
          <Card variant="elevated">
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Kesiapan Berkas</Text>
              <Text style={styles.percentValue}>{complianceRate}%</Text>
            </View>
            <ProgressBar progress={complianceRate} height={7} style={{ marginVertical: 10 }} />
            <Text style={styles.cardSub}>
              {expiredCount > 0
                ? `${expiredCount} dokumen kedaluwarsa perlu pembaruan sebelum penyelidikan kanonik.`
                : 'Seluruh dokumen utama memenuhi syarat hukum kanonik & sipil.'}
            </Text>
          </Card>
        </FadeInView>

        {/* Minimalist Canon Rule Note */}
        <FadeInView delay={90}>
          <Card style={styles.canonCard}>
            <View style={styles.canonHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
              <Text style={styles.canonTitle}>Aturan Kanonik (KHK 1066–1067)</Text>
            </View>
            <Text style={styles.canonText}>
              Surat Baptis wajib diterbitkan maksimal <Text style={styles.bold}>180 hari (6 bulan)</Text>{' '}
              sebelum Hari H (10 Okt 2027) untuk memverifikasi status bebas nikah.
            </Text>
          </Card>
        </FadeInView>

        <FilterChipBar
          options={docCategories}
          selectedIndex={catIndex}
          onChange={setCatIndex}
        />

        {/* Helper Hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
          <Text style={styles.hintText}>Ketuk baris untuk status berkas • Tekan lama untuk edit / hapus</Text>
        </View>

        <FadeInView delay={150}>
          <Card style={styles.listCard}>
            {filteredDocs.map((doc, idx) => (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.7}
                onPress={() => toggleDocStatus(doc.id)}
                onLongPress={() => openEditModal(doc)}
                delayLongPress={300}
                style={[styles.docRow, idx === filteredDocs.length - 1 && styles.rowLast]}
              >
                <View style={styles.docHeader}>
                  <View style={styles.docTitleCol}>
                    <Text style={styles.docTitle} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <Text style={styles.docMeta}>
                      {doc.documentType} •{' '}
                      {doc.owner === 'groom' ? 'Octa' : doc.owner === 'bride' ? 'Jenesia' : 'Berdua'}
                      {doc.issueDate ? ` • ${doc.issueDate}` : ''}
                    </Text>
                  </View>
                  <Badge
                    label={
                      doc.status === 'verified'
                        ? 'Sah'
                        : doc.status === 'expired'
                        ? 'Kedaluwarsa'
                        : 'Pending'
                    }
                    variant={
                      doc.status === 'verified'
                        ? 'success'
                        : doc.status === 'expired'
                        ? 'warning'
                        : 'neutral'
                    }
                  />
                </View>
                {doc.notes ? <Text style={styles.docNotes}>{doc.notes}</Text> : null}
              </TouchableOpacity>
            ))}
          </Card>
        </FadeInView>
      </ScrollView>

      {/* Document Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>{editingId ? 'Edit Dokumen Persyaratan' : 'Tambah Dokumen Baru'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nama Dokumen *</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Surat Baptis Terbaru" placeholderTextColor={colors.textMuted} value={docTitle} onChangeText={setDocTitle} />

              <Text style={styles.fieldLabel}>Jenis Dokumen</Text>
              <TextInput style={styles.textInput} placeholder="Misal: Surat Baptis Katolik, KTP, dll" placeholderTextColor={colors.textMuted} value={docType} onChangeText={setDocType} />

              <Text style={styles.fieldLabel}>Kategori Persyaratan</Text>
              <View style={styles.optionRow}>
                <TouchableOpacity onPress={() => setDocCategory('church_canonical')} style={[styles.optionChip, docCategory === 'church_canonical' && styles.optionChipActive]}>
                  <Text style={[styles.optionChipText, docCategory === 'church_canonical' && styles.optionChipTextActive]}>Kanonik Katolik</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDocCategory('civil_disdukcapil')} style={[styles.optionChip, docCategory === 'civil_disdukcapil' && styles.optionChipActive]}>
                  <Text style={[styles.optionChipText, docCategory === 'civil_disdukcapil' && styles.optionChipTextActive]}>Sipil Disdukcapil</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Pemilik Berkas</Text>
              <View style={styles.optionRow}>
                {(['both', 'groom', 'bride'] as DocumentItem['owner'][]).map((ow) => (
                  <TouchableOpacity key={ow} onPress={() => setDocOwner(ow)} style={[styles.optionChip, docOwner === ow && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, docOwner === ow && styles.optionChipTextActive]}>
                      {ow === 'both' ? 'Bersama' : ow === 'groom' ? 'Octa' : 'Jenesia'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Tanggal Penerbitan Berkas</Text>
              <TextInput style={styles.textInput} placeholder="Misal: 12 Jul 2027 (Wajib cek 180 hari)" placeholderTextColor={colors.textMuted} value={docIssueDate} onChangeText={setDocIssueDate} />

              <Text style={styles.fieldLabel}>Status Keabsahan</Text>
              <View style={styles.optionRow}>
                {(['verified', 'pending', 'expired'] as DocumentItem['status'][]).map((st) => (
                  <TouchableOpacity key={st} onPress={() => setDocStatus(st)} style={[styles.optionChip, docStatus === st && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, docStatus === st && styles.optionChipTextActive]}>
                      {st === 'verified' ? 'Sah' : st === 'expired' ? 'Kedaluwarsa' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Catatan Tambahan</Text>
              <TextInput style={[styles.textInput, styles.notesInput]} placeholder="Misal: Hubungi sekretariat paroki asal..." placeholderTextColor={colors.textMuted} value={docNotes} onChangeText={setDocNotes} multiline numberOfLines={2} />

              <View style={styles.modalActionRow}>
                {editingId ? (
                  <TouchableOpacity onPress={handleDeleteDoc} style={styles.deleteButton} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={handleSaveDoc} style={[styles.saveButton, !docTitle.trim() && styles.saveButtonDisabled]} activeOpacity={0.8} disabled={!docTitle.trim()}>
                  <Text style={styles.saveButtonText}>Simpan Dokumen</Text>
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  percentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  canonCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: spacing.xs,
  },
  canonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  canonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  canonText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bold: {
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
  docRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  docTitleCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  docMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  docNotes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 17,
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
  notesInput: {
    minHeight: 56,
    textAlignVertical: 'top',
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
