import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  differenceInCalendarDays,
  subDays,
} from 'date-fns';
import { colors } from '../../theme/colors';

interface CalendarPickerProps {
  selectedDate: Date;
  weddingDate: Date;
  onSelectDate: (date: Date, offsetDays: number, formattedLabel: string) => void;
}

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const PRESETS = [
  { label: 'H-180', offset: -180 },
  { label: 'H-90', offset: -90 },
  { label: 'H-30', offset: -30 },
  { label: 'H-7', offset: -7 },
];

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  weddingDate,
  onSelectDate,
}) => {
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selectedDate));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const pickDate = (day: Date) => {
    const offset = differenceInCalendarDays(day, weddingDate);
    onSelectDate(day, offset, format(day, 'dd MMM yyyy'));
  };

  const applyPreset = (offset: number) => {
    const target = subDays(weddingDate, Math.abs(offset));
    setViewMonth(startOfMonth(target));
    onSelectDate(target, offset, format(target, 'dd MMM yyyy'));
  };

  const currentOffset = differenceInCalendarDays(selectedDate, weddingDate);

  return (
    <View style={styles.container}>
      {/* Quick Presets */}
      <View style={styles.presetRow}>
        {PRESETS.map((p) => {
          const active = currentOffset === p.offset;
          return (
            <TouchableOpacity
              key={p.label}
              onPress={() => applyPreset(p.offset)}
              style={[styles.presetChip, active && styles.presetChipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Month Switcher */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => setViewMonth((m) => subMonths(m, 1))}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>{format(viewMonth, 'MMMM yyyy')}</Text>

        <TouchableOpacity
          onPress={() => setViewMonth((m) => addMonths(m, 1))}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekLabel}>
            {w}
          </Text>
        ))}
      </View>

      {/* Day Grid */}
      <View style={styles.grid}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isWedding = isSameDay(day, weddingDate);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => pickDate(day)}
              activeOpacity={0.7}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.dayCircle,
                  isSelected && styles.dayCircleSelected,
                  !isSelected && isWedding && styles.dayCircleWedding,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !inMonth && styles.dayTextOutside,
                    isSelected && styles.dayTextSelected,
                    !isSelected && isWedding && styles.dayTextWedding,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.textLight,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.accent,
  },
  dayCircleWedding: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayTextOutside: {
    color: colors.textMuted,
    opacity: 0.45,
  },
  dayTextSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
  dayTextWedding: {
    color: colors.accent,
    fontWeight: '700',
  },
});
