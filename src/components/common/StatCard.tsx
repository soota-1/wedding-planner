import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

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
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
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
      {subtext ? (
        <Text style={styles.subtext} numberOfLines={1}>
          {subtext}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={[{ flex: 1 }, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  value: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  subtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
