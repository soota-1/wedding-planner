import React from 'react';
import { Platform, View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
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
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
    fontSize: 34,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  rightElement: {
    marginLeft: spacing.sm,
  },
});
