import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';
import { Card } from '../src/components/common/Card';
import { FadeInView } from '../src/components/common/FadeInView';
import { AuthService } from '../src/services/auth';
import { CloudSyncService, isSupabaseConfigured } from '../src/services/cloudSyncService';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useWeddingStore } from '../src/stores/useWeddingStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hydrateFromCloud = useWeddingStore((s) => s.hydrateFromCloud);
  const enterOfflineMode = useAuthStore((s) => s.enterOfflineMode);
  const cloudReady = isSupabaseConfigured();

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!cloudReady) {
      setErrorMsg('Kredensial Supabase belum terpasang di .env. Gunakan Mode Lokal di bawah.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Mohon masukkan email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.loginWithEmail(email.trim(), password);
      if (res.user) {
        await CloudSyncService.fetchWorkspaceForUser(res.user.id);
        await CloudSyncService.syncNow((snapshot) => hydrateFromCloud(snapshot));
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Email atau kata sandi salah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineContinue = () => {
    enterOfflineMode();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Editorial Emblem Header */}
          <FadeInView delay={40}>
            <View style={styles.heroHeader}>
              <View style={styles.emblemRing}>
                <Image
                  source={require('../assets/images/onboarding-1.jpg')}
                  style={styles.emblemImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.kicker}>SAKRAL • TERATUR • BERSAMA</Text>
              <Text style={styles.title}>Wedding Tracker</Text>
              <Text style={styles.subtitle}>
                Masuk ke workspace persiapan pernikahan Octa & Jenesia
              </Text>
            </View>
          </FadeInView>

          {/* Elevated Login Form Card */}
          <FadeInView delay={120}>
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.fieldLabel}>Email Pasangan</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="octaadsp@gmail.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.fieldLabel}>Kata Sandi</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={isLoading}
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Menyinkronkan...' : 'Masuk ke Workspace'}
                </Text>
                <Ionicons name="arrow-forward" size={17} color={colors.textLight} />
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>atau</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={handleOfflineContinue}
                activeOpacity={0.75}
                style={styles.secondaryButton}
              >
                <Ionicons name="phone-portrait-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.secondaryButtonText}>Lanjutkan Mode Lokal (Offline)</Text>
              </TouchableOpacity>
            </Card>
          </FadeInView>

          {/* Footer Replay Onboarding */}
          <FadeInView delay={200}>
            <TouchableOpacity
              onPress={() => router.push('/onboarding')}
              activeOpacity={0.7}
              style={styles.replayLink}
            >
              <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
              <Text style={styles.replayText}>Lihat Pengenalan Aplikasi</Text>
            </TouchableOpacity>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emblemRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 4,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.accent,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
  formCard: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 17,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  replayLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: 8,
  },
  replayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
