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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { differenceInCalendarDays, format } from 'date-fns';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Badge } from '../../src/components/common/Badge';
import { FadeInView } from '../../src/components/common/FadeInView';
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
      setSyncMessage('Berhasil keluar dari akun cloud.');
    } catch {
      useAuthStore.getState().reset();
    } finally {
      setIsSyncing(false);
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
  const formattedWeddingDate = format(safeWeddingDate, 'dd MMM yyyy');

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
          kicker="Sakramen & Resepsi"
          title={`${profile.groomName} & ${profile.brideName}`}
          subtitle={`${formattedWeddingDate} • ${profile.parishName}`}
          rightElement={
            <TouchableOpacity
              onPress={openSettings}
              activeOpacity={0.75}
              style={styles.settingsButton}
              accessibilityLabel="Pengaturan Pernikahan"
            >
              <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />

        {/* 1. Minimalist Hero Countdown Card */}
        <FadeInView delay={40}>
          <Card variant="elevated" style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.countdownBlock}>
                <Text style={styles.countdownNumber}>{daysRemaining}</Text>
                <Text style={styles.countdownLabel}>Hari Menuju Hari H</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.heroMetricsColumn}>
                <View style={styles.heroMiniMetric}>
                  <Text style={styles.heroMiniLabel}>Checklist</Text>
                  <Text style={styles.heroMiniValue}>{progressPercent}% Siap</Text>
                </View>
                <View style={styles.heroMiniMetric}>
                  <Text style={styles.heroMiniLabel}>Tamu Hadir</Text>
                  <Text style={styles.heroMiniValue}>{confirmedAttendingPax} Pax Fix</Text>
                </View>
              </View>
            </View>
          </Card>
        </FadeInView>

        {/* Alert Banner if Canonical Docs Expired */}
        {expiredDocsCount > 0 ? (
          <FadeInView delay={70}>
            <Card onPress={() => router.push('/documents')} style={styles.alertCard}>
              <View style={styles.alertRow}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
                <Text style={styles.alertText}>
                  {expiredDocsCount} dokumen kanonik kedaluwarsa perlu diperbarui
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </Card>
          </FadeInView>
        ) : null}

        {/* 2. Smooth Progress Card */}
        <FadeInView delay={100}>
          <Card onPress={() => router.push('/checklist')}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowTitleGroup}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>Progres Persiapan</Text>
              </View>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>
            <ProgressBar progress={progressPercent} height={7} style={styles.progressBar} />
            <View style={styles.cardFooterLinkRow}>
              <Text style={styles.mutedSubtext}>
                {completedTasks} dari {totalTasks} tugas utama selesai
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </Card>
        </FadeInView>

        {/* 3. Financial Health Card */}
        <FadeInView delay={160}>
          <Card onPress={() => router.push('/budget')}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowTitleGroup}>
                <Ionicons name="wallet-outline" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>Ringkasan Anggaran</Text>
              </View>
              <Badge
                label={isOverBudget ? `Over Rp ${(overBudgetAmount / 1000000).toFixed(0)} Jt` : 'Sesuai Target'}
                variant={isOverBudget ? 'warning' : 'success'}
              />
            </View>

            <View style={styles.statGrid}>
              <StatCard
                label="Target Anggaran"
                value={`Rp ${(targetBudget / 1000000).toFixed(0)} Jt`}
              />
              <StatCard
                label="Kas Terbayar"
                value={`Rp ${(cashSpent / 1000000).toFixed(0)} Jt`}
                variant="highlight"
              />
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
          </Card>
        </FadeInView>

        {/* 4. Upcoming Deadlines */}
        <FadeInView delay={220}>
          <Card>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowTitleGroup}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>Agenda Terdekat</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/timeline')} activeOpacity={0.7}>
                <Text style={styles.linkText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {upcomingTasks.length === 0 ? (
              <Text style={styles.mutedSubtext}>Semua tugas telah diselesaikan!</Text>
            ) : (
              upcomingTasks.map((t, idx) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => router.push('/checklist')}
                  activeOpacity={0.7}
                  style={[styles.agendaRow, idx === upcomingTasks.length - 1 && styles.agendaRowLast]}
                >
                  <View style={styles.agendaLeft}>
                    <Text style={styles.agendaTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={styles.agendaDate}>{t.dueDate}</Text>
                  </View>
                  <View style={styles.agendaRight}>
                    <Badge
                      label={`H${t.offsetDays}`}
                      variant={t.priority === 'critical' ? 'danger' : 'warning'}
                    />
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Card>
        </FadeInView>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownBlock: {
    flex: 1.2,
    paddingRight: spacing.md,
  },
  countdownNumber: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 46,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: 54,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  heroMetricsColumn: {
    flex: 1,
    gap: 10,
  },
  heroMiniMetric: {
    justifyContent: 'center',
  },
  heroMiniLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  heroMiniValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  alertCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  percentText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    marginBottom: 10,
  },
  cardFooterLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mutedSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  ledgerList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  ledgerRow: {
    flexDirection: 'row',
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
    flex: 1,
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
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  agendaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  agendaLeft: {
    flex: 1,
    paddingRight: 10,
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  agendaDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  agendaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
});
