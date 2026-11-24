import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'highlight';
  onPress?: () => void;
}

export function Card({ children, style, variant = 'default', onPress }: CardProps) {
  const containerStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'highlight' && styles.highlight,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={containerStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: spacing.borderRadius,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  elevated: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  highlight: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
});
