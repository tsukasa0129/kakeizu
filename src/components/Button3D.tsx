import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

type Variant = 'primary' | 'blue' | 'secondary' | 'danger' | 'premium' | 'ghost' | 'black' | 'outline';

const VARIANTS: Record<Variant, { bg: string; edge: string; text: string; border?: string }> = {
  primary: { bg: colors.green, edge: colors.greenDark, text: '#fff' },
  blue: { bg: colors.blue, edge: colors.blueDark, text: '#fff' },
  secondary: { bg: '#fff', edge: colors.border, text: colors.blue, border: colors.border },
  danger: { bg: colors.red, edge: colors.redDark, text: '#fff' },
  premium: { bg: colors.purple, edge: colors.purpleDark, text: '#fff' },
  ghost: { bg: 'transparent', edge: 'transparent', text: colors.blue },
  black: { bg: '#000', edge: '#3A3A3C', text: '#fff' },
  outline: { bg: '#fff', edge: colors.border, text: colors.text, border: colors.border },
};

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

/** Chunky button with a darker bottom "edge" that compresses on press. */
export function Button3D({ title, onPress, variant = 'primary', disabled, style, icon }: Props) {
  const v = disabled
    ? { bg: colors.border, edge: '#CECECE', text: colors.locked, border: undefined }
    : VARIANTS[variant];
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={style}
      accessibilityRole="button"
    >
      {({ pressed }) => (
        <View style={[styles.edge, { backgroundColor: v.edge, borderRadius: radius.md }]}>
          <View
            style={[
              styles.face,
              {
                backgroundColor: v.bg,
                borderColor: v.border ?? v.bg,
                transform: [{ translateY: pressed ? 0 : -4 }],
              },
            ]}
          >
            {icon}
            <Text style={[styles.text, { color: v.text }]}>{title}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: { marginTop: 4 },
  face: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  text: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
