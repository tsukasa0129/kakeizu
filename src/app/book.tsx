import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookMockup } from '@/components/BookMockup';
import { Button3D } from '@/components/Button3D';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import {
  BOOK_COMPLETE_COUPON,
  BOOK_COMPLETE_DISCOUNT_PERCENT,
  BOOK_COMPLETE_GENERATION,
  BOOK_FAQ,
  BOOK_ORDER_URL,
  BOOK_PLANS,
  BOOK_POINTS,
  BOOK_RECOMMENDED_PERSONS,
  BOOK_STEPS,
} from '@/data/book';
import { notify } from '@/lib/notify';
import { generationName, generationOf, slotsUpTo } from '@/lib/slots';
import { useFamily } from '@/store/family';
import { colors, font, radius } from '@/theme';

/** Landing page for the print service that turns the finished family tree into a bound book. */
export default function BookScreen() {
  const router = useRouter();
  const persons = useFamily((s) => s.persons);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const slots = useMemo(() => new Set(Object.values(persons).map((p) => p.slot)), [persons]);
  const count = slots.size;
  const deepest = Math.max(0, ...[...slots].map(generationOf));
  const familyName = Object.values(persons).find((p) => p.slot === 1)?.familyName;
  const ready = count >= BOOK_RECOMMENDED_PERSONS;
  // Completion reward: every slot up to 曾祖父母 filled unlocks the discount coupon.
  const discountSlots = slotsUpTo(BOOK_COMPLETE_GENERATION);
  const discountFilled = discountSlots.filter((x) => slots.has(x)).length;
  const discountUnlocked = !!BOOK_COMPLETE_COUPON && discountFilled === discountSlots.length;

  const order = () => {
    if (!BOOK_ORDER_URL) {
      notify('まもなく受付開始', '家系図の本の注文受付は準備中です。もうしばらくお待ちください。');
      return;
    }
    const url = discountUnlocked
      ? `${BOOK_ORDER_URL}${BOOK_ORDER_URL.includes('?') ? '&' : '?'}coupon=${encodeURIComponent(BOOK_COMPLETE_COUPON)}`
      : BOOK_ORDER_URL;
    WebBrowser.openBrowserAsync(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <LinearGradient colors={['#FFF6E5', '#FBE3BC']} style={styles.hero}>
          <SafeAreaView edges={['top']} style={{ alignItems: 'center', gap: 10 }}>
            <Pressable style={styles.close} onPress={() => router.back()} hitSlop={12} accessibilityLabel="閉じる">
              <Ionicons name="close" size={26} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.kicker}>家系図ブック</Text>
            <BookMockup title={familyName ? `${familyName}家` : 'わが家'} slots={slots} />
            <Text style={styles.heroTitle}>完成した家系図を、{'\n'}一冊の本に。</Text>
            <Text style={styles.heroSub}>
              アプリで集めたご先祖さまの記録を、{'\n'}手にとって残せる本にしてお届けします。
            </Text>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.card, ready && { borderColor: colors.green }]}>
            <View style={styles.row}>
              <Icon name="tree" size={24} />
              <Text style={font.h3}>いまの家系図で作ると</Text>
            </View>
            <View style={styles.statsRow}>
              <Stat value={`${count}人`} label="掲載する人" />
              <Stat value={generationName(deepest)} label="さかのぼれた世代" />
            </View>
            <ProgressBar value={Math.min(1, count / BOOK_RECOMMENDED_PERSONS)} />
            <Text style={font.small}>
              {ready
                ? '本にするのに十分な人数がそろっています。'
                : `祖父母まで（${BOOK_RECOMMENDED_PERSONS}人）埋まると、見ごたえのある一冊になります。あと ${BOOK_RECOMMENDED_PERSONS - count} 人！`}
            </Text>
            {!ready && (
              <Button3D title="家系図を埋める" variant="secondary" onPress={() => router.navigate('/(tabs)/tree')} />
            )}
          </View>

          {!!BOOK_COMPLETE_COUPON && (
            <View style={[styles.card, styles.rewardCard]}>
              <View style={styles.row}>
                <Icon name="gift" size={24} />
                <Text style={[font.h3, { flex: 1 }]}>
                  完成特典：製本が{BOOK_COMPLETE_DISCOUNT_PERCENT}%オフ
                </Text>
              </View>
              {discountUnlocked ? (
                <>
                  <Text style={font.body}>
                    {generationName(BOOK_COMPLETE_GENERATION)}まで完成しました！注文ページに割引が自動で適用されます。
                  </Text>
                  <View style={styles.coupon}>
                    <Text style={font.small}>クーポンコード</Text>
                    <Text selectable style={styles.couponCode}>
                      {BOOK_COMPLETE_COUPON}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={font.small}>
                    {generationName(BOOK_COMPLETE_GENERATION)}まで（{discountSlots.length}人）すべて埋めると、クーポンがもらえます。あと{' '}
                    {discountSlots.length - discountFilled} 人！
                  </Text>
                  <ProgressBar value={discountFilled / discountSlots.length} color={colors.orange} />
                </>
              )}
            </View>
          )}

          <Text style={styles.section}>こんな本ができます</Text>
          {BOOK_POINTS.map((p) => (
            <View key={p.title} style={styles.point}>
              <View style={styles.pointIcon}>
                <Icon name={p.icon} size={28} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={font.h3}>{p.title}</Text>
                <Text style={[font.body, { color: colors.textMuted }]}>{p.text}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.section}>注文の流れ</Text>
          <View style={styles.card}>
            {BOOK_STEPS.map((s, i) => (
              <View key={s.title} style={styles.step}>
                <View style={styles.stepRail}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  {i < BOOK_STEPS.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={{ flex: 1, paddingBottom: i < BOOK_STEPS.length - 1 ? 14 : 0 }}>
                  <Text style={font.h3}>{s.title}</Text>
                  <Text style={font.small}>{s.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.section}>仕様と価格</Text>
          {BOOK_PLANS.map((p) => (
            <View key={p.id} style={[styles.plan, p.recommended && { borderColor: colors.orange }]}>
              {p.recommended && (
                <View style={styles.ribbon}>
                  <Text style={styles.ribbonText}>いちばん人気</Text>
                </View>
              )}
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <Text style={font.h3}>{p.name}</Text>
                <Text style={styles.price}>{p.price}</Text>
              </View>
              {p.specs.map((s) => (
                <View key={s} style={styles.row}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                  <Text style={font.small}>{s}</Text>
                </View>
              ))}
            </View>
          ))}
          <Text style={[font.small, { textAlign: 'center' }]}>価格は税込・送料別です。ページ数は人数により変わります。</Text>

          <Text style={styles.section}>よくある質問</Text>
          {BOOK_FAQ.map((f, i) => {
            const open = openFaq === i;
            return (
              <Pressable key={f.q} style={styles.faq} onPress={() => setOpenFaq(open ? null : i)}>
                <View style={[styles.row, { alignItems: 'flex-start' }]}>
                  <Text style={[font.h3, { flex: 1, fontSize: 15 }]}>{f.q}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.locked} />
                </View>
                {open && <Text style={[font.body, { color: colors.textMuted }]}>{f.a}</Text>}
              </Pressable>
            );
          })}

          <Text style={[font.small, { textAlign: 'center', marginTop: 8 }]}>
            ご注文・お支払いは製本サービスの注文ページで行います。{'\n'}本に載るのは家系図に登録した情報だけです。
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.cta}>
        <View style={{ paddingBottom: 12 }}>
          <Button3D
            title="家系図の本を注文する"
            variant="primary"
            icon={<Ionicons name="book" size={18} color="#fff" />}
            onPress={order}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={font.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  close: { position: 'absolute', left: 0, top: 8, zIndex: 1 },
  kicker: { color: colors.orangeDark, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: colors.text, textAlign: 'center', lineHeight: 36 },
  heroSub: { ...font.body, color: colors.textMuted, textAlign: 'center' },

  body: { padding: 20, gap: 14 },
  section: { ...font.h2, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 16, gap: 10 },
  rewardCard: { borderColor: colors.orange, backgroundColor: '#FFF8EC' },
  coupon: { alignItems: 'center', gap: 2, padding: 10, borderRadius: radius.sm, backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: colors.orange },
  couponCode: { fontSize: 22, fontWeight: '900', letterSpacing: 3, color: colors.orangeDark },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.sm, padding: 12, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },

  point: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  pointIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 28 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '800' },
  stepLine: { flex: 1, width: 3, backgroundColor: colors.greenLight, marginVertical: 2 },

  plan: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    gap: 6,
    marginTop: 6,
  },
  ribbon: {
    position: 'absolute',
    top: -12,
    right: 14,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ribbonText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  price: { fontSize: 18, fontWeight: '800', color: colors.text },

  faq: { borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 12, gap: 8 },

  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
});
