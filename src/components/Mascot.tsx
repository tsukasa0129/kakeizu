import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { PopIn, useLoop, useReducedMotion } from '@/components/Motion';
import { colors } from '@/theme';

type Mood = 'happy' | 'wow' | 'think';

const HAIR = '#2B2A3A';
const SKIN = '#FFE3C8';
const KIMONO = '#3F63C9';
const KIMONO_DARK = '#2F4DA3';
const HAKAMA = '#5B5F73';
const BAND = '#E5484D';
const MOUTH = '#8A3B2E';
const GOLD = '#F2C14E';

/** 「ちょんまげ丸」: a little samurai who guides the user through their family history. */
export function Mascot({
  size = 120,
  mood = 'happy',
  animate = false,
}: {
  size?: number;
  mood?: Mood;
  /** Idle bobbing and blinking; use on screens where the mascot is the star. */
  animate?: boolean;
}) {
  const reduced = useReducedMotion();
  const bob = useLoop(1600, animate);
  const blinking = useBlink(animate && !reduced);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.04] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });

  return (
    <Animated.View style={animate ? { transform: [{ translateY }, { rotate }] } : undefined}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* katana, worn at the hip behind the body */}
        <Path d="M22 108 L98 78" stroke="#3A2A20" strokeWidth={6} strokeLinecap="round" />
        <Path d="M92 80.5 L108 74" stroke="#1E1E28" strokeWidth={6} strokeLinecap="round" />
        <Path d="M95 79 l2 -5 M100 77 l2 -5 M105 75 l2 -5" stroke="#E8E1D0" strokeWidth={1.6} />
        <Ellipse cx="90" cy="81.5" rx="2.6" ry="6" fill={GOLD} transform="rotate(-22 90 81.5)" />

        {/* body: kimono, obi and hakama */}
        <Path d="M38 114 Q37 96 44 90 L76 90 Q83 96 82 114 Z" fill={HAKAMA} />
        <Path d="M34 104 Q34 84 60 82 Q86 84 86 104 Z" fill={KIMONO} />
        <Path d="M50 84 L60 98 L70 84" stroke="#fff" strokeWidth={5} fill="none" strokeLinejoin="round" />
        <Rect x="40" y="98" width="40" height="7" rx="3" fill={BAND} />
        {/* sleeves / arms */}
        <Ellipse cx="33" cy="96" rx="9" ry="11" fill={KIMONO_DARK} />
        <Ellipse cx="87" cy="96" rx="9" ry="11" fill={KIMONO_DARK} />
        <Circle cx="33" cy="105" r="4.5" fill={SKIN} />
        <Circle cx="87" cy="105" r="4.5" fill={SKIN} />
        {/* family crest: a sprout, for the family tree */}
        <Circle cx="72" cy="92" r="4.2" fill="#fff" />
        <Path d="M72 94.5 V91 M72 91 q-3 -2.5 -3.4 0.4 q2 1.2 3.4 -0.4 M72 91 q3 -2.5 3.4 0.4 q-2 1.2 -3.4 -0.4" stroke={colors.green} strokeWidth={1.1} fill={colors.green} />
        {/* feet */}
        <Ellipse cx="50" cy="115" rx="7" ry="3.5" fill="#fff" />
        <Ellipse cx="70" cy="115" rx="7" ry="3.5" fill="#fff" />

        {/* head */}
        <Circle cx="60" cy="54" r="30" fill={SKIN} />
        {/* hair and topknot (chonmage) */}
        <Path d="M30 56 Q28 24 60 23 Q92 24 90 56 Q88 42 76 38 Q60 34 44 38 Q32 42 30 56 Z" fill={HAIR} />
        <Path d="M53 24 Q52 11 60 9 Q68 11 67 24 Z" fill={HAIR} />
        <Rect x="54" y="18" width="12" height="4" rx="2" fill="#fff" />
        {/* headband (hachimaki) with its knot tails */}
        <Path d="M30.5 47 Q60 36 89.5 47 L89.8 53 Q60 42 30.2 53 Z" fill={BAND} />
        <Circle cx="60" cy="42.5" r="3.4" fill="#fff" />
        <Path d="M89 48 Q99 42 104 46 Q98 48 96 52 Z" fill={BAND} />
        <Path d="M89 51 Q97 54 100 60 Q94 58 90 56 Z" fill={BAND} />

        {/* eyebrows: short and determined */}
        <Path d="M42 53.8 L51 55.4" stroke={HAIR} strokeWidth={2.6} strokeLinecap="round" />
        <Path d="M78 53.8 L69 55.4" stroke={HAIR} strokeWidth={2.6} strokeLinecap="round" />

        <Eyes mood={mood} blinking={blinking} />

        {/* cheeks */}
        <Ellipse cx="41" cy="71" rx="5.5" ry="3.5" fill="#FF9FB0" opacity={0.65} />
        <Ellipse cx="79" cy="71" rx="5.5" ry="3.5" fill="#FF9FB0" opacity={0.65} />

        {mood === 'wow' ? (
          <Ellipse cx="60" cy="75" rx="4.5" ry="5.5" fill={MOUTH} />
        ) : mood === 'think' ? (
          <Path d="M56 75 Q60 73 64 75" stroke={MOUTH} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        ) : (
          <Path d="M54 72.5 Q57 76.5 60 73 Q63 76.5 66 72.5" stroke={MOUTH} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </Svg>
    </Animated.View>
  );
}

