import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  accentColor?: string;
  variant?: 'default' | 'highlight' | 'warning' | 'success';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function StatCard({
  label,
  value,
  subtext,
  accentColor,
  variant = 'default',
  style,
  onPress,
}: StatCardProps) {
  const content = (
    <View
      style={[
        styles.card,
        variant === 'highlight' && styles.highlightCard,
        variant === 'warning' && styles.warningCard,
        variant === 'success' && styles.successCard,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          accentColor ? { color: accentColor } : null,
          variant === 'highlight' && { color: colors.accent },
          variant === 'warning' && { color: colors.warning },
          variant === 'success' && { color: colors.success },
        ]}
      >
        {value}
      </Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: spacing.borderRadius,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    flex: 1,
  },
  highlightCard: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  warningCard: {
    borderColor: colors.warning,
    backgroundColor: colors.warningBg,
  },
  successCard: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
