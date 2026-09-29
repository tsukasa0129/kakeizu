import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '@/theme';

/** Tappable answer row used by onboarding and the web funnel quiz. */
export function ChoiceOption({
  label,
  trailing,
  selected,
  onPress,
}: {
  label: string;
  trailing?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && { borderColor: colors.blue, backgroundColor: colors.blueLight }]}
    >
      <Text style={[styles.optionText, selected && { color: colors.blueDark }]}>{label}</Text>
      {trailing && <Text style={[styles.optionTrailing, selected && { color: colors.blueDark }]}>{trailing}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionText: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionTrailing: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
});
