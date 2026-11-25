import React from 'react';
import DashboardScreen from '../../app/(tabs)/index';
import ChecklistScreen from '../../app/(tabs)/checklist';
import BudgetScreen from '../../app/(tabs)/budget';

describe('Core Tab Screens (Dashboard, Checklist, Budget)', () => {
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

  it('exports valid React components for all core screens', () => {
    expect(DashboardScreen).toBeDefined();
    expect(typeof DashboardScreen).toBe('function');
    expect(ChecklistScreen).toBeDefined();
    expect(typeof ChecklistScreen).toBe('function');
    expect(BudgetScreen).toBeDefined();
    expect(typeof BudgetScreen).toBe('function');
  });

  it('renders DashboardScreen without throwing errors and includes Moodboard entry card', () => {
    const tree = DashboardScreen();
    expect(JSON.stringify(tree)).toContain('Moodboard & Referensi');
  });

  it('renders ChecklistScreen without throwing errors', () => {
    expect(() => ChecklistScreen()).not.toThrow();
  });

  it('renders BudgetScreen without throwing errors', () => {
    expect(() => BudgetScreen()).not.toThrow();
  });
});
