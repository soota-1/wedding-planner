process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-123456';

// React Native Mocks for Jest Node Environment
jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: ({ children, style, ...props }: any) =>
      React.createElement('View', { style, ...props }, children),
    Text: ({ children, style, ...props }: any) =>
      React.createElement('Text', { style, ...props }, children),
    TouchableOpacity: ({ children, onPress, style, ...props }: any) =>
      React.createElement('TouchableOpacity', { onPress, style, ...props }, children),
    ScrollView: ({ children, style, ...props }: any) =>
      React.createElement('ScrollView', { style, ...props }, children),
    TextInput: ({ value, onChangeText, style, ...props }: any) =>
      React.createElement('TextInput', { value, onChangeText, style, ...props }),
    Modal: ({ children, visible, ...props }: any) =>
      visible ? React.createElement('Modal', props, children) : null,
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (styles: any) =>
        Array.isArray(styles) ? Object.assign({}, ...styles.filter(Boolean)) : styles || {},
    },
    StatusBar: () => null,
    Platform: {
      OS: 'ios',
      select: (obj: any) => obj.ios || obj.default,
    },
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
    },
  };
});

// Expo Router Mocks for Jest
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => ['(tabs)'],
  Link: ({ children }: any) => children,
  Tabs: Object.assign(({ children }: any) => children, {
    Screen: () => null,
  }),
  Stack: Object.assign(({ children }: any) => children, {
    Screen: () => null,
  }),
}));

// Safe Area Context Mocks for Jest
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
