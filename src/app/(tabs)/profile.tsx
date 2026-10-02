import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button3D } from '@/components/Button3D';
import { Icon, type IconName } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { confirm, notify } from '@/lib/notify';
import { getManagementURL } from '@/lib/purchases';
import { isDemoMode } from '@/lib/extract';
import { deleteAccount, signOut, syncNow } from '@/lib/sync';
import { useAccount } from '@/store/account';
import { displayName, useFamily } from '@/store/family';
import { levelForXp, useGame, xpForLevel } from '@/store/game';
import { colors, font, radius } from '@/theme';

const DOC_LABELS: Record<string, string> = {
  koseki_zenbu: '戸籍謄本',
  koseki_kojin: '戸籍抄本',
  joseki: '除籍謄本',
  kaisei_genkoseki: '改製原戸籍',
  other: 'その他',
};

export default function ProfileScreen() {
  const router = useRouter();
  const game = useGame();
  const persons = useFamily((s) => s.persons);
  const documents = useFamily((s) => s.documents);
  const me = Object.values(persons).find((p) => p.slot === 1);

  const level = levelForXp(game.xp);
  const levelStart = xpForLevel(level);
  const levelEnd = xpForLevel(level + 1);

  const onManage = async () => {
    const url = await getManagementURL().catch(() => null);
    if (url) WebBrowser.openBrowserAsync(url);
    else notify('サブスクリプション', '管理できるサブスクリプションが見つかりませんでした。');
  };

  const signedIn = useAccount((s) => !!s.token);

  const onReset = async () => {
    const message = signedIn
      ? '家系図・XP・進捗をすべて削除します。クラウドに保存したデータも空になります。元に戻せません。'
      : '家系図・XP・進捗をすべて削除します。元に戻せません。';
    if (!(await confirm('データを削除', message, '削除する', true))) return;
    useFamily.getState().reset();
    useGame.getState().reset();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View style={styles.top}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{me?.givenName?.[0] ?? me?.familyName?.[0] ?? '？'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>{me ? displayName(me) : 'ゲスト'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="crown" size={16} />
              <Text style={font.small}>プレミアム会員</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={font.h3}>レベル {level}</Text>
          <ProgressBar value={(game.xp - levelStart) / (levelEnd - levelStart)} color={colors.blue} />
          <Text style={font.small}>次のレベルまで {levelEnd - game.xp} XP</Text>
        </View>

        <View style={styles.statsGrid}>
          <Stat icon="flame" value={game.streak} label="連続日数" />
          <Stat icon="bolt" value={game.xp} label="合計XP" />
          <Stat icon="tree" value={Object.keys(persons).length} label="登録人数" />
          <Stat icon="scroll" value={documents.length} label="読み取った書類" />
        </View>

        <View style={[styles.card, { borderColor: colors.orange }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="books" size={22} />
            <Text style={font.h3}>家系図を本にする</Text>
          </View>
          <Text style={font.body}>完成した家系図を製本して、ご自宅にお届けします。贈りものにも。</Text>
          <Button3D title="くわしく見る" variant="secondary" onPress={() => router.push('/book')} />
        </View>

        {documents.length > 0 && (
          <View style={styles.card}>
            <Text style={font.h3}>読み取った書類</Text>
            {documents.map((d) => (
              <View key={d.id} style={styles.docRow}>
                <Icon name="scroll" size={26} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{DOC_LABELS[d.type] ?? d.title}</Text>
                  <Text style={font.small}>
                    {[d.hittousha && `筆頭者 ${d.hittousha}`, `${d.personCount}人`, new Date(d.scannedAt).toLocaleDateString('ja-JP')]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <AccountCard />

        <View style={[styles.card, { gap: 10 }]}>
          <Text style={font.h3}>プライバシー</Text>
          <Text style={font.small}>
            {signedIn
              ? '家系図のデータはこの端末と、あなたのアカウント（クラウド）に保存されます。'
              : '家系図のデータはこの端末内に保存されます。'}
            書類の画像はAI読み取りのためだけにサーバーへ送信され、保存されません。
            {isDemoMode() ? '\n（現在はデモモード：画像は送信されず、サンプル結果が表示されます）' : ''}
          </Text>
          <Button3D title="サブスクリプションを管理" variant="secondary" onPress={onManage} />
          <Button3D title="すべてのデータを削除" variant="danger" onPress={onReset} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountCard() {
  const router = useRouter();
  const { user, token, dirty, syncError, lastSyncedAt } = useAccount();
  const [busy, setBusy] = useState(false);

  if (!token || !user) {
    return (
      <View style={[styles.card, { borderColor: colors.blue }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="tree" size={22} />
          <Text style={font.h3}>家系図をクラウドに保存</Text>
        </View>
        <Text style={font.body}>
          ログインすると、機種変更やほかの端末・Web版でも続きから使えます。メールに届くコードだけでログインできます。
        </Text>
        <Button3D title="ログイン・アカウント作成" variant="blue" onPress={() => router.push('/login')} />
      </View>
    );
  }

  const status = syncError
    ? '保存できませんでした（通信できるときに自動で再試行します）'
    : dirty
      ? '保存しています…'
      : lastSyncedAt
        ? `クラウドに保存済み（${new Date(lastSyncedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}）`
        : 'クラウドに保存済み';

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    try {
      await task();
    } catch (e) {
      notify('エラー', e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    const ok = await confirm(
      'ログアウト',
      'この端末から家系図のデータを消してログアウトします。データはクラウドに残っているので、もう一度ログインすれば元に戻ります。',
      'ログアウト',
    );
    if (ok) run(signOut);
  };

  const onDelete = async () => {
    const ok = await confirm(
      'アカウントを削除',
      'アカウントと、クラウドとこの端末に保存した家系図・進捗をすべて削除します。元に戻せません。\n\nサブスクリプションは自動では解約されません。解約は「サブスクリプションを管理」から行ってください。',
      '削除する',
      true,
    );
    if (ok) run(deleteAccount);
  };

  return (
    <View style={[styles.card, { gap: 10 }]}>
      <Text style={font.h3}>アカウント</Text>
      <Text style={{ fontWeight: '700', color: colors.text }}>{user.email}</Text>
      <Text style={[font.small, syncError && { color: colors.redDark }]} onPress={syncError ? () => syncNow() : undefined}>
        {status}
      </Text>
      <Button3D title={busy ? '処理中…' : 'ログアウト'} variant="secondary" onPress={onSignOut} disabled={busy} />
      <Text style={styles.deleteLink} onPress={busy ? undefined : onDelete}>
        アカウントを削除
      </Text>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={28} />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={font.small}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.greenLight,
    borderWidth: 3,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.greenDark },
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 16, gap: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  deleteLink: { color: colors.redDark, fontWeight: '700', fontSize: 13, textAlign: 'center', paddingVertical: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
});
