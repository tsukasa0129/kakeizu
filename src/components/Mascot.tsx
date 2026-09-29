import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { PopIn, useLoop, useReducedMotion } from '@/components/Motion';
import { colors } from '@/theme';

type Mood = 'happy' | 'wow' | 'think';

const OL = '#3E2A1E'; // character outline
const FUR = '#C98B57';
const FUR_LIGHT = '#DDA676';
const DARK = '#5C3D29'; // ears, paws, tail stripes
const PATCH = '#7D5438'; // tanuki eye mask
const CREAM = '#FFF2DF';
const EYE = '#21160F';
const MOUTH = '#C8384A';
const TONGUE = '#FF9AAE';
const LEAF = '#58CC02';
const LEAF_DARK = '#3E9A00';
const PAPER = '#FFFBF1';
const ROLL = '#E5484D';
const SW = 3; // outline width

/**
 * 「まめた」: a little mame-danuki (bean tanuki) who guides the user through their family history.
 * Tanuki shape-shift with a leaf on the head, which doubles as the family-tree leaf; it hugs a
 * koseki scroll. Big head, thick outlines and huge sparkly eyes, drawn like a mascot character.
 */
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
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

  return (
    <Animated.View style={animate ? { transform: [{ translateY }, { rotate }] } : undefined}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* big fluffy striped tail */}
        <Path
          d="M80 104 Q113 100 112 72 Q109 58 98 62 Q90 66 92 80 Q92 92 76 94 Z"
          fill={FUR}
          stroke={OL}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <Path d="M96 64.5 Q104 60 109 66 L108.5 71 Q102 66 95 70 Z" fill={DARK} />
        <Path d="M92.5 80 Q102 78 111 82 L109.5 88 Q101 84 91.5 86.5 Z" fill={DARK} />

        {/* round body with a cream belly */}
        <Ellipse cx="60" cy="98" rx="30" ry="21" fill={FUR} stroke={OL} strokeWidth={SW} />
        <Ellipse cx="60" cy="102" rx="19" ry="14" fill={CREAM} />
        {/* paws */}
        <Ellipse cx="46" cy="117" rx="8.5" ry="3.8" fill={DARK} stroke={OL} strokeWidth={2.4} />
        <Ellipse cx="74" cy="117" rx="8.5" ry="3.8" fill={DARK} stroke={OL} strokeWidth={2.4} />

        {/* koseki scroll hugged in front */}
        <Rect x="43" y="93" width="34" height="11" rx="2" fill={PAPER} stroke={OL} strokeWidth={2.4} />
        <Path d="M55 96.5 H65 M56 100.5 H64" stroke="#B9A98F" strokeWidth={1.6} strokeLinecap="round" />
        <Rect x="39" y="91" width="6" height="15" rx="3" fill={ROLL} stroke={OL} strokeWidth={2.2} />
        <Rect x="75" y="91" width="6" height="15" rx="3" fill={ROLL} stroke={OL} strokeWidth={2.2} />
        {/* stubby arms holding it */}
        <Ellipse cx="49" cy="100" rx="5.5" ry="5" fill={DARK} stroke={OL} strokeWidth={2.6} />
        <Ellipse cx="71" cy="100" rx="5.5" ry="5" fill={DARK} stroke={OL} strokeWidth={2.6} />

        {/* round ears */}
        <Circle cx="30" cy="27" r="11" fill={FUR} stroke={OL} strokeWidth={SW} />
        <Circle cx="90" cy="27" r="11" fill={FUR} stroke={OL} strokeWidth={SW} />
        <Circle cx="30.5" cy="28" r="6" fill={DARK} />
        <Circle cx="89.5" cy="28" r="6" fill={DARK} />

        {/* big round head */}
        <Ellipse cx="60" cy="53" rx="37" ry="31" fill={FUR} stroke={OL} strokeWidth={SW} />
        <Path d="M42 28 Q60 22 78 28" stroke={FUR_LIGHT} strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* cream muzzle and cheeks */}
        <Path d="M30 64 Q34 50 48 56 Q60 52 72 56 Q86 50 90 64 Q86 82 60 82 Q34 82 30 64 Z" fill={CREAM} />

        {/* the transformation leaf, also the family-tree leaf */}
        <Path d="M58 25 Q44 16 50 3 Q66 6 61 24 Z" fill={LEAF} stroke={OL} strokeWidth={2.6} strokeLinejoin="round" />
        <Path d="M59.5 23 Q54 14 51.5 6" stroke={LEAF_DARK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        <Path d="M59 25 Q62 20 66 19" stroke={OL} strokeWidth={2} fill="none" strokeLinecap="round" />

        <Face mood={mood} blinking={blinking} />
      </Svg>
    </Animated.View>
  );
}

