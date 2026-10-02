import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookOpening } from '@/components/BookOpening';
import { Icon, type IconName } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { FadeSlideIn, nativeDriver, PopIn, useCountUp, useLoop, useReducedMotion } from '@/components/Motion';
import {
  BOOK_COMPLETE_DISCOUNT_PERCENT,
  BOOK_COMPLETE_GENERATION,
  BOOK_PLANS,
  bookDiscountActive,
} from '@/data/book';
import { generationName } from '@/lib/slots';
import { colors, font, radius } from '@/theme';

// Intro pages shown right after the welcome screen, before the questions (like the welcome
// carousels of the top-grossing apps studied in Appllama). Each one sells a reason to start:
// how many ancestors you have, how far back koseki go, what meeting them gives you (heart and
// practical), that the app guides every step, how little effort it takes, and the finished tree
// printed as a real book. The web funnel (web-funnel/public/funnel.js) shows the same pages.

export const HOOK_COUNT = 6;

export function OnboardingHook({ index }: { index: number }) {
  if (index === 0) return <AncestorCount />;
  if (index === 1) return <BackInTime />;
  if (index === 2) return <Benefits />;
  if (index === 3) return <GuidedSteps />;
  if (index === 4) return <ScanToTree />;
  return <PrintedBook />;
}

export function HookDots({ index }: { index: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: HOOK_COUNT }, (_, i) => (
        <Dot key={i} active={i === index} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const t = useState(() => new Animated.Value(active ? 1 : 0))[0];
  useEffect(() => {
    Animated.spring(t, { toValue: active ? 1 : 0, friction: 6, useNativeDriver: false }).start();
  }, [t, active]);
  const width = t.interpolate({ inputRange: [0, 1], outputRange: [8, 24] });
  const backgroundColor = t.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.green] });
  return <Animated.View style={[styles.dotIndicator, { width, backgroundColor }]} />;
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <FadeSlideIn>
      <Text style={styles.title}>{children}</Text>
    </FadeSlideIn>
  );
}

// ---------- 1. How many ancestors ----------

const ROWS = [1, 2, 4, 8, 16];

function AncestorCount() {
  const count = useCountUp(1024, 1400, 1100);
  return (
    <View style={styles.page}>
      <Title>
        10代さかのぼると、{'\n'}ご先祖さまは<Text style={{ color: colors.greenDark }}>1,024人</Text>
      </Title>
      <View style={styles.visual}>
        {ROWS.map((n, row) => (
          <View key={n} style={styles.pyramidRow}>
            {Array.from({ length: n }, (_, i) => (
              <PopIn key={i} delay={200 + row * 170 + i * 22}>
                <View
                  style={[
                    styles.person,
                    { backgroundColor: n === 1 ? colors.green : i % 2 ? colors.female : colors.male },
                  ]}
                />
              </PopIn>
            ))}
          </View>
        ))}
        <Text style={styles.ellipsis}>⋮</Text>
        <View style={styles.bigCount}>
          <Text style={styles.bigCountLabel}>10代前</Text>
          <Text style={styles.bigCountValue}>{count.toLocaleString('ja-JP')}人</Text>
        </View>
      </View>
      <FadeSlideIn delay={1600}>
        <Text style={styles.body}>
          そのうち1人でも欠けていたら、{'\n'}あなたはここにいません。
        </Text>
      </FadeSlideIn>
    </View>
  );
}

// ---------- 2. How far back ----------

const ERAS = [
  { era: '令和・平成', who: 'あなた・親', color: colors.green },
  { era: '昭和', who: '祖父母', color: colors.blue },
  { era: '大正・明治', who: '曾祖父母', color: colors.purple },
  { era: '江戸', who: '高祖父母', color: colors.orange },
];

function BackInTime() {
  const twinkle = useLoop(1000);
  const scale = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.25] });
  return (
    <View style={styles.page}>
      <Title>
        戸籍をたどると、{'\n'}
        <Text style={{ color: colors.orangeDark }}>江戸時代</Text>生まれの{'\n'}ご先祖さまに出会えることも
      </Title>
      <View style={[styles.visual, { alignItems: 'stretch', gap: 0 }]}>
        {ERAS.map((e, i) => (
          <FadeSlideIn key={e.era} from="left" delay={250 + i * 260} style={styles.eraRow}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.eraDot, { backgroundColor: e.color }]} />
              {i < ERAS.length - 1 && <View style={styles.eraLine} />}
            </View>
            <View style={{ flex: 1, paddingBottom: i < ERAS.length - 1 ? 14 : 0 }}>
              <Text style={[styles.eraName, { color: e.color }]}>{e.era}</Text>
              <Text style={font.small}>{e.who}（目安）</Text>
            </View>
            {i === ERAS.length - 1 && (
              <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name="sparkles" size={24} color={colors.orange} />
              </Animated.View>
            )}
          </FadeSlideIn>
        ))}
      </View>
      <FadeSlideIn delay={1300}>
        <Text style={styles.body}>
          明治時代の古い戸籍には、江戸時代に生まれた人の名前や生年月日が書かれていることがあります。
        </Text>
      </FadeSlideIn>
    </View>
  );
}

