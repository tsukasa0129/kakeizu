import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors } from '@/theme';

type Mood = 'happy' | 'wow' | 'think';

/** 「ネッコ」: a sapling mascot that guides the user, like a learning-app owl. */
export function Mascot({ size = 120, mood = 'happy' }: { size?: number; mood?: Mood }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* leaves */}
      <Path d="M60 22 C44 4, 22 12, 30 30 C38 40, 52 34, 60 26 Z" fill={colors.greenDark} />
      <Path d="M60 22 C76 4, 98 12, 90 30 C82 40, 68 34, 60 26 Z" fill={colors.green} />
      {/* body */}
      <Ellipse cx="60" cy="72" rx="36" ry="38" fill="#C98B4B" />
      <Ellipse cx="60" cy="80" rx="24" ry="24" fill="#E8B878" />
      {/* eyes */}
      <Circle cx="46" cy="62" r="11" fill="#fff" />
      <Circle cx="74" cy="62" r="11" fill="#fff" />
      {mood === 'think' ? (
        <>
          <Circle cx="49" cy="58" r="5" fill={colors.text} />
          <Circle cx="77" cy="58" r="5" fill={colors.text} />
        </>
      ) : (
        <>
          <Circle cx="47" cy="63" r={mood === 'wow' ? 6 : 5} fill={colors.text} />
          <Circle cx="75" cy="63" r={mood === 'wow' ? 6 : 5} fill={colors.text} />
          <Circle cx="49" cy="61" r="1.8" fill="#fff" />
          <Circle cx="77" cy="61" r="1.8" fill="#fff" />
        </>
      )}
      {/* mouth */}
      {mood === 'wow' ? (
        <Ellipse cx="60" cy="84" rx="6" ry="7" fill="#8A4B22" />
      ) : mood === 'think' ? (
        <Path d="M54 85 L66 83" stroke="#8A4B22" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <Path d="M50 80 Q60 92 70 80" stroke="#8A4B22" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
      {/* cheeks */}
      <Circle cx="36" cy="78" r="5" fill="#FF9FB0" opacity={0.6} />
      <Circle cx="84" cy="78" r="5" fill="#FF9FB0" opacity={0.6} />
      {/* roots / feet */}
      <Path d="M44 106 q-6 6 -12 6" stroke="#8A5A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
      <Path d="M76 106 q6 6 12 6" stroke="#8A5A2B" strokeWidth="5" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** Mascot with a speech bubble to its right. */
export function MascotSays({ text, mood, size = 84 }: { text: string; mood?: Mood; size?: number }) {
  return (
    <View style={styles.row}>
      <Mascot size={size} mood={mood} />
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bubble: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
  },
  tail: {
    position: 'absolute',
    left: -8,
    top: '50%',
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
    marginTop: -7,
  },
  text: { fontSize: 16, lineHeight: 23, color: colors.text, fontWeight: '600' },
});
