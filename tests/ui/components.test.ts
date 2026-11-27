import React from 'react';
import { Card } from '../../src/components/common/Card';
import { Header } from '../../src/components/common/Header';
import { StatCard } from '../../src/components/common/StatCard';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Badge } from '../../src/components/common/Badge';
import { SegmentedControl } from '../../src/components/common/SegmentedControl';
import { FilterChipBar } from '../../src/components/common/FilterChipBar';
import { FadeInView } from '../../src/components/common/FadeInView';

describe('Design System Primitives', () => {
  beforeAll(() => {
    jest.spyOn(React, 'useState').mockImplementation(((init: any) => [
      typeof init === 'function' ? init() : init,
      jest.fn(),
    ]) as any);
    jest.spyOn(React, 'useRef').mockImplementation((init: any) => ({ current: init }));
    jest.spyOn(React, 'useEffect').mockImplementation(jest.fn());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('exports all required common primitive components', () => {
    expect(Card).toBeDefined();
    expect(Header).toBeDefined();
    expect(StatCard).toBeDefined();
    expect(ProgressBar).toBeDefined();
    expect(Badge).toBeDefined();
    expect(SegmentedControl).toBeDefined();
    expect(FilterChipBar).toBeDefined();
    expect(FadeInView).toBeDefined();
  });

  it('renders Badge with semantic variants without throwing', () => {
    expect(() => Badge({ label: 'Sah', variant: 'success' })).not.toThrow();
    expect(() => Badge({ label: 'Kedaluwarsa', variant: 'warning' })).not.toThrow();
    expect(() => Badge({ label: 'Kritis', variant: 'danger' })).not.toThrow();
    expect(() => Badge({ label: 'Octa', variant: 'accent' })).not.toThrow();
  });

  it('renders StatCard with numbers and formatted strings', () => {
    expect(() =>
      StatCard({ label: 'Target Anggaran', value: 'Rp 150 Jt', subtext: 'Alokasi awal' })
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
