import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent' | 'secondary';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', size = 'sm', style }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successBg, text: colors.success };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warning };
      case 'danger':
        return { bg: colors.dangerBg, text: colors.danger };
      case 'info':
        return { bg: colors.infoBg, text: colors.info };
      case 'accent':
        return { bg: colors.accentLight, text: colors.accentDark };
      case 'secondary':
        return { bg: colors.secondaryLight, text: colors.secondary };
      default:
        return { bg: colors.neutral, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'md' && styles.badgeMd,
        style,
      ]}
    >
      <Text style={[styles.text, { color: text }, size === 'md' && styles.textMd]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.borderRadiusPill,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textMd: {
    fontSize: 12,
  },
});
