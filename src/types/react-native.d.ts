declare module 'react-native' {
  export type StyleProp<T> = T | T[] | false | null | undefined;
  export type ViewStyle = Record<string, any>;
  export type TextStyle = Record<string, any>;
  export interface ViewProps {
    style?: StyleProp<ViewStyle>;
    children?: any;
    [key: string]: any;
  }
  const RN: any;
  export const View: any;
  export const Text: any;
  export const TouchableOpacity: any;
  export const Pressable: any;
  export const ScrollView: any;
  export const Image: any;
  export const TextInput: any;
  export type NativeSyntheticEvent<T> = { nativeEvent: T };
  export type NativeScrollEvent = { contentOffset: { x: number; y: number } };
  export const Modal: any;
  export const KeyboardAvoidingView: any;
  export const StatusBar: any;
  export const StyleSheet: any;
  export const Animated: any;
  export const LayoutAnimation: any;
  export const UIManager: any;
  export const Platform: any;
  export const Dimensions: any;
  export default RN;
}

declare module '@expo/vector-icons' {
  export const Ionicons: any;
  export const Feather: any;
}