// ---------- 3. What meeting your ancestors gives you ----------

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const HEART: { icon: IoniconName; title: string; text: string }[] = [
  { icon: 'compass', title: '「自分はどこから来たのか」がわかる', text: '名字や生まれた土地に、ちゃんと物語があったと気づけます。' },
  { icon: 'chatbubbles', title: '家族の会話が増える', text: '「ひいおじいちゃんってどんな人？」が、祖父母と話すきっかけに。' },
  { icon: 'infinite', title: '命のバトンを実感できる', text: 'だれか1人でも欠けていたら、今のあなたはいません。' },
];

const PRACTICAL: { icon: IoniconName; title: string; text: string }[] = [
  { icon: 'document-text', title: '相続の準備に役立つ', text: '相続では、亡くなった人の出生から死亡までの戸籍が必要。集めた戸籍がそのまま役立ちます。' },
  { icon: 'location', title: 'ルーツの土地がわかる', text: '本籍地から、ご先祖さまが暮らした町がわかります。旅行やお墓参りの行き先にも。' },
  { icon: 'people', title: '親戚関係がすっきり', text: '法事やお正月の「あの人はだれ？」が、家系図でひと目でわかります。' },
];

function Benefits() {
  const beat = useLoop(900);
  const scale = beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.page, { paddingVertical: 12 }]} showsVerticalScrollIndicator={false}>
      <Title>
        ご先祖さまに会うと、{'\n'}
        <Text style={{ color: colors.greenDark }}>こんないいこと</Text>があります
      </Title>

      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        <FadeSlideIn delay={200} style={styles.sectionHead}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="heart" size={20} color={colors.female} />
          </Animated.View>
          <Text style={[styles.sectionTitle, { color: '#E0569E' }]}>こころ</Text>
        </FadeSlideIn>
        {HEART.map((b, i) => (
          <BenefitRow key={b.title} {...b} tint="#FFEAF4" color="#E0569E" delay={320 + i * 140} />
        ))}
      </View>

      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        <FadeSlideIn delay={800} style={styles.sectionHead}>
          <Ionicons name="briefcase" size={20} color={colors.blue} />
          <Text style={[styles.sectionTitle, { color: colors.blueDark }]}>くらし</Text>
        </FadeSlideIn>
        {PRACTICAL.map((b, i) => (
          <BenefitRow key={b.title} {...b} tint={colors.blueLight} color={colors.blueDark} delay={920 + i * 140} />
        ))}
      </View>
    </ScrollView>
  );
}

function BenefitRow({
  icon,
  title,
  text,
  tint,
  color,
  delay,
}: {
  icon: IoniconName;
  title: string;
  text: string;
  tint: string;
  color: string;
  delay: number;
}) {
  return (
    <FadeSlideIn from="right" delay={delay} style={[styles.benefit, { backgroundColor: tint }]}>
      <View style={styles.benefitIcon}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitText}>{text}</Text>
      </View>
    </FadeSlideIn>
  );
}

// ---------- 4. The app guides every step ----------

// Only what the app really covers: src/data/guides.ts (本籍地, 広域交付 / コンビニ / 郵送, さかのぼり),
// the route quiz, the scan's "next koseki" list and the lessons.
const GUIDE_STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'pin', title: '本籍地を調べる', text: '住民票の取り方から案内' },
  { icon: 'office', title: '戸籍を取る', text: '役所・コンビニ・郵送から、あなたに合う方法を診断' },
  { icon: 'search', title: '古い戸籍をさかのぼる', text: '次に請求する戸籍をリストでお知らせ' },
  { icon: 'tree', title: '家系図を完成させる', text: 'ご先祖さまが1人ずつ埋まっていく' },
];

function GuidedSteps() {
  return (
    <View style={styles.page}>
      <Title>
        家系図の作り方も、{'\n'}戸籍の取り方も、{'\n'}
        <Text style={{ color: colors.greenDark }}>すべてアプリが案内</Text>します
      </Title>
      <View style={[styles.visual, { alignItems: 'stretch', gap: 0 }]}>
        {GUIDE_STEPS.map((step, i) => (
          <FadeSlideIn key={step.title} from="left" delay={250 + i * 220} style={styles.stepRow}>
            <View style={{ alignItems: 'center' }}>
              <View style={styles.stepIcon}>
                <Icon name={step.icon} size={22} />
              </View>
              {i < GUIDE_STEPS.length - 1 && <View style={styles.stepLine} />}
            </View>
            <View style={{ flex: 1, paddingBottom: i < GUIDE_STEPS.length - 1 ? 12 : 0 }}>
              <Text style={styles.stepTitle}>
                <Text style={{ color: colors.greenDark }}>{i + 1}. </Text>
                {step.title}
              </Text>
              <Text style={font.small}>{step.text}</Text>
            </View>
          </FadeSlideIn>
        ))}
      </View>
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        {['持ち物も申請書の書き方も、チェックリストで', '役所への電話のしかたまで、ていねいに', '旧字や和暦の読み方は、レッスンでやさしく'].map((t, i) => (
          <FadeSlideIn key={t} from="left" delay={1150 + i * 150} style={styles.point}>
            <Ionicons name="checkmark-circle" size={20} color={colors.blue} />
            <Text style={[font.body, { flex: 1, fontWeight: '700' }]}>{t}</Text>
          </FadeSlideIn>
        ))}
      </View>
    </View>
  );
}

