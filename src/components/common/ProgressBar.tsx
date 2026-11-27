import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
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
  backgroundColor = colors.surfaceMuted,
  height = 6,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clampedProgress,
      duration: 550,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  const widthInterpolate = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor, height }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolate,
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
