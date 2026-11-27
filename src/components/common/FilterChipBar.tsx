import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface FilterChipBarProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function FilterChipBar({
  options,
  selectedIndex,
  onChange,
  style,
}: FilterChipBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={[styles.scrollContainer, style]}
    >
      {options.map((label, index) => {
        const isActive = selectedIndex === index;
        return (
          <TouchableOpacity
            key={label}
            activeOpacity={0.75}
            onPress={() => onChange(index)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    marginBottom: spacing.md,
    flexGrow: 0,
  },
  scrollContent: {
    gap: 8,
    paddingRight: spacing.md,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusPill,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accentDark,
    fontWeight: '600',
  },
});
