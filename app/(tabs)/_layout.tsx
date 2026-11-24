import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';

// Helper icon renderer using refined unicode / emojis for crisp rendering across platforms
function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text
      style={[
        styles.iconText,
        { color: focused ? colors.accent : colors.textSecondary },
      ]}
    >
      {symbol}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.bg,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: colors.textPrimary,
        },
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Wedding Tracker',
          tabBarLabel: 'Ringkasan',
          tabBarIcon: ({ focused }) => <TabIcon symbol="💍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist Katolik & Sipil',
          tabBarLabel: 'Checklist',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Anggaran & Vendor',
          tabBarLabel: 'Anggaran',
          tabBarIcon: ({ focused }) => <TabIcon symbol="💰" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: 'Tamu, RSVP & Angpau',
          tabBarLabel: 'Tamu & Kado',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🎁" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Dokumen Kanonik & Legal',
          tabBarLabel: 'Dokumen',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📜" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconText: {
    fontSize: 20,
    lineHeight: 22,
  },
});
