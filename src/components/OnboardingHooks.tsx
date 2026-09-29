import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { BookMockup } from '@/components/BookMockup';
import { Mascot } from '@/components/Mascot';
import { BOOK_PLANS } from '@/data/book';
import { colors, font, radius } from '@/theme';

// Intro pages shown right after the welcome screen, before the questions (like the welcome
// carousels of the top-grossing apps studied in Appllama). Each one sells a reason to start:
// how many ancestors you have, how far back koseki go, how little effort it takes, and the
// finished tree printed as a real book.

export const HOOK_COUNT = 4;

export function OnboardingHook({ index }: { index: number }) {
  if (index === 0) return <AncestorCount />;
  if (index === 1) return <BackInTime />;
  if (index === 2) return <ScanToTree />;
  return <PrintedBook />;
}

export function HookDots({ index }: { index: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: HOOK_COUNT }, (_, i) => (
        <View key={i} style={[styles.dotIndicator, i === index && styles.dotActive]} />
      ))}
    </View>
  );
}

const ROWS = [
  { label: 'あなた', n: 1 },
  { label: '1代前', n: 2 },
  { label: '2代前', n: 4 },
  { label: '3代前', n: 8 },
  { label: '4代前', n: 16 },
];

function AncestorCount() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>
        10代さかのぼると、{'\n'}ご先祖さまは<Text style={{ color: colors.greenDark }}>1,024人</Text>
      </Text>
      <View style={styles.visual}>
        {ROWS.map((r) => (
          <View key={r.label} style={styles.pyramidRow}>
            {Array.from({ length: r.n }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.person,
                  { backgroundColor: r.n === 1 ? colors.green : i % 2 ? colors.female : colors.male },
                ]}
              />
            ))}
          </View>
        ))}
        <Text style={styles.ellipsis}>⋮</Text>
        <View style={styles.bigCount}>
          <Text style={styles.bigCountLabel}>10代前</Text>
          <Text style={styles.bigCountValue}>1,024人</Text>
        </View>
      </View>
      <Text style={styles.body}>
        そのうち1人でも欠けていたら、{'\n'}あなたはここにいません。
      </Text>
    </View>
  );
}

const ERAS = [
  { era: '令和・平成', who: 'あなた・親', color: colors.green },
  { era: '昭和', who: '祖父母', color: colors.blue },
  { era: '大正・明治', who: '曾祖父母', color: colors.purple },
  { era: '江戸', who: '高祖父母', color: colors.orange },
];

function BackInTime() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>
        戸籍をたどると、{'\n'}
        <Text style={{ color: colors.orangeDark }}>江戸時代</Text>生まれの{'\n'}ご先祖さまに出会えることも
      </Text>
      <View style={[styles.visual, { alignItems: 'stretch', gap: 0 }]}>
        {ERAS.map((e, i) => (
          <View key={e.era} style={styles.eraRow}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.eraDot, { backgroundColor: e.color }]} />
              {i < ERAS.length - 1 && <View style={styles.eraLine} />}
            </View>
            <View style={{ flex: 1, paddingBottom: i < ERAS.length - 1 ? 14 : 0 }}>
              <Text style={[styles.eraName, { color: e.color }]}>{e.era}</Text>
              <Text style={font.small}>{e.who}（目安）</Text>
            </View>
            {i === ERAS.length - 1 && <Ionicons name="sparkles" size={22} color={colors.orange} />}
          </View>
        ))}
      </View>
      <Text style={styles.body}>
        明治時代の古い戸籍には、江戸時代に生まれた人の名前や生年月日が書かれていることがあります。
      </Text>
    </View>
  );
}

function ScanToTree() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>
        戸籍を撮るだけ。{'\n'}
        <Text style={{ color: colors.blueDark }}>AI</Text>が家系図にします
      </Text>
      <View style={[styles.visual, styles.scanRow]}>
        <View style={styles.paper}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.paperLine, { height: 40 + ((i * 17) % 30) }]} />
          ))}
          <View style={styles.scanFrame} />
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Mascot size={52} mood="wow" />
          <Ionicons name="arrow-forward" size={26} color={colors.blue} />
        </View>
        <View style={styles.miniTree}>
          <View style={styles.miniRow}>
            <View style={[styles.node, { backgroundColor: colors.male }]} />
            <View style={[styles.node, { backgroundColor: colors.female }]} />
            <View style={[styles.node, { backgroundColor: colors.male }]} />
            <View style={[styles.node, { backgroundColor: colors.female }]} />
          </View>
          <View style={styles.miniRow}>
            <View style={[styles.node, styles.nodeWide, { backgroundColor: colors.male }]} />
            <View style={[styles.node, styles.nodeWide, { backgroundColor: colors.female }]} />
          </View>
          <View style={styles.miniRow}>
            <View style={[styles.node, styles.nodeWide, { backgroundColor: colors.green }]} />
          </View>
        </View>
      </View>
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        {['戸籍の取り方はアプリがガイド', '読みにくい旧字・手書きもAIにおまかせ', '空欄が埋まるたびにXPがもらえる'].map((t) => (
          <View key={t} style={styles.point}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            <Text style={[font.body, { flex: 1, fontWeight: '700' }]}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const FULL_TREE = new Set(Array.from({ length: 15 }, (_, i) => i + 1));

function PrintedBook() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>
        完成した家系図は、{'\n'}
        <Text style={{ color: colors.orangeDark }}>世界に一冊の本</Text>に
      </Text>
      <BookMockup title="わが家" slots={FULL_TREE} />
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        {['見開きいっぱいの家系図', 'ひとりずつの人物ページと和暦つきの年表', '還暦・法事・お正月の贈りものにも'].map((t) => (
          <View key={t} style={styles.point}>
            <Ionicons name="book" size={18} color={colors.orange} />
            <Text style={[font.body, { flex: 1, fontWeight: '700' }]}>{t}</Text>
          </View>
        ))}
      </View>
      <Text style={font.small}>製本は別途ご注文いただけます（{BOOK_PLANS[0].price}）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 24 },
  title: { fontSize: 25, fontWeight: '900', color: colors.text, textAlign: 'center', lineHeight: 36 },
  body: { ...font.body, textAlign: 'center', color: colors.textMuted },
  visual: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
  },
  pyramidRow: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  person: { width: 13, height: 13, borderRadius: 7 },
  ellipsis: { fontSize: 22, color: colors.locked, lineHeight: 24 },
  bigCount: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bigCountLabel: { fontWeight: '800', color: colors.textMuted },
  bigCountValue: { fontSize: 30, fontWeight: '900', color: colors.greenDark },
  eraRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  eraDot: { width: 18, height: 18, borderRadius: 9, marginTop: 3 },
  eraLine: { width: 4, flex: 1, backgroundColor: colors.border, marginTop: 2 },
  eraName: { fontSize: 18, fontWeight: '900' },
  scanRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paper: {
    width: 88,
    height: 112,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    flexDirection: 'row-reverse',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
  },
  paperLine: { width: 4, borderRadius: 2, backgroundColor: '#8C8C8C' },
  scanFrame: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderWidth: 3,
    borderColor: colors.blue,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  miniTree: { gap: 10, alignItems: 'center' },
  miniRow: { flexDirection: 'row', gap: 4 },
  node: { width: 16, height: 16, borderRadius: 4 },
  nodeWide: { width: 30 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dotIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.green },
});