// ---------- 5. Scan → tree ----------

const PAPER_H = 112;

function ScanToTree() {
  const reduced = useReducedMotion();
  const sweep = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (reduced) return;
    const anim = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: nativeDriver }),
    );
    anim.start();
    return () => anim.stop();
  }, [sweep, reduced]);
  const scanY = sweep.interpolate({ inputRange: [0, 1], outputRange: [4, PAPER_H - 8] });

  return (
    <View style={styles.page}>
      <Title>
        戸籍を撮るだけ。{'\n'}
        <Text style={{ color: colors.blueDark }}>AI</Text>が家系図にします
      </Title>
      <View style={[styles.visual, styles.scanRow]}>
        <View style={styles.paper}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.paperLine, { height: 40 + ((i * 17) % 30) }]} />
          ))}
          <View style={styles.scanFrame} />
          {!reduced && <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />}
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Mascot size={56} mood="wow" animate />
          <Ionicons name="arrow-forward" size={26} color={colors.blue} />
        </View>
        <View style={styles.miniTree}>
          {[
            [colors.male, colors.female, colors.male, colors.female],
            [colors.male, colors.female],
            [colors.green],
          ].map((row, r) => (
            <View key={r} style={styles.miniRow}>
              {row.map((c, i) => (
                <PopIn key={i} delay={1300 - r * 350 + i * 90}>
                  <View style={[styles.node, r > 0 && styles.nodeWide, { backgroundColor: c }]} />
                </PopIn>
              ))}
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        {['戸籍の取り方はアプリがガイド', '読みにくい旧字・手書きもAIにおまかせ', '空欄が埋まるたびにXPがもらえる'].map((t, i) => (
          <FadeSlideIn key={t} from="left" delay={400 + i * 150} style={styles.point}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            <Text style={[font.body, { flex: 1, fontWeight: '700' }]}>{t}</Text>
          </FadeSlideIn>
        ))}
      </View>
    </View>
  );
}

// ---------- 6. The finished book ----------

function PrintedBook() {
  return (
    <View style={styles.page}>
      <Title>
        完成した家系図は、{'\n'}
        <Text style={{ color: colors.orangeDark }}>世界に一冊の本</Text>に
      </Title>
      <FadeSlideIn delay={150} distance={60}>
        <BookOpening />
      </FadeSlideIn>
      <View style={{ gap: 8, alignSelf: 'stretch' }}>
        {['見開きいっぱいの家系図', 'ひとりずつの人物ページと和暦つきの年表', '還暦・法事・お正月の贈りものにも'].map((t, i) => (
          <FadeSlideIn key={t} from="left" delay={500 + i * 150} style={styles.point}>
            <Ionicons name="book" size={18} color={colors.orange} />
            <Text style={[font.body, { flex: 1, fontWeight: '700' }]}>{t}</Text>
          </FadeSlideIn>
        ))}
      </View>
      {bookDiscountActive() && (
        <PopIn delay={1000} style={styles.reward}>
          <Ionicons name="gift" size={22} color={colors.orangeDark} />
          <Text style={styles.rewardText}>
            {generationName(BOOK_COMPLETE_GENERATION)}まで完成させた人は、{'\n'}製本が
            <Text style={{ color: colors.red }}>{BOOK_COMPLETE_DISCOUNT_PERCENT}%オフ</Text>に！
          </Text>
        </PopIn>
      )}
      <Text style={font.small}>製本は別途ご注文いただけます（{BOOK_PLANS[0].price}）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 24 },
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
  bigCountValue: { fontSize: 30, fontWeight: '900', color: colors.greenDark, minWidth: 110 },
  eraRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  eraDot: { width: 18, height: 18, borderRadius: 9, marginTop: 3 },
  eraLine: { width: 4, flex: 1, backgroundColor: colors.border, marginTop: 2 },
  eraName: { fontSize: 18, fontWeight: '900' },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { width: 3, flex: 1, minHeight: 10, borderRadius: 2, backgroundColor: colors.greenLight },
  stepTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  benefit: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: radius.md, alignItems: 'flex-start' },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  benefitText: { fontSize: 12, lineHeight: 17, color: colors.textMuted, marginTop: 1 },
  scanRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paper: {
    width: 88,
    height: PAPER_H,
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
  scanLine: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.blue,
    shadowColor: colors.blue,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  miniTree: { gap: 10, alignItems: 'center' },
  miniRow: { flexDirection: 'row', gap: 4 },
  node: { width: 16, height: 16, borderRadius: 4 },
  nodeWide: { width: 30 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    backgroundColor: '#FFF8EC',
  },
  rewardText: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text, lineHeight: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dotIndicator: { height: 8, borderRadius: 4 },
});
