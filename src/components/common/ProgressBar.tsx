import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color = colors.accent,
  backgroundColor = colors.neutral,
  height = 8,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));

  return (
    <View style={[styles.container, { backgroundColor, height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: spacing.borderRadiusPill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: spacing.borderRadiusPill,
  },
});
