import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { nativeDriver, useReducedMotion } from '@/components/Motion';
import { generationOf } from '@/lib/slots';
import { colors } from '@/theme';

// The printed family-tree book opening up on the onboarding's last intro page: the cover swings
// open onto the full-spread tree, then the page turns to a person page and the wareki timeline,
// and back again. The web funnel draws the same book (web-funnel/public/art.js bookOpening()).

const W = 136; // one page
const H = 176;
const GOLD = '#E8C872';
const COVER = '#2F4A3A';
const COVER_DARK = '#1F3327';
const PAPER = '#FFFDF7';
const INK = '#5B4636';
const FAINT = '#D9CDB8';

type Page = 'cover' | 'treeL' | 'treeR' | 'person' | 'timeline' | null;
type Spread = readonly [Page, Page];

const CLOSED: Spread = [null, 'cover'];
const TREE: Spread = ['treeL', 'treeR'];
const PERSON: Spread = ['person', 'timeline'];

/** Open the cover once, then keep turning between the tree spread and the person/timeline spread. */
const STEPS: { from: Spread; to: Spread; dir: 1 | -1; wait: number }[] = [
  { from: CLOSED, to: TREE, dir: 1, wait: 500 },
  { from: TREE, to: PERSON, dir: 1, wait: 1000 },
  { from: PERSON, to: TREE, dir: -1, wait: 1000 },
];
const TURN_MS = 600;

export function BookOpening() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [turning, setTurning] = useState(false);
  const turn = useState(() => new Animated.Value(0))[0];
  const shift = useState(() => new Animated.Value(-W / 2))[0];

  useEffect(() => {
    if (reduced) return;
    const { wait } = STEPS[step];
    let anim: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      turn.setValue(0);
      setTurning(true);
      const easing = Easing.inOut(Easing.cubic);
      anim = Animated.parallel([
        Animated.timing(turn, { toValue: 1, duration: TURN_MS, easing, useNativeDriver: nativeDriver }),
        // The closed book sits centred; it slides over as it opens.
        Animated.timing(shift, { toValue: 0, duration: TURN_MS, easing, useNativeDriver: nativeDriver }),
      ]);
      anim.start(({ finished }) => {
        if (!finished) return;
        setTurning(false);
        setStep((s) => (s === STEPS.length - 1 ? 1 : s + 1));
      });
    }, wait);
    return () => {
      clearTimeout(timer);
      anim?.stop();
    };
  }, [step, reduced, turn, shift]);

  // Reduced motion: just the open book on the tree spread.
  if (reduced) return <Book shift={0}>{halves(TREE)}</Book>;

  // Idle between turns: the spread the last turn ended on (the first step starts from the closed book).
  const { from, to, dir } = STEPS[step];
  if (!turning) return <Book shift={shift}>{halves(step === 0 ? CLOSED : from)}</Book>;

  // A turn is two half-turns of a leaf around the spine: its front folds up to 90°, then its back
  // comes down on the other side. The two pages underneath are already the ones it uncovers.
  const front = turn.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [1, 1, 0, 0] });
  const back = turn.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [0, 0, 1, 1] });
  const fwd = dir === 1;
  const frontRot = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', fwd ? '-90deg' : '90deg', fwd ? '-90deg' : '90deg'] });
  const backRot = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: [fwd ? '90deg' : '-90deg', fwd ? '90deg' : '-90deg', '0deg'] });
  return (
    <Book shift={shift}>
      {fwd ? halves([from[0], to[1]]) : halves([to[0], from[1]])}
      <Leaf side={fwd ? 'right' : 'left'} rotate={frontRot} opacity={front} page={fwd ? from[1] : from[0]} />
      <Leaf side={fwd ? 'left' : 'right'} rotate={backRot} opacity={back} page={fwd ? to[0] : to[1]} />
    </Book>
  );
}

function Book({ shift, children }: { shift: number | Animated.Value; children: React.ReactNode }) {
  // The block of pages under the spread only shows once the book is open.
  const edgeOpacity = typeof shift === 'number' ? 1 : shift.interpolate({ inputRange: [-W / 2, 0], outputRange: [0, 1] });
  return (
    <Animated.View style={[styles.book, { transform: [{ translateX: shift }] }]}>
      <Animated.View style={[styles.edge, { opacity: edgeOpacity }]} />
      {children}
    </Animated.View>
  );
}

