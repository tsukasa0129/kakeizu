import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { generationOf } from '@/lib/slots';

const GOLD = '#E8C872';
const COVER = '#2F4A3A';
const COVER_DARK = '#1F3327';

/** A hardcover with the user's own pedigree stamped on it: filled slots in gold, blanks faint. */
export function BookMockup({ title, slots }: { title: string; slots: Set<number> }) {
  const W = 150;
  const H = 96;
  const GENS = 4; // you → 曾祖父母
  const pos = (slot: number) => {
    const g = generationOf(slot);
    const i = slot - 2 ** g;
    const span = 2 ** (GENS - 1 - g);
    return { x: 10 + g * ((W - 20) / (GENS - 1)), y: ((i * span + span / 2) * H) / 2 ** (GENS - 1) };
  };
  const all = Array.from({ length: 2 ** GENS - 1 }, (_, i) => i + 1);
  const lines = all
    .filter((s) => generationOf(s) < GENS - 1)
    .map((s) => {
      const a = pos(s);
      const f = pos(s * 2);
      const m = pos(s * 2 + 1);
      const xm = (a.x + f.x) / 2;
      return `M${a.x} ${a.y} H${xm} M${xm} ${f.y} V${m.y} M${xm} ${f.y} H${f.x} M${xm} ${m.y} H${m.x}`;
    })
    .join(' ');

  return (
    <View style={styles.bookWrap}>
      <View style={styles.pages} />
      <View style={styles.book}>
        <View style={styles.spine} />
        <View style={styles.cover}>
          <View style={styles.coverFrame}>
            <Text style={styles.coverTitle}>{title}</Text>
            <Text style={styles.coverSub}>家 系 図</Text>
            <Svg width={W} height={H}>
              <Path d={lines} stroke={GOLD} strokeOpacity={0.5} strokeWidth={1.2} fill="none" />
              {all.map((s) => {
                const p = pos(s);
                const filled = slots.has(s);
                return (
                  <Circle
                    key={s}
                    cx={p.x}
                    cy={p.y}
                    r={s === 1 ? 5 : 3.6}
                    fill={filled ? GOLD : COVER}
                    stroke={GOLD}
                    strokeOpacity={filled ? 1 : 0.45}
                    strokeWidth={1.2}
                  />
                );
              })}
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bookWrap: { marginVertical: 12 },
  pages: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: -8,
    bottom: -6,
    backgroundColor: '#FFFDF7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E6D8BC',
  },
  book: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#6B4A1F',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  spine: { width: 14, backgroundColor: COVER_DARK },
  cover: { backgroundColor: COVER, padding: 10 },
  coverFrame: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  coverTitle: { color: GOLD, fontSize: 20, fontWeight: '900', letterSpacing: 4 },
  coverSub: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, opacity: 0.85 },
});
