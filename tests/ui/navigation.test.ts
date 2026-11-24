import React from 'react';
import RootLayout from '../../app/_layout';
import TabsLayout from '../../app/(tabs)/_layout';

describe('Expo Router Layouts', () => {
  it('exports valid React component for RootLayout', () => {
    expect(RootLayout).toBeDefined();
    expect(typeof RootLayout).toBe('function');
  });

  it('exports valid React component for TabsLayout', () => {
    expect(TabsLayout).toBeDefined();
    expect(typeof TabsLayout).toBe('function');
  });

  it('renders RootLayout without throwing errors', () => {
    expect(() => RootLayout()).not.toThrow();
  });

  it('renders TabsLayout without throwing errors', () => {
    expect(() => TabsLayout()).not.toThrow();
  });
});
