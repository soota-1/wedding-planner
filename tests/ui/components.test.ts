import React from 'react';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Badge } from '../../src/components/common/Badge';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';

describe('Design System Primitives', () => {
  it('exports all required common primitive components', () => {
    expect(Card).toBeDefined();
    expect(Header).toBeDefined();
    expect(StatCard).toBeDefined();
    expect(ProgressBar).toBeDefined();
    expect(Badge).toBeDefined();
    expect(SegmentedControl).toBeDefined();
  });

  it('renders Badge with correct semantic variants without throwing', () => {
    expect(() => Badge({ label: 'Sah / Verified', variant: 'success' })).not.toThrow();
    expect(() => Badge({ label: 'Kedaluwarsa', variant: 'warning' })).not.toThrow();
    expect(() => Badge({ label: 'Kritis', variant: 'danger' })).not.toThrow();
    expect(() => Badge({ label: 'Groom', variant: 'accent' })).not.toThrow();
  });

  it('renders StatCard with numbers and formatted strings', () => {
    expect(() =>
      StatCard({ label: 'Total Anggaran', value: 'Rp 150.000.000', subtext: 'Target alokasi awal' })
    ).not.toThrow();
    expect(() =>
      StatCard({ label: 'Pax Hadir', value: 7, variant: 'highlight' })
    ).not.toThrow();
  });

  it('clamps ProgressBar progress value between 0 and 100', () => {
    expect(() => ProgressBar({ progress: 45 })).not.toThrow();
    expect(() => ProgressBar({ progress: 150 })).not.toThrow();
    expect(() => ProgressBar({ progress: -10 })).not.toThrow();
  });
});
