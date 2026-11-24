import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Header({ title, subtitle, rightElement, style }: HeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightElement: {
    marginLeft: spacing.sm,
  },
});