function halves([left, right]: Spread) {
  return (
    <>
      <View style={[styles.half, { left: 0 }]}>{left && <PageView page={left} />}</View>
      <View style={[styles.half, { left: W }]}>{right && <PageView page={right} />}</View>
    </>
  );
}

function Leaf({
  side,
  rotate,
  opacity,
  page,
}: {
  side: 'left' | 'right';
  rotate: Animated.AnimatedInterpolation<string>;
  opacity: Animated.AnimatedInterpolation<number>;
  page: Page;
}) {
  return (
    <Animated.View
      style={[
        styles.half,
        {
          left: side === 'left' ? 0 : W,
          opacity,
          transformOrigin: side === 'left' ? 'right center' : 'left center',
          transform: [{ perspective: 700 }, { rotateY: rotate }],
        },
      ]}
    >
      {page && <PageView page={page} />}
    </Animated.View>
  );
}

function PageView({ page }: { page: Exclude<Page, null> }) {
  if (page === 'cover') return <Cover />;
  const left = page === 'treeL' || page === 'person';
  return (
    <View style={[styles.paper, left ? styles.paperLeft : styles.paperRight]}>
      {page === 'treeL' && <TreeHalf side={0} />}
      {page === 'treeR' && <TreeHalf side={1} />}
      {page === 'person' && <PersonPage />}
      {page === 'timeline' && <TimelinePage />}
      {/* the gutter darkens towards the spine */}
      <View style={[styles.gutter, left ? { right: 0 } : { left: 0 }]} />
    </View>
  );
}

// ---------- the pages ----------

/** Ahnentafel layout (slot 1 = you) for `gens` generations across `width`. */
function pedigree(width: number, height: number, gens: number, margin: number, top = 0) {
  const pos = (slot: number) => {
    const g = generationOf(slot);
    const i = slot - 2 ** g;
    const span = 2 ** (gens - 1 - g);
    return { x: margin + g * ((width - margin * 2) / (gens - 1)), y: top + ((i * span + span / 2) * (height - top)) / 2 ** (gens - 1) };
  };
  const slots = Array.from({ length: 2 ** gens - 1 }, (_, i) => i + 1);
  const lines = slots
    .filter((s) => generationOf(s) < gens - 1)
    .map((s) => {
      const a = pos(s);
      const f = pos(s * 2);
      const m = pos(s * 2 + 1);
      const xm = (a.x + f.x) / 2;
      return `M${a.x} ${a.y} H${xm} M${xm} ${f.y} V${m.y} M${xm} ${f.y} H${f.x} M${xm} ${m.y} H${m.x}`;
    })
    .join(' ');
  return { slots, pos, lines };
}

function Cover() {
  const tree = pedigree(84, 54, 4, 4);
  return (
    <View style={styles.cover}>
      <View style={styles.coverSpine} />
      <View style={styles.coverFrame}>
        <Text style={styles.coverTitle}>わが家</Text>
        <Text style={styles.coverSub}>家 系 図</Text>
        <Svg width={84} height={54}>
          <Path d={tree.lines} stroke={GOLD} strokeOpacity={0.5} strokeWidth={1} fill="none" />
          {tree.slots.map((s) => {
            const p = tree.pos(s);
            return <Circle key={s} cx={p.x} cy={p.y} r={s === 1 ? 3.4 : 2.4} fill={GOLD} />;
          })}
        </Svg>
      </View>
    </View>
  );
}

/** One half of the full-spread tree: the same drawing, shifted so the two pages line up at the spine. */
function TreeHalf({ side }: { side: 0 | 1 }) {
  const tree = pedigree(W * 2, H - 12, 4, 22, 22);
  return (
    <View style={StyleSheet.absoluteFill}>
      {side === 0 && <Text style={styles.pageHead}>わが家の家系図</Text>}
      <Svg width={W * 2} height={H} style={{ position: 'absolute', left: -side * W, top: 0 }}>
        <Path d={tree.lines} stroke={INK} strokeOpacity={0.45} strokeWidth={0.8} fill="none" />
        {tree.slots.map((s) => {
          const p = tree.pos(s);
          const g = generationOf(s);
          const w = g === 0 ? 30 : 26;
          const fill = s === 1 ? colors.greenLight : s % 2 === 0 ? colors.blueLight : '#FFE3F3';
          return (
            <Rect key={s} x={p.x - w / 2} y={p.y - 5.5} width={w} height={11} rx={2.5} fill={fill} stroke={INK} strokeOpacity={0.35} strokeWidth={0.6} />
          );
        })}
      </Svg>
    </View>
  );
}

