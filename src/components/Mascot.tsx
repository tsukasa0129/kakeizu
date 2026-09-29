import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { PopIn, useLoop, useReducedMotion } from '@/components/Motion';
import { colors } from '@/theme';

type Mood = 'happy' | 'wow' | 'think';

const OL = '#3B2B28'; // character outline
const HAIR = '#2E2B3F';
const SKIN = '#FFE6D2';
const KIMONO = '#4A74E0';
const KIMONO_DARK = '#3659B8';
const HAKAMA = '#6A6F86';
const BAND = '#F0474F';
const MOUTH = '#C8384A';
const TONGUE = '#FF9AAE';
const GOLD = '#F6C445';
const SW = 3; // outline width

/**
 * 「ちょんまげ丸」: a chibi samurai who guides the user through their family history.
 * Big head, thick outlines and huge sparkly eyes, drawn like an anime mascot character.
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
        {/* katana on the back */}
        <Path d="M20 112 L92 84" stroke={OL} strokeWidth={9} strokeLinecap="round" />
        <Path d="M20 112 L92 84" stroke="#4A3328" strokeWidth={5} strokeLinecap="round" />
        <Path d="M96 82.5 L110 77" stroke={OL} strokeWidth={9} strokeLinecap="round" />
        <Path d="M96 82.5 L110 77" stroke="#23222E" strokeWidth={5} strokeLinecap="round" />
        <Path d="M99 80 l1.5 4 M103.5 78.3 l1.5 4 M108 76.6 l1.5 4" stroke="#F2EAD8" strokeWidth={1.4} />
        <Ellipse cx="93.5" cy="83.5" rx="3.2" ry="7" fill={GOLD} stroke={OL} strokeWidth={2} transform="rotate(-21 93.5 83.5)" />

        {/* hakama, kimono and obi */}
        <Path d="M42 117 L44 100 L76 100 L78 117 Z" fill={HAKAMA} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M60 104 V117" stroke={OL} strokeWidth={2} />
        <Path d="M35 106 Q35 87 60 85 Q85 87 85 106 Z" fill={KIMONO} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
        <Path d="M49 87 L60 101 L71 87" stroke="#fff" strokeWidth={6} fill="none" strokeLinejoin="round" />
        <Path d="M49 87 L60 101 L71 87" stroke={OL} strokeWidth={1.5} fill="none" strokeLinejoin="round" opacity={0.5} />
        <Rect x="39" y="99" width="42" height="8" rx="3.5" fill={BAND} stroke={OL} strokeWidth={SW} />
        {/* family crest: a sprout, for the family tree */}
        <Circle cx="73" cy="93" r="4.8" fill="#fff" stroke={OL} strokeWidth={1.5} />
        <Path d="M73 96 V92.4" stroke={colors.greenDark} strokeWidth={1.3} />
        <Path d="M73 92.6 q-3.4 -3 -4 0.3 q2.3 1.4 4 -0.3 Z M73 92.6 q3.4 -3 4 0.3 q-2.3 1.4 -4 -0.3 Z" fill={colors.green} />
        {/* stubby arms */}
        <Ellipse cx="33" cy="98" rx="9.5" ry="10" fill={KIMONO_DARK} stroke={OL} strokeWidth={SW} />
        <Ellipse cx="87" cy="98" rx="9.5" ry="10" fill={KIMONO_DARK} stroke={OL} strokeWidth={SW} />
        <Circle cx="31" cy="107" r="5" fill={SKIN} stroke={OL} strokeWidth={SW} />
        <Circle cx="89" cy="107" r="5" fill={SKIN} stroke={OL} strokeWidth={SW} />
        {/* tabi socks */}
        <Ellipse cx="51" cy="117" rx="7.5" ry="3.2" fill="#fff" stroke={OL} strokeWidth={2.4} />
        <Ellipse cx="69" cy="117" rx="7.5" ry="3.2" fill="#fff" stroke={OL} strokeWidth={2.4} />

        {/* topknot (chonmage) */}
        <Path d="M49 22 Q46 5 61 4 Q76 5 71 22 Z" fill={HAIR} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
        <Rect x="51" y="13" width="18" height="5" rx="2.5" fill="#fff" stroke={OL} strokeWidth={2} />
        <Path d="M56 8 Q60 6 64 8" stroke="#6B6590" strokeWidth={1.6} fill="none" strokeLinecap="round" />

        {/* big round head */}
        <Ellipse cx="60" cy="54" rx="38" ry="33" fill={SKIN} stroke={OL} strokeWidth={SW} />
        {/* hair with pointy bangs */}
        <Path
          d="M22.5 52 Q20 19 60 18 Q100 19 97.5 52 Q95 44 90 40 L87 50 Q80 41 72 42 L67 50 Q62 42 55 43 L50 50 Q44 41 36 44 L33 50 Q28 44 22.5 52 Z"
          fill={HAIR}
          stroke={OL}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <Path d="M40 25 Q52 20 64 22" stroke="#5E5885" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        {/* headband (hachimaki) with fluttering knot */}
        <Path d="M23 38 Q60 25 97 38 L97.5 45 Q60 32 22.5 45 Z" fill={BAND} stroke={OL} strokeWidth={SW} strokeLinejoin="round" />
        <Circle cx="60" cy="31.5" r="4" fill="#fff" stroke={OL} strokeWidth={1.8} />
        <Path d="M96 40 Q106 31 114 36 Q106 39 104 45 Z" fill={BAND} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
        <Path d="M96 43 Q106 46 111 55 Q103 53 97 49 Z" fill={BAND} stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />

        <Face mood={mood} blinking={blinking} />
      </Svg>
    </Animated.View>
  );
}

