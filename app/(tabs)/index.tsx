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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { differenceInCalendarDays, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Badge } from '../../src/components/common/Badge';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { useWeddingStore } from '../../src/stores/useWeddingStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { AuthService } from '../../src/services/auth';
import { CloudSyncService, isSupabaseConfigured } from '../../src/services/cloudSyncService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DashboardScreen() {
  const router = useRouter();

  const profile = useWeddingStore((s) => s.profile);
  const tasks = useWeddingStore((s) => s.tasks);
  const categories = useWeddingStore((s) => s.categories);
  const transactions = useWeddingStore((s) => s.transactions);
  const guests = useWeddingStore((s) => s.guests);
  const documents = useWeddingStore((s) => s.documents);
  const moodboardItems = useWeddingStore((s) => s.moodboardItems);
  const updateProfile = useWeddingStore((s) => s.updateProfile);
  const hydrateFromCloud = useWeddingStore((s) => s.hydrateFromCloud);
  const resetAllData = useWeddingStore((s) => s.resetAllData);

  // Settings & Cloud Sync Modal state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  const [formGroom, setFormGroom] = useState(profile.groomName);
  const [formBride, setFormBride] = useState(profile.brideName);
  const [formParish, setFormParish] = useState(profile.parishName);
  const [formDateInput, setFormDateInput] = useState(profile.weddingDate.slice(0, 10));

  // Auth & Sync state
  const authUser = useAuthStore((s) => s.user);
  const activeWorkspace = useAuthStore((s) => s.activeWorkspace);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const cloudConfigured = isSupabaseConfigured();

  const openSettings = () => {
    setFormGroom(profile.groomName);
    setFormBride(profile.brideName);
    setFormParish(profile.parishName);
    setFormDateInput(profile.weddingDate.slice(0, 10));
    setSyncMessage(null);
    setSettingsVisible(true);
  };

  const handleLogin = async () => {
    if (!cloudConfigured) {
      setSyncMessage('Mode Offline: Tambahkan file .env Supabase untuk mengaktifkan login cloud.');
      return;
    }
    if (!loginEmail.trim() || !loginPassword) {
      setSyncMessage('Mohon isi email dan kata sandi terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await AuthService.loginWithEmail(loginEmail.trim(), loginPassword);
      if (res.user) {
        await CloudSyncService.fetchWorkspaceForUser(res.user.id);
        const syncRes = await CloudSyncService.syncNow((snapshot) => hydrateFromCloud(snapshot));
        setSyncMessage(syncRes.synced ? 'Berhasil masuk & data tersinkron!' : syncRes.message);
      }
    } catch (err: any) {
      setSyncMessage(err?.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const result = await CloudSyncService.syncNow((snapshot) => hydrateFromCloud(snapshot));
    setSyncMessage(result.message);
    setIsSyncing(false);
  };

  const handleSignOut = async () => {
    setIsSyncing(true);
    try {
      await AuthService.signOut();
    } catch {
      useAuthStore.getState().reset();
    } finally {
      setIsSyncing(false);
      setSettingsVisible(false);
      router.replace('/login');
    }
  };

  const handleSaveSettings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let nextIso = profile.weddingDate;
    const parsed = new Date(`${formDateInput.trim()}T00:00:00.000Z`);
    if (!isNaN(parsed.getTime())) {
      nextIso = parsed.toISOString();
    }
    updateProfile({
      groomName: formGroom.trim() || 'Octa',
      brideName: formBride.trim() || 'Jenesia',
      parishName: formParish.trim() || 'Paroki St. Perawan Maria',
      weddingDate: nextIso,
    });
    setSettingsVisible(false);
  };

  const handleResetData = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    resetAllData();
    setSettingsVisible(false);
  };

  const weddingDate = new Date(profile.weddingDate);
  const safeWeddingDate = isNaN(weddingDate.getTime()) ? new Date('2027-10-10T00:00:00.000Z') : weddingDate;
  const daysRemaining = Math.max(0, differenceInCalendarDays(safeWeddingDate, new Date()));
  const formattedWeddingDate = format(safeWeddingDate, 'd MMMM yyyy', { locale: id });

  // Checklist metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Guest metrics
  const confirmedAttendingPax = guests
    .filter((g) => g.rsvpStatus === 'attending')
    .reduce((acc, g) => acc + (g.actualPax > 0 ? g.actualPax : g.estimatedPax), 0);

  // Financial metrics
  const targetBudget = categories.reduce((acc, c) => acc + c.allocated, 0);
  const cashSpent = transactions
    .filter((tx) => tx.status === 'paid')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const totalCommitted = categories.reduce((acc, c) => acc + c.committed, 0);
  const overBudgetAmount = totalCommitted - targetBudget;
  const isOverBudget = overBudgetAmount > 0;

  const groomContrib = transactions
    .filter((tx) => tx.status === 'paid' && tx.paidBy === 'groom')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const brideContrib = transactions
    .filter((tx) => tx.status === 'paid' && tx.paidBy === 'bride')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const familyContrib = transactions
    .filter((tx) => tx.status === 'paid' && tx.paidBy === 'family')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Document metrics
  const expiredDocsCount = documents.filter((d) => d.status === 'expired').length;

  // Upcoming 3 uncompleted tasks sorted by earliest offsetDays
  const upcomingTasks = [...tasks]
    .filter((t) => !t.completed)
    .sort((a, b) => a.offsetDays - b.offsetDays)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={`${profile.groomName} & ${profile.brideName}`}
          subtitle={profile.parishName}
          rightElement={
            <TouchableOpacity
              onPress={openSettings}
              activeOpacity={0.75}
              style={styles.settingsButton}
              accessibilityRole="button"
              accessibilityLabel="Pengaturan Pernikahan"
            >
              <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />

        <View style={styles.weddingCard}>
          <View style={styles.weddingDetails}>
            <Text style={styles.weddingDate}>{formattedWeddingDate}</Text>
            <Text style={styles.countdownNumber}>{daysRemaining}</Text>
            <Text style={styles.countdownLabel}>hari menuju pernikahan</Text>
          </View>
          <Image
            source={require('../../assets/images/onboarding-1.jpg')}
            style={styles.weddingArt}
            resizeMode="contain"
            accessible={false}
          />
        </View>

        {/* Alert Banner if Canonical Docs Expired */}
        {expiredDocsCount > 0 ? (
          <Card onPress={() => router.push('/documents')} style={styles.alertCard}>
            <View style={styles.alertRow}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
              <Text style={styles.alertText}>
                {expiredDocsCount} dokumen kanonik kedaluwarsa perlu diperbarui
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.warning} />
            </View>
          </Card>
        ) : null}

        <View style={styles.overview}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push('/checklist')}
            style={styles.overviewItem}
            activeOpacity={0.7}
          >
            <View style={styles.overviewHeading}>
              <Text style={styles.overviewLabel}>Checklist</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.accent} />
            </View>
            <Text style={styles.overviewValue}>{completedTasks} dari {totalTasks}</Text>
            <Text style={styles.mutedSubtext}>tugas selesai</Text>
            <ProgressBar progress={progressPercent} height={4} style={styles.progressBar} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push('/guests')}
            style={styles.overviewItem}
            activeOpacity={0.7}
          >
            <View style={styles.overviewHeading}>
              <Text style={styles.overviewLabel}>Tamu</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.accent} />
            </View>
            <Text style={styles.overviewValue}>{confirmedAttendingPax}</Text>
            <Text style={styles.mutedSubtext}>konfirmasi hadir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Agenda terdekat</Text>
            <TouchableOpacity
              onPress={() => router.push('/timeline')}
              activeOpacity={0.7}
              accessibilityRole="button"
              style={styles.sectionAction}
            >
              <Text style={styles.linkText}>Lihat linimasa</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.accent} />
            </TouchableOpacity>
          </View>
          {upcomingTasks.length === 0 ? (
            <Text style={styles.emptyAgenda}>
              {totalTasks ? 'Semua tugas telah selesai.' : 'Belum ada tugas di checklist.'}
            </Text>
          ) : (
            upcomingTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => router.push('/checklist')}
                activeOpacity={0.7}
                accessibilityRole="button"
                style={styles.agendaRow}
              >
                <View style={styles.agendaLeft}>
                  <Text style={styles.agendaDate}>{task.dueDate}</Text>
                  <Text style={styles.agendaTitle}>{task.title}</Text>
                </View>
                <Badge
                  label={`H${task.offsetDays > 0 ? '+' : ''}${task.offsetDays}`}
                  variant={task.priority === 'critical' ? 'danger' : 'neutral'}
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.standaloneHeading]} accessibilityRole="header">
            Ringkasan anggaran
          </Text>
          <Card onPress={() => router.push('/budget')}>
            {isOverBudget ? (
              <Text style={styles.budgetWarning}>
                Melebihi target Rp {overBudgetAmount.toLocaleString('id-ID')}
              </Text>
            ) : null}

            <View style={styles.budgetTotals}>
              <View style={styles.budgetTotal}>
                <Text style={styles.overviewLabel}>Sudah dibayar</Text>
                <Text style={styles.budgetValue}>Rp {cashSpent.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.budgetTotal}>
                <Text style={styles.overviewLabel}>Target anggaran</Text>
                <Text style={styles.budgetValue}>Rp {targetBudget.toLocaleString('id-ID')}</Text>
              </View>
            </View>

            <View style={styles.ledgerList}>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Total Komitmen Kontrak</Text>
                <Text style={[styles.ledgerValue, isOverBudget && { color: colors.warning }]}>
                  Rp {totalCommitted.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Kontribusi {profile.groomName}</Text>
                <Text style={styles.ledgerValue}>Rp {groomContrib.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Kontribusi {profile.brideName}</Text>
                <Text style={styles.ledgerValue}>Rp {brideContrib.toLocaleString('id-ID')}</Text>
              </View>
              <View style={[styles.ledgerRow, styles.ledgerRowLast]}>
                <Text style={styles.ledgerLabel}>Dukungan Keluarga</Text>
                <Text style={styles.ledgerValue}>Rp {familyContrib.toLocaleString('id-ID')}</Text>
              </View>
            </View>
            <View style={styles.cardFooterLinkRow}>
              <Text style={styles.linkText}>Buka anggaran</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.accent} />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.standaloneHeading]} accessibilityRole="header">
            Moodboard & Referensi
          </Text>
          <Card onPress={() => router.push('/moodboard')} style={styles.moodCard}>
            {moodboardItems.some((item) => item.isFinal) ? (
              <Badge
                label={`${moodboardItems.filter((m) => m.isFinal).length} final`}
                variant="accent"
              />
            ) : null}
            <Text style={styles.mutedSubtext}>
              {moodboardItems.length === 0
                ? 'Simpan inspirasi dekorasi, busana, rias, dan foto untuk dibagikan ke vendor.'
                : `${moodboardItems.length} referensi tersimpan`}
            </Text>
            {moodboardItems.length > 0 ? (
              <View style={styles.moodPreviewRow}>
                {moodboardItems.slice(0, 4).map((m) =>
                  m.imageUrl ? (
                    <Image key={m.id} source={{ uri: m.imageUrl }} style={styles.moodPreviewThumb} />
                  ) : (
                    <View key={m.id} style={styles.moodPreviewLinkBox}>
                      <Ionicons name="link-outline" size={16} color={colors.accent} />
                    </View>
                  )
                )}
              </View>
            ) : null}
            <View style={styles.cardFooterLinkRow}>
              <Text style={styles.linkText}>Buka moodboard</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.accent} />
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Workspace Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSettingsVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalHeading}>Pengaturan & Sinkronisasi</Text>

            <SegmentedControl
              options={['Profil & Hari H', 'Akun & Cloud Sync']}
              selectedIndex={settingsTab}
              onChange={setSettingsTab}
              style={{ marginBottom: 14 }}
            />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {settingsTab === 0 ? (
                <>
                  <View style={styles.syncStatusPill}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                    <Text style={styles.syncStatusText}>
                      Penyimpanan Lokal Aktif • Data tersimpan otomatis di perangkat
                    </Text>
                  </View>

                  <Text style={styles.fieldLabel}>Nama Mempelai Pria</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formGroom}
                    onChangeText={setFormGroom}
                    placeholder="Octa"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.fieldLabel}>Nama Mempelai Wanita</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formBride}
                    onChangeText={setFormBride}
                    placeholder="Jenesia"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.fieldLabel}>Paroki / Lokasi Pemberkatan</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formParish}
                    onChangeText={setFormParish}
                    placeholder="Paroki St. Perawan Maria"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.fieldLabel}>Tanggal Hari H (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formDateInput}
                    onChangeText={setFormDateInput}
                    placeholder="2027-10-10"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={styles.helperSubtext}>
                    Mengubah tanggal Hari H otomatis menggeser tenggat semua tugas yang belum selesai.
                  </Text>

                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      onPress={handleResetData}
                      style={styles.resetButton}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh-outline" size={16} color={colors.danger} />
                      <Text style={styles.resetButtonText}>Reset Default</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveSettings}
                      style={styles.saveButton}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.saveButtonText}>Simpan Profil</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.syncStatusPill}>
                    <Ionicons
                      name={cloudConfigured ? 'cloud-done-outline' : 'cloud-offline-outline'}
                      size={16}
                      color={cloudConfigured ? colors.success : colors.warning}
                    />
                    <Text style={styles.syncStatusText}>
                      {cloudConfigured
                        ? 'Supabase Cloud Terhubung • Siap sinkronisasi antar perangkat'
                        : 'Mode Lokal Offline • Tambahkan .env Supabase untuk sinkronisasi pasangan'}
                    </Text>
                  </View>

                  {isAuthenticated && authUser ? (
                    <>
                      <Text style={styles.fieldLabel}>Akun Terhubung</Text>
                      <Text style={styles.accountValue}>{authUser.email || authUser.id}</Text>
                      {activeWorkspace ? (
                        <>
                          <Text style={styles.fieldLabel}>Workspace Bersama</Text>
                          <Text style={styles.accountValue}>{activeWorkspace.name}</Text>
                        </>
                      ) : null}

                      {syncMessage ? <Text style={styles.syncFeedback}>{syncMessage}</Text> : null}

                      <View style={styles.modalActionRow}>
                        <TouchableOpacity
                          onPress={handleSignOut}
                          style={styles.resetButton}
                          activeOpacity={0.8}
                          disabled={isSyncing}
                        >
                          <Ionicons name="log-out-outline" size={16} color={colors.danger} />
                          <Text style={styles.resetButtonText}>Keluar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSyncNow}
                          style={styles.saveButton}
                          activeOpacity={0.8}
                          disabled={isSyncing}
                        >
                          <Text style={styles.saveButtonText}>
                            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.fieldLabel}>Email Pasangan</Text>
                      <TextInput
                        style={styles.textInput}
                        value={loginEmail}
                        onChangeText={setLoginEmail}
                        placeholder="octaadsp@gmail.com"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />

                      <Text style={styles.fieldLabel}>Kata Sandi</Text>
                      <TextInput
                        style={styles.textInput}
                        value={loginPassword}
                        onChangeText={setLoginPassword}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                      />

                      {syncMessage ? <Text style={styles.syncFeedback}>{syncMessage}</Text> : null}

                      <View style={styles.modalActionRow}>
                        <TouchableOpacity
                          onPress={handleLogin}
                          style={styles.saveButton}
                          activeOpacity={0.8}
                          disabled={isSyncing}
                        >
                          <Text style={styles.saveButtonText}>
                            {isSyncing ? 'Memproses...' : 'Masuk & Hubungkan Cloud'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 680,
    paddingHorizontal: 20,
    paddingBottom: spacing.xl,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weddingCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentDark,
    borderRadius: 16,
    gap: spacing.md,
    padding: 18,
    marginBottom: spacing.md,
  },
  weddingArt: {
    width: '34%',
    maxWidth: 142,
    aspectRatio: 1,
    borderRadius: 10,
  },
  weddingDetails: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
  },
  weddingDate: {
    color: colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
  },
  countdownNumber: {
    fontSize: 58,
    fontWeight: '600',
    color: colors.textLight,
    letterSpacing: -1.7,
    fontVariant: ['tabular-nums'],
    lineHeight: 66,
  },
  countdownLabel: {
    fontSize: 14,
    color: colors.accentLight,
    lineHeight: 19,
  },
  alertCard: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  overview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  overviewItem: {
    flexGrow: 1,
    flexBasis: 128,
    backgroundColor: colors.accentLight,
    borderRadius: spacing.borderRadius,
    padding: 14,
  },
  overviewHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  overviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  overviewValue: {
    fontSize: 23,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xs,
  },
  progressBar: {
    marginTop: spacing.sm,
    backgroundColor: colors.cardBg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: spacing.md,
    marginBottom: spacing.xs,
  },
  standaloneHeading: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.45,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: spacing.xs,
  },
  cardFooterLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  mutedSubtext: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  budgetTotals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  budgetTotal: {
    flexGrow: 1,
    flexBasis: 118,
    gap: spacing.xs,
  },
  budgetValue: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  budgetWarning: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: colors.warningBg,
    borderRadius: spacing.borderRadiusSm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  ledgerList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  ledgerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ledgerRowLast: {
    paddingBottom: 0,
  },
  ledgerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  ledgerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  agendaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  agendaLeft: {
    flex: 1,
    paddingRight: 10,
  },
  agendaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 3,
  },
  agendaDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyAgenda: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  // Modal styles
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
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  syncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  syncStatusText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
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
  helperSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
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
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  resetButton: {
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
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  syncFeedback: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    marginTop: 12,
    lineHeight: 17,
  },
  moodPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  moodCard: {
    backgroundColor: colors.secondaryLight,
    gap: spacing.xs,
  },
  moodPreviewThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  moodPreviewLinkBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
