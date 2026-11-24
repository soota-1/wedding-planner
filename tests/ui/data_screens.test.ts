import React from 'react';
import GuestsScreen from '../../app/(tabs)/guests';
import DocumentsScreen from '../../app/(tabs)/documents';

describe('Data Tab Screens (Guests & Canonical Documents)', () => {
  beforeAll(() => {
    jest.spyOn(React, 'useState').mockImplementation(((init: any) => [
      typeof init === 'function' ? init() : init,
      jest.fn(),
    ]) as any);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('exports valid React components for guests and documents screens', () => {
    expect(GuestsScreen).toBeDefined();
    expect(typeof GuestsScreen).toBe('function');

    expect(DocumentsScreen).toBeDefined();
    expect(typeof DocumentsScreen).toBe('function');
  });

  it('renders GuestsScreen without throwing errors', () => {
    expect(() => GuestsScreen()).not.toThrow();
  });

  it('renders DocumentsScreen without throwing errors', () => {
    expect(() => DocumentsScreen()).not.toThrow();
  });
});
