import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';

interface DocumentItem {
  id: string;
  title: string;
  documentType: string;
  category: 'church_canonical' | 'civil_disdukcapil' | 'other';
  owner: 'groom' | 'bride' | 'both';
  issueDate?: string;
  ageDays?: number;
  status: 'verified' | 'pending' | 'expired' | 'rejected';
  notes?: string;
}

const initialDocuments: DocumentItem[] = [
  {
    id: 'd1',
    title: 'Surat Baptis Octa (Terbaru)',
    documentType: 'Surat Baptis Katolik',
    category: 'church_canonical',
    owner: 'groom',
    issueDate: '12 Juli 2027',
    ageDays: 90,
    status: 'verified',
    notes: 'Diterbitkan Paroki St. Antonius. Umur 90 hari (<= 180 hari). Sah untuk kanonik.',
  },
  {
    id: 'd2',
    title: 'Surat Baptis Jenesia (Perlu Pembaruan)',
    documentType: 'Surat Baptis Katolik',
    category: 'church_canonical',
    owner: 'bride',
    issueDate: '10 Januari 2027',
    ageDays: 273,
    status: 'expired',
    notes: 'Kedaluwarsa (>180 hari). Hubungi paroki tempat baptis asal untuk cetak ulang kutipan akta baptis.',
  },
  {
    id: 'd3',
    title: 'Sertifikat Kursus Persiapan Perkawinan (KPP)',
    documentType: 'Sertifikat Gereja',
    category: 'church_canonical',
    owner: 'both',
    status: 'verified',
    notes: 'Diterbitkan Komisi Kerasulan Keluarga Dekenat. Masa berlaku seumur hidup.',
  },
  {
    id: 'd4',
    title: 'Surat Pengantar Nikah Kelurahan (Formulir N1 - N4)',
    documentType: 'Dokumen Sipil',
    category: 'civil_disdukcapil',
    owner: 'both',
    status: 'verified',
    notes: 'Berkas lengkap dari RT/RW dan Kelurahan asal untuk pendaftaran Disdukcapil.',
  },
  {
    id: 'd5',
    title: 'KTP & Kartu Keluarga Kedua Mempelai',
    documentType: 'Identitas Kependudukan',
    category: 'civil_disdukcapil',
    owner: 'both',
    status: 'verified',
    notes: 'Fotokopi legalisir & scan e-KTP dan KK Octa & Jenesia.',
  },
];

export default function DocumentsScreen() {
  const totalDocs = initialDocuments.length;
  const verifiedCount = initialDocuments.filter((d) => d.status === 'verified').length;
  const expiredCount = initialDocuments.filter((d) => d.status === 'expired').length;
  const complianceRate = Math.round((verifiedCount / totalDocs) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header
        title="Dokumen Kanonik & Legal"
        subtitle="Kepatuhan Prosedur Hukum Gereja Katolik & Sipil"
        style={styles.header}
      />

      {/* 1. Indikator Kesiapan Dokumen */}
      <Card style={styles.progressCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tingkat Kesiapan Berkas</Text>
          <Text style={styles.progressNumber}>{complianceRate}%</Text>
        </View>
        <ProgressBar progress={complianceRate} color={colors.accent} height={8} />
        <Text style={styles.progressSubtext}>
          {verifiedCount} dari {totalDocs} dokumen telah terverifikasi dan memenuhi syarat sah.
        </Text>
      </Card>

      {/* 2. Banner Edukasi & Peringatan Kanonik Katolik */}
      <Card style={styles.canonicalAlertCard}>
        <View style={styles.alertHeaderRow}>
          <Text style={styles.alertIcon}>📜</Text>
          <View style={styles.alertTitleContainer}>
            <Text style={styles.alertHeading}>Aturan Kanonik Surat Baptis Katolik</Text>
            <Text style={styles.alertLaw}>Kitab Hukum Kanonik (KHK) Kanon 1066 - 1067</Text>
          </View>
        </View>
        <Text style={styles.canonicalExplainer}>
          Surat baptis untuk pernikahan Katolik{' '}
          <Text style={styles.boldText}>wajib diterbitkan maksimal 6 bulan (180 hari)</Text>{' '}
          sebelum tanggal Hari H (10 Oktober 2027). Tujuannya memastikan catatan status bebas (*status liber*)
          tidak memiliki ikatan pernikahan sebelumnya.
        </Text>
        {expiredCount > 0 ? (
          <View style={styles.warningActionBox}>
            <Text style={styles.warningActionText}>
              ⚠️ <Text style={styles.boldText}>Tindakan Diperlukan:</Text> Ditemukan {expiredCount} surat
              baptis yang telah kedaluwarsa. Mohon segera meminta cetak ulang ke sekretariat paroki asal baptis.
            </Text>
          </View>
        ) : null}
      </Card>

      {/* 3. StatCards Ringkasan Status */}
      <View style={styles.statGrid}>
        <StatCard
          label="Dokumen Terverifikasi"
          value={`${verifiedCount} Berkas`}
          subtext="Siap untuk kanonik"
          variant="success"
        />
        <StatCard
          label="Dokumen Kedaluwarsa"
          value={`${expiredCount} Berkas`}
          subtext="Perlu pembaruan segera"
          variant={expiredCount > 0 ? 'warning' : 'default'}
        />
      </View>

      {/* 4. Daftar Dokumen & Status */}
      <Card style={[styles.sectionCard, { marginTop: spacing.md }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar Berkas Perkawinan</Text>
          <Text style={styles.subtextCount}>{initialDocuments.length} Berkas</Text>
        </View>

        {initialDocuments.map((doc) => (
          <View key={doc.id} style={styles.docItem}>
            <View style={styles.docHeaderRow}>
              <View style={styles.docTitleContainer}>
                <Text style={styles.docTitle}>{doc.title}</Text>
                <Text style={styles.docType}>
                  {doc.documentType} • Milik:{' '}
                  {doc.owner === 'groom'
                    ? '🤵 Octa'
                    : doc.owner === 'bride'
                    ? '👰 Jenesia'
                    : '👫 Kedua Mempelai'}
                </Text>
              </View>
              <Badge
                label={
                  doc.status === 'verified'
                    ? '✅ SAH / VERIFIED'
                    : doc.status === 'expired'
                    ? '⚠️ KEDALUWARSA'
                    : 'MENUNGGU'
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

            {doc.issueDate ? (
              <Text style={styles.issueDateText}>
                📅 Terbit: {doc.issueDate} {doc.ageDays ? `(Umur berkas: ${doc.ageDays} hari)` : ''}
              </Text>
            ) : null}

            {doc.notes ? <Text style={styles.docNotes}>{doc.notes}</Text> : null}
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: 0,
    marginBottom: spacing.xs,
  },
  progressCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
  },
  progressSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  canonicalAlertCard: {
    padding: spacing.md,
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentDark,
  },
  alertLaw: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  canonicalExplainer: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
  },
  boldText: {
    fontWeight: '700',
  },
  warningActionBox: {
    backgroundColor: colors.cardBg,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  warningActionText: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionCard: {
    padding: spacing.md,
  },
  subtextCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  docItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docTitleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docType: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  issueDateText: {
    fontSize: 11,
    color: colors.accentDark,
    fontWeight: '500',
    marginTop: 4,
  },
  docNotes: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
