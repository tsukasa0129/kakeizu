import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PACKAGE_TYPE, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { ExternalPurchaseNotice } from '@/components/ExternalPurchaseNotice';
import { Icon, type IconName } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { PopIn, useLoop } from '@/components/Motion';
import { notify } from '@/lib/notify';
import {
  getCurrentOffering,
  purchase,
  purchasesAvailable,
  purchaseWithStripe,
  restore,
  stripeCheckoutAvailable,
  type PurchaseOutcome,
} from '@/lib/purchases';
import { generationName } from '@/lib/slots';
import { freeTrialDays, reminderDay, requestReminderPermission, scheduleTrialReminder } from '@/lib/trialReminder';
import { useFamily } from '@/store/family';
import { useGame } from '@/store/game';
import { usePremium } from '@/store/premium';
import { colors, font, radius } from '@/theme';

// Hard paywall: the app is subscription-only, so this screen is the gate after onboarding (and
// again whenever the subscription lapses). Structure follows Cal AI's high-converting sequence
// found in Appllama: "try it free" → "we'll remind you before the trial ends" → timeline + plans.
// The first two steps only appear when the store offers a free trial.

type Step = 'offer' | 'reminder' | 'plans';

const FEATURES: { icon: IconName; text: string }[] = [
  { icon: 'scroll', text: 'AIで戸籍を読み取り、家系図に自動配置（無制限）' },
  { icon: 'tree', text: '5代前まで広がる家系図' },
  { icon: 'office', text: '役所ナビ・請求チェックリスト' },
  { icon: 'book', text: 'すべてのレッスンとユニット' },
];

const PLAN_LABEL: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.ANNUAL]: '年額',
  [PACKAGE_TYPE.MONTHLY]: '月額',
  [PACKAGE_TYPE.LIFETIME]: '買い切り',
  [PACKAGE_TYPE.WEEKLY]: '週額',
};

// Replace with your own URLs before release.
const TERMS_URL = 'https://example.com/terms';
const PRIVACY_URL = 'https://example.com/privacy';

const DAY_MS = 24 * 60 * 60 * 1000;
// Local notifications don't exist on web, so the reminder is only promised on iOS / Android.
const canRemind = Platform.OS !== 'web';
const dateLabel = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * DAY_MS).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });

export default function Paywall() {
  const isPremium = usePremium((s) => s.isPremium);
  const me = useFamily((s) => Object.values(s.persons).find((p) => p.slot === 1));
  const targetGeneration = useGame((s) => s.targetGeneration);
  const name = me?.givenName || me?.familyName || '';

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [step, setStep] = useState<Step>('plans');
  const [busy, setBusy] = useState(false);
  // iOS (Japan): Stripe is offered next to In-App Purchase once Apple grants the entitlement.
  const [stripeOffered, setStripeOffered] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const stripeAccepted = useRef(false);

  useEffect(() => {
    stripeCheckoutAvailable().then(setStripeOffered);
  }, []);

  useEffect(() => {
    getCurrentOffering()
      .then((o) => {
        setOffering(o);
        const annual = o?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
        const initial = annual ?? o?.availablePackages[0] ?? null;
        setSelected(initial);
        if (freeTrialDays(initial?.product.introPrice)) setStep('offer');
      })
      .catch((e) => console.warn('offerings', e))
      .finally(() => setLoading(false));
  }, []);

  const annual = offering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
  const monthly = offering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
  const savings =
    annual && monthly ? Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100) : null;
  const trialDays = freeTrialDays(selected?.product.introPrice);
  const headlinePkg = annual ?? selected;
  const headlineTrial = freeTrialDays(headlinePkg?.product.introPrice);

  // A successful purchase flips the entitlement; the root layout then swaps this screen for the app.
  const finish = (outcome: PurchaseOutcome, days: number | null) => {
    if (outcome === 'purchased') {
      if (days) scheduleTrialReminder(days);
    } else if (outcome === 'failed') {
      notify('購入できませんでした', '時間をおいて、もう一度お試しください。');
    }
  };

  const buy = async () => {
    if (!selected) return;
    const days = trialDays;
    setBusy(true);
    const outcome = await purchase(selected);
    setBusy(false);
    finish(outcome, days);
  };

  // Apple's disclosure sheet must be accepted before routing to the alternative payment.
  // Checkout opens only after the sheet finishes closing, so the in-app browser can be presented.
  const buyWithStripe = async () => {
    if (!stripeAccepted.current) return;
    stripeAccepted.current = false;
    setBusy(true);
    const outcome = await purchaseWithStripe();
    setBusy(false);
    finish(outcome, null);
  };

  const onRestore = async () => {
    setBusy(true);
    const ok = await restore().catch(() => false);
    setBusy(false);
    if (!ok) notify('購入の復元', '復元できる購入が見つかりませんでした。Web でお申し込みの方は、お申し込み時のメールにある「アプリで有効にする」を開いてください。');
  };

  const onReminder = async () => {
    await requestReminderPermission();
    setStep('plans');
  };

  const priceLine = (pkg: PurchasesPackage | null | undefined, days: number | null) => {
    if (!pkg) return null;
    const perMonth =
      pkg.packageType === PACKAGE_TYPE.ANNUAL && pkg.product.pricePerMonthString
        ? `（月あたり${pkg.product.pricePerMonthString}）`
        : '';
    const period = pkg.packageType === PACKAGE_TYPE.ANNUAL ? '年' : pkg.packageType === PACKAGE_TYPE.MONTHLY ? '月' : null;
    const price = period ? `${pkg.product.priceString}/${period}${perMonth}` : pkg.product.priceString;
    return days ? `${days}日間無料、その後 ${price}` : price;
  };

  const footer = (
    <View style={{ gap: 10, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
        <Text style={styles.link} onPress={busy || !purchasesAvailable() ? undefined : onRestore}>
          購入を復元
        </Text>
        <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
          利用規約
        </Text>
        <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
          プライバシー
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  if (!offering) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { padding: 24, gap: 16 }]}>
        <Mascot size={120} mood="think" animate />
        <Text style={[font.body, { textAlign: 'center' }]}>
          {purchasesAvailable()
            ? 'プランを読み込めませんでした。通信状況を確認して、アプリを開き直してください。'
            : Platform.OS === 'web'
              ? 'RevenueCat のAPIキーが未設定です。.env に EXPO_PUBLIC_REVENUECAT_WEB_KEY を設定してください。'
              : 'RevenueCat のAPIキーが未設定です。.env に EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY を設定し、開発ビルドで起動してください。'}
        </Text>
        {__DEV__ && !purchasesAvailable() && (
          <Button3D
            title="開発用：課金をスキップ"
            variant="outline"
            onPress={() => usePremium.getState().setPremium(true)}
          />
        )}
        {footer}
      </SafeAreaView>
    );
  }

  if (step === 'offer') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.stepBody}>
          <Text style={styles.title}>
            {name ? `${name}さんのプランを` : 'あなたのプランを'}
            {'\n'}無料で体験しよう
          </Text>
          <View style={styles.previewCard}>
            <Mascot size={96} mood="wow" animate />
            <Text style={font.h3}>{generationName(targetGeneration)}までのルーツ探し</Text>
            {Array.from({ length: targetGeneration }, (_, i) => i + 1).map((g) => (
              <View key={g} style={styles.previewRow}>
                <Text style={styles.previewGen}>{generationName(g)}</Text>
                <View style={styles.previewDots}>
                  {Array.from({ length: Math.min(2 ** g, 16) }, (_, j) => (
                    <View key={j} style={[styles.dot, { backgroundColor: j % 2 ? colors.female : colors.male }]} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.bottom}>
          <NoPaymentNow />
          <Button3D title="無料で試す" onPress={() => setStep(canRemind ? 'reminder' : 'plans')} />
          <Text style={styles.fine}>{priceLine(headlinePkg, headlineTrial)}</Text>
          {footer}
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'reminder') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep('offer')} hitSlop={12} accessibilityLabel="戻る">
            <Ionicons name="chevron-back" size={26} color={colors.locked} />
          </Pressable>
        </View>
        <View style={[styles.stepBody, { flex: 1, justifyContent: 'center' }]}>
          <Text style={styles.title}>無料体験が終わる前に{'\n'}お知らせします</Text>
          <RingingBell />
          <Text style={[font.body, { textAlign: 'center', color: colors.textMuted }]}>
            終了の前日に通知でお知らせします。{'\n'}合わなければ、それまでに解約すれば料金はかかりません。
          </Text>
        </View>
        <View style={styles.bottom}>
          <NoPaymentNow />
          <Button3D title="無料で続ける" onPress={onReminder} />
          <Text style={styles.fine}>{priceLine(headlinePkg, headlineTrial)}</Text>
          {footer}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {headlineTrial !== null && (
        <View style={styles.header}>
          <Pressable onPress={() => setStep(canRemind ? 'reminder' : 'offer')} hitSlop={12} accessibilityLabel="戻る">
            <Ionicons name="chevron-back" size={26} color={colors.locked} />
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={[styles.stepBody, { paddingTop: headlineTrial !== null ? 0 : 24 }]}>
        {isPremium && (
          <View style={styles.activeBox}>
            <Icon name="crown" size={22} />
            <Text style={font.h3}>プレミアム利用中です</Text>
          </View>
        )}
        <Text style={styles.title}>
          {trialDays
            ? `${trialDays}日間の無料体験で\nはじめましょう`
            : `${name ? `${name}さんの` : ''}家系図づくりを\nはじめよう`}
        </Text>

        {trialDays ? (
          <View style={styles.timeline}>
            <TimelineItem
              icon="lock-open"
              title="今日"
              text="AIでの戸籍読み取り・5代前までの家系図など、すべての機能が使えます。"
            />
            {canRemind && (
              <TimelineItem
                icon="notifications"
                title={`${reminderDay(trialDays)}日後：お知らせ`}
                text="無料体験がまもなく終わることを通知でお知らせします（通知を許可した場合）。"
              />
            )}
            <TimelineItem
              icon="ribbon"
              title={`${trialDays}日後：課金開始`}
              text={`${dateLabel(trialDays)}に課金されます。それまでに解約すれば料金はかかりません。`}
              last
            />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {FEATURES.map((f) => (
              <View key={f.text} style={styles.feature}>
                <Icon name={f.icon} size={26} />
                <Text style={[font.body, { flex: 1, fontWeight: '600' }]}>{f.text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.plans}>
          {offering.availablePackages.map((pkg) => {
            const active = selected?.identifier === pkg.identifier;
            const days = freeTrialDays(pkg.product.introPrice);
            const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
            const ribbon = days ? `${days}日間無料` : isAnnual && savings ? `${savings}%おトク` : null;
            return (
              <Pressable
                key={pkg.identifier}
                onPress={() => setSelected(pkg)}
                style={[styles.plan, active && styles.planActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                {ribbon && (
                  <View style={styles.ribbon}>
                    <Text style={styles.ribbonText}>{ribbon}</Text>
                  </View>
                )}
                <View style={styles.planTop}>
                  <Text style={font.h3}>{PLAN_LABEL[pkg.packageType] ?? pkg.product.title}</Text>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={active ? colors.text : colors.border}
                  />
                </View>
                <Text style={styles.price}>{pkg.product.priceString}</Text>
                {isAnnual && pkg.product.pricePerMonthString && (
                  <Text style={font.small}>月あたり {pkg.product.pricePerMonthString}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {trialDays !== null && <NoPaymentNow />}
        {stripeOffered ? (
          // Apple requires In-App Purchase to be at least as prominent as the alternative:
          // listed first, black, Apple-branded; Stripe gets the neutral outline style.
          <>
            <Button3D
              title={busy ? '処理中…' : trialDays ? '無料体験をはじめる' : 'App Store で購入'}
              variant="black"
              icon={<Ionicons name="logo-apple" size={18} color="#fff" />}
              disabled={!selected || busy || isPremium}
              onPress={buy}
            />
            <Button3D
              title="クレジットカードで購入（Stripe）"
              variant="outline"
              disabled={busy || isPremium}
              onPress={() => setNoticeVisible(true)}
            />
          </>
        ) : (
          <Button3D
            title={busy ? '処理中…' : trialDays ? `${trialDays}日間の無料体験をはじめる` : 'はじめる'}
            disabled={!selected || busy || isPremium}
            onPress={buy}
          />
        )}
        <Text style={styles.fine}>
          {priceLine(selected, trialDays)}
          {'\n'}
          {stripeOffered
            ? '解約しない限り自動更新されます。App Store でのご購入はストアのアカウント設定から、クレジットカード（Stripe）でのご購入はプロフィールの「サブスクリプションを管理」から解約できます。'
            : Platform.OS === 'web'
              ? 'お支払いは Stripe で安全に処理されます。解約しない限り自動更新され、プロフィールの「サブスクリプションを管理」からいつでも解約できます。'
              : '期間終了の24時間前までに解約しない限り自動更新されます。解約はストアのアカウント設定から行えます。'}
        </Text>
        {footer}
      </View>
      <ExternalPurchaseNotice
        visible={noticeVisible}
        onContinue={() => {
          stripeAccepted.current = true;
          setNoticeVisible(false);
        }}
        onCancel={() => setNoticeVisible(false)}
        onDismiss={buyWithStripe}
      />
    </SafeAreaView>
  );
}

/** The reminder bell rings every couple of seconds, and its badge pops in. */
function RingingBell() {
  const ring = useLoop(2400);
  const rotate = ring.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 1],
    outputRange: ['0deg', '14deg', '-12deg', '9deg', '-6deg', '0deg', '0deg'],
  });
  return (
    <View style={styles.bell}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="notifications" size={120} color="#D6DEE2" />
      </Animated.View>
      <PopIn delay={400} style={styles.badge}>
        <Text style={styles.badgeText}>1</Text>
      </PopIn>
    </View>
  );
}

function NoPaymentNow() {
  return (
    <View style={styles.noPay}>
      <Ionicons name="checkmark" size={18} color={colors.text} />
      <Text style={styles.noPayText}>今はお支払い不要</Text>
    </View>
  );
}

function TimelineItem({
  icon,
  title,
  text,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={styles.tlRow}>
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.tlIcon, last && { backgroundColor: colors.text }]}>
          <Ionicons name={icon} size={18} color="#fff" />
        </View>
        {!last && <View style={styles.tlLine} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 14 }}>
        <Text style={font.h3}>{title}</Text>
        <Text style={font.small}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 8, height: 40, justifyContent: 'center' },
  stepBody: { padding: 20, gap: 20 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, textAlign: 'center', lineHeight: 36 },
  bottom: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, gap: 10 },
  fine: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  link: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  noPay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  noPayText: { fontWeight: '800', color: colors.text, fontSize: 15 },
  previewCard: {
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 20,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  previewGen: { width: 64, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  previewDots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  bell: { alignSelf: 'center', marginVertical: 12 },
  badge: {
    position: 'absolute',
    right: -4,
    top: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  timeline: { gap: 0 },
  tlRow: { flexDirection: 'row', gap: 12 },
  tlIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlLine: { width: 8, flex: 1, backgroundColor: '#FFD9A8', marginTop: -2, marginBottom: -2 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plans: { flexDirection: 'row', gap: 10, marginTop: 6 },
  plan: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    gap: 2,
  },
  planActive: { borderColor: colors.text, backgroundColor: colors.surface },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 4 },
  ribbon: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ribbonText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  activeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});