function PersonPage() {
  return (
    <View style={styles.pageBody}>
      <Text style={[styles.pageHead, { marginLeft: 0 }]}>曾祖父</Text>
      <View style={styles.avatar}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={4.5} fill={FAINT} />
          <Path d="M3.5 22a8.5 7.5 0 0 1 17 0z" fill={FAINT} />
        </Svg>
      </View>
      <Text style={styles.kana}>やまだ せいきち</Text>
      <Text style={styles.name}>山田 清吉</Text>
      {[
        ['生まれ', '明治12年'],
        ['出生地', '〇〇県〇〇村'],
        ['本籍', '〇〇県〇〇郡'],
      ].map(([k, v]) => (
        <View key={k} style={styles.kv}>
          <Text style={styles.k}>{k}</Text>
          <Text style={styles.v}>{v}</Text>
        </View>
      ))}
      <View style={[styles.line, { width: '90%', marginTop: 6 }]} />
      <View style={[styles.line, { width: '70%' }]} />
    </View>
  );
}

const TIMELINE = [
  { era: '明治', what: '清吉 生まれ', color: colors.orange },
  { era: '大正', what: '祖父 生まれ', color: colors.purple },
  { era: '昭和', what: '父 生まれ', color: colors.blue },
  { era: '平成', what: 'あなた 生まれ', color: colors.green },
  { era: '令和', what: '家系図 完成', color: colors.greenDark },
];

function TimelinePage() {
  return (
    <View style={styles.pageBody}>
      <Text style={[styles.pageHead, { marginLeft: 0 }]}>年表</Text>
      <View style={{ alignSelf: 'stretch', gap: 9, marginTop: 4 }}>
        {TIMELINE.map((t) => (
          <View key={t.era} style={styles.era}>
            <View style={[styles.eraBadge, { backgroundColor: t.color }]}>
              <Text style={styles.eraText}>{t.era}</Text>
            </View>
            <Text style={styles.v}>{t.what}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  book: { width: W * 2, height: H, marginVertical: 14 },
  // the block of pages under the spread
  edge: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: -5,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#EDE3CF',
    shadowColor: '#6B4A1F',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  half: { position: 'absolute', top: 0, width: W, height: H },
  paper: { flex: 1, backgroundColor: PAPER, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E6D8BC' },
  paperLeft: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  paperRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  gutter: { position: 'absolute', top: 0, bottom: 0, width: 10, backgroundColor: 'rgba(107,74,31,0.07)' },
  cover: { flex: 1, flexDirection: 'row', backgroundColor: COVER, borderRadius: 6, overflow: 'hidden' },
  coverSpine: { width: 10, backgroundColor: COVER_DARK },
  coverFrame: {
    flex: 1,
    margin: 9,
    borderWidth: 1.2,
    borderColor: GOLD,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  coverTitle: { color: GOLD, fontSize: 19, fontWeight: '900', letterSpacing: 4 },
  coverSub: { color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8, opacity: 0.85 },
  pageHead: { alignSelf: 'flex-start', fontSize: 8, fontWeight: '800', color: '#B08A3E', letterSpacing: 1, marginTop: 8, marginLeft: 12 },
  pageBody: { flex: 1, alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: FAINT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: 10,
  },
  kana: { fontSize: 6.5, color: '#9A8A74', marginTop: 6 },
  name: { fontSize: 13, fontWeight: '900', color: INK, marginBottom: 6 },
  kv: { flexDirection: 'row', alignSelf: 'stretch', gap: 6, paddingVertical: 2.5, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: FAINT },
  k: { width: 30, fontSize: 7, fontWeight: '700', color: '#9A8A74' },
  v: { fontSize: 7.5, fontWeight: '700', color: INK },
  line: { height: 3, borderRadius: 2, backgroundColor: '#EFE6D6', marginTop: 4 },
  era: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  eraBadge: { width: 30, borderRadius: 7, paddingVertical: 2, alignItems: 'center' },
  eraText: { fontSize: 7.5, fontWeight: '900', color: '#fff' },
});
