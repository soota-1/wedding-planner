import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Ionicons name={focused ? active : inactive} size={20} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ringkasan',
          tabBarLabel: 'Ringkasan',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          tabBarLabel: 'Checklist',
          tabBarIcon: tabIcon('checkbox', 'checkbox-outline'),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Anggaran',
          tabBarLabel: 'Anggaran',
          tabBarIcon: tabIcon('wallet', 'wallet-outline'),
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: 'Tamu & Kado',
          tabBarLabel: 'Tamu',
          tabBarIcon: tabIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Dokumen',
          tabBarLabel: 'Dokumen',
          tabBarIcon: tabIcon('document-text', 'document-text-outline'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 46,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.accentLight,
  },
});
