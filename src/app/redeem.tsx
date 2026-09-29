import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { redeemWebPurchaseLink, type RedeemOutcome } from '@/lib/purchases';
import { clearPendingRedemptionLink, getPendingRedemptionLink } from '@/lib/webRedemption';
import { useGame } from '@/store/game';
import { colors, font } from '@/theme';

const MESSAGES: Record<Exclude<RedeemOutcome['kind'], 'expired'>, { title: string; body: string }> = {
  success: { title: 'プレミアムが有効になりました！', body: 'Webでのご購入をこのアプリに引き継ぎました。' },
  invalid: {
    title: 'リンクが無効です',
    body: 'リンクが正しくないか、すでに使われています。購入時のページからもう一度お試しください。',
  },
  otherUser: {
    title: 'すでに引き継ぎ済みです',
    body: 'このご購入は別の端末・アカウントに引き継がれています。お困りの場合はサポートまでご連絡ください。',
  },
  error: { title: '引き継ぎに失敗しました', body: '通信状況を確認して、もう一度リンクを開いてください。' },
};

/** Target of RevenueCat Redemption Links (web2app): moves a Stripe web purchase onto this app user. */
export default function Redeem() {
  const router = useRouter();
  const onboarded = useGame((s) => s.onboarded);
  const [link] = useState(getPendingRedemptionLink);
  const [outcome, setOutcome] = useState<RedeemOutcome | null>(link ? null : { kind: 'invalid' });

  useEffect(() => {
    if (!link) return;
    redeemWebPurchaseLink(link).then((result) => {
      clearPendingRedemptionLink();
      setOutcome(result);
    });
  }, [link]);

  if (!outcome) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.purple} />
        <Text style={font.body}>Webでのご購入を確認しています…</Text>
      </SafeAreaView>
    );
  }

  const message =
    outcome.kind === 'expired'
      ? {
          title: 'リンクの有効期限が切れています',
          body: `新しいリンクを ${outcome.obfuscatedEmail} にお送りしました。メールのリンクから開き直してください。`,
        }
      : MESSAGES[outcome.kind];

  return (
    <SafeAreaView style={styles.center}>
      <Mascot size={150} mood={outcome.kind === 'success' ? 'wow' : 'think'} />
      <Text style={[font.h2, styles.text]}>{message.title}</Text>
      <Text style={[font.body, styles.text]}>{message.body}</Text>
      <View style={styles.bottom}>
        <Button3D
          title={outcome.kind === 'success' ? '家系図づくりへ' : 'アプリをひらく'}
          variant={outcome.kind === 'success' ? 'premium' : 'primary'}
          onPress={() => router.replace(onboarded ? '/' : '/onboarding')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.bg },
  text: { textAlign: 'center' },
  bottom: { width: '100%', marginTop: 12 },
});
