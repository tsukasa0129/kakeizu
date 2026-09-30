import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { PopIn } from '@/components/Motion';
import { redeemWebPurchase, type RedemptionOutcome } from '@/lib/purchases';
import { useGame } from '@/store/game';
import { colors, font } from '@/theme';

// web2app funnel: the web funnel's success page (web-funnel/) and RevenueCat's purchase email link to
// rc-xxxx://redeem_web_purchase?redemption_token=…, which Expo Router opens as this route. It sits
// outside the root layout's guards so it works on a fresh install, before onboarding.

const MESSAGES: Record<Exclude<RedemptionOutcome['kind'], 'redeemed'>, { title: string; body: string }> = {
  expired: { title: 'リンクの有効期限が切れていました', body: '' },
  invalid: {
    title: 'このリンクは使えません',
    body: 'すでに有効にしたリンクか、正しくないリンクです。すでに有効にした場合は、そのまま「アプリへ」を押してください。',
  },
  otherUser: {
    title: 'ほかのアカウントで有効になっています',
    body: 'このお申し込みは、別の端末またはアカウントで有効にされています。お困りの場合はサポートまでお問い合わせください。',
  },
  failed: {
    title: '有効にできませんでした',
    body: '通信状況を確認して、もう一度お試しください。',
  },
};

export default function RedeemWebPurchase() {
  const router = useRouter();
  const { redemption_token: token } = useLocalSearchParams<{ redemption_token?: string }>();
  const [outcome, setOutcome] = useState<RedemptionOutcome | null>(null);

  const redeem = useCallback(async () => {
    // The SDK parses the original link; rebuild it only if the OS URL isn't available anymore.
    const opened = Linking.getLinkingURL();
    const url = opened?.includes('redeem_web_purchase')
      ? opened
      : `rc-redeem://redeem_web_purchase?redemption_token=${encodeURIComponent(token ?? '')}`;
    const result = token || opened ? await redeemWebPurchase(url) : ({ kind: 'invalid' } as const);
    // They answered the quiz on the web already, so skip the in-app questions (same as a restore).
    if (result.kind === 'redeemed' && !useGame.getState().onboarded) useGame.getState().finishOnboarding(30, 4);
    return result;
  }, [token]);

  useEffect(() => {
    redeem().then(setOutcome);
  }, [redeem]);

  const retry = () => {
    setOutcome(null);
    redeem().then(setOutcome);
  };

  const goHome = () => router.replace('/');

  if (!outcome) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Mascot size={120} mood="think" animate />
        <ActivityIndicator color={colors.green} />
        <Text style={font.h3}>お申し込みを確認しています…</Text>
      </SafeAreaView>
    );
  }

  if (outcome.kind === 'redeemed') {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <PopIn>
          <Mascot size={150} mood="wow" animate />
        </PopIn>
        <Text style={[font.h1, styles.center]}>プランが有効になりました！</Text>
        <Text style={[font.body, styles.center, styles.muted]}>さっそく家系図づくりをはじめましょう。</Text>
        <Button3D title="はじめる" onPress={goHome} style={styles.button} />
      </SafeAreaView>
    );
  }

  const message = MESSAGES[outcome.kind];
  const body =
    outcome.kind === 'expired'
      ? `新しいリンクを ${outcome.email} にお送りしました。メールを開いて「アプリで有効にする」をタップしてください。`
      : message.body;

  return (
    <SafeAreaView style={[styles.container, styles.centered]}>
      <Mascot size={120} mood="think" animate />
      <Text style={[font.h2, styles.center]}>{message.title}</Text>
      <Text style={[font.body, styles.center, styles.muted]}>{body}</Text>
      {outcome.kind === 'failed' && <Button3D title="もう一度ためす" onPress={retry} style={styles.button} />}
      <Button3D title="アプリへ" variant="secondary" onPress={goHome} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  center: { textAlign: 'center' },
  muted: { color: colors.textMuted },
  button: { alignSelf: 'stretch' },
});
