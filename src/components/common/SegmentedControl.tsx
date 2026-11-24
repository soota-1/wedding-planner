import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl({
  options,
  selectedIndex,
  onChange,
  style,
}: SegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            onPress={() => onChange(index)}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.neutral,
    borderRadius: spacing.borderRadiusPill,
    padding: 3,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.cardBg,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  textSelected: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
