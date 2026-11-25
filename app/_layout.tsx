import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from '../src/theme/colors';
import { supabase } from '../src/config/supabase';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useWeddingStore } from '../src/stores/useWeddingStore';
import { CloudSyncService, isSupabaseConfigured } from '../src/services/cloudSyncService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  const hasSeenOnboarding = useWeddingStore((s) => s.hasSeenOnboarding);
  const hydrateFromCloud = useWeddingStore((s) => s.hydrateFromCloud);
  const activeWorkspace = useAuthStore((s) => s.activeWorkspace);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOfflineMode = useAuthStore((s) => s.isOfflineMode);

  // Restore existing Supabase session & pull initial workspace snapshot
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            useAuthStore.getState().setUser(data.session.user);
            useAuthStore.getState().setSession(data.session);
            const ws = await CloudSyncService.fetchWorkspaceForUser(data.session.user.id);
            if (ws) {
              await CloudSyncService.syncNow((snapshot) => hydrateFromCloud(snapshot));
            }
          }
        } catch {
          // Fallback silently to login/offline gate
        }
      }
      if (mounted) setIsReady(true);
    };
    init();
    return () => {
      mounted = false;
    };
  }, [hydrateFromCloud]);

  // Route Guard: Onboarding -> Login -> Main Tabs
  useEffect(() => {
    if (!isReady) return;
    const currentRoute = segments[0];

    if (!hasSeenOnboarding) {
      if (currentRoute !== 'onboarding') {
        router.replace('/onboarding');
      }
      return;
    }

    if (!isAuthenticated && !isOfflineMode) {
      if (currentRoute !== 'login' && currentRoute !== 'onboarding') {
        router.replace('/login');
      }
    }
  }, [isReady, hasSeenOnboarding, isAuthenticated, isOfflineMode, segments, router]);

  // Subscribe to Realtime changes whenever a workspace is active
  useEffect(() => {
    if (!activeWorkspace?.id || !isSupabaseConfigured()) return;

    const unsubscribe = CloudSyncService.startRealtimeSync(activeWorkspace.id, () => {
      CloudSyncService.syncNow((snapshot) => hydrateFromCloud(snapshot)).catch(() => {});
    });

    return () => {
      unsubscribe();
    };
  }, [activeWorkspace?.id, hydrateFromCloud]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <View style={styles.container}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="timeline" options={{ headerShown: false }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
