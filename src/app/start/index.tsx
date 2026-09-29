import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { ChoiceOption } from '@/components/ChoiceOption';
import { Mascot, MascotSays } from '@/components/Mascot';
import { defaultPackage, PlanPicker } from '@/components/PlanPicker';
import { ProgressBar } from '@/components/ProgressBar';
import { PRIVACY_URL, TERMS_URL } from '@/lib/links';
import { notify } from '@/lib/notify';
import { getFunnelOffering, purchaseOnWeb, setFunnelAttributes } from '@/lib/purchases';
import { colors, font, radius } from '@/theme';

const GENERATIONS = [
  { value: 1, label: '両親まで', sub: '1代前' },
  { value: 2, label: '祖父母まで', sub: '2代前' },
  { value: 3, label: '曾祖父母まで', sub: '3代前' },
  { value: 5, label: 'できるだけ遠くまで', sub: '5代前〜' },
];

const MOTIVES = ['ルーツを知りたい', '子どもに残したい', '相続の準備', 'お墓・法事のため', 'なんとなく興味'];

const EXPERIENCE = ['取ったことがある', '取ったことはない', 'そもそも戸籍がよくわからない'];

const FEATURES = [
  { icon: 'scan', text: '戸籍を撮るだけ。AIが読み取って家系図に自動配置' },
  { icon: 'map', text: '本籍地の調べ方から郵送請求まで、役所の手続きをナビ' },
  { icon: 'git-network', text: '高祖父母・5代前まで家系図を拡張' },
  { icon: 'flame', text: 'ゲーム感覚で、毎日少しずつ進められる' },
] as const;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** Ancestors from parents up to `generations` back: 2 + 4 + … + 2^n. */
const ancestorCount = (generations: number) => 2 ** (generations + 1) - 2;

/**
 * Web2app funnel (web only): short quiz → personalised plan → Stripe checkout via RevenueCat Web Billing.
 * After purchase, `/start/success` hands the buyer a Redemption Link that unlocks premium in the app.
 * Share it as `https://<web host>/start?utm_source=...`.
 */
