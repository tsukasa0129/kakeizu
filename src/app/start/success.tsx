import { Redirect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/links';
import { colors, font, radius } from '@/theme';

/**
 * Post-checkout page of the web funnel. `link` is the RevenueCat Redemption Link (custom scheme, opens the app);
 * `web` is its HTTPS redirect, usable from another device. Both live in the URL so a bookmark keeps them.
 */
const openStore = (url: string) => () => WebBrowser.openBrowserAsync(url);

export default function FunnelSuccess() {
  const { link, web } = useLocalSearchParams<{ link?: string; web?: string }>();

  if (Platform.OS !== 'web') return <Redirect href="/" />;

  // A custom-scheme URL has to replace the page; opening it in a new tab leaves a blank tab behind.
  const openInApp = () => {
    if (link) window.location.assign(link);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Mascot size={140} mood="wow" />
            <Text style={[font.h1, styles.centerText]}>ご購入ありがとうございます！</Text>
            <Text style={[font.body, styles.centerText, { color: colors.textMuted }]}>
              あと2ステップで、アプリでプレミアムが使えるようになります。
            </Text>
          </View>

          <Step n={1} title="アプリをインストール">
            {APP_STORE_URL && (
              <Button3D
                title="App Store からダウンロード"
                variant="blue"
                onPress={openStore(APP_STORE_URL)}
              />
            )}
            {PLAY_STORE_URL && (
              <Button3D
                title="Google Play からダウンロード"
                variant="primary"
                onPress={openStore(PLAY_STORE_URL)}
              />
            )}
            {!APP_STORE_URL && !PLAY_STORE_URL && (
              <Text style={font.body}>
                App Store / Google Play で「家系図クエスト」を検索してインストールしてください。
              </Text>
            )}
          </Step>

          <Step n={2} title="アプリでプレミアムを有効にする">
            {link ? (
              <>
                <Text style={font.body}>
                  アプリを入れたこの端末で、下のボタンを押してください。アプリが開き、ご購入が自動で引き継がれます。
                </Text>
                <Button3D title="アプリでひらく" variant="premium" onPress={openInApp} />
                {web ? (
                  <View style={styles.notice}>
                    <Text style={font.small}>パソコンでご購入の場合は、このリンクをスマホで開いてください：</Text>
                    <Text selectable style={styles.url}>
                      {web}
                    </Text>
                  </View>
                ) : null}
                <Text style={font.small}>このページをブックマークしておくと、あとからでも引き継げます。</Text>
              </>
            ) : (
              <Text style={font.body}>
                引き継ぎ用のリンクを発行できませんでした。お手数ですが、ご購入時のメールアドレスを添えてサポートまでご連絡ください。
              </Text>
            )}
          </Step>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{n}</Text>
        </View>
        <Text style={font.h3}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 18 },
  centerText: { textAlign: 'center' },
  step: {
    gap: 12,
    padding: 16,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontWeight: '900' },
  notice: { gap: 6, padding: 12, borderRadius: radius.sm, backgroundColor: colors.surface },
  url: { fontSize: 12, color: colors.blueDark, fontWeight: '600' },
});
