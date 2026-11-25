import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
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
  const activeWorkspace = useAuthStore((s) => s.activeWorkspace);
  const hydrateFromCloud = useWeddingStore((s) => s.hydrateFromCloud);

  // Restore existing Supabase session & pull initial workspace snapshot
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session?.user) {
        useAuthStore.getState().setUser(data.session.user);
        useAuthStore.getState().setSession(data.session);
        const ws = await CloudSyncService.fetchWorkspaceForUser(data.session.user.id);
        if (ws) {
          await CloudSyncService.syncNow((snapshot) => hydrateFromCloud(snapshot));
        }
      }
    }).catch(() => {});
  }, [hydrateFromCloud]);

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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