export default function Funnel() {
  const router = useRouter();
  const params = useLocalSearchParams<Partial<Record<(typeof UTM_KEYS)[number], string>>>();
  const [step, setStep] = useState(0);
  const [generations, setGenerations] = useState(5);
  const [motive, setMotive] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    getFunnelOffering()
      .then((o) => {
        setOffering(o);
        setSelected(defaultPackage(o));
      })
      .catch((e) => console.warn('funnel offering', e))
      .finally(() => setLoading(false));
  }, []);

  if (Platform.OS !== 'web') return <Redirect href="/" />;

  const checkout = async () => {
    if (!selected) return;
    setBusy(true);
    const attributes: Record<string, string | null> = {
      funnel_generations: String(generations),
      funnel_motive: motive,
      funnel_experience: experience,
    };
    for (const key of UTM_KEYS) if (params[key]) attributes[key] = params[key];
    await setFunnelAttributes(attributes);
    const { outcome, redemptionInfo } = await purchaseOnWeb(selected);
    setBusy(false);
    if (outcome === 'purchased') {
      router.replace({
        pathname: '/start/success',
        params: { link: redemptionInfo?.redeemUrl ?? '', web: redemptionInfo?.redeemUrlRedirect ?? '' },
      });
    } else if (outcome === 'failed') {
      notify('お支払いできませんでした', 'カード情報を確認して、もう一度お試しください。');
    }
  };

  if (step === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.column}>
          <Mascot size={170} />
          <Text style={[font.h1, styles.centerText]}>役所の戸籍から、{'\n'}あなたの家系図を。</Text>
          <Text style={[font.body, styles.centerText, { color: colors.textMuted }]}>
            3つの質問に答えるだけで、あなたが何人のご先祖さままでたどれるかを診断します。
          </Text>
          <Button3D title="無料で診断する（30秒）" onPress={() => setStep(1)} style={{ alignSelf: 'stretch' }} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 4) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#4B54D5', '#7B4DFF']} style={styles.hero}>
          <SafeAreaView edges={['top']} style={[styles.column, { alignItems: 'center', gap: 6 }]}>
            <Text style={styles.kicker}>診断結果</Text>
            <Text style={styles.heroTitle}>{ancestorCount(generations)}人</Text>
            <Text style={styles.heroSub}>
              {generations}代前までに、あなたのご先祖さまが{'\n'}
              {ancestorCount(generations)}人います。戸籍をたどれば、その名前がわかります。
            </Text>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.column}>
            <Text style={font.h2}>家系図クエスト プレミアム</Text>
            {FEATURES.map((f) => (
              <View key={f.text} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={18} color="#fff" />
                </View>
                <Text style={[font.body, { flex: 1, fontWeight: '600' }]}>{f.text}</Text>
              </View>
            ))}

            {loading ? (
              <ActivityIndicator color={colors.purple} style={{ marginVertical: 20 }} />
            ) : offering ? (
              <PlanPicker offering={offering} selected={selected} onSelect={setSelected} />
            ) : (
              <View style={styles.notice}>
                <Text style={font.body}>
                  プランを読み込めませんでした。EXPO_PUBLIC_REVENUECAT_WEB_KEY と通信状況を確認してください。
                </Text>
              </View>
            )}

            <Button3D
              title={busy ? '処理中…' : 'プレミアムをはじめる'}
              variant="premium"
              disabled={!selected || busy}
              onPress={checkout}
            />
            <Text style={[font.small, styles.centerText]}>
              お支払いは Stripe
              で安全に処理されます。購入後に表示されるリンクから、アプリでそのままプレミアムを使えます。
              サブスクリプションは解約しない限り自動更新され、いつでも解約できます。
            </Text>
            <View style={styles.links}>
              <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
                利用規約
              </Text>
              <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
                プライバシーポリシー
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.column, { flex: 1 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep(step - 1)} hitSlop={12} accessibilityLabel="戻る">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ProgressBar value={step / 3} />
          </View>
        </View>

        <View style={styles.body}>
          {step === 1 && (
            <>
              <MascotSays text="どこまでさかのぼってみたい？" />
              <View style={styles.options}>
                {GENERATIONS.map((g) => (
                  <ChoiceOption
                    key={g.value}
                    label={g.label}
                    trailing={g.sub}
                    selected={generations === g.value}
                    onPress={() => setGenerations(g.value)}
                  />
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <MascotSays text="家系図をつくろうと思ったきっかけは？" />
              <View style={styles.options}>
                {MOTIVES.map((m) => (
                  <ChoiceOption key={m} label={m} selected={motive === m} onPress={() => setMotive(m)} />
                ))}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <MascotSays text="役所で戸籍を取ったことはある？" />
              <View style={styles.options}>
                {EXPERIENCE.map((e) => (
                  <ChoiceOption key={e} label={e} selected={experience === e} onPress={() => setExperience(e)} />
                ))}
              </View>
              <Text style={font.small}>はじめてでも大丈夫。本籍地の調べ方から、アプリが1つずつ案内します。</Text>
            </>
          )}
        </View>

        <View style={styles.bottom}>
          <Button3D
            title={step === 3 ? '診断結果を見る' : 'つづける'}
            disabled={(step === 2 && !motive) || (step === 3 && !experience)}
            onPress={() => setStep(step + 1)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  // Keeps the funnel readable on desktop browsers.
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 14 },
  centerText: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  back: { fontSize: 34, color: colors.locked, fontWeight: '300' },
  body: { flex: 1, padding: 20, gap: 20 },
  options: { gap: 10 },
  bottom: { padding: 20 },
  hero: { paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  kicker: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', letterSpacing: 2, marginTop: 16 },
  heroTitle: { color: '#fff', fontSize: 48, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.92)', fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  scroll: { padding: 20, paddingBottom: 40 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: { padding: 14, borderRadius: radius.md, backgroundColor: colors.surface },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  link: { color: colors.blue, fontWeight: '700', fontSize: 13 },
});
