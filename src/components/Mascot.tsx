import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { PopIn, useLoop, useReducedMotion } from '@/components/Motion';
import { colors } from '@/theme';

type Mood = 'happy' | 'wow' | 'think';

const FUR = '#EBA466';
const FUR_SHADE = '#D98C4C';
const CREAM = '#FFF3E2';
const MASK = '#9C5F38'; // tanuki eye mask
const DARK = '#5B3A26'; // ears, paws, tail stripes
const INK = '#2B1C13';
const BLUSH = '#FF9FB2';
const LEAF = '#58CC02';
const LEAF_DARK = '#3F9A00';
const MOUTH = '#D9475B';
const TONGUE = '#FF9AAE';
const SPARKLE = '#FFC800';

/**
 * 「まめた」: a little mame-danuki (bean tanuki) who guides the user through their family history.
 * Drawn the way the best-loved app mascots are (Duolingo's Duo, Catzy, Manna's lamb on Appllama):
 * one soft blob for head and body, no outlines, flat fills with a single shade, big glossy eyes set
 * low on the face, and a tiny mouth. The tanuki shows in the eye mask, round ears and striped tail;
 * the shape-shifting leaf on its head doubles as the family-tree leaf.
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
        <Ellipse cx="60" cy="113" rx="30" ry="4.5" fill="#000" opacity={0.08} />

        {/* striped tail */}
        <Path d="M84 100 C100 102 112 92 110 78 C109 70 101 69 98 75 C96 80 99 86 92 90 C88 92 84 92 82 92 Z" fill={FUR} />
        <Path d="M101 72.5 C105 70 109 72.5 110 77 L103.5 79 C102.5 76.5 100.5 75.5 98.6 76 Z" fill={DARK} />
        <Path d="M97.4 82.5 L105.5 86 C104 89 101.5 91.5 98.5 93 L94 88 C96 86.6 97 84.8 97.4 82.5 Z" fill={DARK} />

        {/* round ears */}
        <Circle cx="34" cy="31" r="12.5" fill={FUR} />
        <Circle cx="86" cy="31" r="12.5" fill={FUR} />
        <Circle cx="34.5" cy="32" r="7" fill={DARK} />
        <Circle cx="85.5" cy="32" r="7" fill={DARK} />

        {/* head and body in one soft blob, with one shade on the right */}
        <Path d="M60 21 C90 21 102 41 102 66 C102 92 85 109 60 109 C35 109 18 92 18 66 C18 41 30 21 60 21 Z" fill={FUR} />
        <Path
          d="M96 46 C100.5 54 102 61 102 66 C102 92 85 109 60 109 C77 103 91 89 93 68 C94 60 95.5 52 96 46 Z"
          fill={FUR_SHADE}
          opacity={0.7}
        />
        <Ellipse cx="60" cy="98" rx="16" ry="8.5" fill={CREAM} />
        <Ellipse cx="46" cy="108" rx="8" ry="4" fill={DARK} />
        <Ellipse cx="74" cy="108" rx="8" ry="4" fill={DARK} />

        <Face mood={mood} blinking={blinking} />

        {/* the transformation leaf, also the family-tree leaf */}
        <Path d="M60 22 C56 16 52 9 55 3 C63 4 66 12 61.5 21.5 Z" fill={LEAF} />
        <Path d="M60.6 20 C58.5 15 57 10 56 6" stroke={LEAF_DARK} strokeWidth={1.4} fill="none" strokeLinecap="round" />

        {mood === 'think' && <Path d="M99 36 Q103 43 99 46 Q95 43 99 36 Z" fill="#8ED3FF" />}
        {mood === 'wow' && (
          <G>
            <Path d="M22 26 l1.6 -4 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 Z" fill={SPARKLE} />
            <Path d="M98 18 l1.2 -3 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 Z" fill={SPARKLE} />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

function Face({ mood, blinking }: { mood: Mood; blinking: boolean }) {
  return (
    <G>
      {/* tanuki eye mask and cream muzzle */}
      <Ellipse cx="43" cy="60" rx="14" ry="12" fill={MASK} transform="rotate(-14 43 60)" />
      <Ellipse cx="77" cy="60" rx="14" ry="12" fill={MASK} transform="rotate(14 77 60)" />
      <Ellipse cx="60" cy="75" rx="15" ry="11" fill={CREAM} />

      {blinking ? <ClosedEyes /> : <Eyes mood={mood} />}

      <Ellipse cx="31" cy="76" rx="5.5" ry="3.4" fill={BLUSH} opacity={0.75} />
      <Ellipse cx="89" cy="76" rx="5.5" ry="3.4" fill={BLUSH} opacity={0.75} />
      <Path d="M55.6 70 Q60 67.6 64.4 70 Q63.2 73.6 60 74.2 Q56.8 73.6 55.6 70 Z" fill={INK} />

      {mood === 'wow' ? (
        <G>
          <Ellipse cx="60" cy="79" rx="4.2" ry="4.8" fill={MOUTH} />
          <Ellipse cx="60" cy="81" rx="2.6" ry="1.8" fill={TONGUE} />
        </G>
      ) : mood === 'think' ? (
        <Path d="M55.5 78.5 Q58 77 60 78.5 Q62 80 64.5 78.5" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      ) : (
        <Path
          d="M54.5 76.5 Q57.3 80.5 60 77 Q62.7 80.5 65.5 76.5"
          stroke={INK}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </G>
  );
}

/** Big glossy eyes: white, a dark pupil and two highlights. `wow` widens them; `think` looks up. */
function Eyes({ mood }: { mood: Mood }) {
  const big = mood === 'wow';
  const look = mood === 'think' ? { x: 1.8, y: -2.6 } : { x: 0, y: 1 };
  const pupil = big ? 7.2 : 6.3;
  return (
    <G>
      {[44, 76].map((cx) => (
        <G key={cx}>
          <Ellipse cx={cx} cy="59" rx={big ? 9 : 8.2} ry={big ? 10.4 : 9.6} fill="#fff" />
          <Ellipse cx={cx + look.x} cy={59 + look.y} rx={pupil} ry={pupil + 1.2} fill={INK} />
          <Circle cx={cx + look.x + 2} cy={59 + look.y - 2.6} r={big ? 2.6 : 2.2} fill="#fff" />
          <Circle cx={cx + look.x - 2} cy={59 + look.y + 2.4} r={1} fill="#fff" />
        </G>
      ))}
    </G>
  );
}

/** Happy "^ ^" eyes, used for blinks. */
function ClosedEyes() {
  return (
    <G>
      <Path d="M38 60 Q44 54 50 60" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M70 60 Q76 54 82 60" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
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
