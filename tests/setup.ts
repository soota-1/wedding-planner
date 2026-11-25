process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-123456';

const reactModule = require('react');

// Minimal React Hooks dispatcher for headless component testing
const defaultDispatcher = {
  useState: (initial: any) => [typeof initial === 'function' ? initial() : initial, jest.fn()],
  useEffect: jest.fn(),
  useCallback: (fn: any) => fn,
  useMemo: (fn: any) => fn(),
  useRef: (initial: any) => ({ current: initial }),
  useContext: (ctx: any) => ctx?._currentValue || {},
  useId: () => 'mock-id',
};

const ReactSharedInternals =
  (reactModule as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ||
  (reactModule as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

if (ReactSharedInternals) {
  ReactSharedInternals.ReactCurrentDispatcher = { current: defaultDispatcher };
}

// React Native Mocks for Jest Node Environment
jest.mock('react-native', () => {
  const AnimatedValue = class {
    value: any;
    constructor(v: any) { this.value = v; }
    interpolate() { return this.value; }
    setValue(v: any) { this.value = v; }
  };
  return {
    View: ({ children, style, ...props }: any) =>
      reactModule.createElement('View', { style, ...props }, children),
    Text: ({ children, style, ...props }: any) =>
      reactModule.createElement('Text', { style, ...props }, children),
    TouchableOpacity: ({ children, onPress, style, ...props }: any) =>
      reactModule.createElement('TouchableOpacity', { onPress, style, ...props }, children),
    Pressable: ({ children, onPress, style, ...props }: any) =>
      reactModule.createElement('Pressable', { onPress, style, ...props }, typeof children === 'function' ? children({ pressed: false }) : children),
    ScrollView: ({ children, style, ...props }: any) =>
      reactModule.createElement('ScrollView', { style, ...props }, children),
    TextInput: ({ value, onChangeText, style, ...props }: any) =>
      reactModule.createElement('TextInput', { value, onChangeText, style, ...props }),
    Modal: ({ children, visible, ...props }: any) =>
      visible ? reactModule.createElement('Modal', props, children) : null,
    KeyboardAvoidingView: ({ children, style, ...props }: any) =>
      reactModule.createElement('KeyboardAvoidingView', { style, ...props }, children),
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (styles: any) =>
        Array.isArray(styles) ? Object.assign({}, ...styles.filter(Boolean)) : styles || {},
    },
    Animated: {
      Value: AnimatedValue,
      View: ({ children, style, ...props }: any) =>
        reactModule.createElement('Animated.View', { style, ...props }, children),
      timing: () => ({ start: (cb?: any) => cb && cb() }),
      spring: () => ({ start: (cb?: any) => cb && cb() }),
      parallel: () => ({ start: (cb?: any) => cb && cb() }),
    },
    LayoutAnimation: {
      configureNext: jest.fn(),
      Presets: { easeInEaseOut: {} },
    },
    UIManager: {
      setLayoutAnimationEnabledExperimental: jest.fn(),
    },
    StatusBar: () => null,
    Platform: {
      OS: 'ios',
      select: (obj: any) => obj.ios || obj.default,
    },
    Dimensions: {
      get: () => ({ width: 414, height: 896 }),
    },
  };
});

// Expo Vector Icons Mock
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, ...props }: any) =>
    reactModule.createElement('Ionicons', { name, size, color, ...props }),
  Feather: ({ name, size, color, ...props }: any) =>
    reactModule.createElement('Feather', { name, size, color, ...props }),
}));

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
  SafeAreaView: ({ children, style }: any) => reactModule.createElement('SafeAreaView', { style }, children),
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
