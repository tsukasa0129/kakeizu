import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { defaultPackage, PlanPicker } from '@/components/PlanPicker';
import { PRIVACY_URL, TERMS_URL } from '@/lib/links';
import { notify } from '@/lib/notify';
import { getCurrentOffering, purchase, purchasesAvailable, restore } from '@/lib/purchases';
import { usePremium } from '@/store/premium';
import { colors, font, radius } from '@/theme';

const FEATURES = [
  { icon: 'scan', text: 'AIによる戸籍の読み取りが無制限' },
  { icon: 'git-network', text: '高祖父母・5代前まで家系図を拡張' },
  { icon: 'map', text: 'ユニット5「高祖父母、さらにその先へ」' },
  { icon: 'heart', text: '家族の歴史を残す開発を応援' },
] as const;

export default function Paywall() {
  const router = useRouter();
  const isPremium = usePremium((s) => s.isPremium);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCurrentOffering()
      .then((o) => {
        setOffering(o);
        setSelected(defaultPackage(o));
      })
      .catch((e) => console.warn('offerings', e))
      .finally(() => setLoading(false));
  }, []);

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    const outcome = await purchase(selected);
    setBusy(false);
    if (outcome === 'purchased') {
      notify('ようこそプレミアムへ！', 'すべての機能が使えるようになりました。');
      router.back();
    } else if (outcome === 'failed') {
      notify('購入できませんでした', '時間をおいて、もう一度お試しください。');
    }
  };

  const onRestore = async () => {
    setBusy(true);
    const ok = await restore().catch(() => false);
    setBusy(false);
    notify('購入の復元', ok ? 'プレミアムを復元しました。' : '復元できる購入が見つかりませんでした。');
    if (ok) router.back();
  };

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
          <PlanPicker offering={offering} selected={selected} onSelect={setSelected} />
        )}

        <Button3D
          title={busy ? '処理中…' : 'プレミアムをはじめる'}
          variant="premium"
          disabled={!selected || busy || isPremium}
          onPress={buy}
        />
        <Button3D title="購入を復元" variant="ghost" disabled={busy || !purchasesAvailable()} onPress={onRestore} />

        <Text style={[font.small, { textAlign: 'center' }]}>
          {Platform.OS === 'web'
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
  activeBox: { padding: 14, borderRadius: radius.md, backgroundColor: colors.surface },
  link: { color: colors.blue, fontWeight: '700', fontSize: 13 },
});
