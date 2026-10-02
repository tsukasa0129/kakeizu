import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Mascot } from '@/components/Mascot';
import { FadeSlideIn } from '@/components/Motion';
import { requestLoginCode, signIn } from '@/lib/sync';
import { useGame } from '@/store/game';
import { usePremium } from '@/store/premium';
import { colors, font, radius } from '@/theme';

// Email + 6-digit code sign-in (no passwords). Signing in saves the family tree to the cloud so it can be
// opened on other devices and the web. Sits outside the root layout's guards so it also works from the
// welcome screen, before onboarding and the paywall.

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setBusy(false);
    }
  };

  const send = () =>
    run(async () => {
      const to = email.trim();
      await requestLoginCode(to);
      setSentTo(to);
      setCode('');
    });

  const verify = () =>
    run(async () => {
      await signIn(sentTo ?? email.trim(), code);
      // Back to the screen underneath; if the loaded data changed which screens the root layout's guards
      // allow, it has already moved on. A purchase found later through RevenueCat does the same.
      if (router.canGoBack()) router.back();
      else router.replace(!useGame.getState().onboarded ? '/onboarding' : usePremium.getState().isPremium ? '/' : '/paywall');
    });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="閉じる">
            <Text style={styles.back}>×</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Mascot size={110} mood={sentTo ? 'wow' : 'happy'} animate />

          {!sentTo ? (
            <FadeSlideIn key="email" style={styles.form}>
              <Text style={[font.h2, styles.center]}>ログイン・アカウント作成</Text>
              <Text style={[font.body, styles.center, styles.muted]}>
                メールアドレスに届く6桁のコードでログインします。パスワードはいりません。{'\n'}
                ログインすると家系図がクラウドに保存され、機種変更やほかの端末・Web版でも続きから使えます。
              </Text>
              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={busy || !email.trim() ? undefined : send}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                placeholderTextColor={colors.locked}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Button3D title={busy ? '送信中…' : 'コードを送る'} onPress={send} disabled={busy || !email.trim()} />
            </FadeSlideIn>
          ) : (
            <FadeSlideIn key="code" style={styles.form}>
              <Text style={[font.h2, styles.center]}>コードを入力</Text>
              <Text style={[font.body, styles.center, styles.muted]}>
                {sentTo} に届いた6桁のコードを入力してください。届かないときは迷惑メールフォルダもご確認ください。
              </Text>
              <TextInput
                style={[styles.input, styles.code]}
                placeholder="123456"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                onSubmitEditing={busy || code.length !== 6 ? undefined : verify}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                autoFocus
                placeholderTextColor={colors.locked}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Button3D title={busy ? '確認中…' : 'ログイン'} onPress={verify} disabled={busy || code.length !== 6} />
              <View style={styles.links}>
                <Text style={styles.link} onPress={busy ? undefined : send}>
                  コードを再送
                </Text>
                <Text
                  style={styles.link}
                  onPress={() => {
                    setSentTo(null);
                    setError(null);
                  }}
                >
                  メールアドレスを変更
                </Text>
              </View>
            </FadeSlideIn>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8 },
  back: { fontSize: 30, color: colors.locked, fontWeight: '300' },
  body: { padding: 20, gap: 20, alignItems: 'center', width: '100%', maxWidth: 480, alignSelf: 'center' },
  form: { width: '100%', gap: 14 },
  center: { textAlign: 'center' },
  muted: { color: colors.textMuted },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    fontSize: 18,
    color: colors.text,
  },
  code: { fontSize: 28, letterSpacing: 8, textAlign: 'center', fontWeight: '800' },
  error: { color: colors.redDark, fontWeight: '700', textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  link: { color: colors.blue, fontWeight: '700', fontSize: 14 },
});
