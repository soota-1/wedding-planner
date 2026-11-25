import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
          subtitle={`${verifiedCount} dari ${docs.length} berkas siap • Ketuk untuk ubah status`}
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
                ? `${expiredCount} dokumen kedaluwarsa perlu pembaruan sebelum kanonik.`
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

        <FadeInView delay={150}>
          <Card style={styles.listCard}>
            {filteredDocs.map((doc, idx) => (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.7}
                onPress={() => toggleDocStatus(doc.id)}
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
});