function Eyes({ mood, blinking }: { mood: Mood; blinking: boolean }) {
  if (blinking) {
    return (
      <G>
        <Path d="M43 64 Q48 66.5 53 64" stroke={HAIR} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <Path d="M67 64 Q72 66.5 77 64" stroke={HAIR} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (mood === 'happy') {
    // Big glossy eyes with two highlights each.
    return (
      <G>
        <Ellipse cx="48" cy="64" rx="5.5" ry="7" fill={HAIR} />
        <Ellipse cx="72" cy="64" rx="5.5" ry="7" fill={HAIR} />
        <Circle cx="50" cy="61.5" r="2.2" fill="#fff" />
        <Circle cx="74" cy="61.5" r="2.2" fill="#fff" />
        <Circle cx="46.5" cy="67" r="1" fill="#fff" />
        <Circle cx="70.5" cy="67" r="1" fill="#fff" />
      </G>
    );
  }
  const dy = mood === 'think' ? -2.5 : 0;
  const dx = mood === 'think' ? 1.5 : 0;
  const r = mood === 'wow' ? 7.5 : 6.5;
  return (
    <G>
      <Circle cx="48" cy="64" r={r} fill="#fff" stroke={HAIR} strokeWidth={1.4} />
      <Circle cx="72" cy="64" r={r} fill="#fff" stroke={HAIR} strokeWidth={1.4} />
      <Circle cx={48 + dx} cy={64 + dy} r={mood === 'wow' ? 4.2 : 3.6} fill={HAIR} />
      <Circle cx={72 + dx} cy={64 + dy} r={mood === 'wow' ? 4.2 : 3.6} fill={HAIR} />
      <Circle cx={49.5 + dx} cy={62.5 + dy} r="1.3" fill="#fff" />
      <Circle cx={73.5 + dx} cy={62.5 + dy} r="1.3" fill="#fff" />
    </G>
  );
}

/** Closes the eyes for a moment every few seconds. */
function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let close: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setClosed(true);
      close = setTimeout(() => setClosed(false), 140);
    }, 3200);
    return () => {
      clearInterval(id);
      clearTimeout(close);
    };
  }, [enabled]);
  return closed;
}

/** Mascot with a speech bubble to its right. With `animate`, the bubble pops in and the mascot bobs. */
export function MascotSays({
  text,
  mood,
  size = 84,
  animate = false,
}: {
  text: string;
  mood?: Mood;
  size?: number;
  animate?: boolean;
}) {
  const bubble = (
    <View style={styles.bubble}>
      <View style={styles.tail} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
  return (
    <View style={styles.row}>
      <Mascot size={size} mood={mood} animate={animate} />
      {animate ? (
        <PopIn delay={120} style={{ flex: 1 }}>
          {bubble}
        </PopIn>
      ) : (
        bubble
      )}
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
