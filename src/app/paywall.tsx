import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PACKAGE_TYPE, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { ExternalPurchaseNotice } from '@/components/ExternalPurchaseNotice';
import { Mascot } from '@/components/Mascot';
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
import { usePremium } from '@/store/premium';
import { colors, font, radius } from '@/theme';

const FEATURES = [
  { icon: 'scan', text: 'AIによる戸籍の読み取りが無制限' },
  { icon: 'git-network', text: '高祖父母・5代前まで家系図を拡張' },
  { icon: 'map', text: 'ユニット5「高祖父母、さらにその先へ」' },
  { icon: 'heart', text: '家族の歴史を残す開発を応援' },
] as const;

const PLAN_LABEL: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.ANNUAL]: '年額プラン',
  [PACKAGE_TYPE.MONTHLY]: '月額プラン',
  [PACKAGE_TYPE.LIFETIME]: '買い切り',
  [PACKAGE_TYPE.WEEKLY]: '週額プラン',
};

// Replace with your own URLs before release.
const TERMS_URL = 'https://example.com/terms';
const PRIVACY_URL = 'https://example.com/privacy';

export default function Paywall() {
  const router = useRouter();
  const isPremium = usePremium((s) => s.isPremium);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
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
        setSelected(annual ?? o?.availablePackages[0] ?? null);
      })
      .catch((e) => console.warn('offerings', e))
      .finally(() => setLoading(false));
  }, []);

  const finish = (outcome: PurchaseOutcome) => {
    if (outcome === 'purchased') {
      notify('ようこそプレミアムへ！', 'すべての機能が使えるようになりました。');
      router.back();
    } else if (outcome === 'failed') {
      notify('購入できませんでした', '時間をおいて、もう一度お試しください。');
    }
  };

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    const outcome = await purchase(selected);
    setBusy(false);
    finish(outcome);
  };

  // Apple's disclosure sheet must be accepted before routing to the alternative payment.
  // Checkout opens only after the sheet finishes closing, so the in-app browser can be presented.
  const buyWithStripe = async () => {
    if (!stripeAccepted.current) return;
    stripeAccepted.current = false;
    setBusy(true);
    const outcome = await purchaseWithStripe();
    setBusy(false);
    finish(outcome);
  };

  const onRestore = async () => {
    setBusy(true);
    const ok = await restore().catch(() => false);
    setBusy(false);
    notify('購入の復元', ok ? 'プレミアムを復元しました。' : '復元できる購入が見つかりませんでした。');
    if (ok) router.back();
  };

  const annual = offering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
  const monthly = offering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
  const savings =
    annual && monthly ? Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100) : null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4B54D5', '#7B4DFF']} style={styles.hero}>
        <SafeAreaView edges={['top']} style={{ alignItems: 'center', gap: 8 }}>
          <Pressable style={styles.close} onPress={() => router.back()} hitSlop={12} accessibilityLabel="閉じる">
            <Ionicons name="close" size={26} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <Text style={styles.kicker}>PREMIUM</Text>
          <Mascot size={110} mood="wow" />
          <Text style={styles.heroTitle}>家系図クエスト プレミアム</Text>
          <Text style={styles.heroSub}>ご先祖さまを、もっと遠くまで。</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        {isPremium && (
          <View style={styles.activeBox}>
            <Text style={font.h3}>👑 プレミアム利用中です</Text>
          </View>
        )}

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
        ) : !offering ? (
          <View style={styles.activeBox}>
            <Text style={font.body}>
              {purchasesAvailable()
                ? 'プランを読み込めませんでした。通信状況を確認してください。'
                : Platform.OS === 'web'
                  ? 'RevenueCat のAPIキーが未設定です。.env に EXPO_PUBLIC_REVENUECAT_WEB_KEY を設定してください。'
                  : 'RevenueCat のAPIキーが未設定です。.env に EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY を設定し、開発ビルドで起動してください。'}
            </Text>
          </View>
        ) : (
          offering.availablePackages.map((pkg) => {
            const active = selected?.identifier === pkg.identifier;
            const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
            return (
              <Pressable
                key={pkg.identifier}
                onPress={() => setSelected(pkg)}
                style={[styles.plan, active && { borderColor: colors.purple, backgroundColor: '#F7EEFF' }]}
              >
                {isAnnual && savings !== null && savings > 0 && (
                  <View style={styles.ribbon}>
                    <Text style={styles.ribbonText}>おすすめ・{savings}%おトク</Text>
                  </View>
                )}
                <View style={[styles.radio, active && { borderColor: colors.purple }]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{PLAN_LABEL[pkg.packageType] ?? pkg.product.title}</Text>
                  {pkg.product.introPrice && (
                    <Text style={[font.small, { color: colors.purpleDark, fontWeight: '700' }]}>
                      無料トライアルあり
                    </Text>
                  )}
                </View>
                <Text style={styles.price}>{pkg.product.priceString}</Text>
              </Pressable>
            );
          })
        )}

        {stripeOffered ? (
          // Apple requires In-App Purchase to be at least as prominent as the alternative:
          // listed first, black, Apple-branded; Stripe gets the neutral outline style.
          <>
            <Button3D
              title={busy ? '処理中…' : 'App Store で購入'}
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
            title={busy ? '処理中…' : 'プレミアムをはじめる'}
            variant="premium"
            disabled={!selected || busy || isPremium}
            onPress={buy}
          />
        )}
        <Button3D title="購入を復元" variant="ghost" disabled={busy || !purchasesAvailable()} onPress={onRestore} />

        <Text style={[font.small, { textAlign: 'center' }]}>
          {stripeOffered
            ? 'サブスクリプションは解約しない限り自動更新されます。App Store でのご購入はストアのアカウント設定から、クレジットカード（Stripe）でのご購入はプロフィールの「サブスクリプションを管理」から解約できます。'
            : Platform.OS === 'web'
            ? 'お支払いは Stripe で安全に処理されます。サブスクリプションは解約しない限り自動更新され、解約はプロフィールの「サブスクリプションを管理」からいつでも行えます。'
            : 'サブスクリプションは期間終了の24時間前までに解約しない限り自動更新されます。解約はストアのアカウント設定から行えます。'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
          <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
            利用規約
          </Text>
          <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>
            プライバシーポリシー
          </Text>
        </View>
      </ScrollView>
      <ExternalPurchaseNotice
        visible={noticeVisible}
        onContinue={() => {
          stripeAccepted.current = true;
          setNoticeVisible(false);
        }}
        onCancel={() => setNoticeVisible(false)}
        onDismiss={buyWithStripe}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  close: { position: 'absolute', left: 16, top: 8, zIndex: 1 },
  kicker: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 6,
  },
  ribbon: {
    position: 'absolute',
    top: -12,
    right: 14,
    backgroundColor: '#28CDA5',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ribbonText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.purple },
  price: { fontSize: 17, fontWeight: '800', color: colors.text },
  activeBox: { padding: 14, borderRadius: radius.md, backgroundColor: colors.surface },
  link: { color: colors.blue, fontWeight: '700', fontSize: 13 },
});