function Face({ mood, blinking }: { mood: Mood; blinking: boolean }) {
  return (
    <G>
      {/* tanuki eye mask */}
      <Ellipse cx="44" cy="55" rx="12.5" ry="10.5" fill={PATCH} transform="rotate(-18 44 55)" />
      <Ellipse cx="76" cy="55" rx="12.5" ry="10.5" fill={PATCH} transform="rotate(18 76 55)" />

      {blinking ? <ClosedEyes /> : mood === 'think' ? <LookUpEyes /> : <SparkleEyes big={mood === 'wow'} />}

      {/* blush */}
      <Ellipse cx="33" cy="70" rx="6.5" ry="4" fill="#FF8FA3" opacity={0.6} />
      <Ellipse cx="87" cy="70" rx="6.5" ry="4" fill="#FF8FA3" opacity={0.6} />

      {/* nose */}
      <Path d="M55 62 Q60 59.5 65 62 Q63.5 66.5 60 67 Q56.5 66.5 55 62 Z" fill={EYE} />
      <Ellipse cx="58.3" cy="62.3" rx="1.6" ry="0.9" fill="#fff" opacity={0.8} />

      {mood === 'wow' ? (
        <G>
          <Ellipse cx="60" cy="74" rx="4.8" ry="5.6" fill={MOUTH} stroke={OL} strokeWidth={2} />
          <Ellipse cx="60" cy="76.5" rx="2.8" ry="1.9" fill={TONGUE} />
        </G>
      ) : mood === 'think' ? (
        <G>
          <Path d="M54 72 Q57 69.5 60 72 Q63 74.5 66 71.5" stroke={OL} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M94 40 Q98 47 94 50 Q90 47 94 40 Z" fill="#9ED8FF" stroke={OL} strokeWidth={1.6} />
        </G>
      ) : (
        <G>
          {/* open "ω" smile */}
          <Path d="M52 69 Q56 76 60 70 Q64 76 68 69 Q66 79 60 79 Q54 79 52 69 Z" fill={MOUTH} stroke={OL} strokeWidth={2} strokeLinejoin="round" />
          <Ellipse cx="60" cy="76" rx="3.2" ry="1.9" fill={TONGUE} />
        </G>
      )}
    </G>
  );
}

/** Huge glossy eyes; `big` adds star sparkles for surprise. */
function SparkleEyes({ big }: { big: boolean }) {
  return (
    <G>
      {[45, 75].map((cx) => (
        <G key={cx}>
          <Ellipse cx={cx} cy="56" rx={big ? 7.8 : 7} ry={big ? 9.2 : 8.4} fill={EYE} />
          <Ellipse cx={cx} cy="59.5" rx={big ? 5.6 : 5} ry="3.8" fill="#8A5A36" opacity={0.9} />
          <Circle cx={cx + 2.6} cy="52.2" r={big ? 3.6 : 3.2} fill="#fff" />
          <Circle cx={cx - 2.6} cy="60" r="1.5" fill="#fff" />
          {big && <Path d={`M${cx - 3.5} 53 l1 -2.6 l1 2.6 l2.6 1 l-2.6 1 l-1 2.6 l-1 -2.6 l-2.6 -1 Z`} fill="#fff" />}
        </G>
      ))}
    </G>
  );
}

function LookUpEyes() {
  return (
    <G>
      {[45, 75].map((cx) => (
        <G key={cx}>
          <Ellipse cx={cx} cy="56" rx="7.2" ry="8.6" fill="#fff" stroke={OL} strokeWidth={1.8} />
          <Ellipse cx={cx + 2} cy="52.5" rx="4.6" ry="5.4" fill={EYE} />
          <Circle cx={cx + 3.6} cy="50.5" r="1.6" fill="#fff" />
        </G>
      ))}
    </G>
  );
}

/** Happy "^ ^" eyes, used for blinks. */
function ClosedEyes() {
  return (
    <G>
      <Path d="M38 58 Q45 50 52 58" stroke={CREAM} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <Path d="M68 58 Q75 50 82 58" stroke={CREAM} strokeWidth={3.4} fill="none" strokeLinecap="round" />
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