function Face({ mood, blinking }: { mood: Mood; blinking: boolean }) {
  return (
    <G>
      {/* eyebrows: short, round and plucky */}
      <Path d="M37 53 Q43 50.5 49 52.5" stroke={HAIR} strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <Path d="M83 53 Q77 50.5 71 52.5" stroke={HAIR} strokeWidth={3.2} fill="none" strokeLinecap="round" />

      {blinking ? <ClosedEyes /> : mood === 'think' ? <LookUpEyes /> : <SparkleEyes big={mood === 'wow'} />}

      {/* manga blush */}
      <Ellipse cx="32" cy="72" rx="7.5" ry="4.5" fill="#FF8FA3" opacity={0.55} />
      <Ellipse cx="88" cy="72" rx="7.5" ry="4.5" fill="#FF8FA3" opacity={0.55} />
      <Path d="M28 71 l2 -3 M32 71 l2 -3 M36 71 l2 -3" stroke="#F27289" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M84 71 l2 -3 M88 71 l2 -3 M92 71 l2 -3" stroke="#F27289" strokeWidth={1.2} strokeLinecap="round" />

      {mood === 'wow' ? (
        <G>
          <Ellipse cx="60" cy="76" rx="5.5" ry="6.5" fill={MOUTH} stroke={OL} strokeWidth={2.2} />
          <Ellipse cx="60" cy="79" rx="3.2" ry="2.2" fill={TONGUE} />
        </G>
      ) : mood === 'think' ? (
        <G>
          <Path d="M55 76 Q58 73.5 61 76 Q64 78.5 66 75.5" stroke={OL} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          {/* sweat drop */}
          <Path d="M92 50 Q96 57 92 60 Q88 57 92 50 Z" fill="#9ED8FF" stroke={OL} strokeWidth={1.6} />
        </G>
      ) : (
        <G>
          <Path d="M52 72 Q60 83 68 72 Z" fill={MOUTH} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />
          <Ellipse cx="60" cy="77.5" rx="3.6" ry="2.2" fill={TONGUE} />
        </G>
      )}
    </G>
  );
}

/** Huge glossy anime eyes; `big` adds star sparkles for surprise. */
function SparkleEyes({ big }: { big: boolean }) {
  const ry = big ? 11.5 : 10.5;
  return (
    <G>
      {[44, 76].map((cx) => (
        <G key={cx}>
          <Ellipse cx={cx} cy="63" rx={big ? 9.5 : 8.5} ry={ry} fill={HAIR} />
          <Ellipse cx={cx} cy="67.5" rx={big ? 7 : 6.2} ry="5" fill="#5B4FA0" opacity={0.85} />
          <Circle cx={cx + 3.2} cy="58.5" r={big ? 4.2 : 3.8} fill="#fff" />
          <Circle cx={cx - 3} cy="68" r="1.8" fill="#fff" />
          {big && <Path d={`M${cx - 4} 60 l1.2 -3 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 Z`} fill="#fff" />}
        </G>
      ))}
    </G>
  );
}

function LookUpEyes() {
  return (
    <G>
      {[44, 76].map((cx) => (
        <G key={cx}>
          <Ellipse cx={cx} cy="63" rx="8.5" ry="10.5" fill="#fff" stroke={OL} strokeWidth={2} />
          <Ellipse cx={cx + 2.5} cy="58.5" rx="5.5" ry="6.5" fill={HAIR} />
          <Circle cx={cx + 4.5} cy="56" r="2" fill="#fff" />
        </G>
      ))}
    </G>
  );
}

/** Happy "^ ^" eyes, used for blinks. */
function ClosedEyes() {
  return (
    <G>
      <Path d="M36 65 Q44 56 52 65" stroke={HAIR} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <Path d="M68 65 Q76 56 84 65" stroke={HAIR} strokeWidth={3.4} fill="none" strokeLinecap="round" />
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
